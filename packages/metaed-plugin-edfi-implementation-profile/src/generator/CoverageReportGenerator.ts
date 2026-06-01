import { ProfileModel, SpecIndex, validateProfile } from 'edfi-profile-core';

export interface ResourceCoverage {
  name: string;
  usage: string;
  coverage?: number;
  /** Properties in the base schema for this resource. */
  schemaPropertyCount: number;
  /** Annotated properties whose usage is in-use or partial. */
  propertiesInUse: number;
  /** Annotated properties marked not-populated. */
  propertiesNotPopulated: number;
  notable: string[];
}

export interface CoverageFinding {
  severity: string;
  code: string;
  path: string;
  message: string;
}

export interface CoverageReport {
  generatedAt: string;
  base: { dataStandard?: string; version?: string };
  profile: { name: string; version: string };
  summary: {
    resourcesInBaseSpec: number;
    resourcesAnnotated: number;
    resourcesInUse: number;
    resourcesNotImplemented: number;
    resourcesPlanned: number;
    propertiesInUse: number;
    propertiesAnnotated: number;
  };
  resources: ResourceCoverage[];
  findings: CoverageFinding[];
}

export interface CoverageOptions {
  /** ISO date string; injectable so golden-file tests stay stable. */
  generatedAt?: string;
}

function resourceCoverage(
  resourceName: string,
  resource: ProfileModel['resources'][string],
  specIndex: SpecIndex,
): ResourceCoverage {
  const resolved = specIndex.resolve(resourceName);
  const schemaPropertyCount = resolved.schema?.properties
    ? Object.keys(resolved.schema.properties).length
    : 0;

  const props = Object.entries(resource.properties ?? {});
  const propertiesInUse = props.filter(
    ([, p]) => p.usage === 'in-use' || p.usage === 'partial',
  ).length;
  const propertiesNotPopulated = props.filter(([, p]) => p.usage === 'not-populated').length;

  const notable: string[] = [];
  for (const [name, p] of props) {
    if (p.usage === 'partial') {
      const pct = p.coverage !== undefined ? ` (${Math.round(p.coverage * 100)}%)` : '';
      notable.push(`\`${name}\` partial${pct}`);
    } else if (p.usage === 'not-populated') {
      notable.push(`\`${name}\` not populated`);
    } else if (p.usage === 'planned') {
      notable.push(`\`${name}\` planned`);
    }
  }

  return {
    name: resourceName,
    usage: resource.usage,
    coverage: resource.coverage,
    schemaPropertyCount,
    propertiesInUse,
    propertiesNotPopulated,
    notable,
  };
}

export function generateCoverageReport(
  model: ProfileModel,
  specIndex: SpecIndex,
  options: CoverageOptions = {},
): CoverageReport {
  const resources = Object.entries(model.resources).map(([name, r]) =>
    resourceCoverage(name, r, specIndex),
  );

  const resourcesInUse = resources.filter(
    (r) => r.usage === 'in-use' || r.usage === 'partial',
  ).length;
  const resourcesNotImplemented = resources.filter((r) => r.usage === 'not-implemented').length;
  const resourcesPlanned = resources.filter((r) => r.usage === 'planned').length;
  const propertiesInUse = resources.reduce((sum, r) => sum + r.propertiesInUse, 0);
  const propertiesAnnotated = resources.reduce(
    (sum, r) => sum + r.propertiesInUse + r.propertiesNotPopulated,
    0,
  );

  // Surface validator findings that are "surprising" to a human reader.
  const validation = validateProfile(model, specIndex);
  const findings: CoverageFinding[] = validation.issues
    .filter((i) => i.code === 'required-not-populated' || i.code === 'tightened-required')
    .map((i) => ({ severity: i.severity, code: i.code, path: i.path, message: i.message }));

  return {
    generatedAt: options.generatedAt ?? new Date().toISOString().slice(0, 10),
    base: {
      dataStandard: model.profile.extends?.dataStandard,
      version: model.profile.extends?.version,
    },
    profile: { name: model.profile.name, version: model.profile.version },
    summary: {
      resourcesInBaseSpec: specIndex.countResources(),
      resourcesAnnotated: resources.length,
      resourcesInUse,
      resourcesNotImplemented,
      resourcesPlanned,
      propertiesInUse,
      propertiesAnnotated,
    },
    resources,
    findings,
  };
}

export function coverageReportToMarkdown(report: CoverageReport): string {
  const lines: string[] = [];
  lines.push(`# ${report.profile.name} — Ed-Fi Usage Coverage Report`);
  lines.push('');
  lines.push(`Generated: ${report.generatedAt}`);
  if (report.base.version) {
    lines.push(`Base: ${report.base.dataStandard ?? 'Ed-Fi'} ${report.base.version}`);
  }
  lines.push('');
  lines.push('## Summary');
  lines.push(`- Resources in base spec: ${report.summary.resourcesInBaseSpec}`);
  lines.push(`- Resources annotated: ${report.summary.resourcesAnnotated}`);
  lines.push(`- Resources in use: ${report.summary.resourcesInUse}`);
  lines.push(`- Resources not implemented: ${report.summary.resourcesNotImplemented}`);
  if (report.summary.resourcesPlanned > 0) {
    lines.push(`- Resources planned: ${report.summary.resourcesPlanned}`);
  }
  lines.push(
    `- Properties in use: ${report.summary.propertiesInUse} / ${report.summary.propertiesAnnotated} annotated`,
  );
  lines.push('');

  lines.push('## Resources');
  for (const r of report.resources) {
    lines.push('');
    lines.push(`### ${r.name} — ${r.usage}`);
    if (r.usage === 'not-implemented') {
      lines.push('- Not exposed by this implementation.');
    } else {
      if (r.coverage !== undefined) {
        lines.push(`- Resource coverage: ${Math.round(r.coverage * 100)}%`);
      }
      lines.push(
        `- Properties in use: ${r.propertiesInUse} / ${r.schemaPropertyCount} in base schema`,
      );
      if (r.notable.length > 0) lines.push(`- Notable: ${r.notable.join('; ')}`);
    }
  }

  if (report.findings.length > 0) {
    lines.push('');
    lines.push('## Findings');
    for (const f of report.findings) {
      const icon = f.severity === 'error' ? '❌' : f.severity === 'warning' ? '⚠️' : 'ℹ️';
      lines.push(`- ${icon} **${f.code}** (\`${f.path}\`): ${f.message}`);
    }
  }

  lines.push('');
  return lines.join('\n');
}
