import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { OpenApiDoc } from 'edfi-profile-core';

/** Load an OpenAPI document from a .yaml/.yml/.json file into memory. */
export function loadBaseSpec(filePath: string): OpenApiDoc {
  const text = fs.readFileSync(filePath, 'utf8');
  const ext = path.extname(filePath).toLowerCase();
  const doc = ext === '.json' ? JSON.parse(text) : yaml.load(text);
  return doc as OpenApiDoc;
}

export function readText(filePath: string): string {
  return fs.readFileSync(filePath, 'utf8');
}

export function writeOut(outDir: string, fileName: string, contents: string): string {
  fs.mkdirSync(outDir, { recursive: true });
  const full = path.join(outDir, fileName);
  fs.writeFileSync(full, contents, 'utf8');
  return full;
}
