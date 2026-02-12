// Database helper functions for Gmail skill.
// CRUD operations for emails, threads, labels, and attachments.
// Registered on globalThis.gmailDb for cross-module access.
import type {
  AttachmentRow,
  EmailRow,
  EmailSearchOptions,
  GmailLabel,
  GmailMessage,
  GmailThread,
  LabelRow,
  StorageStats,
  ThreadRow,
} from '../types';

// ---------------------------------------------------------------------------
// Upsert functions
// ---------------------------------------------------------------------------

function upsertEmail(message: GmailMessage): void {
  const now = Date.now();
  const headers = message.payload.headers;

  const subject = headers.find(h => h.name.toLowerCase() === 'subject')?.value || '';
  const from = headers.find(h => h.name.toLowerCase() === 'from')?.value || '';
  const to = headers.find(h => h.name.toLowerCase() === 'to')?.value || '';
  const cc = headers.find(h => h.name.toLowerCase() === 'cc')?.value || null;
  const bcc = headers.find(h => h.name.toLowerCase() === 'bcc')?.value || null;
  const dateHeader = headers.find(h => h.name.toLowerCase() === 'date')?.value;

  const fromMatch = from.match(/(.+?)\s*<([^>]+)>/) || [null, from, from];
  const senderName = fromMatch[1]?.trim().replace(/^["']|["']$/g, '') || null;
  const senderEmail = fromMatch[2]?.trim() || from;

  const date = dateHeader ? new Date(dateHeader).getTime() : parseInt(message.internalDate, 10);
  const isRead = !message.labelIds.includes('UNREAD');
  const isImportant = message.labelIds.includes('IMPORTANT');
  const isStarred = message.labelIds.includes('STARRED');
  const hasAttachments = checkHasAttachments(message);

  db.exec(
    `INSERT OR REPLACE INTO emails (
      id, thread_id, subject, sender_email, sender_name, recipient_emails,
      cc_emails, bcc_emails, date, snippet, body_text, body_html,
      is_read, is_important, is_starred, has_attachments, labels,
      size_estimate, history_id, internal_date, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      message.id,
      message.threadId,
      subject,
      senderEmail,
      senderName,
      to,
      cc,
      bcc,
      date,
      message.snippet,
      extractTextBody(message),
      extractHtmlBody(message),
      isRead ? 1 : 0,
      isImportant ? 1 : 0,
      isStarred ? 1 : 0,
      hasAttachments ? 1 : 0,
      JSON.stringify(message.labelIds),
      message.sizeEstimate,
      message.historyId,
      message.internalDate,
      now,
    ]
  );

  if (hasAttachments) {
    insertEmailAttachments(message);
  }
}

function upsertThread(thread: GmailThread): void {
  const now = Date.now();
  const firstMessage = thread.messages[0];
  const lastMessage = thread.messages[thread.messages.length - 1];
  if (!firstMessage || !lastMessage) return;

  const subject =
    firstMessage.payload.headers.find(h => h.name.toLowerCase() === 'subject')?.value || '';
  const participants = new Set<string>();

  thread.messages.forEach(msg => {
    const headers = msg.payload.headers;
    const from = headers.find(h => h.name.toLowerCase() === 'from')?.value;
    const to = headers.find(h => h.name.toLowerCase() === 'to')?.value;
    const ccH = headers.find(h => h.name.toLowerCase() === 'cc')?.value;
    if (from) participants.add(extractEmailAddr(from));
    if (to) to.split(',').forEach(email => participants.add(extractEmailAddr(email.trim())));
    if (ccH) ccH.split(',').forEach(email => participants.add(extractEmailAddr(email.trim())));
  });

  const lastMessageDate = parseInt(lastMessage.internalDate, 10);
  const allLabels = new Set<string>();
  let hasAttachments = false;
  let allRead = true;

  thread.messages.forEach(msg => {
    msg.labelIds.forEach(label => allLabels.add(label));
    if (checkHasAttachments(msg)) hasAttachments = true;
    if (msg.labelIds.includes('UNREAD')) allRead = false;
  });

  db.exec(
    `INSERT OR REPLACE INTO threads (
      id, subject, snippet, message_count, participants, last_message_date,
      is_read, has_attachments, labels, history_id, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      thread.id,
      subject,
      thread.snippet,
      thread.messages.length,
      Array.from(participants).join(', '),
      lastMessageDate,
      allRead ? 1 : 0,
      hasAttachments ? 1 : 0,
      JSON.stringify(Array.from(allLabels)),
      thread.historyId,
      now,
    ]
  );
}

function upsertLabel(label: GmailLabel): void {
  const now = Date.now();
  db.exec(
    `INSERT OR REPLACE INTO labels (
      id, name, type, message_list_visibility, label_list_visibility,
      messages_total, messages_unread, threads_total, threads_unread,
      color_text, color_background, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      label.id,
      label.name,
      label.type,
      label.messageListVisibility,
      label.labelListVisibility,
      label.messagesTotal || 0,
      label.messagesUnread || 0,
      label.threadsTotal || 0,
      label.threadsUnread || 0,
      label.color?.textColor || null,
      label.color?.backgroundColor || null,
      now,
    ]
  );
}

// ---------------------------------------------------------------------------
// Update functions
// ---------------------------------------------------------------------------

function updateEmailReadStatus(emailId: string, isRead: boolean): void {
  db.exec('UPDATE emails SET is_read = ?, updated_at = ? WHERE id = ?', [
    isRead ? 1 : 0,
    Date.now(),
    emailId,
  ]);
}

// ---------------------------------------------------------------------------
// Query functions
// ---------------------------------------------------------------------------

function getEmailById(id: string): EmailRow | null {
  return db.get('SELECT * FROM emails WHERE id = ?', [id]) as EmailRow | null;
}

function getThreadById(id: string): ThreadRow | null {
  return db.get('SELECT * FROM threads WHERE id = ?', [id]) as ThreadRow | null;
}

function getEmails(options: EmailSearchOptions = {}): EmailRow[] {
  let sql = 'SELECT * FROM emails WHERE 1=1';
  const params: unknown[] = [];

  if (options.query) {
    sql += ' AND (subject LIKE ? OR sender_email LIKE ? OR snippet LIKE ?)';
    const term = `%${options.query}%`;
    params.push(term, term, term);
  }

  if (options.labelIds && options.labelIds.length > 0) {
    const conds = options.labelIds.map(() => 'labels LIKE ?').join(' OR ');
    sql += ` AND (${conds})`;
    options.labelIds.forEach(id => params.push(`%"${id}"%`));
  }

  sql += ' ORDER BY date DESC';

  if (options.maxResults) {
    sql += ' LIMIT ?';
    params.push(options.maxResults);
  }

  return db.all(sql, params) as unknown as EmailRow[];
}

function getThreads(options: EmailSearchOptions = {}): ThreadRow[] {
  let sql = 'SELECT * FROM threads WHERE 1=1';
  const params: unknown[] = [];

  if (options.query) {
    sql += ' AND (subject LIKE ? OR participants LIKE ? OR snippet LIKE ?)';
    const term = `%${options.query}%`;
    params.push(term, term, term);
  }

  if (options.labelIds && options.labelIds.length > 0) {
    const conds = options.labelIds.map(() => 'labels LIKE ?').join(' OR ');
    sql += ` AND (${conds})`;
    options.labelIds.forEach(id => params.push(`%"${id}"%`));
  }

  sql += ' ORDER BY last_message_date DESC';

  if (options.maxResults) {
    sql += ' LIMIT ?';
    params.push(options.maxResults);
  }

  return db.all(sql, params) as unknown as ThreadRow[];
}

function getLabels(): LabelRow[] {
  return db.all('SELECT * FROM labels ORDER BY type, name', []) as unknown as LabelRow[];
}

function getEmailAttachments(messageId: string): AttachmentRow[] {
  return db.all('SELECT * FROM attachments WHERE message_id = ?', [
    messageId,
  ]) as unknown as AttachmentRow[];
}

function getEntityCounts(): StorageStats {
  const emailCount =
    (db.get('SELECT COUNT(*) as count FROM emails', []) as { count: number } | null)?.count ?? 0;
  const threadCount =
    (db.get('SELECT COUNT(*) as count FROM threads', []) as { count: number } | null)?.count ?? 0;
  const labelCount =
    (db.get('SELECT COUNT(*) as count FROM labels', []) as { count: number } | null)?.count ?? 0;
  const unreadCount =
    (
      db.get('SELECT COUNT(*) as count FROM emails WHERE is_read = 0', []) as {
        count: number;
      } | null
    )?.count ?? 0;
  return { emailCount, threadCount, labelCount, unreadCount };
}

// ---------------------------------------------------------------------------
// Sync state helpers
// ---------------------------------------------------------------------------

function getSyncState(key: string): string | null {
  const row = db.get('SELECT value FROM sync_state WHERE key = ?', [key]) as {
    value: string;
  } | null;
  return row?.value || null;
}

function setSyncState(key: string, value: string): void {
  db.exec(
    `INSERT OR REPLACE INTO sync_state (key, value, updated_at) VALUES (?, ?, ?)`,
    [key, value, Date.now()]
  );
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function extractEmailAddr(emailStr: string): string {
  const match = emailStr.match(/<([^>]+)>/);
  return match ? match[1] : emailStr.trim();
}

function checkHasAttachments(message: GmailMessage): boolean {
  if (message.payload.body.attachmentId) return true;
  if (message.payload.parts) {
    return message.payload.parts.some(
      part => part.body.attachmentId || (part.filename && part.filename.length > 0)
    );
  }
  return false;
}

function extractTextBody(message: GmailMessage): string | null {
  if (message.payload.mimeType === 'text/plain' && message.payload.body.data) {
    return atob(message.payload.body.data);
  }
  if (message.payload.parts) {
    for (const part of message.payload.parts) {
      if (part.mimeType === 'text/plain' && part.body.data) {
        return atob(part.body.data);
      }
    }
  }
  return null;
}

function extractHtmlBody(message: GmailMessage): string | null {
  if (message.payload.mimeType === 'text/html' && message.payload.body.data) {
    return atob(message.payload.body.data);
  }
  if (message.payload.parts) {
    for (const part of message.payload.parts) {
      if (part.mimeType === 'text/html' && part.body.data) {
        return atob(part.body.data);
      }
    }
  }
  return null;
}

function insertEmailAttachments(message: GmailMessage): void {
  const attachments: Array<{
    attachmentId: string;
    filename: string;
    mimeType: string;
    size: number;
    partId: string;
  }> = [];

  if (message.payload.body.attachmentId && message.payload.filename) {
    attachments.push({
      attachmentId: message.payload.body.attachmentId,
      filename: message.payload.filename,
      mimeType: message.payload.mimeType,
      size: message.payload.body.size,
      partId: message.payload.partId,
    });
  }

  if (message.payload.parts) {
    message.payload.parts.forEach(part => {
      if (part.body.attachmentId && part.filename) {
        attachments.push({
          attachmentId: part.body.attachmentId,
          filename: part.filename,
          mimeType: part.mimeType,
          size: part.body.size,
          partId: part.partId,
        });
      }
    });
  }

  attachments.forEach(att => {
    db.exec(
      `INSERT OR REPLACE INTO attachments
       (message_id, attachment_id, filename, mime_type, size, part_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [message.id, att.attachmentId, att.filename, att.mimeType, att.size, att.partId]
    );
  });
}

// ---------------------------------------------------------------------------
// globalThis registration
// ---------------------------------------------------------------------------

declare global {
  var gmailDb: {
    upsertEmail: typeof upsertEmail;
    upsertThread: typeof upsertThread;
    upsertLabel: typeof upsertLabel;
    updateEmailReadStatus: typeof updateEmailReadStatus;
    getEmailById: typeof getEmailById;
    getThreadById: typeof getThreadById;
    getEmails: typeof getEmails;
    getThreads: typeof getThreads;
    getLabels: typeof getLabels;
    getEmailAttachments: typeof getEmailAttachments;
    getEntityCounts: typeof getEntityCounts;
    getSyncState: typeof getSyncState;
    setSyncState: typeof setSyncState;
  };
}

globalThis.gmailDb = {
  upsertEmail,
  upsertThread,
  upsertLabel,
  updateEmailReadStatus,
  getEmailById,
  getThreadById,
  getEmails,
  getThreads,
  getLabels,
  getEmailAttachments,
  getEntityCounts,
  getSyncState,
  setSyncState,
};
