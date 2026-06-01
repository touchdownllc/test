import { OpenApiDoc, ProfileModel, SpecIndex } from 'edfi-profile-core';
import { generateOverlay, Overlay, overlayToYaml } from './generator/OverlayGenerator';
import { generateStrippedSpec, strippedSpecToYaml } from './generator/StrippedSpecGenerator';
import {
  coverageReportToMarkdown,
  CoverageOptions,
  CoverageReport,
  generateCoverageReport,
} from './generator/CoverageReportGenerator';

export interface GeneratedArtifacts {
  overlay: Overlay;
  overlayYaml: string;
  strippedSpec: OpenApiDoc;
  strippedSpecYaml: string;
  coverage: CoverageReport;
  coverageJson: string;
  coverageMarkdown: string;
}

/** Run all three generators against a profile and base OpenAPI doc. */
export function runGenerators(
  model: ProfileModel,
  baseDoc: OpenApiDoc,
  options: CoverageOptions = {},
): GeneratedArtifacts {
  const specIndex = new SpecIndex(baseDoc);

  const overlay = generateOverlay(model, specIndex);
  const strippedSpec = generateStrippedSpec(model, specIndex);
  const coverage = generateCoverageReport(model, specIndex, options);

  return {
    overlay,
    overlayYaml: overlayToYaml(overlay),
    strippedSpec,
    strippedSpecYaml: strippedSpecToYaml(strippedSpec),
    coverage,
    coverageJson: `${JSON.stringify(coverage, null, 2)}\n`,
    coverageMarkdown: coverageReportToMarkdown(coverage),
  };
}
