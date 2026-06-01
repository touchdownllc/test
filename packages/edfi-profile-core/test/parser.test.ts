import fs from 'fs';
import path from 'path';
import { parseProfile, serializeProfile, ProfileParseError } from '../src';

const examplePath = path.join(
  __dirname,
  '..',
  '..',
  '..',
  'examples',
  'sample-lea',
  'sample-lea.profile.yaml',
);

describe('ProfileParser', () => {
  const source = fs.readFileSync(examplePath, 'utf8');

  it('parses the worked example into the model', () => {
    const model = parseProfile(source);
    expect(model.profile.name).toBe('SampleLeaProduction');
    expect(model.profile.extends?.version).toBe('5.2.0');
    expect(model.resources.Student.usage).toBe('in-use');
    expect(model.resources.Student.properties?.middleName.coverage).toBe(0.62);
    expect(model.resources.StudentEducationOrganizationAssociation.usage).toBe('not-implemented');
  });

  it('throws on missing profile.name', () => {
    expect(() => parseProfile('profile:\n  version: "1"\nresources: {}')).toThrow(ProfileParseError);
  });

  it('throws on invalid YAML', () => {
    expect(() => parseProfile('profile: : :')).toThrow(ProfileParseError);
  });

  it('round-trips: parse -> serialize -> parse is semantically stable', () => {
    const model = parseProfile(source);
    const yamlOut = serializeProfile(model);
    const reparsed = parseProfile(yamlOut);
    expect(reparsed).toEqual(model);
  });

  it('serialization is idempotent (byte-equivalent on re-serialize)', () => {
    const once = serializeProfile(parseProfile(source));
    const twice = serializeProfile(parseProfile(once));
    expect(twice).toBe(once);
  });
});
