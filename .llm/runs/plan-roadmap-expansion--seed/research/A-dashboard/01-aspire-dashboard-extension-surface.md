# Aspire dashboard-extension surface — WithCommand, interaction-service, custom resources, embedding a Fresh app

Scope: Topic A §6 research task 1. Facts only, cited against `aspire.dev` docs (via the `aspire`
MCP doc server) and the NetScript worktree
(`C:\Dev\repos\netscript-framework\.llm\tmp\wt-roadmap-expansion`).

## 1. `WithCommand` / custom resource commands — DOES have a TypeScript path

Source: `aspire.dev` slug `custom-resource-commands` (fetched via `mcp__aspire__get_doc`).

- C# has `IResourceBuilder<T>.WithCommand(name, displayName, executeCommand, commandOptions)`. The
  **TypeScript AppHost SDK has the equivalent as an instance method `withCommand(...)`** on any
  resource builder returned from `builder.addNodeApp(...)`, `builder.addRedis(...)`,
  `builder.addProject(...)`, etc. Confirmed real (not NetScript-authored) — imported from
  `./.aspire/modules/aspire.mjs`, the generated Aspire SDK module NetScript's own
  `aspire/apphost.mts` imports from (see `docs/site/explanation/aspire.md` lines 6–11 in this repo).
