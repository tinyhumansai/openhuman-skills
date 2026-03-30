#!/usr/bin/env node

/**
 * test-registry.mjs
 *
 * Validates the generated registry.json after a build.
 * Checks structure, required fields, and checksum integrity.
 */

import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const SKILLS_DIR = resolve('skills');
const REGISTRY_PATH = join(SKILLS_DIR, 'registry.json');

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
    console.log(`  PASS: ${message}`);
  } else {
    failed++;
    console.error(`  FAIL: ${message}`);
  }
}

function sha256(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

function main() {
  console.log('Validating skills registry...\n');

  // Check registry file exists
  assert(existsSync(REGISTRY_PATH), 'registry.json exists');
  if (!existsSync(REGISTRY_PATH)) {
    console.error('\nRegistry file not found. Run "yarn build" first.');
    process.exit(1);
  }

  // Parse registry
  let registry;
  try {
    registry = JSON.parse(readFileSync(REGISTRY_PATH, 'utf-8'));
    assert(true, 'registry.json is valid JSON');
  } catch (err) {
    assert(false, `registry.json is valid JSON: ${err.message}`);
    process.exit(1);
  }

  // Check top-level fields
  assert(registry.version === 1, `version is 1 (got ${registry.version})`);
  assert(typeof registry.generated_at === 'string', 'generated_at is a string');
  assert(registry.skills !== undefined, 'skills field exists');
  assert(Array.isArray(registry.skills.core), 'skills.core is an array');
  assert(Array.isArray(registry.skills.third_party), 'skills.third_party is an array');

  // Validate each core skill entry
  console.log(`\nValidating ${registry.skills.core.length} core skills...`);
  const requiredFields = ['id', 'name', 'version', 'download_url', 'manifest_url', 'checksum_sha256'];

  for (const skill of registry.skills.core) {
    for (const field of requiredFields) {
      assert(
        skill[field] !== undefined && skill[field] !== null && skill[field] !== '',
        `${skill.id || '?'}: has ${field}`,
      );
    }

    // Verify checksum matches actual file
    const jsPath = join(SKILLS_DIR, skill.id, 'index.js');
    if (existsSync(jsPath)) {
      const actualChecksum = sha256(readFileSync(jsPath));
      assert(
        actualChecksum === skill.checksum_sha256,
        `${skill.id}: checksum matches (${actualChecksum.slice(0, 12)}...)`,
      );
    } else {
      assert(false, `${skill.id}: index.js exists at ${jsPath}`);
    }

    // Verify manifest exists
    const manifestPath = join(SKILLS_DIR, skill.id, 'manifest.json');
    assert(existsSync(manifestPath), `${skill.id}: manifest.json exists`);
  }

  // Summary
  console.log(`\n--- Results ---`);
  console.log(`  Passed: ${passed}`);
  console.log(`  Failed: ${failed}`);
  console.log(`  Total:  ${passed + failed}`);

  if (failed > 0) {
    process.exit(1);
  }
}

main();
