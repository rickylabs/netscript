/**
 * Userland artifact builder for the thin auth scaffolder.
 *
 * `plugin add auth` emits ONLY user-owned glue: the `auth/mod.ts` barrel re-exporting the published
 * auth v1 contract surface. Everything else the auth plugin provides — the `auth-api` service
 * (`services/`), the plugin `mod.ts`/`deno.json`/manifest, the auth session streams (`streams/`), the
 * Aspire wiring, and the `auth.prisma` database schema — resolves from the `@netscript/plugin-auth`
 * dependency and is never copied into the user's repository. The active backend is selected by
 * environment / appsettings (`NETSCRIPT_AUTH_BACKEND`), which the CLI owns, not by an emitted
 * userland file. This replaces the legacy scaffolder, which emitted an entire second `plugins/<name>/`
 * plugin tree (26 files) into userland; the CLI owns config wiring (`deno.json`, appsettings,
 * `netscript.config.ts`), this builder owns nothing but the single userland barrel.
 *
 * @module
 */

import type { ScaffoldArtifact } from '@netscript/plugin/scaffold';
import { readScaffoldPluginName } from '@netscript/plugin/scaffold';
import type { ScaffolderContext } from '@netscript/plugin/protocol';
import { AUTH_SAMPLE_STUBS } from './spec.ts';

/**
 * Build the userland artifacts `plugin add auth` writes into the target workspace.
 *
 * The emitted set is static: the sample stubs from {@linkcode AUTH_SAMPLE_STUBS} (the `auth/mod.ts`
 * barrel), written verbatim with no scaffold-time interpolation. The plugin name is read and
 * validated from the context so an invalid invocation fails fast with the shared
 * `InvalidPluginNameError`, even though the barrel itself does not embed it.
 *
 * @param context The scaffolder context supplied by the CLI installer.
 * @returns The userland sample artifacts to write, in emission order.
 */
export function buildArtifacts(context: ScaffolderContext): readonly ScaffoldArtifact[] {
  readScaffoldPluginName(context);
  return AUTH_SAMPLE_STUBS.map((stub) => ({ path: stub.path, content: stub.content }));
}
