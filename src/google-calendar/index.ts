// Google Calendar skill — list calendars and events, create/update/delete events
// OAuth via bridge; no DB or cron (API-only like a thin Gmail-style skill)
import './skill-state';
import { createEventTool } from './tools/create-event';
import { deleteEventTool } from './tools/delete-event';
import { getEventTool } from './tools/get-event';
import { listCalendarsTool } from './tools/list-calendars';
import { listEventsTool } from './tools/list-events';
import { updateEventTool } from './tools/update-event';
import type { SkillConfig } from './types';

// ---------------------------------------------------------------------------
// Calendar API helper (uses oauth.fetch; path relative to manifest apiBaseUrl)
// ---------------------------------------------------------------------------

function calendarFetch(
  endpoint: string,
  options: {
    method?: string;
    body?: string;
    headers?: Record<string, string>;
    timeout?: number;
  } = {}
): { success: boolean; data?: unknown; error?: { code: number; message: string } } {
  if (!oauth.getCredential()) {
    return {
      success: false,
      error: { code: 401, message: 'Google Calendar not connected. Complete OAuth setup first.' },
    };
  }

  try {
    const response = oauth.fetch(endpoint, {
      method: options.method || 'GET',
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
      body: options.body,
      timeout: options.timeout || 30,
    });

    const s = globalThis.getGoogleCalendarSkillState();
    if (response.headers['x-ratelimit-remaining']) {
      s.rateLimitRemaining = parseInt(response.headers['x-ratelimit-remaining'], 10);
    }
    if (response.headers['x-ratelimit-reset']) {
      s.rateLimitReset = parseInt(response.headers['x-ratelimit-reset'], 10) * 1000;
    }

    if (response.status >= 200 && response.status < 300) {
      const data = response.body ? JSON.parse(response.body) : null;
      s.lastApiError = null;
      return { success: true, data };
    }
    const error = response.body
      ? JSON.parse(response.body)
      : { code: response.status, message: 'API request failed' };
    s.lastApiError = (error as { message?: string }).message || `HTTP ${response.status}`;
    return { success: false, error: { code: response.status, message: s.lastApiError } };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    const s = globalThis.getGoogleCalendarSkillState();
    s.lastApiError = errorMsg;
    return { success: false, error: { code: 500, message: errorMsg } };
  }
}

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------

function init(): void {
  console.log(`[google-calendar] Initializing on ${platform.os()}`);
  const s = globalThis.getGoogleCalendarSkillState();
  const saved = state.get('config') as Partial<SkillConfig> | null;
  if (saved) {
    s.config.credentialId = saved.credentialId || s.config.credentialId;
    s.config.userEmail = saved.userEmail || s.config.userEmail;
  }
  const isConnected = !!oauth.getCredential();
  console.log(`[google-calendar] Initialized. Connected: ${isConnected}`);
}

function start(): void {
  console.log('[google-calendar] Starting skill...');
  publishSkillState();
}

function stop(): void {
  console.log('[google-calendar] Stopping skill...');
  const s = globalThis.getGoogleCalendarSkillState();
  state.set('config', s.config);
  console.log('[google-calendar] Skill stopped');
}

function onSessionStart(args: { sessionId: string }): void {
  const s = globalThis.getGoogleCalendarSkillState();
  s.activeSessions.push(args.sessionId);
}

function onSessionEnd(args: { sessionId: string }): void {
  const s = globalThis.getGoogleCalendarSkillState();
  const i = s.activeSessions.indexOf(args.sessionId);
  if (i > -1) s.activeSessions.splice(i, 1);
}

function onOAuthComplete(args: OAuthCompleteArgs): void {
  console.log(`[google-calendar] OAuth complete: ${args.provider}`);
  const s = globalThis.getGoogleCalendarSkillState();
  s.config.credentialId = args.credentialId;
  if (args.accountLabel) s.config.userEmail = args.accountLabel;
  state.set('config', s.config);
  publishSkillState();
}

function onOAuthRevoked(_args: OAuthRevokedArgs): void {
  const s = globalThis.getGoogleCalendarSkillState();
  s.config = { credentialId: '', userEmail: '' };
  state.set('config', s.config);
  publishSkillState();
}

function onDisconnect(): void {
  oauth.revoke();
  const s = globalThis.getGoogleCalendarSkillState();
  s.config = { credentialId: '', userEmail: '' };
  state.delete('config');
  publishSkillState();
}

function publishSkillState(): void {
  const s = globalThis.getGoogleCalendarSkillState();
  const isConnected = !!oauth.getCredential();
  state.setPartial({
    connection_status: isConnected ? 'connected' : 'disconnected',
    auth_status: isConnected ? 'authenticated' : 'not_authenticated',
    connection_error: s.lastApiError || null,
    auth_error: null,
    is_initialized: isConnected,
    userEmail: s.config.userEmail,
    activeSessions: s.activeSessions.length,
    rateLimitRemaining: s.rateLimitRemaining,
    lastError: s.lastApiError,
  });
}

const _g = globalThis as Record<string, unknown>;
_g.calendarFetch = calendarFetch;
_g.publishSkillState = publishSkillState;
_g.init = init;
_g.start = start;
_g.stop = stop;
_g.onSessionStart = onSessionStart;
_g.onSessionEnd = onSessionEnd;
_g.onOAuthComplete = onOAuthComplete;
_g.onOAuthRevoked = onOAuthRevoked;
_g.onDisconnect = onDisconnect;

tools = [
  listCalendarsTool,
  listEventsTool,
  getEventTool,
  createEventTool,
  updateEventTool,
  deleteEventTool,
];
