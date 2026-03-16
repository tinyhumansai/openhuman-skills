import { getGmailSkillState } from '../state';
import { gmailFetch } from './index';
import type { GmailProfile } from '../types';

export async function loadGmailProfile(): Promise<void> {
  const response = await gmailFetch<GmailProfile>('/users/me/profile', { timeout: 10 });
  if (!response.success) {
    throw new Error(response.error?.message || 'unknown error');
  }
  if (response.success) {
    const s = getGmailSkillState();
    const profile = response.data as GmailProfile;
    s.profile = {
      emailAddress: profile.emailAddress,
      messagesTotal: profile.messagesTotal || 0,
      threadsTotal: profile.threadsTotal || 0,
      historyId: profile.historyId,
    };

    if (!s.config.userEmail) {
      s.config.userEmail = profile.emailAddress;
      state.set('config', s.config);
    }

    console.log(`[gmail] Profile loaded for ${s.profile.emailAddress}`);
  }
}
