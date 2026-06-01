import yaml from 'js-yaml';
import { ProfileModel, SpecIndex } from 'edfi-profile-core';
import { propertyUsageBlock, resourceUsageBlock } from './usageBlock';

export interface OverlayAction {
  target: string;
  description?: string;
  update: Record<string, unknown>;
}

export interface Overlay {
  overlay: string;
  info: { title: string; version: string };
  extends?: string;
  actions: OverlayAction[];
}

/** JSONPath escaping for a path key that contains slashes/braces. */
function jsonPathForPath(path: string): string {
  return `$.paths['${path}']`;
}

/**
 * Emits an OpenAPI Overlay 1.0 document that decorates the canonical Ed-Fi
 * OpenAPI doc with `x-edfi-usage` blocks. Purely additive — the overlay never
 * removes anything (that is the stripped spec's job).
 */
export function generateOverlay(model: ProfileModel, specIndex: SpecIndex): Overlay {
  const actions: OverlayAction[] = [];

  for (const [resourceName, resource] of Object.entries(model.resources)) {
    const resolved = specIndex.resolve(resourceName);

    // Resource-level: annotate every operation on the collection path so the
    // usage shows up wherever a consumer looks.
    if (resolved.collectionPath) {
      for (const [method] of specIndex.operationsForPath(resolved.collectionPath)) {
        actions.push({
          target: `${jsonPathForPath(resolved.collectionPath)}.${method}`,
          update: { 'x-edfi-usage': resourceUsageBlock(resource) },
        });
      }
    }

    // Property-level: annotate the schema property nodes.
    if (resolved.schemaName) {
      for (const [propName, prop] of Object.entries(resource.properties ?? {})) {
        actions.push({
          target: `$.components.schemas.${resolved.schemaName}.properties.${propName}`,
          update: { 'x-edfi-usage': propertyUsageBlock(prop) },
        });
      }
    }
  }

  return {
    overlay: '1.0.0',
    info: {
      title: `${model.profile.name} Implementation Profile`,
      version: model.profile.version,
    },
    ...(model.profile.extends
      ? { extends: `${model.profile.extends.dataStandard}@${model.profile.extends.version}` }
      : {}),
    actions,
  };
}

export function overlayToYaml(overlay: Overlay): string {
  return yaml.dump(overlay, { indent: 2, lineWidth: -1, noRefs: true, sortKeys: false });
}
