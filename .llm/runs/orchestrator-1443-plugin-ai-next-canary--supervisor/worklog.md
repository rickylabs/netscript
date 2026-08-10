# Worklog — #1443 plugin-ai next-canary orchestrator

## Design

### Public surface

No new public export from any package. The change set is:

- `packages/plugin` — `PluginManifestProvider.defaultServiceEntrypoint` and
  `PluginManifestOfficialSource.{serviceEntrypoint,serviceConfigKey,servicePort}` become optional in
  the exported types and their Zod schemas. Same export list, same symbol names.
- `plugins/ai` — new `ItemScaffolder`s registered in `aiStarterResources`; they are internal to
  `src/adapter/resources/` and reach the outside only through the existing `./scaffold` export.
- `packages/cli` — internal kernel/application changes plus two new doctor checks and four new e2e
  gate ids. `GATE`/`SCAFFOLD` id constants are the CLI-e2e public vocabulary and gain entries.

### Domain vocabulary

- `PluginManifestProvider` / `PluginManifestOfficialSource` (existing) — the "no service" shape is
  the **absence** of fields, not a new type.
- `PluginScaffoldResult.serviceWorkdir: string | undefined` (existing) — already the signal that a
  scaffold produced a runnable service; slice 2 makes it load-bearing instead of advisory.
- `ItemScaffolder<Input>` / `ScaffoldArtifact` / `StubSource<T>` (existing, from
  `@netscript/plugin/adapter`) — the two new emitters use them unchanged.
- New doctor check names as constants, not string literals: `configured-module`,
  `service-entrypoint`.
- New e2e gate ids as constants in `packages/cli/e2e/src/domain/cli-surface.ts`:
  `GENERATE_RUNTIME_SCHEMAS`, `GENERATED_AI_NAMESPACE_CHECK`, `SCAFFOLD_PLUGIN_AI_NO_SERVICE`,
  `BEHAVIOR_PLUGINS_DOCTOR_NEGATIVE`. Exact spellings are slice 8's to finalize against the existing
  naming convention in that file.

### Ports

None created. The work consumes existing ports (`FileSystemPort`, `ScaffolderPort`, `TemplatePort`,
`ProcessPort`) and the existing UI-registry application function `installUiRegistryItems`. No new
abstraction is introduced, because no new external dependency or untestable seam appears.

### Constants

- The AI emitted-file vocabulary (`ai/mod.ts`, `ai/deno.json`, `ai/components/ui/markdown.tsx`)
  lives beside the existing emitted-path constants in `plugins/ai/src/adapter/resources/`, not as
  scattered literals.
- The registry item name `markdown` and its collection membership come from
  `packages/fresh-ui/registry.manifest.ts`; the install path references the item id, never a file
  path into the fresh-ui package.

### Commit slices

The nine ordered slices in `plan.md` §"Commit slices" are the Design's slice list; they are not
restated here. Each slice: implement → automated gate → **Tier-A supervisor review** → sign-off
commit → push → PR comment → run-artifact update → reconcile note.

### Deferred scope

Per `plan.md` §"Deferred scope". The load-bearing one: the generated chat island stays unmounted by
the Fresh app in this PR.

### Contributor path

Per `plan.md` §"Contributor path" — slices 1–4 read top to bottom are the worked example for adding
a service-less plugin.

## PLAN-EVAL selection

**PLAN-EVAL: SELECTED** (not `N/A`). Justification, per `run-loop.md` §4: the work spans four
packages, changes a **published manifest protocol**, removes an appsettings resource that the
AppHost currently emits, and picks between more than one defensible answer on three separate axes
(how "no service" is encoded, where the Markdown surface comes from, where the AI namespace's JSX
configuration lives). `research.md` §4 lists those open questions; `plan.md` locks them. A wrong
lock here is a rewrite, not an edit — which is exactly the condition the Plan-Gate exists for.

Route: Codex · OpenAI · GPT-5.6 Sol · high (`formal_plan_evaluation`, native opposite-family for a
Claude-authored plan). Hard stop: no source edit until `plan-eval.md` records `PASS`.

## Gate results

| Slice | Gate | Result | Evidence |
| --- | --- | --- | --- |
| — | Published-0.0.5 consumer reproduction | 4/4 defects reproduced | `evidence/published-0.0.5-repro.log` |

## Reconcile notes

_(one per slice, from the post-slice reconcile loop)_
