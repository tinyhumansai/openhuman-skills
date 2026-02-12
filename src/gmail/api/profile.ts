// Gmail API — profile operations.
import type { GmailProfile } from '../types';
import { gmailFetch } from './client';

export async function getProfile(): Promise<GmailProfile | null> {
  const response = await gmailFetch('/users/me/profile');
  if (!response.success || !response.data) return null;

  return {
    emailAddress: response.data.emailAddress,
    messagesTotal: response.data.messagesTotal || 0,
    threadsTotal: response.data.threadsTotal || 0,
    historyId: response.data.historyId,
  };
}
