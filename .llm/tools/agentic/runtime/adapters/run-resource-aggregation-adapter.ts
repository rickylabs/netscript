/** Local run-resource aggregation for normalized Antigravity citation metadata. */

import type { AntigravityCitationEvidence } from '../antigravity-evidence.ts';
import type { AntigravityCitationAggregationPort } from '../ports.ts';

export const ANTIGRAVITY_AGGREGATION_SCHEMA_VERSION = '1.0' as const;

/** Atomically writes citation metadata without provider response bodies. */
export class LocalRunResourceAggregationAdapter implements AntigravityCitationAggregationPort {
  readonly #outputPath: string;

  constructor(outputPath: string) {
    this.#outputPath = outputPath;
  }

  async writeAntigravityCitations(
    citations: readonly AntigravityCitationEvidence[],
  ): Promise<void> {
    const separator = this.#outputPath.lastIndexOf('/');
    if (separator < 1) throw new Error('run resource aggregation path must be absolute');
    const directory = this.#outputPath.slice(0, separator);
    await Deno.mkdir(directory, { recursive: true, mode: 0o700 });
    const temporary = `${this.#outputPath}.netscript-${crypto.randomUUID()}`;
    try {
      await Deno.writeTextFile(
        temporary,
        `${
          JSON.stringify(
            {
              schemaVersion: ANTIGRAVITY_AGGREGATION_SCHEMA_VERSION,
              source: 'antigravity',
              citations,
            },
            null,
            2,
          )
        }\n`,
        { createNew: true, mode: 0o600 },
      );
      await Deno.rename(temporary, this.#outputPath);
      await Deno.chmod(this.#outputPath, 0o600);
    } catch (error) {
      try {
        await Deno.remove(temporary);
      } catch {
        // Best-effort cleanup; the original failure remains authoritative.
      }
      throw error;
    }
  }
}
