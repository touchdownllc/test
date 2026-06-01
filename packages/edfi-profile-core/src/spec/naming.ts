/** Naming helpers that map between profile resource names and Ed-Fi OpenAPI
 * conventions (camelCase schema suffixes, pluralized collection paths). */

export function lowerFirst(s: string): string {
  return s.length === 0 ? s : s[0].toLowerCase() + s.slice(1);
}

/** Naive English pluralization, sufficient for Ed-Fi resource names. */
export function pluralize(word: string): string {
  if (/[^aeiou]y$/i.test(word)) return word.slice(0, -1) + 'ies';
  if (/(s|x|z|ch|sh)$/i.test(word)) return word + 'es';
  return word + 's';
}

/** "Student" -> "students", "StudentSchoolAssociation" -> "studentSchoolAssociations". */
export function resourceToCollectionSegment(resourceName: string): string {
  return pluralize(lowerFirst(resourceName));
}

/** "Student" -> "student", used to build schema-name candidates like "edFi_student". */
export function resourceToSchemaSuffix(resourceName: string): string {
  return lowerFirst(resourceName);
}
