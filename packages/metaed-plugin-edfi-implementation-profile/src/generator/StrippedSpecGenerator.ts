import yaml from 'js-yaml';
import { OpenApiDoc, OpenApiSchema, ProfileModel, SpecIndex } from 'edfi-profile-core';
import { coverageDescriptionSuffix, propertyUsageBlock, resourceUsageBlock } from './usageBlock';

/**
 * Produces a complete, valid OpenAPI 3.0 document derived from the base spec:
 *  1. Remove paths for `not-implemented` resources.
 *  2. Remove `not-populated` properties (and drop them from `required`).
 *  3. Attach `x-edfi-usage` to surviving operations and properties.
 *  4. Augment descriptions with human-readable coverage notes.
 *  5. Promote `requiredByImplementation` properties into `required`.
 *  6. Leave everything else (servers, security, etc.) untouched.
 */
export function generateStrippedSpec(model: ProfileModel, specIndex: SpecIndex): OpenApiDoc {
  const doc: OpenApiDoc = structuredClone(specIndex.doc);
  const freshIndex = new SpecIndex(doc);

  for (const [resourceName, resource] of Object.entries(model.resources)) {
    const resolved = freshIndex.resolve(resourceName);

    if (resource.usage === 'not-implemented') {
      for (const path of resolved.paths) {
        delete doc.paths[path];
      }
      continue;
    }

    // Annotate operations on the collection path.
    if (resolved.collectionPath) {
      const pathItem = doc.paths[resolved.collectionPath];
      for (const [method] of freshIndex.operationsForPath(resolved.collectionPath)) {
        const op = pathItem[method as keyof typeof pathItem] as Record<string, unknown>;
        op['x-edfi-usage'] = resourceUsageBlock(resource);
      }
    }

    // Property transforms on the schema.
    if (resolved.schema?.properties) {
      const schema = resolved.schema;
      const props = schema.properties as Record<string, OpenApiSchema>;
      const required = new Set(schema.required ?? []);

      for (const [propName, prop] of Object.entries(resource.properties ?? {})) {
        if (!(propName in props)) continue;

        if (prop.usage === 'not-populated') {
          delete props[propName];
          required.delete(propName);
          continue;
        }

        const target = props[propName];
        target['x-edfi-usage'] = propertyUsageBlock(prop);

        const suffix = coverageDescriptionSuffix(prop);
        if (suffix) {
          target.description = target.description
            ? `${target.description} ${suffix}`
            : suffix;
        }

        if (prop.requiredByImplementation === true) required.add(propName);
      }

      if (required.size > 0) schema.required = [...required];
      else delete schema.required;
    }
  }

  return doc;
}

export function strippedSpecToYaml(doc: OpenApiDoc): string {
  return yaml.dump(doc, { indent: 2, lineWidth: -1, noRefs: true, sortKeys: false });
}
