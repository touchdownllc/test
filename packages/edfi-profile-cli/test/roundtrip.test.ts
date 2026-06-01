import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import SwaggerParser from '@apidevtools/swagger-parser';
import { OpenApiDoc, parseProfile } from 'edfi-profile-core';
import { runGenerators } from 'metaed-plugin-edfi-implementation-profile';
import { parseArgs } from '../src/args';

const repoRoot = path.join(__dirname, '..', '..', '..');

describe('Stripped spec OpenAPI round-trip', () => {
  it('the generated stripped spec validates as OpenAPI 3.0', async () => {
    const model = parseProfile(
      fs.readFileSync(
        path.join(repoRoot, 'examples', 'sample-lea', 'sample-lea.profile.yaml'),
        'utf8',
      ),
    );
    const base = yaml.load(
      fs.readFileSync(path.join(repoRoot, 'examples', 'ed-fi-base', 'openapi-5.2.yaml'), 'utf8'),
    ) as OpenApiDoc;

    const { strippedSpec } = runGenerators(model, base);
    // structuredClone because swagger-parser mutates ($ref resolution) its input.
    await expect(
      SwaggerParser.validate(structuredClone(strippedSpec) as never),
    ).resolves.toBeDefined();
  });

  it('the base spec itself is valid OpenAPI 3.0', async () => {
    const base = yaml.load(
      fs.readFileSync(path.join(repoRoot, 'examples', 'ed-fi-base', 'openapi-5.2.yaml'), 'utf8'),
    );
    await expect(SwaggerParser.validate(structuredClone(base) as never)).resolves.toBeDefined();
  });
});

describe('parseArgs', () => {
  it('parses a command, flags, and bools', () => {
    const parsed = parseArgs(['generate', '--profile', 'p.yaml', '--base', 'b.yaml', '--verbose']);
    expect(parsed.command).toBe('generate');
    expect(parsed.flags.profile).toBe('p.yaml');
    expect(parsed.flags.base).toBe('b.yaml');
    expect(parsed.bools.has('verbose')).toBe(true);
  });
});
