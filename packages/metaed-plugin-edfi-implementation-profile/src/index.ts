/**
 * MetaEd plugin entry point.
 *
 * For the POC the generators run standalone (see {@link runGenerators} and the
 * `edfi-profile` CLI), but the code is shaped as a MetaEd plugin so the
 * integration path into the MetaEd enhancer/generator pipeline is clear. The
 * real MetaEd runtime would invoke these generators after
 * `metaed-plugin-edfi-api-swagger` has produced the base OpenAPI document.
 */

export interface MetaEdGenerator {
  generatorName: string;
  run: unknown;
}

export interface MetaEdPluginShape {
  shortName: string;
  enhancer: unknown[];
  generator: MetaEdGenerator[];
}

export const plugin: MetaEdPluginShape = {
  shortName: 'edfiImplementationProfile',
  // No model enhancement — this plugin consumes the model surface, never mutates it.
  enhancer: [],
  generator: [
    { generatorName: 'overlayGenerator', run: undefined },
    { generatorName: 'strippedSpecGenerator', run: undefined },
    { generatorName: 'coverageReportGenerator', run: undefined },
  ],
};

export * from './generate';
export * from './generator/OverlayGenerator';
export * from './generator/StrippedSpecGenerator';
export * from './generator/CoverageReportGenerator';
export * from './generator/usageBlock';
