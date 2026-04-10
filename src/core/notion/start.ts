// notion/start.ts
//
// The single activation entry point for the Notion skill. The Rust host calls
// `start({ oauth, auth, validate? })`:
//
//   - on instance spawn (with credentials read from disk)
//   - immediately after `oauth/complete` once the OAuth credential is persisted
//   - immediately after `auth/complete` for self_hosted / text auth modes,
//     with `validate: true` so we hit the Notion API and surface field-level
//     errors before any cron is registered
//
// start() owns:
//   1. picking up account metadata from the credential bag
//   2. (optional) validating credentials against the upstream API
//   3. registering the periodic sync cron
//   4. publishing connection state to the host
import { notionApi } from './api/index';
import { isNotionConnected } from './helpers';
import { publishState } from './publish-state';
import { getNotionSkillState } from './state';

export interface NotionStartArgs {
  oauth?: Record<string, unknown> | null;
  auth?: Record<string, unknown> | null;
  validate?: boolean;
}

export type StartResult =
  | { status: 'complete'; message?: string }
  | { status: 'error'; errors: Array<{ field: string; message: string }> };

// Validate the OAuth credential by hitting the Notion API through the proxy
// (`oauth.fetch`, exposed via notionApi). The proxy uses whatever credential
// the runtime currently has injected into the `oauth` bridge — that's the
// fresh credential the host injected before calling start().
function validateNotionOAuth(): {
  status: 'error';
  errors: Array<{ field: string; message: string }>;
} | null {
  try {
    const user = notionApi.getUser('me') as Record<string, unknown>;
    // Best-effort: stash workspace/user name from the bot user record
    const name = user.name as string | undefined;
    if (name && !getNotionSkillState().config.workspaceName) {
      getNotionSkillState().config.workspaceName = name;
    }
    return null;
  } catch (err) {
    return {
      status: 'error',
      errors: [
        { field: 'oauth', message: `Notion OAuth credential rejected by API: ${String(err)}` },
      ],
    };
  }
}

// Hit the Notion API directly with the token from a self_hosted/text auth
// credential. Returns null on success (and stashes the discovered workspace
// name into state); returns a populated StartResult on failure.
function validateNotionAuthDirect(auth: {
  mode?: string;
  credentials?: Record<string, unknown>;
}): { status: 'error'; errors: Array<{ field: string; message: string }> } | null {
  const creds = auth.credentials || {};
  const token = (creds.api_token || creds.content || creds.access_token) as string | undefined;
  if (!token) {
    return { status: 'error', errors: [{ field: 'api_token', message: 'API token is required.' }] };
  }

  try {
    const response = net.fetch('https://api.notion.com/v1/users/me', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2026-03-11',
      },
      timeout: 15,
    });

    if (response.status === 401 || response.status === 403) {
      return {
        status: 'error',
        errors: [
          {
            field: 'api_token',
            message: 'Invalid token. Check that your integration token is correct.',
          },
        ],
      };
    }

    if (response.status >= 400) {
      return {
        status: 'error',
        errors: [
          {
            field: 'api_token',
            message: `Notion API returned error ${response.status}. Please check your token.`,
          },
        ],
      };
    }

    // Token is valid — extract workspace info from the bot user record
    try {
      const data = JSON.parse(response.body) as {
        results?: Array<{ name?: string; type?: string }>;
      };
      const botUser = data.results ? data.results.find(u => u.type === 'bot') : undefined;
      if (botUser && botUser.name) {
        getNotionSkillState().config.workspaceName = botUser.name;
      }
    } catch {
      // Non-critical: workspace name extraction failed
    }

    return null;
  } catch (err) {
    return {
      status: 'error',
      errors: [{ field: 'api_token', message: `Could not reach Notion API: ${String(err)}` }],
    };
  }
}

export function start(args?: NotionStartArgs): StartResult {
  const s = getNotionSkillState();

  // Pick up account label from the freshly delivered credential bag if we
  // didn't have it stashed already (e.g. first time after OAuth handoff).
  if (args && args.oauth) {
    const oauthCred = args.oauth as { credentialId?: string; accountLabel?: string };
    if (oauthCred.credentialId) s.config.credentialId = oauthCred.credentialId;
    if (oauthCred.accountLabel && !s.config.workspaceName) {
      s.config.workspaceName = oauthCred.accountLabel;
    }
    state.set('config', s.config);
  }

  // Validation phase — only when host explicitly asks (auth/oauth handshake).
  // We validate OAuth and direct-token (self_hosted / text) creds the same
  // way: hit the Notion API and confirm the credential is accepted. If
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
    const validatesViaProxy = !!args.oauth || !auth || auth.mode === 'managed';

    let validationError;
    if (auth && auth.mode && auth.mode !== 'managed') {
      validationError = validateNotionAuthDirect(auth);
    } else if (validatesViaProxy) {
      validationError = validateNotionOAuth();
    }

    if (validationError) {
      console.log('[notion] start(): validation failed');
      return validationError;
    }
    state.set('config', s.config);
  }

  // The skill activates the moment we have a credential — either from the
  // bag the host hands us, or from the bridges (oauth.getCredential / auth)
  // which were already populated by the runtime. We tolerate both so re-calls
  // from oauth/auth complete and the initial spawn behave identically.
  const hasCredFromArgs = !!(args && (args.oauth || args.auth));
  const connected = hasCredFromArgs || isNotionConnected();

  if (!connected) {
    console.log('[notion] start(): no credential yet — waiting for auth');
    publishState();
    return { status: 'complete' };
  }

  // Register sync cron schedule. Always unregister first so re-calls from
  // oauth/auth complete don't pile up duplicate timers.
  cron.unregister('notion-sync');
  const cronExpr = `0 */${s.config.syncIntervalMinutes} * * * *`;
  cron.register('notion-sync', cronExpr);
  console.log(`[notion] start(): scheduled sync every ${s.config.syncIntervalMinutes} minutes`);
  publishState();
  return { status: 'complete', message: 'Connected to Notion!' };
}
