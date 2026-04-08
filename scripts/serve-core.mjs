#!/usr/bin/env node
/**
 * Start openhuman `serve` with openhuman-skills/.env applied (BACKEND_URL, JWT_TOKEN, …).
 *
 * Usage:
 *   npm run serve:core
 *   npm run serve:core -- --port 7788
 *
 * Finds the openhuman repo via: ./openhuman (submodule), ../openhuman (sibling), or OPENHUMAN_ROOT.
 */

import { spawn } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');

/**
 * Parse `openhuman-skills/.env` into a copy of `process.env`, filling keys
 * not already set in the environment (does not override existing vars).
 * @returns {NodeJS.ProcessEnv}
 */
function loadEnvFromSkillsDotenv() {
  const envPath = resolve(rootDir, '.env');
  const envVars = { ...process.env };
  if (!existsSync(envPath)) {
    console.warn(`\x1b[33m  No .env at ${envPath} — BACKEND_URL may default in skills\x1b[0m`);
    return envVars;
  }
  for (const line of readFileSync(envPath, 'utf-8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key] && value) {
      envVars[key] = value;
    }
  }
  console.log(`\x1b[2m  Loaded .env from ${envPath}\x1b[0m`);
  return envVars;
}

/**
 * Locate the openhuman repo: `./openhuman` submodule, sibling `../openhuman`, or `OPENHUMAN_ROOT`.
 * Exits the process if no checkout with `Cargo.toml` is found.
 * @returns {string} Absolute path to the openhuman repository root
 */
function findOpenhumanRoot() {
  const fromSubmodule = resolve(rootDir, 'openhuman', 'Cargo.toml');
  if (existsSync(fromSubmodule)) {
    return resolve(rootDir, 'openhuman');
  }
  const sibling = resolve(rootDir, '..', 'openhuman', 'Cargo.toml');
  if (existsSync(sibling)) {
    return resolve(rootDir, '..', 'openhuman');
  }
  if (process.env.OPENHUMAN_ROOT) {
    const o = resolve(process.env.OPENHUMAN_ROOT);
    if (existsSync(resolve(o, 'Cargo.toml'))) {
      return o;
    }
  }
  console.error(
    '\x1b[31m  Could not find openhuman (expected ./openhuman or ../openhuman). Set OPENHUMAN_ROOT.\x1b[0m'
  );
  process.exit(1);
}

const argv = process.argv.slice(2);
let port = 7788;
const portIdx = argv.indexOf('--port');
if (portIdx !== -1 && argv[portIdx + 1]) {
  port = parseInt(argv[portIdx + 1], 10);
}

const env = loadEnvFromSkillsDotenv();
const openhumanRoot = findOpenhumanRoot();
const backend = env.BACKEND_URL || '(unset — skills default)';
const jwt = env.JWT_TOKEN ? `<${String(env.JWT_TOKEN).length} chars>` : '(unset)';

console.log(`\n\x1b[36m  openhuman serve (with skills .env)\x1b[0m`);
console.log(`\x1b[2m  Port:     ${port}\x1b[0m`);
console.log(`\x1b[2m  Backend:  ${backend}\x1b[0m`);
console.log(`\x1b[2m  JWT:      ${jwt}\x1b[0m`);
console.log(`\x1b[2m  Core:     ${openhumanRoot}\x1b[0m\n`);

const child = spawn(
  'cargo',
  ['run', '--bin', 'openhuman-core', '--', 'serve', '--port', String(port)],
  {
    cwd: openhumanRoot,
    stdio: 'inherit',
    env: {
      ...env,
      RUST_LOG: env.RUST_LOG || 'info',
    },
  }
);

child.on('exit', (code) => {
  process.exit(code ?? 1);
});
process.on('SIGINT', () => child.kill('SIGINT'));
process.on('SIGTERM', () => child.kill('SIGTERM'));
