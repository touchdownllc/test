import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { OpenApiDoc, parseProfile } from 'edfi-profile-core';
import { runGenerators } from '../src';

const repoRoot = path.join(__dirname, '..', '..', '..');
const exampleDir = path.join(repoRoot, 'examples', 'sample-lea');
const baseDir = path.join(repoRoot, 'examples', 'ed-fi-base');

function read(p: string): string {
  return fs.readFileSync(p, 'utf8');
}

describe('Sample LEA golden files', () => {
  const model = parseProfile(read(path.join(exampleDir, 'sample-lea.profile.yaml')));
  const base = yaml.load(read(path.join(baseDir, 'openapi-5.2.yaml'))) as OpenApiDoc;
  const artifacts = runGenerators(model, base, { generatedAt: '2026-05-26' });

  it('overlay matches the golden file', () => {
    expect(artifacts.overlayYaml).toBe(read(path.join(exampleDir, 'expected-overlay.yaml')));
  });

  it('stripped spec matches the golden file', () => {
    expect(artifacts.strippedSpecYaml).toBe(read(path.join(exampleDir, 'expected-stripped.yaml')));
  });

  it('coverage report matches the golden file', () => {
    expect(artifacts.coverageJson).toBe(read(path.join(exampleDir, 'expected-coverage.json')));
  });
});

describe('Generator transformations', () => {
  const model = parseProfile(read(path.join(exampleDir, 'sample-lea.profile.yaml')));
  const base = yaml.load(read(path.join(baseDir, 'openapi-5.2.yaml'))) as OpenApiDoc;
  const { strippedSpec, overlay } = runGenerators(model, base, { generatedAt: '2026-05-26' });

  it('removes not-implemented resource paths', () => {
    expect(strippedSpec.paths['/ed-fi/studentEducationOrganizationAssociations']).toBeUndefined();
    expect(strippedSpec.paths['/ed-fi/students']).toBeDefined();
  });

  it('removes not-populated properties and keeps the resource', () => {
    const student = strippedSpec.components?.schemas?.edFi_student;
    expect(student?.properties?.citizenshipStatusDescriptor).toBeUndefined();
    expect(student?.properties?.personalTitlePrefix).toBeUndefined();
    expect(student?.properties?.studentUniqueId).toBeDefined();
  });

  it('promotes requiredByImplementation into required', () => {
    const student = strippedSpec.components?.schemas?.edFi_student;
    expect(student?.required).toContain('hispanicLatinoEthnicity');
  });

  it('augments partial property descriptions', () => {
    const student = strippedSpec.components?.schemas?.edFi_student;
    expect(student?.properties?.middleName?.description).toMatch(/62% of records/);
  });

  it('overlay is additive only (no removals)', () => {
    expect(overlay.actions.every((a) => 'update' in a)).toBe(true);
    expect(overlay.overlay).toBe('1.0.0');
  });
});
