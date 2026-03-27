import type { LcmConfig } from './types';

export interface LcmSkillState {
  config: LcmConfig;
  isRunning: boolean;
  fts5Available: boolean;
  currentConversationId: number | null;
}

declare global {
  function getLcmState(): LcmSkillState;
  var __lcmState: LcmSkillState;
}

const DEFAULT_CONFIG: LcmConfig = {
  contextThreshold: 0.75,
  freshTailCount: 10,
  incrementalMaxDepth: -1,
  leafMinFanout: 4,
  condensedMinFanout: 3,
  condensedMinFanoutHard: 2,
  summaryModel: 'neocortex-mk1',
  maxContextTokens: 128000,
};

const skillState: LcmSkillState = {
  config: { ...DEFAULT_CONFIG },
  isRunning: false,
  fts5Available: false,
  currentConversationId: null,
};

globalThis.__lcmState = skillState;

globalThis.getLcmState = function (): LcmSkillState {
  return globalThis.__lcmState;
};
