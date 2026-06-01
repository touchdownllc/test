import yaml from 'js-yaml';
import { OpenApiDoc, OpenApiSchema, SpecIndex } from 'edfi-profile-core';

export interface PropertyNode {
  name: string;
  type: string;
  requiredInSpec: boolean;
  description?: string;
}

export interface ResourceNode {
  resourceName: string;
  schemaName?: string;
  collectionPath: string;
  description?: string;
  properties: PropertyNode[];
}

export interface LoadedSpec {
  doc: OpenApiDoc;
  title: string;
  version: string;
  resources: ResourceNode[];
}

function upperFirst(s: string): string {
  return s.length === 0 ? s : s[0].toUpperCase() + s.slice(1);
}

/** "edFi_studentSchoolAssociation" -> "StudentSchoolAssociation". */
function schemaNameToResourceName(schemaName: string): string {
  const suffix = schemaName.includes('_')
    ? schemaName.slice(schemaName.lastIndexOf('_') + 1)
    : schemaName;
  return upperFirst(suffix);
}

function refToSchemaName(ref: string): string {
  return ref.slice(ref.lastIndexOf('/') + 1);
}

function describeType(prop: OpenApiSchema): string {
  if (prop.$ref) return 'object';
  if (prop.type === 'array') return `array<${prop.items?.type ?? 'object'}>`;
  return [prop.type, prop.format].filter(Boolean).join(' / ') || 'object';
}

/** Find the schema name backing a collection path's list response. */
function collectionSchemaName(doc: OpenApiDoc, path: string): string | undefined {
  const get = doc.paths[path]?.get as Record<string, any> | undefined;
  const ref = get?.responses?.['200']?.content?.['application/json']?.schema?.items?.$ref;
  return typeof ref === 'string' ? refToSchemaName(ref) : undefined;
}

function buildResourceNode(
  doc: OpenApiDoc,
  collectionPath: string,
  schemaName: string,
): ResourceNode {
  const schema = doc.components?.schemas?.[schemaName];
  const required = new Set(schema?.required ?? []);
  const properties: PropertyNode[] = Object.entries(schema?.properties ?? {})
    .filter(([name]) => name !== 'id')
    .map(([name, prop]) => ({
      name,
      type: describeType(prop),
      requiredInSpec: required.has(name),
      description: prop.description,
    }));

  return {
    resourceName: schemaNameToResourceName(schemaName),
    schemaName,
    collectionPath,
    description: schema?.description,
    properties,
  };
}

/** Parse a base OpenAPI document (YAML or JSON text) into the studio's UI model. */
export function adaptSpec(text: string): LoadedSpec {
  const trimmed = text.trim();
  const doc = (trimmed.startsWith('{') ? JSON.parse(trimmed) : yaml.load(trimmed)) as OpenApiDoc;
  const index = new SpecIndex(doc);

  const resources: ResourceNode[] = [];
  for (const path of index.collectionPaths()) {
    const schemaName = collectionSchemaName(doc, path);
    if (!schemaName || !doc.components?.schemas?.[schemaName]) continue;
    resources.push(buildResourceNode(doc, path, schemaName));
  }
  resources.sort((a, b) => a.resourceName.localeCompare(b.resourceName));

  return {
    doc,
    title: doc.info?.title ?? 'Untitled API',
    version: doc.info?.version ?? '',
    resources,
  };
}
