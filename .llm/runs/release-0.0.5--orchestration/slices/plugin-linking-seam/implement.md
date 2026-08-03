use harness

# Slice W6-A: plugin linking declared in config, wired by one core seam — #1189 (p1)

You are the implementation supervisor for the PR closing #1189. Read the issue body first — it
carries three source-referenced gaps and eight acceptance boxes. Context: #1067 (0.0.4)
generalized plugin→plugin and plugin→background-processor edges from `scaffold.plugin.json`;
the plugin→**consuming-service** edge has no declaration vocabulary, so developers hand-edit
`appsettings.json` (verified on 0.0.4: `Plugins.sagas-api` + `BackgroundProcessors.sagas`
auto-wired; `Services.deploy` `PluginReferences: [sagas-api]` written by hand).

## Milestone-run evaluator rule (read before planning)

This slice runs inside milestone run `release-0.0.5--orchestration`. Per
`.llm/harness/workflow/milestone-run.md` § Evaluator protocol and orchestrator ruling D6: do not
spawn or wait on a local formal PLAN-EVAL — evaluation composes draft→ready augment + OpenHands
+ the orchestrator pre-merge gate. Mark your PLAN-EVAL gate row "composed per milestone-run.md
(orchestrator waiver)", lock your plan, and implement in the same run.

## SKILL

`.agents/skills/netscript-harness`, `.agents/skills/netscript-pr`,
`.agents/skills/netscript-doctrine` (plugin core + CLI framework surface),
`.agents/skills/netscript-cli` (scaffold/install semantics), `.agents/skills/aspire` (OTEL
evidence).

## The owner's framing — this is the contract

A plugin declares its linking in its own plugin config; **core wires every declared surface
through one shared seam**. No per-plugin wiring logic in plugins, no per-plugin branches in
core. A plugin is fully installable and runnable in a single command with no manual alteration.

Three named gaps (source references in the issue):
1. Declaration vocabulary cannot express the consuming-service edge (services/apps surfaces).
2. `parseDeclaration` gates the seam behind an `officialSource` block — third-party plugins are
   invisible to reconciliation.
3. `readInstalledDeclarations` infers processor→API pairing from `key.endsWith('-api')` —
   replace convention inference with declared identifiers.

## Sequencing context

#1093 (W5-B) lands before you: it de-hardcodes plugin *discovery* and ships a third-party
discovery fixture. Rebase on it; **reuse/extend its third-party fixture plugin** for your
linking fixture where compatible rather than building a second one. Your scope is the
declaration vocabulary + reconciliation/wiring seam; discovery internals stay #1093's. If its
fixture cannot express linking declarations, extend it — do not fork a parallel fixture tree
without recording why in your slice `drift.md`.

## Deliverable = the eight boxes + the verification protocol

All eight issue boxes, plus the owner-set verification bar (non-negotiable, evidence quoted per
step in your slice worklog and on the PR):

1. **Real local scaffold** — what a user actually gets, not a harness.
2. **Single command**: `netscript plugin install <name>` + start; a consuming service reaches
   the plugin with **zero manual `appsettings.json` edits**.
3. **Genuine cross-boundary call** proven with `aspire otel traces` / `aspire otel spans` /
   `aspire otel logs` — the spans must show the service→plugin call actually executing, with
   correlation held.
4. **RED first**: capture the unfixed behavior (missing `PluginReferences`, dead call) on
   today's scaffold before the GREEN run.
5. **Install-order independence**: installing the plugin after the consuming service exists
   retro-wires it — demonstrated both orders.
6. **Uninstall cleanup**: references removed from every linked surface — demonstrated.
7. **The seam proof**: a fixture THIRD-PARTY plugin declares its linking and is wired end to
   end **without touching CLI source**. A fix that only works for sagas does not pass.
8. **Verify the artefact, never the exit code** — piped commands report the last stage.

## Gates

Framework-wave law: `deno task quality:gate` (its doctrine scan also polices "no per-plugin
branches in core" — a hardcoded plugin-name branch is a RED), scoped check/lint/fmt wrappers on
touched roots, no new lint-ignores, no `deno.lock` churn. `scaffold.runtime` one-pass at
merge-readiness — you hold wave 6's expensive-gate slot; serialize against other AppHost runs.
Schema changes to `scaffold.plugin.json` are contract-first: schema + docs updated together;
publish dry-run + doc-lint scoped evidence if any exported surface moves.

## Anticipated files

`packages/plugin` declaration schema + `parseDeclaration`/`readInstalledDeclarations` and the
reconciliation seam; `packages/cli` install/uninstall wiring; the third-party fixture plugin
(from #1093, extended); scaffold templates if the declaration schema surfaces there; focused
tests incl. the endsWith('-api') removal regression. Doctrine: this is the #1093-adjacent
builder/AST debt neighborhood — record a doctrine verdict for the seam design in your plan;
adding a surface to the declaration vocabulary is a contract change, design it before code.

## Environmental hazards

One AppHost at a time; verified process-tree stop; never kill `aspire mcp start`; never kill by
pattern; `deno task agentic:leak-check` before finishing; `--owned-root` for out-of-worktree
scaffold dirs. The machine is shared.

## PR contract

Branch `fix/plugin-linking-declared-seam` (worktree provided at dispatch), target `main`.
Labels: `type:fix`, `area:cli`, `area:plugins`, `priority:p1`, exactly one `status:`; milestone
`0.0.5`. Body: `Closes #1189` only with all eight boxes truthfully ticked on protocol evidence;
authoritative `## Definition of Done` section per the shipped template (PR #1181 enforcement is
live — unchecked DoD boxes fail close-gate). Never write keyword-adjacent issue references in
prose ("hand-closes #N" parses as a closing keyword — use "completed by hand"). Slice
`worklog.md`/`drift.md` in this dir as you go.
