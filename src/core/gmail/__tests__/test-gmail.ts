/**
 * Tests for the Gmail skill.
 * Runs against the real Rust QuickJS runtime via JSON-RPC.
 */
import {
  describe, it, beforeAll, afterAll,
  startSkill, stopSkill, callTool, callToolRaw, getSkillStatus,
  setupStart, skillRpc,
  assert, assertEqual, assertNotNull, assertTrue, assertFalse,
  run,
} from '../../../../dev/test-harness';

const SKILL_ID = 'gmail';

// ─────────────────────────────────────────────────────────────────────────────
// Lifecycle tests
// ─────────────────────────────────────────────────────────────────────────────

describe('Lifecycle', () => {
  it('should start successfully', async () => {
    const snap = await startSkill(SKILL_ID);
    assertEqual(snap.status, 'running');
    assertNotNull(snap.name);
    assertEqual(snap.name, 'Gmail');
  });

  it('should register tools on start', async () => {
    const snap = await getSkillStatus(SKILL_ID);
    assert(snap.tools.length > 0, 'should have tools');
    const toolNames = snap.tools.map(t => t.name);
    // Gmail should have email-related tools
    assert(
      toolNames.some(n => n.includes('email') || n.includes('label')),
      `should have email/label tools, got: ${toolNames.join(', ')}`,
    );
  });

  it('should stop cleanly', async () => {
    await stopSkill(SKILL_ID);
    // Restarting should work
    const snap = await startSkill(SKILL_ID);
    assertEqual(snap.status, 'running');
  });

  afterAll(async () => {
    try { await stopSkill(SKILL_ID); } catch {}
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Setup flow tests
// ─────────────────────────────────────────────────────────────────────────────

describe('Setup flow', () => {
  beforeAll(async () => {
    try { await stopSkill(SKILL_ID); } catch {}
    await startSkill(SKILL_ID);
  });

  it('onSetupStart should return a setup step', async () => {
    const result = await setupStart(SKILL_ID) as any;
    assertNotNull(result);
    assertNotNull(result.step);
    assertNotNull(result.step.id);
    assertNotNull(result.step.fields);
  });

  afterAll(async () => {
    try { await stopSkill(SKILL_ID); } catch {}
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Tools tests (without OAuth - tools should return meaningful errors)
// ─────────────────────────────────────────────────────────────────────────────

describe('Tools - without credentials', () => {
  beforeAll(async () => {
    try { await stopSkill(SKILL_ID); } catch {}
    await startSkill(SKILL_ID);
  });

  it('get-labels should handle missing credentials', async () => {
    const result = await callTool(SKILL_ID, 'get-labels') as any;
    assertNotNull(result);
    // Without OAuth, should return an error or empty result
    assert(
      result.error || result.success === false || Array.isArray(result.labels),
      'should handle missing credentials gracefully',
    );
  });

  it('get-emails should handle missing credentials', async () => {
    const result = await callTool(SKILL_ID, 'get-emails') as any;
    assertNotNull(result);
    assert(
      result.error || result.success === false || Array.isArray(result.emails),
      'should handle missing credentials gracefully',
    );
  });

  it('get-email should require message_id', async () => {
    const result = await callTool(SKILL_ID, 'get-email', {}) as any;
    assertNotNull(result);
    assertFalse(result.success);
  });

  afterAll(async () => {
    try { await stopSkill(SKILL_ID); } catch {}
  });
});

// Run all tests
run();
