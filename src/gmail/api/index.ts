// ---------------------------------------------------------------------------
// Gmail API helper (uses net.fetch directly with Bearer token)
import { getGmailSkillState } from '../state';
import type { ApiError } from '../types';

/** Max retries on 429 rate-limit responses. */
const MAX_RETRIES = 3;

/** Default backoff in ms when Retry-After header is absent. */
const DEFAULT_BACKOFF_MS = 5_000;

/** Sleep helper for retry backoff. */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const GMAIL_BASE_URL = 'https://gmail.googleapis.com/gmail/v1';

export interface GmailApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

export async function gmailFetch<T = unknown>(
  endpoint: string,
  options: {
    method?: string;
    body?: string;
    headers?: Record<string, string>;
    timeout?: number;
  } = {}
): Promise<GmailApiResponse<T>> {
  const credential = oauth.getCredential();

  if (!credential) {
    console.log('[gmail] gmailFetch: no credential (OAuth not connected)');
    return {
      success: false,
      error: { code: 401, message: 'Gmail not connected. Complete OAuth setup first.' },
    };
  }

  const accessToken = credential.accessToken;
  if (!accessToken) {
    console.log('[gmail] gmailFetch: credential missing accessToken');
    return {
      success: false,
      error: { code: 401, message: 'Gmail credential has no access token. Please reconnect.' },
    };
  }

  // Build the full URL — endpoint may start with / or be relative
  const cleanPath = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${GMAIL_BASE_URL}${cleanPath}`;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log('[gmail] gmailFetch:', options.method || 'GET', url, accessToken);
      const response = await net.fetch(url, {
        method: options.method || 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          ...(options.headers || {}),
        },
        body: options.body,
        timeout: options.timeout || 10,
      });
      console.log('[gmail] gmailFetch response status:', response.status);

      const s = getGmailSkillState();

      // -- 429 Rate Limit: back off and retry --------------------------------
      if (response.status === 429 && attempt < MAX_RETRIES) {
        const retryAfter = response.headers['retry-after'];
        const waitMs = retryAfter
          ? parseInt(retryAfter, 10) * 1000
          : DEFAULT_BACKOFF_MS * (attempt + 1);
        console.log(
          `[gmail] gmailFetch: 429 rate-limited path=${url} — retrying in ${waitMs}ms (attempt ${attempt + 1}/${MAX_RETRIES})`
        );
        await sleep(waitMs);
        continue;
      }

      if (response.status === 401) {
        const bodyPreview = response.body ? response.body.slice(0, 200) : '(empty)';
        console.log(
          `[gmail] gmailFetch: 401 Unauthorized url=${url} credentialId=${credential.credentialId} body=${bodyPreview}`
        );
      } else if (response.status >= 400) {
        const bodyPreview = response.body ? response.body.slice(0, 200) : '(empty)';
        console.log(
          `[gmail] gmailFetch: error url=${url} status=${response.status} body=${bodyPreview}`
        );
      }

      // Update rate limit info from headers
      if (response.headers['x-ratelimit-remaining']) {
        s.rateLimitRemaining = parseInt(response.headers['x-ratelimit-remaining'], 10);
      }
      if (response.headers['x-ratelimit-reset']) {
        s.rateLimitReset = parseInt(response.headers['x-ratelimit-reset'], 10) * 1000;
      }

      if (response.status >= 200 && response.status < 300) {
        const data: T | undefined = response.body ? (JSON.parse(response.body) as T) : undefined;
        s.lastApiError = null;
        return { success: true, data };
      } else {
        const error: ApiError = response.body
          ? (JSON.parse(response.body) as ApiError)
          : { code: response.status, message: 'API request failed' };
        s.lastApiError = error.message || `HTTP ${response.status}`;
        return { success: false, error };
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error(`[gmail] gmailFetch error url=${url}: ${errorMsg}`);
      const s = getGmailSkillState();
      s.lastApiError = errorMsg;
      return { success: false, error: { code: 500, message: errorMsg } };
    }
  }

  // Exhausted retries (only reachable after repeated 429s)
  return { success: false, error: { code: 429, message: 'Rate limit exceeded after retries' } };
}
