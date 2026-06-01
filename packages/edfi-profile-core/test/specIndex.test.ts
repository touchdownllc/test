import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { OpenApiDoc, SpecIndex } from '../src';

const baseDoc = yaml.load(
  fs.readFileSync(
    path.join(__dirname, '..', '..', '..', 'examples', 'ed-fi-base', 'openapi-5.2.yaml'),
    'utf8',
  ),
) as OpenApiDoc;

describe('SpecIndex', () => {
  const index = new SpecIndex(baseDoc);

  it('resolves a simple resource name to schema and paths', () => {
    const r = index.resolve('Student');
    expect(r.schemaName).toBe('edFi_student');
    expect(r.collectionPath).toBe('/ed-fi/students');
    expect(r.itemPath).toBe('/ed-fi/students/{id}');
  });

  it('resolves a multi-word association resource', () => {
    const r = index.resolve('StudentSchoolAssociation');
    expect(r.schemaName).toBe('edFi_studentSchoolAssociation');
    expect(r.collectionPath).toBe('/ed-fi/studentSchoolAssociations');
  });

  it('counts collection resources', () => {
    expect(index.countResources()).toBe(7);
  });

  it('reports existence correctly', () => {
    expect(index.exists('Student')).toBe(true);
    expect(index.exists('Nonexistent')).toBe(false);
  });
});
