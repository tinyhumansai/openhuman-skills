/**
 * Shared helper for syncing skill integration metadata to the backend.
 * Uses the QuickJS global bridge exposed as `memory.insert`.
 */
interface SkillMemoryInsertParams {
  title: string;
  content: string;
  sourceType?: 'doc' | 'chat' | 'email';
  metadata?: Record<string, unknown>;
  priority?: 'high' | 'medium' | 'low';
  createdAt?: number;
  updatedAt?: number;
  documentId?: string;
}

export function syncIntegrationMetadata(
  params: SkillMemoryInsertParams
): void {
  try {
    const memoryBridge = (
      globalThis as {
        memory?: {
          insert?: (params: SkillMemoryInsertParams) => boolean;
        };
      }
    ).memory;
    if (typeof memoryBridge?.insert !== 'function') return;
    memoryBridge.insert(params);
  } catch (error) {
    console.warn('[integration-metadata] sync failed:', error);
  }
}
