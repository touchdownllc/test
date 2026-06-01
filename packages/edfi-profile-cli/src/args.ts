/** Minimal flag parser — avoids a dependency for the POC CLI. */
export interface ParsedArgs {
  command: string | undefined;
  flags: Record<string, string>;
  bools: Set<string>;
}

export function parseArgs(argv: string[]): ParsedArgs {
  const [command, ...rest] = argv;
  const flags: Record<string, string> = {};
  const bools = new Set<string>();

  for (let i = 0; i < rest.length; i++) {
    const token = rest[i];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    const next = rest[i + 1];
    if (next === undefined || next.startsWith('--')) {
      bools.add(key);
    } else {
      flags[key] = next;
      i++;
    }
  }
  return { command, flags, bools };
}
