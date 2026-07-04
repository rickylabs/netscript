# Aspire version pin + AppHost seam — where a dashboard plugin would actually plug in

Scope: Topic A §5 ("verify the repo's pinned Aspire SDK version") + the "two surfaces" reconciliation
Topic A §5 explicitly flags. All facts sourced against files in
`C:\Dev\repos\netscript-framework\.llm\tmp\wt-roadmap-expansion`.

## 1. Version pin — gate satisfied

Topic A §5 constraint: *"Aspire ≥ 9.4 for `WithCommand` (+ interaction-service). Verify the repo's
pinned Aspire SDK version before committing the Aspire-extension slice."*

- **Pinned version: `13.4.6`**, consistently across:
  - `.github/toolchain.env`
  - `packages/cli/src/kernel/constants/scaffold/scaffold-versions.ts`
  - The `aspire.config.json` documentation example in `docs/site/explanation/aspire.md`.
- `13.4.6 ≫ 9.4` — the numeric gate is satisfied with large headroom. **But** see file 01 §2: the
  `WithCommand` half of the gate is available in TypeScript today; the interaction-service half is
  **not available in the TypeScript AppHost SDK at any version** (confirmed via the
  `interaction-service-preview` doc, which does not scope the limitation by version — it is a
  language-surface gap, not a version gap). Do not treat "we're on 13.4.6" as clearing the whole §5
  constraint; only the `WithCommand` clause is actually cleared by the version pin.

## 2. NetScript's AppHost is TypeScript/Node, generated, two-layer

- `aspire.config.json`'s `appHost.language` is `"typescript/nodejs"` (confirmed in
  `docs/site/explanation/aspire.md`). The generated entry point is `aspire/apphost.mts`:
  `createBuilder()` → `createNetScriptAppHost(builder, configPath)` → `builder.build().run()`
  (`packages/cli/src/kernel/assets/aspire/helpers/apphost.ts.template`).
- The AppHost imports the real Aspire SDK from a generated local module,
  `./.aspire/modules/aspire.mjs` — this is where `withCommand`, `CommandResultFormat`,
  `ResourceCommandVisibility`, `OtlpProtocol`, etc. actually live at runtime. NetScript code never
  vendors these types by hand; they come from Aspire's own generated SDK.
- `.llm/runs` and `register-*.mts` outputs are **generated, overwrite-on-scaffold files** — the repo
  convention (stated directly in `docs/site/explanation/aspire.md` and mirrored in the generator
  source) is "never hand-edit; tag exceptions" if a generated file must diverge from its template.

## 3. TWO SEPARATE seams exist today — this is the load-bearing architectural finding

Topic A §5 says: *"Reconcile the 'two surfaces': the Fresh build-console is the plugin's UI; the
Aspire extension (`WithCommand`) is the plugin's Aspire integration. Extend, do not reinvent."*
Concretely, in the current codebase, these are not two views of one seam — they are **two
structurally independent code paths**:

### Seam A — plugin-contribution (`@netscript/aspire`, plugin-owned, composed at scaffold time)

- `AspireNSPluginContribution` (abstract base, `packages/aspire/src/runtime/aspire-ns-plugin-contribution.base.ts`):
  every plugin's Aspire integration extends this — `pluginName`, `contribute(builder, ctx)`,
  `declareEnv`, `declareHealthChecks`.
- `ContributionRegistry` (`packages/aspire/src/runtime/contribution-registry.ts`): register/resolve/
  list, throws `DuplicateContributionError` on a name collision.
- `composeAppHost()` (`packages/aspire/src/application/compose-apphost.ts`): walks
  `ComposePluginManifest[]`, instantiates each plugin's `contributions.aspire` class, collects
  `AspireResource[]` from each `contribute()` call.
- `AspireBuilder` port (`packages/aspire/src/ports/aspire-builder-port.ts`) — the **entire** method
  set a plugin contribution can call: `addDenoService`, `addDenoBackground`, `addContainer`,
  `addPostgresDatabase`, `addMysqlDatabase`, `addMssqlDatabase`, `addRedisCache`, `addGarnetCache`,
  `reference`, `waitFor`. **No app/executable method. No command method.**
- `AspireResourceKind` (`packages/aspire/src/domain/aspire-resource.ts`) is a **closed union**:
  ```ts
  export type AspireResourceKind =
    | 'deno-service'
    | 'deno-background'
    | 'container'
    | 'database'
    | 'cache';
  ```
  No `'app'`, no `'command'`. `grep -r "WithCommand|addCommand|ResourceCommand" packages/aspire` →
  zero matches, confirming this seam has never touched `withCommand` at all.

### Seam B — app-registration (`register-apps.mts`, config-driven, generated per-scaffold, NOT plugin-composed)

