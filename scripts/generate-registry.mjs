#!/usr/bin/env node

/**
 * generate-registry.mjs
 *
 * Reads all built skills from skills/ directory, computes SHA-256 checksums,
 * and produces a registry.json file listing all available skills.
 *
 * Environment variables:
 *   SKILLS_BASE_URL - Base URL for download links (default: https://skills.openhuman.ai)
 *
 * Third-party skills can be added via third-party-skills.json at the repo root.
 */

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const SKILLS_DIR = resolve('skills');
const THIRD_PARTY_PATH = resolve('third-party-skills.json');
const OUTPUT_PATH = join(SKILLS_DIR, 'registry.json');
const BASE_URL = process.env.SKILLS_BASE_URL || 'https://skills.openhuman.ai';

function sha256(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

function loadThirdPartySkills() {
  if (!existsSync(THIRD_PARTY_PATH)) {
    return [];
  }
  try {
    const content = readFileSync(THIRD_PARTY_PATH, 'utf-8');
    const entries = JSON.parse(content);
    if (!Array.isArray(entries)) {
      console.warn('third-party-skills.json must be a JSON array, skipping');
      return [];
    }
    return entries;
  } catch (err) {
    console.warn(`Failed to read third-party-skills.json: ${err.message}`);
    return [];
  }
}

function discoverCoreSkills() {
  if (!existsSync(SKILLS_DIR)) {
    console.error(`Skills directory not found: ${SKILLS_DIR}`);
    console.error('Run "yarn build" first to compile skills.');
    process.exit(1);
  }

  const skills = [];
  const entries = readdirSync(SKILLS_DIR, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const skillId = entry.name;
    const skillDir = join(SKILLS_DIR, skillId);
    const manifestPath = join(skillDir, 'manifest.json');
    const indexPath = join(skillDir, 'index.js');

    if (!existsSync(manifestPath)) {
      console.warn(`  Skipping ${skillId}: no manifest.json`);
      continue;
    }

    if (!existsSync(indexPath)) {
      console.warn(`  Skipping ${skillId}: no index.js`);
      continue;
    }

    try {
      const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
      const jsContent = readFileSync(indexPath);
      const checksum = sha256(jsContent);

      // Skip production-ignored skills
      if (manifest.ignoreInProduction) {
        console.log(`  Skipping ${skillId}: ignoreInProduction=true`);
        continue;
      }

      skills.push({
        id: manifest.id || skillId,
        name: manifest.name || skillId,
        version: manifest.version || '0.0.0',
        description: manifest.description || '',
        runtime: manifest.runtime || 'quickjs',
        entry: manifest.entry || 'index.js',
        auto_start: manifest.auto_start || false,
        platforms: manifest.platforms || null,
        setup: manifest.setup || null,
        ignore_in_production: false,
        download_url: `${BASE_URL}/skills/${skillId}/index.js`,
        manifest_url: `${BASE_URL}/skills/${skillId}/manifest.json`,
        checksum_sha256: checksum,
      });

      console.log(`  Added ${skillId} v${manifest.version || '?'} (sha256: ${checksum.slice(0, 12)}...)`);
    } catch (err) {
      console.warn(`  Skipping ${skillId}: ${err.message}`);
    }
  }

  return skills;
}

function main() {
  console.log('Generating skills registry...');
  console.log(`  Base URL: ${BASE_URL}`);
  console.log(`  Skills dir: ${SKILLS_DIR}`);

  const coreSkills = discoverCoreSkills();
  const thirdPartySkills = loadThirdPartySkills();

  const registry = {
    version: 1,
    generated_at: new Date().toISOString(),
    skills: {
      core: coreSkills,
      third_party: thirdPartySkills,
    },
  };

  // Ensure output directory exists
  if (!existsSync(SKILLS_DIR)) {
    mkdirSync(SKILLS_DIR, { recursive: true });
  }

  writeFileSync(OUTPUT_PATH, JSON.stringify(registry, null, 2) + '\n');

  console.log(`\nRegistry generated: ${OUTPUT_PATH}`);
  console.log(`  Core skills: ${coreSkills.length}`);
  console.log(`  Third-party skills: ${thirdPartySkills.length}`);
}

main();