- Signature (TS): `resource.withCommand(name: string, displayName: string, executeCommand: (context: ExecuteCommandContext) => Promise<ExecuteCommandResult>, options?: { commandOptions?: CommandOptions })`.
- `ExecuteCommandContext` (TS) exposes **async accessors**: `resourceName()`, `cancellationToken()`,
  `logger()`, `arguments()` — note the async-getter shape differs from C#'s plain properties; this
  is the general pattern for the whole TS SDK (methods return promises where C# has properties).
- `ExecuteCommandResult` (TS) is a **plain object literal**, not a helper class:
  `{ success: boolean, message?: string, data?: { value: string, format: CommandResultFormat, displayImmediately?: boolean } }`.
  `CommandResultFormat` is `Text | Json | Markdown`, imported from the same generated module.
- `commandOptions` supports: `description`, `confirmationMessage`, `iconName` (Fluent UI Blazor icon
  name), `updateState` (async callback → `ResourceCommandState.Enabled | Disabled`, receives
  `UpdateCommandStateContext` with `resourceSnapshot()` → `{ healthStatus, state }`), `arguments`
  (array of `InteractionInput` — renders as a dashboard prompt dialog *and* ordered CLI positional
  args), `validateArguments`, `visibility` (`ResourceCommandVisibility.UI | Api | UI|Api | None` —
  bit-combinable; default is both UI+API/MCP).
- **Commands are invokable three ways**, all from the same registration: the dashboard "Actions"
  ellipsis menu; `aspire resource <name> <command> [args...]` from the CLI (stdout carries the
  payload, stderr carries status — pipeable to `jq`); and MCP tool callers (the payload becomes a
  second `TextContentBlock`). This means a dashboard-plugin command registered once is automatically
  scriptable and agent-visible — a real "one seam, three surfaces" win.
- **`WithProcessCommand` / `withProcessCommandFactory`** (experimental, gated by
  `ASPIREPROCESSCOMMAND001` in C#) is a reusable helper for the common "shell out to a local tool and
  stream its stdout/stderr into the command result" pattern — runs on the **AppHost machine**, not in
  a container. Relevant if the dashboard ever wants a "run `deno task db:migrate`"-style button
  without hand-writing process plumbing.
- **Programmatic execution**: `ResourceCommandService`, resolved in TS via
  `(await builder.executionContext()).serviceProvider().getResourceCommandService()`, lets one
  command invoke another by resource name string (`commandService.executeCommandAsync("cache", "clear-cache", { cancellationToken })`).
  This is the mechanism for a dashboard "reset everything" composite command.

**NetScript-repo fact-check**: `WithCommand`/`withCommand` does **not** appear anywhere in
`packages/aspire/` today (`grep` for `WithCommand|addCommand|ResourceCommand` in
`packages/aspire` → no matches). See file 02 for why: the plugin-contribution seam
(`AspireNSPluginContribution`) has a closed `AspireResourceKind` set that does not include a
"command" kind, so `withCommand` is only reachable today by hand-editing a `register-*.mts` file
directly against the raw SDK builder — not through a plugin's `contribute()` return value.

## 2. Interaction service — CONFIRMED NOT AVAILABLE in the TypeScript AppHost SDK

Source: `aspire.dev` slug `interaction-service-preview`.

> "Note: The `IInteractionService` API is not yet available in the TypeScript AppHost SDK."

This is a hard blocker fact for Topic A §5's "Aspire ≥ 9.4 for `WithCommand` (+ interaction-service)"
constraint: the version gate is satisfied (13.4.6 ≫ 9.4), but **the interaction-service half of that
constraint is a C#-AppHost-only feature today**, regardless of version. NetScript's AppHost is
generated TypeScript (`aspire/apphost.mts`, `language: "typescript/nodejs"` — confirmed in
`docs/site/explanation/aspire.md` and `aspire.config.json`'s `appHost.language` field), so:

- No `PromptMessageBoxAsync`/`PromptNotificationAsync`/`PromptConfirmationAsync`/`PromptInputAsync`/
  `PromptInputsAsync` equivalents exist for NetScript's AppHost to call today.
- The doc explicitly steers this exact gap: *"If you need to collect input for a custom resource
  command, consider using command arguments instead of the interaction service. Command arguments
  display the same input UI in the dashboard but also work when running commands from the Aspire
  CLI."* — i.e. **`commandOptions.arguments` (the `InteractionInput[]` on `withCommand`) is the
  TS-reachable substitute** for anything the dashboard would otherwise want the interaction service
  for (confirmation dialogs, input prompts). Design any "are you sure?" or parameterized dashboard
  action through `withCommand`'s `arguments`/`confirmationMessage`, not a hoped-for interaction
  service call — it will throw/not exist.
- Notifications *shown to the user as a result of a command* still work via the command's own
  return payload (`ExecuteCommandResult.message` + `data` surfaces in the dashboard's notification
  center automatically) — that path does not need the interaction service at all.

## 3. Custom resource types

Source: `custom-resource-commands` doc + `what-is-the-apphost` overview (via search, not fully
fetched — time-boxed). The C#-side "build a custom `IResource` type" extensibility model
(`Aspire.Hosting.ApplicationModel`, custom `IResource` + `IResourceBuilder<T>` implementations) is
the deeper mechanism `WithCommand` docs allude to ("Resource types are free to define dashboard
interactions"). NetScript does **not** need this: the repo's own `AspireResource` domain type
(`packages/aspire/src/domain/aspire-resource.ts`) is already a closed, NetScript-defined resource
shape (`name`, `kind`, `port?`, `metadata?`) that adapters turn into real Aspire SDK calls — NetScript
plugins never author raw Aspire `IResource` types directly. This means: extending the *kind* of
resource plugins can contribute (e.g. adding an `'app'` or `'command'` kind, see file 02) is the
right extension point, not standing up custom Aspire `IResource` classes.

## 4. Embedding a Fresh app as an Aspire resource — already solved, but NOT via the plugin-contribution port

This is the single most important fact for the dashboard's own Aspire wiring:

- The generated `register-apps.mts` (source template:
  `packages\cli\src\kernel\templates\aspire\helpers\register\generate-register-apps.ts`) registers
  **any** app-type resource (including a Fresh app) via
  `builder.addExecutable(name, 'deno', workdir, ['task', '--minimum-dependency-age=0', taskName])` —
  a direct call against the raw Aspire TS SDK builder, not through `@netscript/aspire`'s
  `AspireBuilder` port.
- For `app`-type entries with a `Port`, the generator emits
  `await ${id}.withHttpEndpoint({ port, env: 'PORT' })` **and** `await ${id}.withBrowserLogs();` —
  confirming `withBrowserLogs()` is a **real Aspire SDK method**, and that it is already wired for
  every scaffolded Fresh/web app today (this is the landed half of issue #218 — see file
  `analysis/A-dashboard/05-issue-218-prior-art.md` for the issue-level detail, out of this fork's
  scope).
- `apps.Type` has exactly three values today: `app` (→ VITE service-discovery env injection: full
  `VITE_services__{name}__http__0`, shorthand `VITE_{NAME}_URL`, server-side
  `services__{name}__http__0`), `tauri` (same `addExecutable`, no VITE, optional `Remote` app
  reference wiring), `task` (same `addExecutable`, no VITE, no HTTP assumptions).
- eis-chat's own `apps/dashboard` is registered exactly this way today (confirmed via
  `C:\Dev\repos\netscript-framework\.llm\tmp\eis-chat-ref\docs\DESKTOP-SHELL.md` lines 267–278,
  270–292): *"Our TS apphost already mirrors this: `register-apps.mts` registers `dashboard` as
  `builder.addExecutable('dashboard','deno',workdir,['task','dev'])` + `withEnvironment` discovery
  injection."* eis-chat's proposed desktop resource (`aspire/PROPOSED-desktop-resource.md`,
  referenced but not itself read in this fork's scope) is a sibling `register-apps.mts` block with
  `Type:"app"`, no `Port` (a native window binds its own internal `Deno.serve` port), and
  `Enabled:false` for opt-in staging — same registration path, not a new one.
- **Consequence for the dashboard plugin**: the new `plugins/dashboard`'s own Fresh UI will almost
  certainly be scaffolded as an `apps.dashboard`-style entry (or reuse the *existing* generated
  `apps/dashboard` app slot if the project already has one) rather than as a plugin-contributed
  resource — because the plugin-contribution port (`AspireBuilder`, see file 02) has no way to
  express "add a web app with an HTTP endpoint and browser-log capture" at all. This is the "two
  surfaces" reconciliation Topic A §5 flags: the Fresh build-console is registered through the
  **app-registration seam** (`register-apps.mts`), while the dashboard's own Aspire-facing behavior
  (contributing commands, reading the resource graph) would use the **plugin-contribution seam**
  (`AspireNSPluginContribution`) — these are genuinely two different code paths today, not two views
  of one path.

## 5. Sources

- `aspire.dev` (via `mcp__aspire__get_doc`): `custom-resource-commands`, `interaction-service-preview`.
- `aspire.dev` (via `mcp__aspire__search_docs`, titles only, not fully fetched — time-boxed):
  `what-is-the-apphost`, `aspire` (home), `add-aspire-to-an-existing-app`, `multi-language-integrations`.
- `C:\Dev\repos\netscript-framework\.llm\tmp\wt-roadmap-expansion\docs\site\explanation\aspire.md`
- `C:\Dev\repos\netscript-framework\.llm\tmp\wt-roadmap-expansion\packages\cli\src\kernel\templates\aspire\helpers\register\generate-register-apps.ts`
- `C:\Dev\repos\netscript-framework\.llm\tmp\wt-roadmap-expansion\packages\aspire\src\domain\aspire-resource.ts`
- `C:\Dev\repos\netscript-framework\.llm\tmp\eis-chat-ref\docs\DESKTOP-SHELL.md` (lines 79–86, 267–294)
