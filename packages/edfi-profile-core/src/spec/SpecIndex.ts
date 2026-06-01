import { HTTP_METHODS, OpenApiDoc, OpenApiSchema } from './OpenApiTypes';
import { resourceToCollectionSegment, resourceToSchemaSuffix } from './naming';

/** A resolved binding between a profile resource name and the elements of the
 * base OpenAPI document that represent it. */
export interface ResolvedResource {
  resourceName: string;
  /** Schema name in components.schemas, e.g. "edFi_student". */
  schemaName?: string;
  schema?: OpenApiSchema;
  /** Collection path, e.g. "/ed-fi/students". */
  collectionPath?: string;
  /** Item path, e.g. "/ed-fi/students/{id}". */
  itemPath?: string;
  /** All paths (collection + item) belonging to this resource. */
  paths: string[];
}

/**
 * Indexes an Ed-Fi ODS/API OpenAPI document so callers can resolve a
 * PascalCase profile resource name (e.g. "Student") to the corresponding
 * schema and paths, regardless of the namespace prefix the document uses.
 */
export class SpecIndex {
  readonly doc: OpenApiDoc;
  private readonly schemaNames: string[];
  private readonly pathNames: string[];

  constructor(doc: OpenApiDoc) {
    this.doc = doc;
    this.schemaNames = Object.keys(doc.components?.schemas ?? {});
    this.pathNames = Object.keys(doc.paths ?? {});
  }

  /** Total number of distinct resources (collection schemas) in the spec.
   * Counts schemas referenced by a collection path so descriptors / sub-objects
   * are not double-counted. */
  countResources(): number {
    return this.collectionPaths().length;
  }

  /** All collection paths (those without a trailing {id} segment). */
  collectionPaths(): string[] {
    return this.pathNames.filter((p) => !/\{[^}]+\}\/?$/.test(p));
  }

  private resolveSchemaName(resourceName: string): string | undefined {
    const suffix = resourceToSchemaSuffix(resourceName).toLowerCase();
    // Prefer "<ns>_<suffix>" then any schema ending in the suffix.
    const exact = this.schemaNames.find((n) => {
      const tail = n.includes('_') ? n.slice(n.lastIndexOf('_') + 1) : n;
      return tail.toLowerCase() === suffix;
    });
    if (exact) return exact;
    return this.schemaNames.find((n) => n.toLowerCase().endsWith(suffix));
  }

  private resolvePaths(resourceName: string): { collection?: string; item?: string; all: string[] } {
    const segment = resourceToCollectionSegment(resourceName).toLowerCase();
    const all: string[] = [];
    let collection: string | undefined;
    let item: string | undefined;
    for (const p of this.pathNames) {
      // Match the last non-parameter segment of the path.
      const lastResourceSegment = p
        .split('/')
        .filter((s) => s.length > 0 && !s.startsWith('{'))
        .pop();
      if (lastResourceSegment?.toLowerCase() === segment) {
        all.push(p);
        if (/\{[^}]+\}\/?$/.test(p)) item = item ?? p;
        else collection = collection ?? p;
      }
    }
    return { collection, item, all };
  }

  resolve(resourceName: string): ResolvedResource {
    const schemaName = this.resolveSchemaName(resourceName);
    const { collection, item, all } = this.resolvePaths(resourceName);
    return {
      resourceName,
      schemaName,
      schema: schemaName ? this.doc.components?.schemas?.[schemaName] : undefined,
      collectionPath: collection,
      itemPath: item,
      paths: all,
    };
  }

  /** True if the resource maps to at least a schema or a path in the base spec. */
  exists(resourceName: string): boolean {
    const r = this.resolve(resourceName);
    return r.schema !== undefined || r.paths.length > 0;
  }

  /** All HTTP operations declared on a path, as [method, operation] pairs. */
  operationsForPath(path: string): Array<[string, unknown]> {
    const item = this.doc.paths[path];
    if (!item) return [];
    return HTTP_METHODS.filter((m) => item[m]).map((m) => [m, item[m]]);
  }
}
