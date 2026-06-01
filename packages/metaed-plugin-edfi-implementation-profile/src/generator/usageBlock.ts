import { PropertyUsage, ResourceUsage } from 'edfi-profile-core';

/**
 * Builds the `x-edfi-usage` block that travels with overlay actions and the
 * stripped spec. Note the key is `status` (not `usage`) — the YAML profile
 * authoring vocabulary maps to a slightly different on-the-wire vocabulary so
 * the annotation reads naturally inside an OpenAPI document.
 */

export function resourceUsageBlock(r: ResourceUsage): Record<string, unknown> {
  const block: Record<string, unknown> = { status: r.usage };
  if (r.populatedBy !== undefined) block.populatedBy = r.populatedBy;
  if (r.refreshCadence !== undefined) block.refreshCadence = r.refreshCadence;
  if (r.coverage !== undefined) block.coverage = r.coverage;
  if (r.notes !== undefined) block.notes = r.notes;
  if (r.reason !== undefined) block.reason = r.reason;
  return block;
}

export function propertyUsageBlock(p: PropertyUsage): Record<string, unknown> {
  const block: Record<string, unknown> = { status: p.usage };
  if (p.coverage !== undefined) block.coverage = p.coverage;
  if (p.source !== undefined) block.source = p.source;
  if (p.requiredByImplementation !== undefined)
    block.requiredByImplementation = p.requiredByImplementation;
  if (p.notes !== undefined) block.notes = p.notes;
  if (p.reason !== undefined) block.reason = p.reason;
  return block;
}

/** A short, human-readable note appended to descriptions in the stripped spec. */
export function coverageDescriptionSuffix(p: PropertyUsage): string | undefined {
  switch (p.usage) {
    case 'partial': {
      const pct = p.coverage !== undefined ? ` ~${Math.round(p.coverage * 100)}% of records` : '';
      return `⚠️ Partially populated:${pct}.${p.notes ? ` ${p.notes}` : ''}`.trim();
    }
    case 'planned':
      return `🕒 Planned — not yet populated.${p.notes ? ` ${p.notes}` : ''}`.trim();
    case 'in-use':
      return p.requiredByImplementation ? '✅ Required by this implementation.' : undefined;
    default:
      return undefined;
  }
}
