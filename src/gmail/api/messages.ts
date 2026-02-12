// Gmail API — message operations.
import type { GmailFetchResult } from '../types';
import { gmailFetch } from './client';

export async function listMessages(params: string): Promise<GmailFetchResult> {
  return gmailFetch(`/users/me/messages?${params}`);
}

export async function getMessage(
  messageId: string,
  format: string = 'full'
): Promise<GmailFetchResult> {
  return gmailFetch(`/users/me/messages/${messageId}?format=${encodeURIComponent(format)}`);
}

export async function sendMessage(body: {
  raw: string;
  threadId?: string;
}): Promise<GmailFetchResult> {
  return gmailFetch('/users/me/messages/send', { method: 'POST', body: JSON.stringify(body) });
}

export async function batchModifyMessages(body: {
  ids: string[];
  addLabelIds?: string[];
  removeLabelIds?: string[];
}): Promise<GmailFetchResult> {
  return gmailFetch('/users/me/messages/batchModify', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}
