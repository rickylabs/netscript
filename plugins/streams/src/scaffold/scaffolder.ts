/**
 * Userland artifact builder for the thin streams scaffolder.
 *
 * `plugin add streams` emits ONLY user-owned glue: a sample durable stream and the barrel that
 * re-exports it. Everything else the streams plugin provides (`services/`, `src/streams/`,
 * `src/aspire/`, `src/e2e/`, the plugin `mod.ts`/`deno.json`/manifest) resolves from the
 * `@netscript/plugin-streams` dependency and is never copied into the user's repository. This
 * replaces the legacy scaffolder, which emitted an entire second `plugins/<name>/` plugin tree into
 * userland; the CLI owns config wiring (`deno.json`, appsettings), this builder owns nothing but the
 * userland samples.
 *
 * @module
 */

import type { ScaffoldArtifact } from '@netscript/plugin/scaffold';
import { readScaffoldPluginName } from '@netscript/plugin/scaffold';
import type { ScaffolderContext } from '@netscript/plugin/protocol';
import { STREAMS_SAMPLE_STUBS } from './spec.ts';

/**
 * Build the userland artifacts `plugin add streams` writes into the target workspace.
 *
 * The emitted set is static: the sample stubs from {@linkcode STREAMS_SAMPLE_STUBS}, written
 * verbatim with no scaffold-time interpolation. The plugin name is read and validated from the
 * context so an invalid invocation fails fast with the shared `InvalidPluginNameError`, even though
 * the samples themselves do not embed it.
 *
 * @param context The scaffolder context supplied by the CLI installer.
 * @returns The userland sample artifacts to write, in emission order.
 */
export function buildArtifacts(context: ScaffolderContext): readonly ScaffoldArtifact[] {
  readScaffoldPluginName(context);
  return STREAMS_SAMPLE_STUBS.map((stub) => ({ path: stub.path, content: stub.content }));
}
