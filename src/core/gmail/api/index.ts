// ---------------------------------------------------------------------------
// Gmail API helper (all requests via OAuth proxy — `oauth.fetch`)
import { getGmailSkillState } from '../state';
import type { ApiError } from '../types';

/** Max retries on 429 rate-limit responses. */
const MAX_RETRIES = 3;

/** Default backoff in ms when Retry-After header is absent. */
const DEFAULT_BACKOFF_MS = 5_000;

/** Busy-wait sleep for retry backoff (QuickJS has no async setTimeout). */
function sleep(ms: number): void {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    /* busy wait */
  }
}

/** Returns true if any form of Gmail credential is available. */
export function isGmailConnected(): boolean {
  const authCred = auth.getCredential();
  if (authCred && authCred.mode !== 'managed') return true;
  const oauthCred = oauth.getCredential();
  return !!oauthCred;
}

/** Parsed Gmail API result: success payload or structured error for callers. */
export interface GmailApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

/**
 * Perform a Gmail REST request through the managed OAuth proxy (`oauth.fetch`).
 * Handles 429 backoff, rate-limit header updates, and optional raw batch bodies.
 *
 * @param endpoint - Path under the Gmail API root (leading `/` optional)
 * @param options - HTTP method, body, headers, timeout, or `rawBatch` for multipart batch responses
 */
export function gmailFetch<T = unknown>(
  endpoint: string,
  options: {
    method?: string;
    body?: string;
    headers?: Record<string, string>;
    timeout?: number;
    rawBatch?: boolean;
  } = {}
): GmailApiResponse<T> {
  const cleanPath = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const method = options.method || 'GET';
  const timeout = options.timeout || 10;
  const oauthCred = oauth.getCredential();

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (!oauthCred) {
      console.log('[gmail] gmailFetch: no OAuth credential');
      return {
        success: false,
        error: { code: 401, message: 'Gmail not connected. Complete setup first.' },
      };
    }

    try {
      // All Gmail API requests go through OAuth proxy.
      // oauth.fetch path is relative to the manifest apiBaseUrl.
      console.log('[gmail] gmailFetch (oauth.fetch):', method, cleanPath);
      const response = oauth.fetch(cleanPath, {
        method,
        headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
        body: options.body,
        timeout,
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
          `[gmail] gmailFetch: 429 rate-limited — retrying in ${waitMs}ms (attempt ${attempt + 1}/${MAX_RETRIES})`
        );
        sleep(waitMs);
        continue;
      }

      if (response.status >= 400) {
        const bodyPreview = response.body ? response.body.slice(0, 200) : '(empty)';
        console.log(`[gmail] gmailFetch: error status=${response.status} body=${bodyPreview}`);
      }

      // Update rate limit info from headers
      if (response.headers['x-ratelimit-remaining']) {
        s.rateLimitRemaining = parseInt(response.headers['x-ratelimit-remaining'], 10);
      }
      if (response.headers['x-ratelimit-reset']) {
        s.rateLimitReset = parseInt(response.headers['x-ratelimit-reset'], 10) * 1000;
      }

      if (response.status >= 200 && response.status < 300) {
        // Batch responses are multipart/mixed — return raw body without JSON parsing
        if (options.rawBatch) {
          s.lastApiError = null;
          return { success: true, data: response.body as unknown as T };
        }
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
      console.error(`[gmail] gmailFetch error: ${errorMsg}`);
      const s = getGmailSkillState();
      s.lastApiError = errorMsg;
      return { success: false, error: { code: 500, message: errorMsg } };
    }
  }

  // Exhausted retries (only reachable after repeated 429s)
  return { success: false, error: { code: 429, message: 'Rate limit exceeded after retries' } };
}
