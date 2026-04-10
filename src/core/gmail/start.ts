// gmail/start.ts
//
// The single activation entry point for the Gmail skill. The Rust host calls
// `start({ oauth, auth, validate? })`:
//
//   - on instance spawn (with credentials read from disk)
//   - immediately after `oauth/complete` once the OAuth credential is persisted
//   - immediately after `auth/complete` for self_hosted / text auth modes,
//     with `validate: true` so we hit the Gmail API and surface field-level
//     errors before any cron is registered
//
// start() owns:
//   1. picking up account metadata from the credential bag
//   2. (optional) validating credentials against the upstream API
//   3. registering the periodic sync cron (when sync is enabled)
//   4. publishing connection state to the host
import { loadGmailProfile } from './api/helpers';
import { isGmailConnected } from './api/index';
import { publishSkillState } from './publish-state';
import { getGmailSkillState } from './state';

// Lifecycle types come from the canonical contract in `types/skill.d.ts`
// (`SkillStartArgs` / `SkillStartResult`). Both are global ambient types so
// no import is needed — we reference them directly below.

// Validate Gmail self_hosted credentials by exchanging the refresh token for
// an access token, then using it to hit the Gmail profile API. Returns null
// on success (and stashes the discovered email into config); returns a
// populated StartResult on failure.
function validateGmailSelfHosted(
  creds: Record<string, unknown>
): Extract<SkillStartResult, { status: 'error' }> | null {
  const s = getGmailSkillState();
  const clientId = creds.client_id as string | undefined;
  const clientSecret = creds.client_secret as string | undefined;
  const refreshToken = creds.refresh_token as string | undefined;

  if (!clientId || !clientSecret || !refreshToken) {
    return {
      status: 'error',
      errors: [{ field: 'refresh_token', message: 'All three fields are required.' }],
    };
  }

  try {
    const body = `client_id=${encodeURIComponent(clientId)}&client_secret=${encodeURIComponent(clientSecret)}&refresh_token=${encodeURIComponent(refreshToken)}&grant_type=refresh_token`;
    const response = net.fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
      timeout: 15,
    });

    if (response.status !== 200) {
      let errorMsg = 'Invalid credentials.';
      try {
        const parsed = JSON.parse(response.body) as { error_description?: string };
        if (parsed.error_description) errorMsg = parsed.error_description;
      } catch {
        /* use default */
      }
      return { status: 'error', errors: [{ field: 'refresh_token', message: errorMsg }] };
    }

    const tokenData = JSON.parse(response.body) as { access_token: string };
    const profileResp = net.fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        'Content-Type': 'application/json',
      },
      timeout: 10,
    });

    if (profileResp.status !== 200) {
      return {
        status: 'error',
        errors: [
          {
            field: 'client_id',
            message:
              'Token is valid but Gmail API access failed. Ensure Gmail API is enabled in your Google Cloud project.',
          },
        ],
      };
    }

    try {
      const profile = JSON.parse(profileResp.body) as { emailAddress?: string };
      if (profile.emailAddress) s.config.userEmail = profile.emailAddress;
    } catch {
      /* non-critical */
    }
    return null;
  } catch (err) {
    return {
      status: 'error',
      errors: [{ field: 'client_id', message: `Could not reach Google API: ${String(err)}` }],
    };
  }
}

// Validate a free-form text credential (raw access token or JSON blob).
function validateGmailText(
  creds: Record<string, unknown>
): Extract<SkillStartResult, { status: 'error' }> | null {
  const s = getGmailSkillState();
  const content = (creds.content || '') as string;
  if (!content.trim()) {
    return {
      status: 'error',
      errors: [{ field: 'content', message: 'Credential content is required.' }],
    };
  }

  let token = content.trim();
  try {
    const parsed = JSON.parse(content) as Record<string, unknown>;
    if (parsed.access_token) {
      token = parsed.access_token as string;
    } else if (parsed.private_key) {
      return {
        status: 'error',
        errors: [
          {
            field: 'content',
            message:
              'Service account JSON with private_key is not yet supported. Use a refresh token or access token instead.',
          },
        ],
      };
    }
  } catch {
    // Not JSON — treat as raw token
  }

  try {
    const profileResp = net.fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      timeout: 10,
    });

    if (profileResp.status === 401 || profileResp.status === 403) {
      return {
        status: 'error',
        errors: [{ field: 'content', message: 'Invalid or expired token.' }],
      };
    }

    if (profileResp.status !== 200) {
      const bodyPreview = profileResp.body ? profileResp.body.slice(0, 200) : '';
      return {
        status: 'error',
        errors: [
          {
            field: 'content',
            message: `Gmail API returned ${profileResp.status}. ${bodyPreview}`.trim(),
          },
        ],
      };
    }

    try {
      const profile = JSON.parse(profileResp.body) as { emailAddress?: string };
      if (profile.emailAddress) s.config.userEmail = profile.emailAddress;
    } catch {
      /* non-critical */
    }
    return null;
  } catch (err) {
    return {
      status: 'error',
      errors: [{ field: 'content', message: `Could not reach Gmail API: ${String(err)}` }],
    };
  }
}

