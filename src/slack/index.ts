// slack/index.ts
// Full-fledged Slack bot skill: read/send messages, receive real-time events, periodic sync, store in DB.
import { getChannelTool } from './tools/get-channel';
import { getMessagesTool } from './tools/get-messages';
import { listChannelsTool } from './tools/list-channels';
import { openDmTool } from './tools/open-dm';
import { sendMessageTool } from './tools/send-message';
import { syncNowTool } from './tools/sync-now';

// Inline display-text helper (also exposed on globalThis for bundled tools). Avoids bundle import issues.
function getMessageDisplayText(msg: Record<string, unknown>): string {
  const text = (msg.text as string) ?? '';
  if (text.trim()) return text;
  if (Array.isArray(msg.blocks)) {
    const parts: string[] = [];
    for (const block of msg.blocks) {
      if (!block || typeof block !== 'object') continue;
      const b = block as Record<string, unknown>;
      if (b.text && typeof b.text === 'object' && b.text !== null && 'text' in (b.text as object)) {
        const t = (b.text as { text?: string }).text;
        if (typeof t === 'string' && t.trim()) parts.push(t.trim());
      }
      if (b.elements && Array.isArray(b.elements)) {
        for (const el of b.elements) {
          if (el && typeof el === 'object' && 'text' in (el as object)) {
            const t = (el as { text?: string }).text;
            if (typeof t === 'string' && t.trim()) parts.push(t.trim());
          }
        }
      }
    }
    if (parts.length > 0) return parts.join(' ');
  }
  if (Array.isArray(msg.attachments)) {
    const parts: string[] = [];
    for (const a of msg.attachments) {
      if (!a || typeof a !== 'object') continue;
      const at = a as Record<string, unknown>;
      for (const key of ['fallback', 'pretext', 'title', 'text']) {
        const v = at[key];
        if (typeof v === 'string' && v.trim()) parts.push(v.trim());
      }
    }
    if (parts.length > 0) return parts.join(' ');
  }
  return '';
}
(globalThis as Record<string, unknown>).getMessageDisplayText = getMessageDisplayText;

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

interface SlackConfig {
  botToken: string;
  workspaceName: string;
  syncIntervalMinutes: number;
}

const CONFIG: SlackConfig = { botToken: '', workspaceName: '', syncIntervalMinutes: 20 };

const SLACK_BASE_URL = 'https://slack.com/api';
const SLACK_REQUEST_TIMEOUT = 15000;

/** Max channels to fetch history for per sync (avoid rate limits). */
const SYNC_MAX_CHANNELS = 30;
/** Rolling window: always keep this many days of messages. */
const SYNC_WINDOW_DAYS = 90;
/** Max pages per channel per sync run (each page = 200 messages). */
const SYNC_MAX_PAGES_PER_CHANNEL = 10;

let syncInProgress = false;
let lastSyncTime = 0;
let lastSyncChannels = 0;
let lastSyncMessages = 0;

/** Per-channel newest ts we've synced (for incremental: next run fetches from this ts to now). */
let lastSyncedLatestPerChannel: Record<string, string> = {};

// ---------------------------------------------------------------------------
// Lifecycle hooks
// ---------------------------------------------------------------------------

