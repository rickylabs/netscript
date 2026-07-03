import { join } from '@std/path';

import type { DenoDeployPreflightPort } from '../../domain/deploy/deno-deploy-cli-port.ts';
import type {
  UnstableApiScanInput,
  UnstableApiSource,
} from '../../domain/deploy/unstable-api-guard.ts';

/** Default entrypoint scanned when a target declares none. */
const DEFAULT_ENTRYPOINT = 'main.ts';

/**
 * Filesystem reader that feeds the pure unstable-API guard (F-CLI-16 / A11).
 *
 * Reads `deno.json` and the deploy entrypoint from the project root, tolerating
 * missing files, and hands the parsed contents to `scanUnstableApis`. The scan
 * itself stays pure in the domain; this adapter owns the side effects. The read
 * is best-effort (entrypoint + config, not the full transitive graph) — the
 * bound is recorded in arch-debt.
 */
export class DenoDeployPreflightReader implements DenoDeployPreflightPort {
  async readGuardInputs(
    projectRoot: string,
    entrypoint = DEFAULT_ENTRYPOINT,
  ): Promise<UnstableApiScanInput> {
    const denoJson = await this.#readJson(join(projectRoot, 'deno.json')) ??
      await this.#readJson(join(projectRoot, 'deno.jsonc'));
    const sources = await this.#readSources(projectRoot, entrypoint);
    return { denoJson, sources };
  }

  async #readJson(path: string): Promise<unknown> {
    const text = await this.#readText(path);
    if (text === undefined) return undefined;
    try {
      return JSON.parse(text);
    } catch {
      return undefined;
    }
  }

  async #readSources(projectRoot: string, entrypoint: string): Promise<UnstableApiSource[]> {
    const sources: UnstableApiSource[] = [];
    for (const candidate of [entrypoint, join('src', entrypoint)]) {
      const path = join(projectRoot, candidate);
      const content = await this.#readText(path);
      if (content !== undefined) sources.push({ path: candidate, content });
    }
    return sources;
  }

  async #readText(path: string): Promise<string | undefined> {
    try {
      return await Deno.readTextFile(path);
    } catch {
      return undefined;
    }
  }
}
