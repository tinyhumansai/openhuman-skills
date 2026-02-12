// Gmail skill type definitions
// All TypeScript interfaces and type definitions — no runtime code.

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

export interface SkillConfig {
  credentialId: string;
  userEmail: string;

  // Sync settings
  syncEnabled: boolean;
  syncIntervalMinutes: number;
  maxEmailsPerSync: number;
  notifyOnNewEmails: boolean;

  // Permission flags (default restrictive)
  allowWriteActions: boolean;
  showSensitiveContent: boolean;
}

// ---------------------------------------------------------------------------
// API response types
// ---------------------------------------------------------------------------

export interface GmailProfile {
  emailAddress: string;
  messagesTotal: number;
  threadsTotal: number;
  historyId: string;
}

export interface GmailMessage {
  id: string;
  threadId: string;
  labelIds: string[];
  snippet: string;
  payload: GmailPayload;
  sizeEstimate: number;
  historyId: string;
  internalDate: string;
}

export interface GmailPayload {
  partId: string;
  mimeType: string;
  filename: string;
  headers: GmailHeader[];
  body: GmailBody;
  parts?: GmailPayload[];
}

export interface GmailHeader {
  name: string;
  value: string;
}

export interface GmailBody {
  attachmentId?: string;
  size: number;
  data?: string;
}

export interface GmailThread {
  id: string;
  snippet: string;
  historyId: string;
  messages: GmailMessage[];
}

export interface GmailLabel {
  id: string;
  name: string;
  messageListVisibility: string;
  labelListVisibility: string;
  type: 'system' | 'user';
  messagesTotal?: number;
  messagesUnread?: number;
  threadsTotal?: number;
  threadsUnread?: number;
  color?: { textColor: string; backgroundColor: string };
}

export interface GmailAttachment {
  attachmentId: string;
  size: number;
  data: string;
}

// ---------------------------------------------------------------------------
// Request types
// ---------------------------------------------------------------------------

export interface EmailAddress {
  email: string;
  name?: string;
}

export interface SendEmailRequest {
  to: EmailAddress[];
  cc?: EmailAddress[];
  bcc?: EmailAddress[];
  subject: string;
  bodyText?: string;
  bodyHtml?: string;
  attachments?: Array<{ filename: string; data: string; mimeType: string }>;
  threadId?: string;
  replyToMessageId?: string;
}

export interface EmailSearchOptions {
  query?: string;
  labelIds?: string[];
  maxResults?: number;
  pageToken?: string;
  includeSpamTrash?: boolean;
}

// ---------------------------------------------------------------------------
// Database row types
// ---------------------------------------------------------------------------

export interface EmailRow {
  id: string;
  thread_id: string;
  subject: string;
  sender_email: string;
  sender_name: string | null;
  recipient_emails: string;
  cc_emails: string | null;
  bcc_emails: string | null;
  date: number;
  snippet: string;
  body_text: string | null;
  body_html: string | null;
  is_read: number;
  is_important: number;
  is_starred: number;
  has_attachments: number;
  labels: string;
  size_estimate: number;
  history_id: string;
  internal_date: string;
  created_at: number;
  updated_at: number;
}

export interface ThreadRow {
  id: string;
  subject: string;
  snippet: string;
  message_count: number;
  participants: string;
  last_message_date: number;
  is_read: number;
  has_attachments: number;
  labels: string;
  history_id: string;
  created_at: number;
  updated_at: number;
}

export interface LabelRow {
  id: string;
  name: string;
  type: string;
  message_list_visibility: string;
  label_list_visibility: string;
  messages_total: number;
  messages_unread: number;
  threads_total: number;
  threads_unread: number;
  color_text: string | null;
  color_background: string | null;
  created_at: number;
  updated_at: number;
}

export interface AttachmentRow {
  id: string;
  message_id: string;
  attachment_id: string;
  filename: string;
  mime_type: string;
  size: number;
  part_id: string;
  created_at: number;
}

// ---------------------------------------------------------------------------
// Sync & state types
// ---------------------------------------------------------------------------

export interface SyncStatus {
  inProgress: boolean;
  completed: boolean;
  lastSyncTime: number;
  nextSyncTime: number;
  lastSyncDurationMs: number;
  lastHistoryId: string;
  error: string | null;
}

export interface StorageStats {
  emailCount: number;
  threadCount: number;
  labelCount: number;
  unreadCount: number;
}

// ---------------------------------------------------------------------------
// API error type
// ---------------------------------------------------------------------------

export interface ApiError {
  code: number;
  message: string;
  errors?: Array<{ domain: string; reason: string; message: string }>;
}

// ---------------------------------------------------------------------------
// API fetch result type
// ---------------------------------------------------------------------------

export interface GmailFetchResult {
  success: boolean;
  data?: any;
  error?: { code: number; message: string };
}
