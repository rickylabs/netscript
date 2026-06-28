/**
 * Userland artifact builder for the thin triggers scaffolder.
 *
 * `plugin add triggers` emits ONLY user-owned glue: the three sample triggers and the
 * background-workspace barrel that re-exports them. Everything else the triggers plugin provides
 * (`services/`, `contracts/`, `src/runtime/`, `src/aspire/`, `bin/`, the Prisma schema, the
 * manifest) resolves from the `@netscript/plugin-triggers` dependency and is never copied into the
 * user's repository. The CLI owns config wiring (`deno.json`, appsettings, Prisma copy); this
 * builder owns nothing but the userland samples.
 *
 * @module
 */

import type { ScaffoldArtifact } from '@netscript/plugin/scaffold';
import { readScaffoldPluginName } from '@netscript/plugin/scaffold';
import type { ScaffolderContext } from '@netscript/plugin/protocol';
import { TRIGGERS_SAMPLE_STUBS } from './spec.ts';

/**
 * Build the userland artifacts `plugin add triggers` writes into the target workspace.
 *
 * The emitted set is static: the four sample stubs from {@linkcode TRIGGERS_SAMPLE_STUBS}, written
 * verbatim with no scaffold-time interpolation. The plugin name is read and validated from the
 * context so an invalid invocation fails fast with the shared `InvalidPluginNameError`, even though
 * the samples themselves do not embed it.
 *
 * @param context The scaffolder context supplied by the CLI installer.
 * @returns The userland sample artifacts to write, in emission order.
 */
export function buildArtifacts(context: ScaffolderContext): readonly ScaffoldArtifact[] {
  readScaffoldPluginName(context);
  return TRIGGERS_SAMPLE_STUBS.map((stub) => ({ path: stub.path, content: stub.content }));
}
