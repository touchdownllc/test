import yaml from 'js-yaml';
import {
  DEFAULT_UNANNOTATED_PROPERTY_STATUS,
  ProfileModel,
  PropertyUsage,
  ResourceUsage,
} from '../model/ProfileModel';
import { isUsageStatus } from '../model/UsageStatus';

/**
 * Raised when a profile document is structurally unparseable (bad YAML or
 * missing required scaffolding). Semantic problems (typos against the base
 * spec, illegal coverage values) are surfaced by the validator instead, so
 * authors get the full picture rather than failing on the first issue.
 */
export class ProfileParseError extends Error {
  override readonly name = 'ProfileParseError';
}

function asRecord(value: unknown, where: string): Record<string, unknown> {
  if (value === null || value === undefined) return {};
  if (typeof value !== 'object' || Array.isArray(value)) {
    throw new ProfileParseError(`Expected a mapping at ${where}, got ${typeof value}`);
  }
  return value as Record<string, unknown>;
}

function parseProperty(raw: Record<string, unknown>): PropertyUsage {
  const usage = raw.usage;
  if (!isUsageStatus(usage)) {
    // Keep the raw value so the validator can produce a friendly message.
    return { usage: String(usage) as PropertyUsage['usage'], ...stripUsage(raw) };
  }
  return { usage, ...stripUsage(raw) };
}

function stripUsage(raw: Record<string, unknown>): Omit<PropertyUsage, 'usage'> {
  const out: Omit<PropertyUsage, 'usage'> = {};
  if (typeof raw.coverage === 'number') out.coverage = raw.coverage;
  if (typeof raw.source === 'string') out.source = raw.source;
  if (typeof raw.requiredByImplementation === 'boolean')
    out.requiredByImplementation = raw.requiredByImplementation;
  if (typeof raw.notes === 'string') out.notes = raw.notes;
  if (typeof raw.reason === 'string') out.reason = raw.reason;
  return out;
}

function parseResource(raw: Record<string, unknown>): ResourceUsage {
  const resource: ResourceUsage = {
    usage: (isUsageStatus(raw.usage) ? raw.usage : String(raw.usage)) as ResourceUsage['usage'],
  };
  if (Array.isArray(raw.populatedBy))
    resource.populatedBy = raw.populatedBy.map((s) => String(s));
  if (typeof raw.refreshCadence === 'string') resource.refreshCadence = raw.refreshCadence;
  if (typeof raw.coverage === 'number') resource.coverage = raw.coverage;
  if (typeof raw.notes === 'string') resource.notes = raw.notes;
  if (typeof raw.reason === 'string') resource.reason = raw.reason;

  const props = asRecord(raw.properties, 'properties');
  if (Object.keys(props).length > 0) {
    resource.properties = {};
    for (const [name, value] of Object.entries(props)) {
      resource.properties[name] = parseProperty(asRecord(value, `properties.${name}`));
    }
  }
  return resource;
}

/** Parse a profile YAML string into the internal model. */
export function parseProfile(source: string): ProfileModel {
  let doc: unknown;
  try {
    doc = yaml.load(source);
  } catch (e) {
    throw new ProfileParseError(`Invalid YAML: ${(e as Error).message}`);
  }
  const root = asRecord(doc, 'document root');

  const profileRaw = asRecord(root.profile, 'profile');
  if (typeof profileRaw.name !== 'string' || profileRaw.name.length === 0) {
    throw new ProfileParseError('profile.name is required');
  }
  if (typeof profileRaw.version !== 'string' || profileRaw.version.length === 0) {
    throw new ProfileParseError('profile.version is required');
  }

  const model: ProfileModel = {
    profile: { name: profileRaw.name, version: profileRaw.version },
    defaults: { unannotatedPropertyStatus: DEFAULT_UNANNOTATED_PROPERTY_STATUS },
    resources: {},
  };

  if (typeof profileRaw.description === 'string') model.profile.description = profileRaw.description;
  if (profileRaw.extends) {
    const ext = asRecord(profileRaw.extends, 'profile.extends');
    model.profile.extends = {
      dataStandard: String(ext.dataStandard ?? ''),
      version: String(ext.version ?? ''),
    };
  }
  if (profileRaw.publisher) {
    const pub = asRecord(profileRaw.publisher, 'profile.publisher');
    model.profile.publisher = {};
    if (typeof pub.name === 'string') model.profile.publisher.name = pub.name;
    if (typeof pub.contact === 'string') model.profile.publisher.contact = pub.contact;
  }

  const defaults = asRecord(root.defaults, 'defaults');
  if (
    defaults.unannotatedPropertyStatus === 'in-use' ||
    defaults.unannotatedPropertyStatus === 'unknown' ||
    defaults.unannotatedPropertyStatus === 'not-populated'
  ) {
    model.defaults.unannotatedPropertyStatus = defaults.unannotatedPropertyStatus;
  }

  const resources = asRecord(root.resources, 'resources');
  for (const [name, value] of Object.entries(resources)) {
    model.resources[name] = parseResource(asRecord(value, `resources.${name}`));
  }

  return model;
}
