/**
 * The set of usage statuses a resource or property may carry in an
 * implementation profile.
 *
 * Semantic distinctions (these matter — the generators behave differently):
 *  - `in-use`         : actively populated.
 *  - `partial`        : populated some of the time; `coverage` quantifies it.
 *  - `not-populated`  : the resource is in use, but this specific property is
 *                       never written. In the stripped spec the *property* is
 *                       removed (the resource stays).
 *  - `not-implemented`: the resource itself is not exposed by this
 *                       implementation. In the stripped spec the whole *path*
 *                       is removed. Only meaningful at the resource level.
 *  - `planned`        : not currently in use but on the roadmap. Stays in the
 *                       stripped output, flagged in the overlay.
 */
export const USAGE_STATUSES = [
  'in-use',
  'partial',
  'not-populated',
  'not-implemented',
  'planned',
] as const;

export type UsageStatus = (typeof USAGE_STATUSES)[number];

export function isUsageStatus(value: unknown): value is UsageStatus {
  return typeof value === 'string' && (USAGE_STATUSES as readonly string[]).includes(value);
}

/**
 * What to assume for a property that is not explicitly annotated when its
 * resource is in use. Authors set this via `defaults.unannotatedPropertyStatus`.
 */
export const UNANNOTATED_PROPERTY_STATUSES = ['in-use', 'unknown', 'not-populated'] as const;
export type UnannotatedPropertyStatus = (typeof UNANNOTATED_PROPERTY_STATUSES)[number];
