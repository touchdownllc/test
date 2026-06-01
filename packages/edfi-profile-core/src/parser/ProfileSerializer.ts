import yaml from 'js-yaml';
import { ProfileModel, PropertyUsage, ResourceUsage } from '../model/ProfileModel';
import { DEFAULT_UNANNOTATED_PROPERTY_STATUS } from '../model/ProfileModel';

/**
 * Serialize the internal model back to canonical profile YAML.
 *
 * Key order is fixed (not alphabetical) so output is deterministic and the
 * round-trip parse -> serialize -> parse is idempotent. Empty/absent optional
 * fields are omitted rather than emitted as null.
 */

function propertyToObject(p: PropertyUsage): Record<string, unknown> {
  const out: Record<string, unknown> = { usage: p.usage };
  if (p.coverage !== undefined) out.coverage = p.coverage;
  if (p.source !== undefined) out.source = p.source;
  if (p.requiredByImplementation !== undefined)
    out.requiredByImplementation = p.requiredByImplementation;
  if (p.notes !== undefined) out.notes = p.notes;
  if (p.reason !== undefined) out.reason = p.reason;
  return out;
}

function resourceToObject(r: ResourceUsage): Record<string, unknown> {
  const out: Record<string, unknown> = { usage: r.usage };
  if (r.populatedBy !== undefined) out.populatedBy = r.populatedBy;
  if (r.refreshCadence !== undefined) out.refreshCadence = r.refreshCadence;
  if (r.coverage !== undefined) out.coverage = r.coverage;
  if (r.notes !== undefined) out.notes = r.notes;
  if (r.reason !== undefined) out.reason = r.reason;
  if (r.properties && Object.keys(r.properties).length > 0) {
    const props: Record<string, unknown> = {};
    for (const [name, p] of Object.entries(r.properties)) {
      props[name] = propertyToObject(p);
    }
    out.properties = props;
  }
  return out;
}

/** Build the canonical plain-object representation (no YAML formatting). */
export function profileToObject(model: ProfileModel): Record<string, unknown> {
  const profile: Record<string, unknown> = {
    name: model.profile.name,
    version: model.profile.version,
  };
  if (model.profile.description !== undefined) profile.description = model.profile.description;
  if (model.profile.extends) {
    profile.extends = {
      dataStandard: model.profile.extends.dataStandard,
      version: model.profile.extends.version,
    };
  }
  if (model.profile.publisher) {
    const pub: Record<string, unknown> = {};
    if (model.profile.publisher.name !== undefined) pub.name = model.profile.publisher.name;
    if (model.profile.publisher.contact !== undefined)
      pub.contact = model.profile.publisher.contact;
    profile.publisher = pub;
  }

  const root: Record<string, unknown> = { profile };

  if (model.defaults.unannotatedPropertyStatus !== DEFAULT_UNANNOTATED_PROPERTY_STATUS) {
    root.defaults = { unannotatedPropertyStatus: model.defaults.unannotatedPropertyStatus };
  }

  const resources: Record<string, unknown> = {};
  for (const [name, r] of Object.entries(model.resources)) {
    resources[name] = resourceToObject(r);
  }
  root.resources = resources;

  return root;
}

/** Serialize the internal model to a canonical profile YAML string. */
export function serializeProfile(model: ProfileModel): string {
  return yaml.dump(profileToObject(model), {
    indent: 2,
    lineWidth: -1,
    noRefs: true,
    sortKeys: false,
  });
}