function init(): void {
  console.log('[slack] Initializing');

  // Create table for messages received via events and sync
  db.exec(
    `CREATE TABLE IF NOT EXISTS slack_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      channel_id TEXT NOT NULL,
      user_id TEXT,
      ts TEXT NOT NULL,
      text TEXT,
      type TEXT,
      subtype TEXT,
      event_type TEXT,
      thread_ts TEXT,
      created_at TEXT NOT NULL,
      blocks_json TEXT,
      attachments_json TEXT,
      UNIQUE(channel_id, ts)
    )`,
    []
  );
  try {
    db.exec('ALTER TABLE slack_messages ADD COLUMN blocks_json TEXT');
  } catch {
    // column may already exist
  }
  try {
    db.exec('ALTER TABLE slack_messages ADD COLUMN attachments_json TEXT');
  } catch {
    // column may already exist
  }

  // Load persisted config from state
  const saved = state.get('config') as Partial<SlackConfig> | null;
  if (saved) {
    CONFIG.botToken = (saved.botToken as string) ?? '';
    CONFIG.workspaceName = (saved.workspaceName as string) ?? '';
    CONFIG.syncIntervalMinutes =
      typeof (saved.syncIntervalMinutes as number) === 'number'
        ? (saved.syncIntervalMinutes as number)
        : 20;
  }

  const savedLastSync = state.get('lastSyncTime') as number | null;
  if (savedLastSync && typeof savedLastSync === 'number') {
    lastSyncTime = savedLastSync;
  }

  const savedPerChannel = state.get('lastSyncedLatestPerChannel') as Record<string, string> | null;
  if (savedPerChannel && typeof savedPerChannel === 'object') {
    lastSyncedLatestPerChannel = { ...savedPerChannel };
  }

  if (CONFIG.botToken) {
    console.log(`[slack] Connected to workspace: ${CONFIG.workspaceName || '(unnamed)'}`);
  } else {
    console.log('[slack] No bot token configured — waiting for setup');
  }

  publishState();
}

function start(): void {
  if (!CONFIG.botToken) {
    console.log('[slack] No bot token — skill inactive until setup completes');
    return;
  }
  const mins = CONFIG.syncIntervalMinutes;
  const cronExpr = `0 */${mins} * * * *`;
  cron.register('slack-sync', cronExpr);
  console.log(`[slack] Started — sync every ${mins} minutes`);

  const tenMinsMs = 10 * 60 * 1000;
  if (lastSyncTime === 0 || Date.now() - lastSyncTime > tenMinsMs) {
    performSync();
  } else {
    console.log('[slack] Skipping initial sync (last sync was within 10 minutes)');
  }
  publishState();
}

function stop(): void {
  cron.unregister('slack-sync');
  state.set('config', CONFIG);
  state.set('lastSyncTime', lastSyncTime);
  state.set('lastSyncedLatestPerChannel', lastSyncedLatestPerChannel);
  console.log('[slack] Stopped');
  state.set('status', 'stopped');
  publishState();
}

// ---------------------------------------------------------------------------
// Setup flow (single step: bot token)
// ---------------------------------------------------------------------------

