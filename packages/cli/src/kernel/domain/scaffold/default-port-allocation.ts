import { ScaffoldValidationError } from '../errors.ts';

/** Inclusive IANA dynamic/private range used by generated standalone listeners. */
export const SCAFFOLD_DEFAULT_PORT_RANGE = {
  start: 49_152,
  end: 65_535,
} as const;

/** Select a stable high-range listener port for one project resource. */
export function allocateScaffoldDefaultPort(
  projectName: string,
  resourceKey: string,
  usedPorts: ReadonlySet<number> = new Set(),
): number {
  const { start, end } = SCAFFOLD_DEFAULT_PORT_RANGE;
  const size = end - start + 1;
  const offset = stableHash(`${projectName}\0${resourceKey}`) % size;

  for (let attempt = 0; attempt < size; attempt++) {
    const port = start + ((offset + attempt) % size);
    if (!usedPorts.has(port)) return port;
  }

  throw new ScaffoldValidationError(
    `Scaffold listener range exhausted (${start}-${end}).`,
    { start, end },
  );
}

function stableHash(value: string): number {
  let hash = 2_166_136_261;
  for (const character of value) {
    hash ^= character.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 16_777_619);
  }
  return hash >>> 0;
}
