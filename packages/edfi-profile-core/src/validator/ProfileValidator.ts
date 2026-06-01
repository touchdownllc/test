import { ProfileModel } from '../model/ProfileModel';
import { isUsageStatus } from '../model/UsageStatus';
import { SpecIndex } from '../spec/SpecIndex';

export type Severity = 'error' | 'warning' | 'info';

export interface ValidationIssue {
  severity: Severity;
  /** Stable machine code, e.g. "unknown-resource". */
  code: string;
  /** Dotted path into the profile, e.g. "resources.Student.properties.birthDate". */
  path: string;
  message: string;
}

export interface ValidationResult {
  issues: ValidationIssue[];
  errorCount: number;
  warningCount: number;
}

function summarize(issues: ValidationIssue[]): ValidationResult {
  return {
    issues,
    errorCount: issues.filter((i) => i.severity === 'error').length,
    warningCount: issues.filter((i) => i.severity === 'warning').length,
  };
}

function isRequiredInSpec(specIndex: SpecIndex, resourceName: string, propertyName: string): boolean {
  const resolved = specIndex.resolve(resourceName);
  return resolved.schema?.required?.includes(propertyName) ?? false;
}

function propertyExistsInSpec(
  specIndex: SpecIndex,
  resourceName: string,
  propertyName: string,
): boolean {
  const resolved = specIndex.resolve(resourceName);
  return Boolean(resolved.schema?.properties && propertyName in resolved.schema.properties);
}

/**
 * Validate a profile. Structural integrity is assumed (the parser guarantees
 * it); this layer enforces semantic rules. Pass a {@link SpecIndex} to also
 * cross-check the profile against the base OpenAPI document — without it, only
 * spec-independent rules (enum values, coverage range) run.
 */
export function validateProfile(model: ProfileModel, specIndex?: SpecIndex): ValidationResult {
  const issues: ValidationIssue[] = [];

  for (const [resourceName, resource] of Object.entries(model.resources)) {
    const rPath = `resources.${resourceName}`;

    if (!isUsageStatus(resource.usage)) {
      issues.push({
        severity: 'error',
        code: 'invalid-usage',
        path: `${rPath}.usage`,
        message: `"${resource.usage}" is not a valid usage status.`,
      });
    }

    if (resource.coverage !== undefined && (resource.coverage < 0 || resource.coverage > 1)) {
      issues.push({
        severity: 'error',
        code: 'coverage-out-of-range',
        path: `${rPath}.coverage`,
        message: `coverage must be between 0 and 1, got ${resource.coverage}.`,
      });
    }

    if (specIndex && !specIndex.exists(resourceName)) {
      issues.push({
        severity: 'error',
        code: 'unknown-resource',
        path: rPath,
        message: `Resource "${resourceName}" does not exist in the base spec (typo or version drift?).`,
      });
    }

    for (const [propName, prop] of Object.entries(resource.properties ?? {})) {
      const pPath = `${rPath}.properties.${propName}`;

      if (!isUsageStatus(prop.usage)) {
        issues.push({
          severity: 'error',
          code: 'invalid-usage',
          path: `${pPath}.usage`,
          message: `"${prop.usage}" is not a valid usage status.`,
        });
      }

      if (prop.usage === 'not-implemented') {
        issues.push({
          severity: 'warning',
          code: 'not-implemented-on-property',
          path: `${pPath}.usage`,
          message: `"not-implemented" is meaningful only at the resource level; use "not-populated" for an unused property.`,
        });
      }

      if (prop.coverage !== undefined && (prop.coverage < 0 || prop.coverage > 1)) {
        issues.push({
          severity: 'error',
          code: 'coverage-out-of-range',
          path: `${pPath}.coverage`,
          message: `coverage must be between 0 and 1, got ${prop.coverage}.`,
        });
      }

      if (specIndex && specIndex.exists(resourceName)) {
        const present = propertyExistsInSpec(specIndex, resourceName, propName);
        if (!present) {
          issues.push({
            severity: 'error',
            code: 'unknown-property',
            path: pPath,
            message: `Property "${propName}" does not exist on resource "${resourceName}" in the base spec.`,
          });
        } else {
          // Non-conformance: spec requires it but the implementation never populates it.
          if (
            prop.usage === 'not-populated' &&
            isRequiredInSpec(specIndex, resourceName, propName)
          ) {
            issues.push({
              severity: 'error',
              code: 'required-not-populated',
              path: pPath,
              message: `Property "${propName}" is REQUIRED by the base spec but marked not-populated — this implementation is non-conformant.`,
            });
          }
          // Informational: implementation tightens an optional field to required.
          if (
            prop.requiredByImplementation === true &&
            !isRequiredInSpec(specIndex, resourceName, propName)
          ) {
            issues.push({
              severity: 'info',
              code: 'tightened-required',
              path: pPath,
              message: `Property "${propName}" is optional in the spec but required by this implementation.`,
            });
          }
        }
      }
    }
  }

  return summarize(issues);
}