function onSetupStart(): SetupStartResult {
  return {
    step: {
      id: 'bot_token',
      title: 'Connect Slack',
      description:
        'Enter your Slack Bot User OAuth Token (xoxb-...). ' +
        'Create an app at https://api.slack.com/apps and install it to your workspace. ' +
        'Find the token under OAuth & Permissions > Bot User OAuth Token.',
      fields: [
        {
          name: 'bot_token',
          type: 'password',
          label: 'Bot Token',
          description: 'Your Slack bot token (starts with xoxb-)',
          required: true,
          placeholder: 'xoxb-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        },
      ],
    },
  };
}

function onSetupSubmit(args: {
  stepId: string;
  values: Record<string, unknown>;
}): SetupSubmitResult {
  const { stepId, values } = args;

  if (stepId !== 'bot_token') {
    return { status: 'error', errors: [{ field: '', message: `Unknown setup step: ${stepId}` }] };
  }

  const rawToken = ((values.bot_token as string) ?? '').trim();

  if (!rawToken) {
    return { status: 'error', errors: [{ field: 'bot_token', message: 'Bot token is required' }] };
  }

  if (!rawToken.startsWith('xoxb-')) {
    return {
      status: 'error',
      errors: [
        {
          field: 'bot_token',
          message: "Bot token should start with 'xoxb-'. Check your Slack app settings.",
        },
      ],
    };
  }

  // Validate token by calling auth.test
  try {
    const response = net.fetch(`${SLACK_BASE_URL}/auth.test`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${rawToken}`, 'Content-Type': 'application/json' },
      timeout: 15000,
    });

    if (response.status !== 200) {
      return {
        status: 'error',
        errors: [{ field: 'bot_token', message: `Slack API error: ${response.status}` }],
      };
    }

    const auth = JSON.parse(response.body) as {
      ok?: boolean;
      team?: string;
      url?: string;
      error?: string;
    };
    if (!auth.ok) {
      const err = auth.error || 'invalid_auth';
      return {
        status: 'error',
        errors: [
          {
            field: 'bot_token',
            message:
              err === 'invalid_auth'
                ? 'Invalid bot token. Please check your token.'
                : `Slack error: ${err}`,
          },
        ],
      };
    }

    const workspaceName = (auth.team as string) || (auth.url as string) || '';
    CONFIG.botToken = rawToken;
    CONFIG.workspaceName = workspaceName;
    state.set('config', CONFIG);
    data.write('config.json', JSON.stringify({ workspaceName }, null, 2));

    console.log(`[slack] Setup complete — connected to ${workspaceName || 'workspace'}`);
    publishState();
    return { status: 'complete' };
  } catch (e) {
    return {
      status: 'error',
      errors: [{ field: 'bot_token', message: `Failed to connect: ${formatApiError(e)}` }],
    };
  }
}

function onSetupCancel(): void {
  console.log('[slack] Setup cancelled');
}

// ---------------------------------------------------------------------------
// Cron: periodic sync
// ---------------------------------------------------------------------------

function onCronTrigger(scheduleId: string): void {
  if (scheduleId === 'slack-sync') {
    performSync();
  }
}

// ---------------------------------------------------------------------------
// Event-driven ingestion: onServerEvent
// ---------------------------------------------------------------------------

function onServerEvent(event: string, data: unknown): void {
  if (event !== 'slack') {
    return;
  }

  const envelope = data as Record<string, unknown> | null;
  if (!envelope || typeof envelope !== 'object') {
    return;
  }

  // Events API: { type: 'event_callback', event: { type: 'message', channel, user, ts, text, ... } }
  // Socket Mode: similar envelope
  const eventPayload = envelope.event as Record<string, unknown> | undefined;
  if (!eventPayload || typeof eventPayload !== 'object') {
    return;
  }

  const eventType = eventPayload.type as string | undefined;
  if (eventType !== 'message' && eventType !== 'app_mention') {
    return;
  }

  const channelId = eventPayload.channel as string | undefined;
  const ts = eventPayload.ts as string | undefined;
  if (!channelId || !ts) {
    return;
  }

  const userId = eventPayload.user as string | undefined;
  const displayText = getMessageDisplayText(eventPayload);
  const type = (eventPayload.type as string) ?? 'message';
  const subtype = eventPayload.subtype as string | undefined;
  const threadTs = eventPayload.thread_ts as string | undefined;
  const createdAt = new Date().toISOString();
  const blocksJson = eventPayload.blocks ? JSON.stringify(eventPayload.blocks) : null;
  const attachmentsJson = eventPayload.attachments
    ? JSON.stringify(eventPayload.attachments)
    : null;

  try {
    db.exec(
      `INSERT OR IGNORE INTO slack_messages (channel_id, user_id, ts, text, type, subtype, event_type, thread_ts, created_at, blocks_json, attachments_json)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        channelId,
        userId ?? null,
        ts,
        displayText,
        type,
        subtype ?? null,
        eventType,
        threadTs ?? null,
        createdAt,
        blocksJson,
        attachmentsJson,
      ]
    );
    state.setPartial({ last_event_at: createdAt });
  } catch (e) {
    console.error('[slack] Failed to store event:', e);
  }
}

// ---------------------------------------------------------------------------
// State publishing
// ---------------------------------------------------------------------------

function publishState(): void {
  state.setPartial({
    connected: !!CONFIG.botToken,
    workspaceName: CONFIG.workspaceName || null,
    lastSyncTime: lastSyncTime > 0 ? lastSyncTime : null,
    syncInProgress,
  });
}

// ---------------------------------------------------------------------------
// Periodic sync: always last SYNC_WINDOW_DAYS, incremental per channel
// ---------------------------------------------------------------------------

/** Returns Slack ts string for (now - days). */
function slackTsDaysAgo(days: number): string {
  const sec = Math.floor(Date.now() / 1000) - days * 24 * 3600;
  return `${sec}.000000`;
}