// Validate the OAuth credential by hitting the Gmail API through the proxy
// (`oauth.fetch`, exposed via gmailFetch / loadGmailProfile). The proxy uses
// whatever credential the runtime currently has injected into the `oauth`
// bridge — that's the fresh credential the host injected before calling start().
function validateGmailOAuth(): Extract<SkillStartResult, { status: 'error' }> | null {
  try {
    loadGmailProfile();
    return null;
  } catch (err) {
    return {
      status: 'error',
      errors: [
        { field: 'oauth', message: `Gmail OAuth credential rejected by API: ${String(err)}` },
      ],
    };
  }
}

export function start(args?: SkillStartArgs): SkillStartResult {
  console.log('[gmail] start() called');
  const s = getGmailSkillState();

  // Stash incoming oauth metadata in temporaries — we only commit them to
  // s.config (and persist via state.set) *after* any requested validation
  // succeeds, so a rejected OAuth credential never overwrites the previously
  // stored account identity.
  let tempOauthCredentialId: string | undefined;
  let tempOauthAccountLabel: string | undefined;
  if (args && args.oauth) {
    const oauthCred = args.oauth as { credentialId?: string; accountLabel?: string };
    tempOauthCredentialId = oauthCred.credentialId;
    tempOauthAccountLabel = oauthCred.accountLabel;
  }

  // Validation phase — only when host explicitly asks (auth/oauth handshake).
  // We validate OAuth and direct-token (self_hosted / text) creds the same
  // way: hit the Gmail API and confirm the credential is accepted. If
  // validation fails we bail out *before* registering cron so a bad
  // credential never schedules background work.
  //
  // Auth `mode === 'managed'` is the OAuth handoff arriving via auth/complete
  // — its credentials live in the `oauth` bridge by the time start() runs,
  // so it goes through the OAuth validator just like a pure oauth/complete.
  if (args && args.validate) {
    const auth = args.auth as
      | { mode?: string; credentials?: Record<string, unknown> }
      | null
      | undefined;

    let validationError;
    if (auth && auth.mode === 'self_hosted') {
      validationError = validateGmailSelfHosted(auth.credentials || {});
    } else if (auth && auth.mode === 'text') {
      validationError = validateGmailText(auth.credentials || {});
    } else if (args.oauth || (auth && auth.mode === 'managed')) {
      validationError = validateGmailOAuth();
    } else if (auth) {
      // `auth` was provided but `mode` is missing or not one of the
      // recognized values. Reject explicitly so we never fall through to
      // `connected = true` with credentials we don't know how to use.
      validationError = {
        status: 'error' as const,
        errors: [
          {
            field: 'mode',
            message: auth.mode
              ? `Unsupported auth mode: ${auth.mode}`
              : 'Missing auth mode — expected self_hosted, text, or managed.',
          },
        ],
      };
    }

    if (validationError) {
      console.log('[gmail] start(): validation failed');
      return validationError;
    }
  }

  // Validation passed (or wasn't requested) — now it's safe to commit the
  // oauth metadata onto s.config and persist it. We do this *after* the
  // validation block so a rejected credential is never written to disk.
  if (tempOauthCredentialId || tempOauthAccountLabel) {
    if (tempOauthCredentialId) s.config.credentialId = tempOauthCredentialId;
    if (tempOauthAccountLabel) s.config.userEmail = tempOauthAccountLabel;
    state.set('config', s.config);
  } else if (args && args.validate) {
    // Direct-token validators (self_hosted / text) update s.config.userEmail
    // in-place on success, so persist whatever they discovered.
    state.set('config', s.config);
  }

  const hasCredFromArgs = !!(args && (args.oauth || args.auth));
  const connected = hasCredFromArgs || isGmailConnected();

  if (!connected) {
    console.log('[gmail] start(): no credential yet — waiting for auth');
    publishSkillState();
    return { status: 'complete' };
  }

  if (!s.config.syncEnabled) {
    console.log('[gmail] start(): connected but sync disabled');
    cron.unregister('gmail-sync');
    publishSkillState();
    return { status: 'complete' };
  }

  // Always unregister first so re-calls from oauth/auth complete don't pile up
  // duplicate timers.
  cron.unregister('gmail-sync');
  const cronExpr = `0 */${s.config.syncIntervalMinutes} * * * *`;
  cron.register('gmail-sync', cronExpr);
  console.log(`[gmail] start(): scheduled sync every ${s.config.syncIntervalMinutes} minutes`);
  publishSkillState();
  return { status: 'complete', message: 'Connected to Gmail!' };
}
