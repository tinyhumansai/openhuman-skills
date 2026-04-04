#!/usr/bin/env node
/**
 * test-harness.mjs - Simple test harness for QuickJS skills
 *
 * This harness provides mock implementations of the QuickJS bridge APIs
 * and runs basic verification tests on bundled skills.
 */
import Database from 'better-sqlite3';
import { build as esbuild } from 'esbuild';
import { existsSync, readdirSync, readFileSync } from 'fs';
import { basename, dirname, join } from 'path';
import { fileURLToPath } from 'url';
import vm from 'vm';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const skillsDir = join(rootDir, 'skills');

// Colors for output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
};

// Test state
let testsPassed = 0;
let testsFailed = 0;
const errors = [];

// Mock state for bridge APIs
let mockState = {
  store: {},
  state: {},
  db: { tables: {}, data: {} },
  stateValues: {},
  cronSchedules: {},
  notifications: [],
  fetchResponses: {},
  fetchErrors: {},
  dataFiles: {},
  env: {},
  platformOs: 'macos',
};

function resetMockState() {
  mockState = {
    store: {},
    state: {},
    db: { tables: {}, data: {} },
    stateValues: {},
    cronSchedules: {},
    notifications: [],
    fetchResponses: {},
    fetchErrors: {},
    dataFiles: {},
    env: {},
    platformOs: 'macos',
  };
}

// Create a real SQLite in-memory database for testing
function createInMemoryDb() {
  const database = new Database(':memory:');
  database.pragma('journal_mode = WAL');
  database.exec('CREATE TABLE IF NOT EXISTS __kv (key TEXT PRIMARY KEY, value TEXT)');

  return {
    exec: (sql, params = []) => {
      if (params.length === 0) {
        database.exec(sql);
      } else {
        database.prepare(sql).run(...params);
      }
    },
    get: (sql, params = []) => {
      const row = database.prepare(sql).get(...params);
      return row ?? null;
    },
    all: (sql, params = []) => {
      return database.prepare(sql).all(...params);
    },
    kvGet: (key) => {
      const row = database.prepare('SELECT value FROM __kv WHERE key = ?').get(key);
      if (!row) return null;
      try {
        return JSON.parse(row.value);
      } catch {
        return row.value;
      }
    },
    kvSet: (key, value) => {
      database.prepare('INSERT OR REPLACE INTO __kv (key, value) VALUES (?, ?)').run(key, JSON.stringify(value));
    },
    _close: () => {
      database.close();
    },
  };
}

// Assertion functions injected into test VM contexts
function createAssertions() {
  return {
    assert: (cond, msg) => {
      if (!cond) throw new Error(msg ?? `Assertion failed: expected truthy, got ${cond}`);
    },
    assertEqual: (a, b, msg) => {
      if (a !== b) throw new Error(msg ?? `assertEqual failed: ${JSON.stringify(a)} !== ${JSON.stringify(b)}`);
    },
    assertNotNull: (v, msg) => {
      if (v == null) throw new Error(msg ?? `assertNotNull failed: got ${v}`);
    },
    assertNull: (v, msg) => {
      if (v != null) throw new Error(msg ?? `assertNull failed: got ${JSON.stringify(v)}`);
    },
    assertTrue: (v, msg) => {
      if (v !== true) throw new Error(msg ?? `assertTrue failed: got ${JSON.stringify(v)}`);
    },
    assertFalse: (v, msg) => {
      if (v !== false) throw new Error(msg ?? `assertFalse failed: got ${JSON.stringify(v)}`);
    },
    assertContains: (haystack, needle, msg) => {
      if (typeof haystack !== 'string' || !haystack.includes(needle))
        throw new Error(msg ?? `assertContains failed: "${haystack}" does not contain "${needle}"`);
    },
    assertGreaterThan: (a, b, msg) => {
      if (!(a > b)) throw new Error(msg ?? `assertGreaterThan failed: ${a} is not > ${b}`);
    },
    assertDeepEqual: (a, b, msg) => {
      const aStr = JSON.stringify(a, null, 2);
      const bStr = JSON.stringify(b, null, 2);
      if (aStr !== bStr) throw new Error(msg ?? `assertDeepEqual failed:\n  actual:   ${aStr}\n  expected: ${bStr}`);
    },
    assertThrows: (fn, expectedMsg, msg) => {
      let threw = false;
      try { fn(); } catch (e) {
        threw = true;
        if (expectedMsg && !String(e.message ?? e).includes(expectedMsg)) {
          throw new Error(msg ?? `assertThrows: error message "${e.message}" does not contain "${expectedMsg}"`);
        }
      }
      if (!threw) throw new Error(msg ?? 'assertThrows failed: function did not throw');
    },
    assertMatch: (str, regex, msg) => {
      const re = typeof regex === 'string' ? new RegExp(regex) : regex;
      if (!re.test(str)) throw new Error(msg ?? `assertMatch failed: "${str}" does not match ${re}`);
    },
    assertArrayLength: (arr, len, msg) => {
      if (!Array.isArray(arr)) throw new Error(msg ?? `assertArrayLength failed: not an array`);
      if (arr.length !== len) throw new Error(msg ?? `assertArrayLength failed: expected ${len}, got ${arr.length}`);
    },
  };
}

