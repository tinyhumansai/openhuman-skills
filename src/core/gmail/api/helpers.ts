import { getGmailSkillState } from '../state';
import type { GmailProfile } from '../types';
import { gmailFetch } from './index';

export function loadGmailProfile(): void {
  const response = gmailFetch<GmailProfile>('/users/me/profile', { timeout: 10 });
  if (!response.success) {
    throw new Error((response.error && response.error.message) || 'unknown error');
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

    // Always refresh — re-auth against a different Google account should
    // replace the stored email rather than keep the previous one.
    if (profile.emailAddress && s.config.userEmail !== profile.emailAddress) {
      s.config.userEmail = profile.emailAddress;
      state.set('config', s.config);
    }

    console.log(`[gmail] Profile loaded for ${s.profile.emailAddress}`);
  }
}