- Generator: `packages/cli/src/kernel/templates/aspire/helpers/register/generate-register-apps.ts`.
- Driven by `appsettings.json`'s `NetScript.Apps.*` entries (`Type: app|tauri|task`, `TaskName`,
  `Workdir`, `Port?`, `ServiceReferences`, `PluginReferences`), **not** by plugin `contribute()`
  return values.
- Calls the **raw Aspire TS SDK builder directly**: `builder.addExecutable(name, 'deno', workdir,
  ['task', '--minimum-dependency-age=0', taskName])`, plus `withHttpEndpoint`, `withOtlpExporter`,
  `withBrowserLogs` (for `app`-type with a `Port`), `withEnvironment` (service-discovery injection).
- This is the seam eis-chat's own `apps/dashboard` and the proposed desktop resource both go
  through (`docs/DESKTOP-SHELL.md` lines 267–292 in the eis-chat reference tree) — confirming this
  is the established, working pattern for "put a web app in the Aspire graph," entirely independent
  of `@netscript/aspire`'s plugin-contribution machinery.

### The gap this creates for the dashboard plugin

A `plugins/dashboard` package that wants to (a) register its own Fresh UI as an Aspire resource with
an HTTP endpoint + browser-log capture, and (b) contribute `withCommand`-based dashboard actions
(e.g. "restart worker," "clear cache," "run migration") **cannot do both through Seam A alone** — (a)
needs Seam B's `addExecutable`/`withHttpEndpoint`/`withBrowserLogs`, which Seam A's `AspireBuilder`
port doesn't expose, and (b) needs `withCommand`, which neither seam currently wires up (Seam A
because its port doesn't have it; Seam B because `register-apps.mts` is a static app-registration
generator, not a place plugins contribute arbitrary command callbacks into).

Two structurally honest options exist for the eventual design (decision owned downstream, not by
this fork):
1. **Extend Seam A**: add an `'app'` and/or `'command'` variant to `AspireResourceKind` + matching
   `AspireBuilder` port methods (`addApp`, `addCommand` or similar) so a plugin's `contribute()` can
   express both a web app and dashboard commands declaratively, and have `composeAppHost()` lower
   them to the same raw SDK calls Seam B already makes today (`addExecutable`, `withCommand`).
   Consistent with the plugin-thinness/core-centralization law — the *capability* (command
   registration) belongs in `@netscript/aspire` core, not hand-rolled per plugin.
2. **Leave the dashboard's own UI on Seam B** (as just another `apps.dashboard`-style entry, same as
   eis-chat's `apps/dashboard` today) and only extend Seam A for `withCommand` support (option 1's
   command half only) — narrower change, but leaves "the dashboard is itself a plugin" as true only
   for its non-Aspire surface (registries, doctor, CLI), not its own Aspire presence.

## 4. Sources

- `C:\Dev\repos\netscript-framework\.llm\tmp\wt-roadmap-expansion\.github\toolchain.env`
- `C:\Dev\repos\netscript-framework\.llm\tmp\wt-roadmap-expansion\packages\cli\src\kernel\constants\scaffold\scaffold-versions.ts`
- `C:\Dev\repos\netscript-framework\.llm\tmp\wt-roadmap-expansion\docs\site\explanation\aspire.md`
- `C:\Dev\repos\netscript-framework\.llm\tmp\wt-roadmap-expansion\packages\aspire\src\runtime\aspire-ns-plugin-contribution.base.ts`
- `C:\Dev\repos\netscript-framework\.llm\tmp\wt-roadmap-expansion\packages\aspire\src\runtime\contribution-registry.ts`
- `C:\Dev\repos\netscript-framework\.llm\tmp\wt-roadmap-expansion\packages\aspire\src\application\compose-apphost.ts`
- `C:\Dev\repos\netscript-framework\.llm\tmp\wt-roadmap-expansion\packages\aspire\src\ports\aspire-builder-port.ts`
- `C:\Dev\repos\netscript-framework\.llm\tmp\wt-roadmap-expansion\packages\aspire\src\domain\aspire-resource.ts`
- `C:\Dev\repos\netscript-framework\.llm\tmp\wt-roadmap-expansion\packages\cli\src\kernel\templates\aspire\helpers\register\generate-register-apps.ts`
- `C:\Dev\repos\netscript-framework\.llm\tmp\wt-roadmap-expansion\packages\cli\src\kernel\assets\aspire\helpers\apphost.ts.template`
- `aspire.dev` slug `interaction-service-preview` (via `mcp__aspire__get_doc`)
- `C:\Dev\repos\netscript-framework\.llm\tmp\eis-chat-ref\docs\DESKTOP-SHELL.md` (lines 267–294)
