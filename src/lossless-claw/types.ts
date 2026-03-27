// Core type definitions for the Lossless Context Management skill

export type ConversationId = number;
export type MessageId = number;
export type SummaryId = string;
export type MessageRole = 'system' | 'user' | 'assistant' | 'tool';
export type SummaryKind = 'leaf' | 'condensed';

export interface LcmConfig {
  /** Fraction of context window that triggers compaction (0.0-1.0) */
  contextThreshold: number;
  /** Number of recent messages protected from compaction */
  freshTailCount: number;
  /** How deep incremental compaction goes (0 = leaf only, -1 = unlimited) */
  incrementalMaxDepth: number;
  /** Minimum fan-out for leaf summaries */
  leafMinFanout: number;
  /** Minimum fan-out for condensed summaries */
  condensedMinFanout: number;
  /** Hard minimum fan-out for condensed summaries */
  condensedMinFanoutHard: number;
  /** Model for summarization (uses Neocortex API) */
  summaryModel: string;
  /** Max tokens per context assembly */
  maxContextTokens: number;
}

export interface CreateConversationInput {
  sessionId: string;
  sessionKey?: string;
  title?: string;
}

export interface ConversationRecord {
  conversationId: ConversationId;
  sessionId: string;
  sessionKey: string | null;
  title: string | null;
  bootstrappedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMessageInput {
  conversationId: ConversationId;
  seq: number;
  role: MessageRole;
  content: string;
  tokenCount: number;
}

export interface MessageRecord {
  messageId: MessageId;
  conversationId: ConversationId;
  seq: number;
  role: MessageRole;
  content: string;
  tokenCount: number;
  createdAt: string;
}

export interface SummaryRecord {
  summaryId: SummaryId;
  conversationId: ConversationId;
  kind: SummaryKind;
  depth: number;
  content: string;
  tokenCount: number;
  earliestAt: string | null;
  latestAt: string | null;
  descendantCount: number;
  descendantTokenCount: number;
  sourceMessageTokenCount: number;
  model: string;
  createdAt: string;
  fileIds: string;
}

export interface CreateSummaryInput {
  summaryId: SummaryId;
  conversationId: ConversationId;
  kind: SummaryKind;
  depth: number;
  content: string;
  tokenCount: number;
  earliestAt?: string | null;
  latestAt?: string | null;
  descendantCount?: number;
  descendantTokenCount?: number;
  sourceMessageTokenCount?: number;
  model: string;
  fileIds?: string[];
}

export interface ContextItem {
  conversationId: ConversationId;
  ordinal: number;
  itemType: 'message' | 'summary';
  messageId: MessageId | null;
  summaryId: SummaryId | null;
}

export interface GrepResult {
  type: 'message' | 'summary';
  id: number | string;
  conversationId: ConversationId;
  content: string;
  snippet: string;
  createdAt: string;
  tokenCount: number;
}

export interface ExpandResult {
  summaryId: SummaryId;
  kind: SummaryKind;
  depth: number;
  content: string;
  tokenCount: number;
  childCount: number;
  earliestAt: string | null;
  latestAt: string | null;
}

export interface DescribeResult {
  summaryId: SummaryId;
  kind: SummaryKind;
  depth: number;
  content: string;
  tokenCount: number;
  descendantCount: number;
  descendantTokenCount: number;
  sourceMessageTokenCount: number;
  earliestAt: string | null;
  latestAt: string | null;
  parentIds: string[];
  childIds: string[];
}
