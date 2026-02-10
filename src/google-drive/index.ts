// Google Drive skill — Drive files, Sheets, and Docs (API-only; no DB/cron)
import './skill-state';
import { createDocumentTool } from './tools/create-document';
import { getDocumentTool } from './tools/get-document';
import { getFileTool } from './tools/get-file';
import { getSheetValuesTool } from './tools/get-sheet-values';
import { getSpreadsheetTool } from './tools/get-spreadsheet';
import { listFilesTool } from './tools/list-files';
import { searchFilesTool } from './tools/search-files';
import { updateSheetValuesTool } from './tools/update-sheet-values';
import type { SkillConfig } from './types';

// ---------------------------------------------------------------------------
// Drive/Sheets/Docs API helper — path relative to manifest apiBaseUrl, or pass baseUrl for Sheets/Docs
// ---------------------------------------------------------------------------

async function driveFetch(
  endpoint: string,
  options: {
    method?: string;
    body?: string;
    headers?: Record<string, string>;
    timeout?: number;
    baseUrl?: string;
  } = {}
): Promise<{ success: boolean; data?: unknown; error?: { code: number; message: string } }> {
  if (!oauth.getCredential()) {
    return {
      success: false,
      error: { code: 401, message: 'Google Drive not connected. Complete OAuth setup first.' },
    };
  }

  try {
    const response = await oauth.fetch(endpoint, {
      method: options.method || 'GET',
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
      body: options.body,
      timeout: options.timeout || 30,
      baseUrl: options.baseUrl,
    });

    const s = globalThis.getGoogleDriveSkillState();
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
    const s = globalThis.getGoogleDriveSkillState();
    s.lastApiError = errorMsg;
    return { success: false, error: { code: 500, message: errorMsg } };
  }
}

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------

function init(): void {
  console.log(`[google-drive] Initializing on ${platform.os()}`);
  const s = globalThis.getGoogleDriveSkillState();
  const saved = state.get('config') as Partial<SkillConfig> | null;
  if (saved) {
    s.config.credentialId = saved.credentialId || s.config.credentialId;
    s.config.userEmail = saved.userEmail || s.config.userEmail;
  }
  const isConnected = !!oauth.getCredential();
  console.log(`[google-drive] Initialized. Connected: ${isConnected}`);
}

function start(): void {
  console.log('[google-drive] Starting skill...');
  publishSkillState();
}

function stop(): void {
  console.log('[google-drive] Stopping skill...');
  const s = globalThis.getGoogleDriveSkillState();
  state.set('config', s.config);
  console.log('[google-drive] Skill stopped');
}

function onSessionStart(args: { sessionId: string }): void {
  const s = globalThis.getGoogleDriveSkillState();
  s.activeSessions.push(args.sessionId);
}

function onSessionEnd(args: { sessionId: string }): void {
  const s = globalThis.getGoogleDriveSkillState();
  const i = s.activeSessions.indexOf(args.sessionId);
  if (i > -1) s.activeSessions.splice(i, 1);
}

async function onOAuthComplete(args: OAuthCompleteArgs): Promise<void> {
  console.log(`[google-drive] OAuth complete: ${args.provider}`);
  const s = globalThis.getGoogleDriveSkillState();
  s.config.credentialId = args.credentialId;
  if (args.accountLabel) s.config.userEmail = args.accountLabel;
  state.set('config', s.config);
  publishSkillState();
}

function onOAuthRevoked(_args: OAuthRevokedArgs): void {
  const s = globalThis.getGoogleDriveSkillState();
  s.config = { credentialId: '', userEmail: '' };
  state.set('config', s.config);
  publishSkillState();
}

function onDisconnect(): void {
  oauth.revoke();
  const s = globalThis.getGoogleDriveSkillState();
  s.config = { credentialId: '', userEmail: '' };
  state.delete('config');
  publishSkillState();
}

function publishSkillState(): void {
  const s = globalThis.getGoogleDriveSkillState();
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
_g.driveFetch = driveFetch;
_g.publishSkillState = publishSkillState;

const tools: ToolDefinition[] = [
  listFilesTool,
  getFileTool,
  searchFilesTool,
  getSpreadsheetTool,
  getSheetValuesTool,
  updateSheetValuesTool,
  getDocumentTool,
  createDocumentTool,
];

const skill: Skill = {
  info: {
    id: 'google-drive',
    name: 'Google Drive',
    version: '1.0.0',
    description: 'Google Drive integration',
    auto_start: true,
    setup: { required: true, label: 'Google Drive' },
  },
  tools,
  init,
  start,
  stop,
  onSessionStart,
  onSessionEnd,
  onOAuthComplete,
  onOAuthRevoked,
  onDisconnect,
};

export default skill;
