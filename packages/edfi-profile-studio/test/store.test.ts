/**
 * @jest-environment node
 *
 * End-to-end Track B integration: load a fixture spec, mark up a resource and
 * its properties through the store, export the YAML, and re-parse + validate it
 * with the shared core. This is the round-trip guarantee that the studio and
 * Track A can never drift on what a valid profile is.
 */
import fs from 'fs';
import path from 'path';
import { parseProfile, validateProfile, SpecIndex, OpenApiDoc } from 'edfi-profile-core';
import yaml from 'js-yaml';
import { useProfileStore } from '../src/state/profileStore';

const repoRoot = path.join(__dirname, '..', '..', '..');
const specText = fs.readFileSync(
  path.join(repoRoot, 'examples', 'ed-fi-base', 'openapi-5.2.yaml'),
  'utf8',
);
const profileText = fs.readFileSync(
  path.join(repoRoot, 'examples', 'sample-lea', 'sample-lea.profile.yaml'),
  'utf8',
);

beforeEach(() => {
  useProfileStore.setState({
    spec: null,
    profile: { profile: { name: 'NewProfile', version: '0.1.0' }, defaults: { unannotatedPropertyStatus: 'unknown' }, resources: {} },
    selectedResource: null,
    validation: { issues: [], errorCount: 0, warningCount: 0 },
    error: null,
  });
});

describe('profileStore', () => {
  it('loads a spec and exposes resources', () => {
    useProfileStore.getState().loadSpec(specText);
    const { spec } = useProfileStore.getState();
    expect(spec?.resources.map((r) => r.resourceName)).toContain('Student');
    expect(spec?.resources.length).toBe(7);
  });

  it('marks up a resource and property, exports valid YAML that round-trips', () => {
    const store = useProfileStore.getState();
    store.loadSpec(specText);
    store.setResourceField('Student', { usage: 'in-use', populatedBy: ['Infinite Campus SIS'] });
    store.setPropertyField('Student', 'middleName', { usage: 'partial', coverage: 0.62 });

    const exported = useProfileStore.getState().exportYaml();
    const reparsed = parseProfile(exported);
    expect(reparsed.resources.Student.usage).toBe('in-use');
    expect(reparsed.resources.Student.properties?.middleName.coverage).toBe(0.62);
  });

  it('surfaces validation findings live as the model changes', () => {
    const store = useProfileStore.getState();
    store.loadSpec(specText);
    // birthDate is required in the base spec — marking it not-populated is non-conformant.
    store.setPropertyField('Student', 'birthDate', { usage: 'not-populated' });
    expect(
      useProfileStore.getState().validation.issues.some((i) => i.code === 'required-not-populated'),
    ).toBe(true);
  });

  it('imports an existing profile and restores prior work', () => {
    const store = useProfileStore.getState();
    store.loadSpec(specText);
    store.importProfile(profileText);
    const profile = useProfileStore.getState().profile;
    expect(profile.profile.name).toBe('SampleLeaProduction');
    expect(profile.resources.StudentEducationOrganizationAssociation.usage).toBe('not-implemented');

    // The imported profile remains valid against the spec it targets.
    const base = yaml.load(specText) as OpenApiDoc;
    expect(validateProfile(profile, new SpecIndex(base)).errorCount).toBe(0);
  });
});
