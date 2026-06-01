import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import {
  emptyProfile,
  OpenApiDoc,
  parseProfile,
  ProfileModel,
  SpecIndex,
  validateProfile,
} from '../src';

const baseDoc = yaml.load(
  fs.readFileSync(
    path.join(__dirname, '..', '..', '..', 'examples', 'ed-fi-base', 'openapi-5.2.yaml'),
    'utf8',
  ),
) as OpenApiDoc;
const specIndex = new SpecIndex(baseDoc);

function profileWith(resources: ProfileModel['resources']): ProfileModel {
  const p = emptyProfile();
  p.resources = resources;
  return p;
}

describe('validateProfile — spec-independent rules', () => {
  it('flags coverage outside 0..1', () => {
    const result = validateProfile(
      profileWith({ Student: { usage: 'partial', coverage: 1.4 } }),
    );
    expect(result.issues.some((i) => i.code === 'coverage-out-of-range')).toBe(true);
  });

  it('flags an invalid usage status', () => {
    const result = validateProfile(
      profileWith({ Student: { usage: 'bogus' as never } }),
    );
    expect(result.issues.some((i) => i.code === 'invalid-usage')).toBe(true);
  });

  it('warns when not-implemented is used at the property level', () => {
    const result = validateProfile(
      profileWith({
        Student: { usage: 'in-use', properties: { birthDate: { usage: 'not-implemented' } } },
      }),
    );
    expect(result.issues.some((i) => i.code === 'not-implemented-on-property')).toBe(true);
  });
});

describe('validateProfile — against the base spec', () => {
  it('flags an unknown resource (typo / version drift)', () => {
    const result = validateProfile(profileWith({ Studnet: { usage: 'in-use' } }), specIndex);
    expect(result.issues.some((i) => i.code === 'unknown-resource')).toBe(true);
  });

  it('flags an unknown property', () => {
    const result = validateProfile(
      profileWith({ Student: { usage: 'in-use', properties: { notAField: { usage: 'in-use' } } } }),
      specIndex,
    );
    expect(result.issues.some((i) => i.code === 'unknown-property')).toBe(true);
  });

  it('loudly flags a required property marked not-populated (non-conformance)', () => {
    const result = validateProfile(
      profileWith({
        Student: { usage: 'in-use', properties: { birthDate: { usage: 'not-populated' } } },
      }),
      specIndex,
    );
    const finding = result.issues.find((i) => i.code === 'required-not-populated');
    expect(finding).toBeDefined();
    expect(finding?.severity).toBe('error');
  });

  it('notes a tightened-required property (optional in spec, required by impl)', () => {
    const result = validateProfile(
      profileWith({
        Student: {
          usage: 'in-use',
          properties: { hispanicLatinoEthnicity: { usage: 'in-use', requiredByImplementation: true } },
        },
      }),
      specIndex,
    );
    const finding = result.issues.find((i) => i.code === 'tightened-required');
    expect(finding?.severity).toBe('info');
  });

  it('the worked example produces no errors', () => {
    const model = parseProfile(
      fs.readFileSync(
        path.join(__dirname, '..', '..', '..', 'examples', 'sample-lea', 'sample-lea.profile.yaml'),
        'utf8',
      ),
    );
    const result = validateProfile(model, specIndex);
    expect(result.errorCount).toBe(0);
  });
});
