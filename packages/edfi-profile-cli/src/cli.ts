import SwaggerParser from '@apidevtools/swagger-parser';
import { parseProfile, validateProfile, SpecIndex, ValidationIssue } from 'edfi-profile-core';
import { runGenerators } from 'metaed-plugin-edfi-implementation-profile';
import { parseArgs } from './args';
import { loadBaseSpec, readText, writeOut } from './io';

const USAGE = `edfi-profile — Ed-Fi implementation usage profile generator

Usage:
  edfi-profile generate --profile <file> --base <file> --out-dir <dir> [--emit overlay,stripped,report]
  edfi-profile validate --profile <file> --base <file>

Options:
  --profile   Path to the .profile.yaml sidecar file
  --base      Path to the base Ed-Fi OpenAPI document (.yaml/.json)
  --out-dir   Output directory for generated artifacts (generate only)
  --emit      Comma-separated subset of: overlay,stripped,report (default: all)
`;

function printIssues(issues: ValidationIssue[]): void {
  for (const issue of issues) {
    const icon = issue.severity === 'error' ? '✗' : issue.severity === 'warning' ? '⚠' : 'ℹ';
    // eslint-disable-next-line no-console
    console.log(`  ${icon} [${issue.severity}] ${issue.code} (${issue.path}): ${issue.message}`);
  }
}

function requireFlag(flags: Record<string, string>, name: string): string {
  const value = flags[name];
  if (!value) {
    console.error(`Missing required --${name}`);
    process.exit(2);
  }
  return value;
}

async function commandValidate(flags: Record<string, string>): Promise<number> {
  const profilePath = requireFlag(flags, 'profile');
  const basePath = requireFlag(flags, 'base');

  const model = parseProfile(readText(profilePath));
  const baseDoc = loadBaseSpec(basePath);
  const result = validateProfile(model, new SpecIndex(baseDoc));

  console.log(`Validated "${model.profile.name}" v${model.profile.version}`);
  if (result.issues.length === 0) {
    console.log('  ✓ No issues found.');
    return 0;
  }
  printIssues(result.issues);
  console.log(`\n${result.errorCount} error(s), ${result.warningCount} warning(s).`);
  return result.errorCount > 0 ? 1 : 0;
}

async function commandGenerate(flags: Record<string, string>): Promise<number> {
  const profilePath = requireFlag(flags, 'profile');
  const basePath = requireFlag(flags, 'base');
  const outDir = requireFlag(flags, 'out-dir');
  const emit = (flags.emit ?? 'overlay,stripped,report').split(',').map((s) => s.trim());

  const model = parseProfile(readText(profilePath));
  const baseDoc = loadBaseSpec(basePath);

  // Surface profile problems before generating, but don't block — generation
  // is still useful while an author irons out warnings.
  const validation = validateProfile(model, new SpecIndex(baseDoc));
  if (validation.issues.length > 0) {
    console.log('Profile validation:');
    printIssues(validation.issues);
    console.log('');
  }

  const artifacts = runGenerators(model, baseDoc);
  const written: string[] = [];

  if (emit.includes('overlay')) {
    written.push(writeOut(outDir, 'overlay.yaml', artifacts.overlayYaml));
  }
  if (emit.includes('stripped')) {
    // Hard acceptance criterion: the stripped doc must be valid OpenAPI 3.0.
    try {
      await SwaggerParser.validate(structuredClone(artifacts.strippedSpec) as never);
      console.log('  ✓ Stripped spec validates as OpenAPI 3.0.');
    } catch (e) {
      console.error(`  ✗ Stripped spec failed OpenAPI validation: ${(e as Error).message}`);
      return 1;
    }
    written.push(writeOut(outDir, 'openapi-stripped.yaml', artifacts.strippedSpecYaml));
  }
  if (emit.includes('report')) {
    written.push(writeOut(outDir, 'coverage.json', artifacts.coverageJson));
    written.push(writeOut(outDir, 'coverage.md', artifacts.coverageMarkdown));
  }

  console.log(`\nWrote ${written.length} file(s) to ${outDir}:`);
  for (const f of written) console.log(`  - ${f}`);
  // Generation is report-only: profile validation issues are surfaced above but
  // do not fail the run (the artifacts are still useful). Use `validate` in CI
  // to gate on profile errors.
  return 0;
}

export async function main(argv: string[]): Promise<number> {
  const { command, flags } = parseArgs(argv);
  switch (command) {
    case 'generate':
      return commandGenerate(flags);
    case 'validate':
      return commandValidate(flags);
    case 'help':
    case undefined:
      console.log(USAGE);
      return 0;
    default:
      console.error(`Unknown command: ${command}\n`);
      console.log(USAGE);
      return 2;
  }
}

if (require.main === module) {
  main(process.argv.slice(2))
    .then((code) => process.exit(code))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
