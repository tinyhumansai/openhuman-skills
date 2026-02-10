// Export all Telegram tool definitions.

// Existing tools
import { getChatStatsToolDefinition } from './get-chat-stats';
import { getChatsToolDefinition } from './get-chats';
import { getContactsToolDefinition } from './get-contacts';
import { getMeToolDefinition } from './get-me';
import { getMessagesToolDefinition } from './get-messages';

// Messaging tools
import { sendMessageToolDefinition } from './send-message';
import { editMessageToolDefinition } from './edit-message';
import { deleteMessagesToolDefinition } from './delete-messages';
import { forwardMessagesToolDefinition } from './forward-messages';
import {
  searchChatMessagesToolDefinition,
  searchMessagesGlobalToolDefinition,
} from './search-messages';
import { pinMessageToolDefinition } from './pin-message';
import { markAsReadToolDefinition } from './mark-as-read';

// Chat management tools
import { getChatToolDefinition } from './get-chat';
import {
  createPrivateChatToolDefinition,
  createGroupToolDefinition,
  createChannelToolDefinition,
} from './create-chat';
import { joinChatToolDefinition, leaveChatToolDefinition } from './join-leave-chat';
import {
  setChatTitleToolDefinition,
  getChatInviteLinkToolDefinition,
  muteChatToolDefinition,
} from './manage-chat';

// User & contact management tools
import {
  getUserToolDefinition,
  getUserProfileToolDefinition,
  searchPublicChatToolDefinition,
} from './get-user';
import {
  addContactToolDefinition,
  removeContactToolDefinition,
  blockUserToolDefinition,
} from './manage-contacts';

// Reaction tools
import { addReactionToolDefinition, removeReactionToolDefinition } from './reactions';

// Sticker & GIF tools
import {
  sendStickerToolDefinition,
  sendGifToolDefinition,
  searchStickersToolDefinition,
} from './stickers-gifs';

// Folder management tools
import {
  getChatFoldersToolDefinition,
  createChatFolderToolDefinition,
  editChatFolderToolDefinition,
  deleteChatFolderToolDefinition,
} from './folders';

// Group admin tools
import {
  getChatMembersToolDefinition,
  addChatMemberToolDefinition,
  banChatMemberToolDefinition,
  promoteChatMemberToolDefinition,
  getChatAdminsToolDefinition,
  setChatPermissionsToolDefinition,
} from './chat-members';

// Media tools
import { sendPhotoToolDefinition, sendDocumentToolDefinition } from './send-media';

// Single message tools
import { getMessageToolDefinition, getMessageLinkToolDefinition } from './get-message';

/**
 * Get all storage-related tool definitions.
 */
export const tools: ToolDefinition[] = [
  // Original 5
  getMeToolDefinition,
  getChatsToolDefinition,
  getMessagesToolDefinition,
  getContactsToolDefinition,
  getChatStatsToolDefinition,

  // Messaging (8)
  sendMessageToolDefinition,
  editMessageToolDefinition,
  deleteMessagesToolDefinition,
  forwardMessagesToolDefinition,
  searchChatMessagesToolDefinition,
  searchMessagesGlobalToolDefinition,
  pinMessageToolDefinition,
  markAsReadToolDefinition,

  // Chat management (8)
  getChatToolDefinition,
  createPrivateChatToolDefinition,
  createGroupToolDefinition,
  createChannelToolDefinition,
  joinChatToolDefinition,
  leaveChatToolDefinition,
  setChatTitleToolDefinition,
  getChatInviteLinkToolDefinition,

  // User & contact management (6)
  getUserToolDefinition,
  getUserProfileToolDefinition,
  searchPublicChatToolDefinition,
  addContactToolDefinition,
  removeContactToolDefinition,
  blockUserToolDefinition,

  // Reactions (2)
  addReactionToolDefinition,
  removeReactionToolDefinition,

  // GIFs & stickers (3)
  sendStickerToolDefinition,
  sendGifToolDefinition,
  searchStickersToolDefinition,

  // Folder management (4)
  getChatFoldersToolDefinition,
  createChatFolderToolDefinition,
  editChatFolderToolDefinition,
  deleteChatFolderToolDefinition,

  // Group admin (6)
  getChatMembersToolDefinition,
  addChatMemberToolDefinition,
  banChatMemberToolDefinition,
  promoteChatMemberToolDefinition,
  getChatAdminsToolDefinition,
  setChatPermissionsToolDefinition,

  // Media & misc (5)
  sendPhotoToolDefinition,
  sendDocumentToolDefinition,
  getMessageToolDefinition,
  getMessageLinkToolDefinition,
  muteChatToolDefinition,
];

export default tools;
