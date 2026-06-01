#!/usr/bin/env node
/**
 * Regenerates the golden output files for the Sample LEA worked example.
 * Run after intentionally changing generator behavior:
 *   npm run build && node scripts/regen-golden.js
 *
 * The coverage report's `generatedAt` is pinned so the golden file is stable.
 */
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { parseProfile } = require('../packages/edfi-profile-core/dist/index.js');
const { runGenerators } = require('../packages/metaed-plugin-edfi-implementation-profile/dist/index.js');

const exampleDir = path.join(__dirname, '..', 'examples', 'sample-lea');
const baseDir = path.join(__dirname, '..', 'examples', 'ed-fi-base');

const profile = parseProfile(fs.readFileSync(path.join(exampleDir, 'sample-lea.profile.yaml'), 'utf8'));
const base = yaml.load(fs.readFileSync(path.join(baseDir, 'openapi-5.2.yaml'), 'utf8'));

const artifacts = runGenerators(profile, base, { generatedAt: '2026-05-26' });

fs.writeFileSync(path.join(exampleDir, 'expected-overlay.yaml'), artifacts.overlayYaml);
fs.writeFileSync(path.join(exampleDir, 'expected-stripped.yaml'), artifacts.strippedSpecYaml);
fs.writeFileSync(path.join(exampleDir, 'expected-coverage.json'), artifacts.coverageJson);

console.log('Regenerated golden files in', exampleDir);
