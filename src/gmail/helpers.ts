// Shared formatting and utility functions for the Gmail skill.

import { isSensitiveText } from '../helpers';

// Re-export for convenience
export { isSensitiveText };

/**
 * Parse email addresses from a header string like "Name <email>, Other <email2>".
 */
export function parseEmailAddresses(
  headerValue: string
): Array<{ email: string; name?: string }> {
  if (!headerValue) return [];

  const addresses: Array<{ email: string; name?: string }> = [];
  const parts = headerValue.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/);

  parts.forEach(part => {
    const trimmed = part.trim();
    if (!trimmed) return;

    const match = trimmed.match(/(.+?)\s*<([^>]+)>/) || [null, trimmed, trimmed];
    const name = match[1]?.trim().replace(/^["']|["']$/g, '') || undefined;
    const email = match[2]?.trim() || trimmed;

    addresses.push({ email, name: name !== email ? name : undefined });
  });

  return addresses;
}

/**
 * Format an array of email addresses into a header-compatible string.
 */
export function formatEmailAddresses(
  addresses: Array<{ email: string; name?: string }>
): string {
  return addresses
    .map(addr => (addr.name ? `"${addr.name}" <${addr.email}>` : addr.email))
    .join(', ');
}

/**
 * Extract email body content from a Gmail API payload recursively.
 */
export function extractEmailBodies(payload: any): { text?: string; html?: string } {
  const result: { text?: string; html?: string } = {};

  if (payload.body?.data) {
    if (payload.mimeType === 'text/plain') {
      result.text = atob(payload.body.data);
    } else if (payload.mimeType === 'text/html') {
      result.html = atob(payload.body.data);
    }
  }

  if (payload.parts) {
    for (const part of payload.parts) {
      if (part.body?.data) {
        if (part.mimeType === 'text/plain' && !result.text) {
          result.text = atob(part.body.data);
        } else if (part.mimeType === 'text/html' && !result.html) {
          result.html = atob(part.body.data);
        }
      }
      if (part.parts) {
        const nested = extractEmailBodies(part);
        if (nested.text && !result.text) result.text = nested.text;
        if (nested.html && !result.html) result.html = nested.html;
      }
    }
  }

  return result;
}

/**
 * Extract attachment information from a Gmail API payload.
 */
export function extractAttachmentInfo(
  payload: any
): Array<{
  attachment_id?: string;
  filename: string;
  mime_type: string;
  size: number;
  part_id: string;
}> {
  const attachments: Array<{
    attachment_id?: string;
    filename: string;
    mime_type: string;
    size: number;
    part_id: string;
  }> = [];

  function processPayload(part: any) {
    if (part.filename && part.filename.length > 0) {
      attachments.push({
        attachment_id: part.body?.attachmentId,
        filename: part.filename,
        mime_type: part.mimeType,
        size: part.body?.size || 0,
        part_id: part.partId,
      });
    }
    if (part.parts) {
      part.parts.forEach(processPayload);
    }
  }

  processPayload(payload);
  return attachments;
}

/**
 * Check if a message payload has attachments.
 */
export function hasPayloadAttachments(message: any): boolean {
  if (message.payload?.body?.attachmentId) return true;
  if (message.payload?.parts) {
    return message.payload.parts.some(
      (part: any) => part.body?.attachmentId || (part.filename && part.filename.length > 0)
    );
  }
  return false;
}

/**
 * Parse sender info from a "From" header value.
 */
export function parseSenderInfo(from: string): { email: string; name: string | null } {
  const match = from.match(/(.+?)\s*<([^>]+)>/) || [null, from, from];
  const name = match[1]?.trim().replace(/^["']|["']$/g, '') || null;
  const email = match[2]?.trim() || from;
  return { email, name };
}

/**
 * Map an action string to Gmail API label add/remove operations.
 */
export function getLabelOperations(
  action: string,
  labelIds: string[] = []
): { addLabelIds?: string[]; removeLabelIds?: string[] } {
  switch (action) {
    case 'mark_read':
      return { removeLabelIds: ['UNREAD'] };
    case 'mark_unread':
      return { addLabelIds: ['UNREAD'] };
    case 'add_star':
      return { addLabelIds: ['STARRED'] };
    case 'remove_star':
      return { removeLabelIds: ['STARRED'] };
    case 'mark_important':
      return { addLabelIds: ['IMPORTANT'] };
    case 'mark_not_important':
      return { removeLabelIds: ['IMPORTANT'] };
    case 'add_labels':
      return { addLabelIds: labelIds };
    case 'remove_labels':
      return { removeLabelIds: labelIds };
    default:
      throw new Error(`Unknown action: ${action}`);
  }
}
