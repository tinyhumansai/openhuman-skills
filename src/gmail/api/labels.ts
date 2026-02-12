// Gmail API — label operations.
import type { GmailFetchResult } from '../types';
import { gmailFetch } from './client';

export async function listLabels(): Promise<GmailFetchResult> {
  return gmailFetch('/users/me/labels');
}
