// Central fetch wrapper for Gmail API.
// Handles auth injection via oauth.fetch, error parsing, and rate limiting.
import type { GmailFetchResult } from '../types';

export async function gmailFetch(
  endpoint: string,
  options: {
    method?: string;
    body?: string;
    headers?: Record<string, string>;
    timeout?: number;
  } = {}
): Promise<GmailFetchResult> {
  const credential = oauth.getCredential();

  if (!credential) {
    return {
      success: false,
      error: { code: 401, message: 'Gmail not connected. Complete OAuth setup first.' },
    };
  }

  try {
    const response = await oauth.fetch(endpoint, {
      method: options.method || 'GET',
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
      body: options.body,
      timeout: options.timeout || 30,
    });

    const s = globalThis.getGmailSkillState();

    // Update rate limit info from headers
    if (response.headers['x-ratelimit-remaining']) {
      s.rateLimitRemaining = parseInt(response.headers['x-ratelimit-remaining'], 10);
    }
    if (response.headers['x-ratelimit-reset']) {
      s.rateLimitReset = parseInt(response.headers['x-ratelimit-reset'], 10) * 1000;
    }

    if (response.status === 401) {
      s.lastApiError = 'Unauthorized';
      return {
        success: false,
        error: { code: 401, message: 'Unauthorized. Credentials may have expired.' },
      };
    }

    if (response.status === 429) {
      s.lastApiError = 'Rate limited';
      return { success: false, error: { code: 429, message: 'Rate limited. Try again later.' } };
    }

    if (response.status >= 200 && response.status < 300) {
      const data = response.body ? JSON.parse(response.body) : null;
      s.lastApiError = null;
      return { success: true, data };
    }

    const error = response.body
      ? JSON.parse(response.body)
      : { code: response.status, message: 'API request failed' };
    s.lastApiError = error.message || `HTTP ${response.status}`;
    return { success: false, error };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    const s = globalThis.getGmailSkillState();
    s.lastApiError = errorMsg;
    return { success: false, error: { code: 500, message: errorMsg } };
  }
}