function performSync(): void {
  if (!CONFIG.botToken) {
    return;
  }
  if (syncInProgress) {
    console.log('[slack] Sync already in progress, skipping');
    return;
  }

  syncInProgress = true;
  publishState();

  const oldest90Str = slackTsDaysAgo(SYNC_WINDOW_DAYS);
  const now = new Date().toISOString();

  try {
    const seen = new Set<string>();

    const listAllChannels = (types: string): void => {
      try {
        let cursor: string | undefined;
        do {
          const params: Record<string, unknown> = { types, exclude_archived: true, limit: 200 };
          if (cursor) params.cursor = cursor;
          const listResult = slackApiFetch('GET', '/conversations.list', params);
          const raw = (listResult.channels as Record<string, unknown>[]) || [];
          for (const ch of raw) {
            const id = ch.id as string;
            if (id) seen.add(id);
          }
          const meta = listResult.response_metadata as { next_cursor?: string } | undefined;
          cursor = meta?.next_cursor;
        } while (cursor && seen.size < SYNC_MAX_CHANNELS);
      } catch (e) {
        if (types.includes('im') || types.includes('mpim')) {
          console.log(
            '[slack] Could not list DMs/group DMs (add OAuth scopes im:read and mpim:read, then reinstall the app).'
          );
        } else {
          console.warn('[slack] conversations.list failed:', e);
        }
      }
    };

    listAllChannels('public_channel,private_channel');
    listAllChannels('mpim,im');

    const channelIds = Array.from(seen).slice(0, SYNC_MAX_CHANNELS);

    if (channelIds.length === 0) {
      console.log(
        '[slack] No channels found. Add the bot to channels in Slack, or for DMs/group DMs add OAuth scopes im:read and mpim:read and reinstall the app.'
      );
    }

    let totalStored = 0;
    let loggedZeroHint = false;

    for (const channelId of channelIds) {
      const oldestForChannel = lastSyncedLatestPerChannel[channelId] ?? oldest90Str;
      let cursor: string | null = null;
      let pagesThisChannel = 0;
      let newestTs: string | null = null;

      while (pagesThisChannel < SYNC_MAX_PAGES_PER_CHANNEL) {
        const params: Record<string, unknown> = {
          channel: channelId,
          oldest: oldestForChannel,
          limit: 200,
        };
        if (cursor) params.cursor = cursor;

        const historyResult = slackApiFetch('GET', '/conversations.history', params);
        const messages = (historyResult.messages as Record<string, unknown>[]) || [];
        let storedThisPage = 0;
        for (const msg of messages) {
          const ts = msg.ts as string | number | undefined;
          const tsStr = typeof ts === 'number' ? String(ts) : ts;
          if (!tsStr) continue;
          if (!newestTs || tsStr > newestTs) newestTs = tsStr;
          const userId = msg.user as string | undefined;
          const displayText = getMessageDisplayText(msg);
          const type = (msg.type as string) ?? 'message';
          const subtype = (msg.subtype as string) ?? null;
          const threadTs = (msg.thread_ts as string) ?? null;
          const blocksJson = msg.blocks ? JSON.stringify(msg.blocks) : null;
          const attachmentsJson = msg.attachments ? JSON.stringify(msg.attachments) : null;
          db.exec(
            `INSERT OR IGNORE INTO slack_messages (channel_id, user_id, ts, text, type, subtype, event_type, thread_ts, created_at, blocks_json, attachments_json)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              channelId,
              userId ?? null,
              tsStr,
              displayText,
              type,
              subtype,
              'message',
              threadTs,
              now,
              blocksJson,
              attachmentsJson,
            ]
          );
          totalStored++;
          storedThisPage++;
        }

        if (messages.length > 0 || pagesThisChannel === 0) {
          const pageLabel = pagesThisChannel > 0 ? ` (page ${pagesThisChannel + 1})` : '';
          console.log(
            `[slack] Channel ${channelId}: ${messages.length} from API, ${storedThisPage} stored for this channel${pageLabel} (total so far: ${totalStored})`
          );
          if (messages.length === 0 && pagesThisChannel === 0 && !loggedZeroHint) {
            console.log(
              `[slack] Hint: If the channel has messages, ensure the bot has OAuth scopes channels:history (public) and groups:history (private).`
            );
            loggedZeroHint = true;
          }
        }
        pagesThisChannel++;
        const meta = historyResult.response_metadata as { next_cursor?: string } | undefined;
        const nextCursor = meta?.next_cursor;
        if (!nextCursor) break;
        cursor = nextCursor;
      }

      if (newestTs) {
        lastSyncedLatestPerChannel[channelId] = newestTs;
      }
    }

    db.exec('DELETE FROM slack_messages WHERE ts < ?', [oldest90Str]);

    lastSyncTime = Date.now();
    lastSyncChannels = channelIds.length;
    lastSyncMessages = totalStored;
    state.set('lastSyncTime', lastSyncTime);
    state.set('lastSyncedLatestPerChannel', lastSyncedLatestPerChannel);
    console.log(
      `[slack] Sync completed: ${channelIds.length} channels, ${totalStored} messages stored in total; trimmed to last ${SYNC_WINDOW_DAYS} days`
    );
  } catch (e) {
    console.error('[slack] Sync failed:', e);
  } finally {
    syncInProgress = false;
    publishState();
  }
}

// ---------------------------------------------------------------------------
// Slack API helper (exposed on globalThis for tools)
// ---------------------------------------------------------------------------

function slackApiFetch(
  method: string,
  endpoint: string,
  params?: Record<string, unknown>
): Record<string, unknown> {
  const token = CONFIG.botToken;
  if (!token) {
    throw new Error('Slack not connected. Please complete setup first.');
  }

  const url = endpoint.startsWith('http') ? endpoint : `${SLACK_BASE_URL}${endpoint}`;
  const isGet = method.toUpperCase() === 'GET';

  let fullUrl = url;
  let body: string | undefined;

  if (isGet && params && Object.keys(params).length > 0) {
    const pairs: string[] = [];
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null) {
        pairs.push(encodeURIComponent(k) + '=' + encodeURIComponent(String(v)));
      }
    }
    fullUrl = `${url}?${pairs.join('&')}`;
  } else if (!isGet && params) {
    body = JSON.stringify(params);
  }

  const response = net.fetch(fullUrl, {
    method: method.toUpperCase(),
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body,
    timeout: SLACK_REQUEST_TIMEOUT,
  });

  if (response.status === 429) {
    throw new Error('Slack rate limited. Please try again in a moment.');
  }

  const parsed = JSON.parse(response.body) as Record<string, unknown>;
  if (!parsed.ok && response.status >= 400) {
    const err = parsed.error as string | undefined;
    throw new Error(err || `Slack API error: ${response.status}`);
  }

  return parsed;
}

function formatApiError(error: unknown): string {
  const message = String(error);
  if (message.includes('401') || message.includes('invalid_auth')) {
    return 'Invalid or expired token. Check your Slack app settings.';
  }
  if (message.includes('429')) {
    return 'Rate limited. Please try again in a moment.';
  }
  if (message.includes('channel_not_found') || message.includes('not_in_channel')) {
    return 'Channel not found or bot is not in the channel.';
  }
  return message;
}

// Expose for tools (bundled code calls this via globalThis)
const _g = globalThis as Record<string, unknown>;
_g.slackApiFetch = slackApiFetch;
_g.performSlackSync = performSync;
_g.getSlackSyncStatus = function (): {
  lastSyncTime: number;
  syncInProgress: boolean;
  lastSyncChannels: number;
  lastSyncMessages: number;
} {
  return { lastSyncTime, syncInProgress, lastSyncChannels, lastSyncMessages };
};

// ---------------------------------------------------------------------------
// Tool registration and skill export
// ---------------------------------------------------------------------------

const tools = [
  listChannelsTool,
  getMessagesTool,
  sendMessageTool,
  getChannelTool,
  openDmTool,
  syncNowTool,
];

const skill: Skill = {
  info: {
    id: 'slack',
    name: 'Slack',
    runtime: 'v8',
    entry: 'index.js',
    version: '1.0.0',
    description:
      'Full-fledged Slack bot: read and send messages, receive real-time events, periodic sync to DB, and store all messages in the skill DB.',
    auto_start: false,
    setup: { required: true, label: 'Connect Slack' },
  },
  tools,
  init,
  start,
  stop,
  onCronTrigger,
  onSetupStart,
  onSetupSubmit,
  onSetupCancel,
  onServerEvent,
};

export default skill;