// Run __tests__/ files for a skill
async function runSkillUnitTests(skillDir, skillName, srcDir) {
  const testsDir = join(srcDir, skillName, '__tests__');
  if (!existsSync(testsDir)) return;

  const testFiles = readdirSync(testsDir).filter(f => f.startsWith('test-') && f.endsWith('.ts'));
  if (testFiles.length === 0) return;

  console.log(`\n  ${colors.blue}Running unit tests:${colors.reset}`);

  for (const testFile of testFiles) {
    const testPath = join(testsDir, testFile);

    // Bundle the test file with esbuild (inlines skill code + test code)
    let bundledCode;
    try {
      // Plugin to stub out imports that are already in the VM context:
      // - test-harness-globals: assertion helpers injected as globals
      // - relative skill imports (../types, ../state, etc.): already loaded from compiled skill
      const stubImportsPlugin = {
        name: 'stub-imports',
        setup(build) {
          // Stub test-harness-globals with re-exports from globalThis
          build.onResolve({ filter: /test-harness-globals/ }, () => ({
            path: 'test-harness-globals',
            namespace: 'stub',
          }));
          build.onLoad({ filter: /test-harness-globals/, namespace: 'stub' }, () => ({
            contents: `
              var g = globalThis;
              export var _describe = g.describe;
              export var _it = g.it;
              export var _assert = g.assert;
              export var _assertEqual = g.assertEqual;
              export var _assertNotNull = g.assertNotNull;
              export var _assertContains = g.assertContains;
              export var _assertTrue = g.assertTrue;
              export var _assertNull = g.assertNull;
              export var _assertFalse = g.assertFalse;
              export var _assertGreaterThan = g.assertGreaterThan;
              export var _assertDeepEqual = g.assertDeepEqual;
              export var _assertThrows = g.assertThrows;
              export var _assertMatch = g.assertMatch;
              export var _assertArrayLength = g.assertArrayLength;
              export var _setup = g.setupSkillTest;
              export var _callTool = g.callTool;
              export var _getMockState = g.getMockState;
              export var _mockFetchResponse = g.mockFetchResponse;
              export var _mockFetchError = g.mockFetchError;
              export var _handleTimer = g.__handleTimer;
              export var _flushTimers = g.__flushTimers;
            `,
            loader: 'js',
          }));
          // Stub all relative skill imports (../types, ../state, etc.) with empty modules
          // since the skill code is already loaded in the VM context.
          build.onResolve({ filter: /^\.\./ }, (args) => {
            // Don't stub test-harness-globals (already handled above)
            if (args.path.includes('test-harness-globals')) return undefined;
            // If it's from inside __tests__/, stub the parent skill module imports
            if (args.importer.includes('__tests__')) {
              return { path: args.path, namespace: 'skill-stub' };
            }
            return undefined;
          });
          build.onLoad({ filter: /.*/, namespace: 'skill-stub' }, () => ({
            contents: '// Skill module already loaded in VM context',
            loader: 'js',
          }));
        },
      };

      const result = await esbuild({
        entryPoints: [testPath],
        bundle: true,
        format: 'iife',
        platform: 'neutral',
        target: 'es2020',
        write: false,
        plugins: [stubImportsPlugin],
      });
      bundledCode = result.outputFiles[0].text;
    } catch (e) {
      console.log(`    ${colors.red}✗${colors.reset} ${testFile}: build failed: ${e.message}`);
      testsFailed++;
      errors.push({ skill: skillName, error: `${testFile} build error: ${e.message}` });
      continue;
    }

    // Create a fresh sandbox with bridge APIs + assertions + test framework
    resetMockState();
    const bridgeAPIs = createBridgeAPIs();
    const assertions = createAssertions();

    // Track test results
    const testResults = [];
    let currentSuite = '';

    const sandbox = {
      ...bridgeAPIs,
      ...assertions,
      globalThis: {},
      Buffer: globalThis.Buffer,
      Uint8Array: globalThis.Uint8Array,
      ArrayBuffer: globalThis.ArrayBuffer,
      TextEncoder: globalThis.TextEncoder,
      TextDecoder: globalThis.TextDecoder,
      crypto: globalThis.crypto,
      window: {
        location: { protocol: 'https:', hostname: 'localhost', port: '', href: 'https://localhost/' },
        WebSocket: class MockWebSocket { constructor() { this.readyState = 0; } send() {} close() {} },
      },
      location: { protocol: 'https:', hostname: 'localhost', port: '', href: 'https://localhost/' },
      WebSocket: class MockWebSocket { constructor() { this.readyState = 0; } send() {} close() {} },
      navigator: { userAgent: 'QuickJSTestHarness' },
      setTimeout: fn => 1,
      clearTimeout: () => {},
      setInterval: fn => 1,
      clearInterval: () => {},
      Date, JSON, Object, Array, String, Number, Boolean, Math,
      Error, TypeError, ReferenceError,
      Map, Set, WeakMap, WeakSet, Promise, RegExp, Symbol, BigInt,
      parseInt, parseFloat, isNaN, isFinite,
      encodeURIComponent, decodeURIComponent,
      btoa: str => Buffer.from(str, 'binary').toString('base64'),
      atob: str => Buffer.from(str, 'base64').toString('binary'),
      fetch: async (url, options = {}) => {
        const result = bridgeAPIs.net.fetch(url, options);
        return {
          status: result.status, ok: result.status >= 200 && result.status < 300,
          statusText: '', headers: result.headers || {},
          text: async () => result.body, json: async () => JSON.parse(result.body),
        };
      },
      addEventListener: () => {}, removeEventListener: () => {}, dispatchEvent: () => true,
      // Test framework
      describe: (name, fn) => {
        currentSuite = name;
        fn();
      },
      it: (name, fn) => {
        try {
          fn();
          testResults.push({ suite: currentSuite, name, passed: true });
        } catch (e) {
          testResults.push({ suite: currentSuite, name, passed: false, error: e.message });
        }
      },
      // setupSkillTest: fully resets everything by reloading the skill code.
      // This ensures the skill's internal globalThis state is fresh for each test.
      setupSkillTest: (opts) => {
        resetMockState();
        const st = mockState;
        if (opts?.stateData) Object.assign(st.stateValues, opts.stateData);
        if (opts?.fetchResponses) Object.assign(st.fetchResponses, opts.fetchResponses);
        if (opts?.fetchErrors) Object.assign(st.fetchErrors, opts.fetchErrors);
        if (opts?.env) Object.assign(st.env, opts.env);
        if (opts?.platformOs) st.platformOs = opts.platformOs;
        if (opts?.oauthCredential) st.oauthCredential = { ...opts.oauthCredential };
        if (opts?.oauthFetchResponses) Object.assign(st.oauthFetchResponses, opts.oauthFetchResponses);

        // Recreate in-memory db
        const newDb = createInMemoryDb();
        sandbox.db.exec = newDb.exec;
        sandbox.db.get = newDb.get;
        sandbox.db.all = newDb.all;
        sandbox.db.kvGet = newDb.kvGet;
        sandbox.db.kvSet = newDb.kvSet;

        // Reconnect all bridge APIs to fresh mock state
        sandbox.state.get = (key) => st.stateValues[key] ?? null;
        sandbox.state.set = (key, value) => { st.stateValues[key] = value; st.state[key] = value; st.store[key] = value; };
        sandbox.state.setPartial = (partial) => { Object.assign(st.stateValues, partial); Object.assign(st.state, partial); Object.assign(st.store, partial); };
        sandbox.state.delete = (key) => { delete st.stateValues[key]; delete st.state[key]; delete st.store[key]; };
        sandbox.state.keys = () => Object.keys(st.stateValues);
        sandbox.data.read = (filename) => st.dataFiles[filename] ?? null;
        sandbox.data.write = (filename, content) => { st.dataFiles[filename] = content; };
        sandbox.platform.env = (key) => st.env[key] ?? '';
        sandbox.platform.os = () => st.platformOs;
        sandbox.platform.notify = (title, body) => { st.notifications.push({ title, body }); };
        sandbox.net.fetch = (url, options = {}) => {
          if (st.fetchErrors[url]) throw new Error(st.fetchErrors[url]);
          const response = st.fetchResponses[url] || { status: 200, body: '{}', headers: {} };
          return { status: response.status, headers: response.headers || {}, body: response.body };
        };
        sandbox.cron.register = (id, schedule) => { st.cronSchedules[id] = schedule; };
        sandbox.cron.unregister = (id) => { delete st.cronSchedules[id]; };
        sandbox.cron.list = () => Object.keys(st.cronSchedules).map(id => ({ id, schedule: st.cronSchedules[id] }));

        // Re-load the compiled skill code to reset internal globalThis state
        // (e.g., __skillState, schema registration, etc.)
        if (sandbox.__skillCodeForReload) {
          sandbox.tools = [];
          vm.runInContext(sandbox.__skillCodeForReload, context, { filename: 'skill-reload', timeout: 30000 });
          // Re-hoist lifecycle functions and tools
          const skillObj = sandbox.__skill?.default || sandbox;
          for (const name of sandbox.__lifecycleNames || []) {
            if (typeof skillObj[name] === 'function') {
              sandbox[name] = skillObj[name];
            }
          }
          if (Array.isArray(skillObj.tools)) {
            sandbox.tools = skillObj.tools;
          }
        }
      },
      callTool: (name, args = {}) => {
        const tool = sandbox.tools?.find(t => t?.name === name);
        if (!tool) throw new Error(`Tool not found: ${name}`);
        const result = tool.execute(args);
        try { return JSON.parse(result); } catch { return result; }
      },
      getMockState: () => mockState,
      mockFetchResponse: (url, status, body, headers) => {
        mockState.fetchResponses[url] = { status, body, headers };
        delete mockState.fetchErrors[url];
      },
      mockFetchError: (url, message = 'Network error') => {
        mockState.fetchErrors[url] = message;
        delete mockState.fetchResponses[url];
      },
    };

    // Self-referential globals
    sandbox.globalThis = sandbox;
    sandbox.self = sandbox;
    const windowLocation = sandbox.window.location;
    const windowWS = sandbox.window.WebSocket;
    sandbox.window = { ...sandbox, location: windowLocation, WebSocket: windowWS };
    sandbox.tools = [];
    sandbox.init = undefined;
    sandbox.start = undefined;
    sandbox.stop = undefined;
    sandbox.onCronTrigger = undefined;
    sandbox.onSessionStart = undefined;
    sandbox.onSessionEnd = undefined;
    sandbox.onSetupStart = undefined;
    sandbox.onSetupSubmit = undefined;
    sandbox.onSetupCancel = undefined;
    sandbox.onDisconnect = undefined;
    sandbox.onListOptions = undefined;
    sandbox.onSetOption = undefined;
    sandbox.onOAuthComplete = undefined;
    sandbox.onOAuthRevoked = undefined;
    sandbox.onAuthComplete = undefined;
    sandbox.onAuthRevoked = undefined;
    sandbox.onHookTriggered = undefined;
    sandbox.onWebhookRequest = undefined;
    sandbox.onServerEvent = undefined;

    const context = vm.createContext(sandbox);

    try {
      // First, load the compiled skill code so lifecycle functions and tools are available
      const skillIndexPath = join(skillDir, 'index.js');
      if (existsSync(skillIndexPath)) {
        let skillCode = readFileSync(skillIndexPath, 'utf-8');
        // Strip 'async' from all function forms so they execute synchronously.
        // In the real QuickJS runtime, all bridge APIs are sync, so async functions
        // effectively run synchronously. In Node.js VM, async wrapping introduces
        // deferred microtasks that break synchronous test expectations.
        skillCode = skillCode.replace(/\basync function\b/g, 'function');
        skillCode = skillCode.replace(/\basync (\w+)\s*\(/g, '$1(');  // async method shorthand: async execute(
        // Also strip 'await' keyword usage (becomes a no-op for sync calls)
        skillCode = skillCode.replace(/\bawait\s+/g, '');
        vm.runInContext(skillCode, context, { filename: skillIndexPath, timeout: 30000 });

        // Hoist lifecycle functions from __skill.default onto globalThis.
        // Wrap async functions so they await the result before returning,
        // matching QuickJS behavior where async functions with sync bridge APIs
        // resolve immediately.
        const skillObj = sandbox.__skill?.default || sandbox;
        const lifecycleNames = [
          'init', 'start', 'stop', 'onCronTrigger', 'onSessionStart', 'onSessionEnd',
          'onSetupStart', 'onSetupSubmit', 'onSetupCancel', 'onDisconnect',
          'onListOptions', 'onSetOption', 'onOAuthComplete', 'onOAuthRevoked',
          'onAuthComplete', 'onAuthRevoked', 'onHookTriggered', 'onWebhookRequest',
          'onServerEvent',
        ];
        for (const name of lifecycleNames) {
          if (typeof skillObj[name] === 'function') {
            sandbox[name] = skillObj[name];
          }
        }
        // Also hoist tools array
        if (Array.isArray(skillObj.tools)) {
          sandbox.tools = skillObj.tools;
        }
        // Store for setupSkillTest to reload
        sandbox.__skillCodeForReload = skillCode;
        sandbox.__lifecycleNames = lifecycleNames;
      }

      // Run the bundled test code (describe/it are already set on sandbox)
      vm.runInContext(bundledCode, context, { filename: testPath, timeout: 30000 });

      // Report results
      for (const r of testResults) {
        if (r.passed) {
          console.log(`    ${colors.green}✓${colors.reset} ${r.suite} > ${r.name}`);
          testsPassed++;
        } else {
          console.log(`    ${colors.red}✗${colors.reset} ${r.suite} > ${r.name}`);
          console.log(`      ${r.error}`);
          testsFailed++;
          errors.push({ skill: skillName, error: `${r.suite} > ${r.name}: ${r.error}` });
        }
      }

      if (testResults.length === 0 && pendingTests.length === 0) {
        console.log(`    ${colors.yellow}○${colors.reset} ${testFile}: no tests found`);
      }
    } catch (e) {
      console.log(`    ${colors.red}✗${colors.reset} ${testFile}: runtime error: ${e.message}`);
      testsFailed++;
      errors.push({ skill: skillName, error: `${testFile}: ${e.message}` });
      if (e.stack) {
        console.log(`      ${e.stack.split('\n').slice(0, 3).join('\n      ')}`);
      }
    }
  }
}

// Create mock bridge APIs
function createBridgeAPIs() {
  return {
    // Store API
    store: {
      get: key => mockState.store[key] ?? null,
      set: (key, value) => {
        mockState.store[key] = value;
      },
      delete: key => {
        delete mockState.store[key];
      },
      keys: () => Object.keys(mockState.store),
    },

    // Database API - real SQLite in-memory
    db: createInMemoryDb(),

    // State API
    state: {
      get: key => mockState.stateValues[key] ?? null,
      set: (key, value) => {
        mockState.stateValues[key] = value;
        mockState.state[key] = value;
        mockState.store[key] = value;
      },
      setPartial: obj => {
        Object.assign(mockState.stateValues, obj);
        Object.assign(mockState.state, obj);
        Object.assign(mockState.store, obj);
      },
    },

    // Cron API
    cron: {
      register: (id, schedule) => {
        mockState.cronSchedules[id] = schedule;
      },
      unregister: id => {
        delete mockState.cronSchedules[id];
      },
      list: () =>
        Object.keys(mockState.cronSchedules).map(id => ({
          id,
          schedule: mockState.cronSchedules[id],
        })),
    },

    // Platform API
    platform: {
      os: () => mockState.platformOs,
      env: key => mockState.env[key] ?? null,
      notify: (title, body) => {
        mockState.notifications.push({ title, body });
      },
    },

    // Network API
    net: {
      fetch: (url, options = {}) => {
        if (mockState.fetchErrors[url]) {
          throw new Error(mockState.fetchErrors[url]);
        }
        const response = mockState.fetchResponses[url] || { status: 200, body: '{}', headers: {} };
        return { status: response.status, headers: response.headers || {}, body: response.body };
      },
    },

    // Data API
    data: {
      read: filename => mockState.dataFiles[filename] ?? null,
      write: (filename, content) => {
        mockState.dataFiles[filename] = content;
      },
    },

    // Skills API
    skills: { list: () => [], callTool: () => null },

    // OAuth API
    oauth: {
      getCredential: () => null,
      fetch: (path, options) => ({ status: 404, headers: {}, body: '{"error":"No OAuth mock configured"}' }),
      revoke: () => true,
      __setCredential: () => {},
    },

    // Auth API (advanced authentication: managed/self_hosted/text)
    auth: {
      getCredential: () => null,
      getMode: () => null,
      getCredentials: () => null,
      fetch: (url, options) => ({ status: 401, headers: {}, body: '{"error":"No auth credential"}' }),
      __setCredential: () => {},
    },

    // Webhook API
    webhook: {
      register: () => {},
      unregister: () => {},
      list: () => [],
      createTunnel: () => ({ id: 'mock', uuid: 'mock-uuid', webhookUrl: 'https://mock/webhooks/mock-uuid' }),
      listTunnels: () => [],
      deleteTunnel: () => {},
    },

    // Memory API
    memory: {
      insert: () => true,
    },

    // Model API (generate/summarize)
    model: {
      generate: (prompt, options) => '[mock generate response]',
      summarize: (text, options) => '[mock summary]',
    },

    // Backend API
    backend: {
      url: 'https://api.tinyhumans.ai',
      token: '',
      fetch: () => ({ status: 404, headers: {}, body: '{}' }),
      submitData: async () => {},
    },

    // Socket API
    socket: {
      connected: () => false,
      id: () => undefined,
      emit: () => {},
      on: () => {},
      off: () => {},
      disconnect: () => {},
    },

    // Hooks API
    hooks: {
      register: () => true,
      unregister: () => true,
      update: () => true,
      setEnabled: () => true,
      list: () => [],
      emit: () => 0,
      getAccumulationState: () => null,
    },

    // Console
    console: {
      log: (...args) => {
        /* silent */
      },
      warn: (...args) => {
        /* silent */
      },
      error: (...args) => {
        /* silent */
      },
    },
  };
}

// Test a skill bundle
async function testSkill(skillDir, skillName) {
  console.log(`\n${colors.blue}Testing skill: ${skillName}${colors.reset}`);

  const indexPath = join(skillDir, 'index.js');
  const manifestPath = join(skillDir, 'manifest.json');

  // Check files exist
  if (!existsSync(indexPath)) {
    console.log(`  ${colors.red}✗${colors.reset} index.js not found`);
    testsFailed++;
    return;
  }

  if (!existsSync(manifestPath)) {
    console.log(`  ${colors.red}✗${colors.reset} manifest.json not found`);
    testsFailed++;
    return;
  }
  console.log(`  ${colors.green}✓${colors.reset} Files exist`);
  testsPassed++;

  // Load manifest
  let manifest;
  try {
    manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
    console.log(`  ${colors.green}✓${colors.reset} Manifest is valid JSON`);
    testsPassed++;
  } catch (e) {
    console.log(`  ${colors.red}✗${colors.reset} Invalid manifest: ${e.message}`);
    testsFailed++;
    return;
  }

  // Validate manifest
  if (!manifest.id || !manifest.name || !manifest.version) {
    console.log(`  ${colors.red}✗${colors.reset} Manifest missing required fields`);
    testsFailed++;
    return;
  }
  console.log(
    `  ${colors.green}✓${colors.reset} Manifest has required fields (id: ${manifest.id}, version: ${manifest.version})`
  );
  testsPassed++;

  // Load and evaluate skill
  resetMockState();
  const bridgeAPIs = createBridgeAPIs();

  try {
    const code = readFileSync(indexPath, 'utf-8');

    // Create a sandboxed context with bridge APIs
    const sandbox = {
      ...bridgeAPIs,
      globalThis: {},
      Buffer: globalThis.Buffer,
      Uint8Array: globalThis.Uint8Array,
      ArrayBuffer: globalThis.ArrayBuffer,
      TextEncoder: globalThis.TextEncoder,
      TextDecoder: globalThis.TextDecoder,
      crypto: globalThis.crypto,
      // Browser globals that gramjs expects
      window: {
        location: {
          protocol: 'https:',
          hostname: 'localhost',
          port: '',
          href: 'https://localhost/',
        },
        WebSocket: class MockWebSocket {
          constructor() {
            this.readyState = 0;
          }
          send() {}
          close() {}
        },
      },
      location: { protocol: 'https:', hostname: 'localhost', port: '', href: 'https://localhost/' },
      WebSocket: class MockWebSocket {
        constructor() {
          this.readyState = 0;
        }
        send() {}
        close() {}
      },
      navigator: { userAgent: 'QuickJSTestHarness' },
      setTimeout: fn => {
        return 1;
      },
      clearTimeout: () => {},
      setInterval: fn => {
        return 1;
      },
      clearInterval: () => {},
      Date,
      JSON,
      Object,
      Array,
      String,
      Number,
      Boolean,
      Math,
      Error,
      TypeError,
      ReferenceError,
      Map,
      Set,
      WeakMap,
      WeakSet,
      Promise,
      RegExp,
      Symbol,
      BigInt,
      parseInt,
      parseFloat,
      isNaN,
      isFinite,
      encodeURIComponent,
      decodeURIComponent,
      btoa: str => Buffer.from(str, 'binary').toString('base64'),
      atob: str => Buffer.from(str, 'base64').toString('binary'),
      // Browser-like fetch API (wraps net.fetch)
      fetch: async (url, options = {}) => {
        const method = options.method || 'GET';
        const headers = options.headers || {};
        const body = options.body || null;
        const result = bridgeAPIs.net.fetch(url, { method, headers, body });
        return {
          status: result.status,
          ok: result.status >= 200 && result.status < 300,
          statusText: '',
          headers: result.headers || {},
          text: async () => result.body,
          json: async () => JSON.parse(result.body),
        };
      },
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => true,
    };

    // Make globalThis self-referential, but preserve window.location
    const windowLocation = sandbox.window.location;
    const windowWebSocket = sandbox.window.WebSocket;
    sandbox.globalThis = sandbox;
    sandbox.self = sandbox;
    // Keep window as a proper object with location
    sandbox.window = { ...sandbox, location: windowLocation, WebSocket: windowWebSocket };

    // Pre-declare skill globals that will be assigned by the skill code
    sandbox.tools = [];
    sandbox.init = undefined;
    sandbox.start = undefined;
    sandbox.stop = undefined;
    sandbox.onCronTrigger = undefined;
    sandbox.onSessionStart = undefined;
    sandbox.onSessionEnd = undefined;
    sandbox.onSetupStart = undefined;
    sandbox.onSetupSubmit = undefined;
    sandbox.onSetupCancel = undefined;
    sandbox.onDisconnect = undefined;
    sandbox.onListOptions = undefined;
    sandbox.onSetOption = undefined;
    sandbox.onOAuthComplete = undefined;
    sandbox.onOAuthRevoked = undefined;
    sandbox.onAuthComplete = undefined;
    sandbox.onAuthRevoked = undefined;
    sandbox.onHookTriggered = undefined;
    sandbox.onWebhookRequest = undefined;
    sandbox.onServerEvent = undefined;

    const context = vm.createContext(sandbox);

    // Run the skill code
    vm.runInContext(code, context, { filename: indexPath, timeout: 30000 });

    console.log(`  ${colors.green}✓${colors.reset} Skill code evaluates without errors`);
    testsPassed++;

    // Resolve skill object: bundled skills use __skill.default
    const skillObj = sandbox.globalThis.__skill?.default || sandbox.globalThis;
    const initFn = skillObj.init || sandbox.globalThis.init;
    const startFn = skillObj.start || sandbox.globalThis.start;
    const stopFn = skillObj.stop || sandbox.globalThis.stop;
    const toolsArr = skillObj.tools || sandbox.globalThis.tools;

    // Check lifecycle hooks are exported
    const hooks = [
      ['init', initFn],
      ['start', startFn],
      ['stop', stopFn],
    ];
    for (const [name, fn] of hooks) {
      if (typeof fn === 'function') {
        console.log(`  ${colors.green}✓${colors.reset} ${name}() exported`);
        testsPassed++;
      } else {
        console.log(`  ${colors.yellow}○${colors.reset} ${name}() not found (optional)`);
      }
    }

    // Fix tools array: esbuild CommonJS interop can leave tool references undefined
    // when __esm wrappers create isolated module scopes. Tools end up on the outer
    // 'exports' object instead. Rebuild from exports if tools has undefined entries.
    if (Array.isArray(sandbox.globalThis.tools)) {
      const hasUndefined = sandbox.globalThis.tools.length > 0 &&
        sandbox.globalThis.tools.some(t => !t);
      if (hasUndefined && sandbox.globalThis.exports) {
        const fixedTools = [];
        for (const key of Object.keys(sandbox.globalThis.exports)) {
          const val = sandbox.globalThis.exports[key];
          if (val && typeof val === 'object' && typeof val.name === 'string' && typeof val.execute === 'function') {
            fixedTools.push(val);
          }
        }
        if (fixedTools.length > 0) {
          sandbox.globalThis.tools = fixedTools;
        }
      }
    }

    // Check tools
    if (Array.isArray(sandbox.globalThis.tools)) {
      const hasUndefined = sandbox.globalThis.tools.length > 0 &&
        sandbox.globalThis.tools.some(t => !t);
      if (hasUndefined && sandbox.globalThis.exports) {
        const fixedTools = [];
        for (const key of Object.keys(sandbox.globalThis.exports)) {
          const val = sandbox.globalThis.exports[key];
          if (val && typeof val === 'object' && typeof val.name === 'string' && typeof val.execute === 'function') {
            fixedTools.push(val);
          }
        }
        if (fixedTools.length > 0) {
          sandbox.globalThis.tools = fixedTools;
        }
      }
    }

    // Check tools
    if (Array.isArray(toolsArr)) {
      console.log(
        `  ${colors.green}✓${colors.reset} tools array exported (${toolsArr.length} tools)`
      );
      testsPassed++;

      // List tools
      for (const tool of sandbox.globalThis.tools) {
        if (tool && tool.name && tool.description && typeof tool.execute === 'function') {
          console.log(`    - ${tool.name}`);
        }
      }
    } else {
      console.log(`  ${colors.yellow}○${colors.reset} tools array not found`);
    }

    // Try calling init()
    if (typeof initFn === 'function') {
      try {
        initFn();
        console.log(`  ${colors.green}✓${colors.reset} init() runs without error`);
        testsPassed++;
      } catch (e) {
        console.log(`  ${colors.red}✗${colors.reset} init() threw: ${e.message}`);
        testsFailed++;
        errors.push({ skill: skillName, error: `init() error: ${e.message}` });
      }
    }

    // Run unit tests from __tests__/ directory
    const srcDir = join(rootDir, 'src');
    await runSkillUnitTests(skillDir, skillName, srcDir);
  } catch (e) {
    console.log(`  ${colors.red}✗${colors.reset} Failed to evaluate skill: ${e.message}`);
    testsFailed++;
    errors.push({ skill: skillName, error: e.message });
    if (e.stack) {
      console.log(`    ${e.stack.split('\n').slice(0, 3).join('\n    ')}`);
    }
  }
}

// Main
console.log(
  `${colors.yellow}═══════════════════════════════════════════════════════════════${colors.reset}`
);
console.log(
  `${colors.yellow}                 QuickJS Skills Test Harness                    ${colors.reset}`
);
console.log(
  `${colors.yellow}═══════════════════════════════════════════════════════════════${colors.reset}`
);

// Find and test skills
const specificSkill = process.argv[2];

if (!existsSync(skillsDir)) {
  console.log(
    `\n${colors.red}Error: skills directory not found. Run 'yarn build' first.${colors.reset}`
  );
  process.exit(1);
}

// Directories that are not skills (shared helpers, etc.) — skip testing
const SKIP_DIRS = ['helpers', 'shared'];

const skillDirs = readdirSync(skillsDir, { withFileTypes: true })
  .filter(d => d.isDirectory() && !SKIP_DIRS.includes(d.name))
  .map(d => d.name);

if (skillDirs.length === 0) {
  console.log(`\n${colors.red}Error: No skills found. Run 'yarn build' first.${colors.reset}`);
  process.exit(1);
}

for (const skillName of skillDirs) {
  if (specificSkill && skillName !== specificSkill) {
    continue;
  }
  await testSkill(join(skillsDir, skillName), skillName);
}

// Summary
console.log(
  `\n${colors.yellow}═══════════════════════════════════════════════════════════════${colors.reset}`
);
console.log(
  `${colors.yellow}                        Summary                                ${colors.reset}`
);
console.log(
  `${colors.yellow}═══════════════════════════════════════════════════════════════${colors.reset}`
);
console.log(`  ${colors.green}Passed: ${testsPassed}${colors.reset}`);
console.log(`  ${colors.red}Failed: ${testsFailed}${colors.reset}`);

if (errors.length > 0) {
  console.log(`\n${colors.red}Errors:${colors.reset}`);
  for (const { skill, error } of errors) {
    console.log(`  - ${skill}: ${error}`);
  }
}

process.exit(testsFailed > 0 ? 1 : 0);
