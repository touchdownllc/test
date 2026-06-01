/**
 * Deliberately loose OpenAPI 3.0 typings — enough to introspect and transform
 * an Ed-Fi ODS/API document without pulling a full schema dependency into the
 * shared core. The CLI/plugin still validate the real document with
 * `@apidevtools/swagger-parser`; this is just for ergonomic traversal.
 */

export interface OpenApiSchema {
  type?: string;
  format?: string;
  description?: string;
  properties?: Record<string, OpenApiSchema>;
  required?: string[];
  items?: OpenApiSchema;
  $ref?: string;
  enum?: unknown[];
  // Ed-Fi usage annotation we inject.
  'x-edfi-usage'?: unknown;
  [key: string]: unknown;
}

export interface OpenApiOperation {
  operationId?: string;
  summary?: string;
  description?: string;
  tags?: string[];
  'x-edfi-usage'?: unknown;
  [key: string]: unknown;
}

export type HttpMethod = 'get' | 'post' | 'put' | 'delete' | 'patch' | 'head' | 'options';

export const HTTP_METHODS: HttpMethod[] = [
  'get',
  'post',
  'put',
  'delete',
  'patch',
  'head',
  'options',
];

export type OpenApiPathItem = {
  [method in HttpMethod]?: OpenApiOperation;
} & { [key: string]: unknown };

export interface OpenApiDoc {
  openapi?: string;
  info?: { title?: string; version?: string; description?: string; [k: string]: unknown };
  servers?: unknown[];
  paths: Record<string, OpenApiPathItem>;
  components?: {
    schemas?: Record<string, OpenApiSchema>;
    [k: string]: unknown;
  };
  [key: string]: unknown;
}
