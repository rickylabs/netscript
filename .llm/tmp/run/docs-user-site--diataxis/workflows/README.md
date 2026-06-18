# Doc fan-out workflow — `g3-user-docs-fanout.js`

The Claude **dynamic workflow** that generated the Group 3 user-docs bulk: 21 reference
pages (from `deno doc`), 25 standardized READMEs, 4 Diátaxis concept pages, and one Verify
barrier — ~50 background subagents in a single run (`wf_910e9292-7b7`).

It is sanctioned under the **LD-DOCS-LANE** exception in `CLAUDE.md`: a Claude workflow may be
the *implementation* lane for **documentation authoring only** (no `packages/`/`plugins/`
source). Validation still goes to OpenHands (separate session); the workflow is generator-only.

## How it works (anatomy)

1. **`export const meta = {...}`** — pure literal (`name`, `description`, `phases[]`). Drives the
   `/workflows` progress UI. Phase titles must match the `phase:` tag on each `agent()` call.
2. **`COMMON` preamble** — one string injected into every agent prompt. Carries the cross-cutting
   rules: the **worktree-pin workaround** (agents are pinned to a *different* worktree, so they
   write via the **Bash tool with absolute paths**, never Edit/Write), the off-limits list (no
   source edits, no `version`/catalog/lock churn), and pointers to the worked examples (the logger
   pilot page + README template + `check-readme-standard.ts`).
3. **`SCHEMA`** — JSON Schema passed as `agent(prompt, {schema})`. Forces each subagent to return
   validated structured output (`{unit, filesWritten, commandsRun:[{cmd,exit}], ok, notes}`)
   instead of prose, so results are machine-checkable.
4. **Unit lists → agent thunks** — the reusable core. Three arrays drive everything:
   - `refPlain` (17 packages) + `refPlugins` (4, each folding its `packages/plugin-*-core` as an
     `## Internals` subsection, US-8) → 21 reference-page agents.
   - `readmePkgs` + `readmePlugins` → 25 README agents.
   - `concepts` → 4 Diátaxis agents.
   Each maps to `() => agent(templatedPrompt(unit), {label, phase, schema, effort})`.
5. **Fan-out + barrier** — `await parallel([...refWork, ...readmeWork, ...conceptWork])` runs all
   ~50 concurrently (runtime caps concurrency at ~16, so they batch). Then a single **Verify**
   agent builds the site, runs the README checker over all 26 units, tallies per-unit
   `deno doc --lint`, and scans `_site` links — the go/no-go.
6. **Model/effort routing** — reference + concepts = Opus `medium`; READMEs = Opus `low`.

## Reusing it for a new / updated package

To onboard a new package: add its name to **`refPlain`** and **`readmePkgs`** (or
`refPlugins`/`readmePlugins` for a plugin), then re-run. It generates that unit's reference page
(from `deno doc`) and a standardized README automatically, and Verify re-checks the whole census.
The per-unit prompt is templated ("read `deno.json` for the JSR name, run `deno doc --json` on each
export, write to `docs/site/reference/<u>/index.md`"), so there's no per-package handcrafting.
`check-readme-standard.ts` + `deno doc --lint` give an objective conformance bar for any new unit.

Caveats to weigh:
- **`parallel()` is a barrier** — all units finish before Verify. For a steady "one new package at a
  time" flow, call `agent()` directly or switch to `pipeline()` (no barrier) so Verify streams.
- The **Bash-absolute-path** writes are only needed because the launching session is pinned to a
  different worktree. Run the recipe from the package's own checkout and agents can use normal
  Edit/Write (relax the `COMMON` rule).
- Scope stays **docs-only** per LD-DOCS-LANE. Framework *source* changes (e.g. the fresh-ui
  `*Namespace` exports) remain a WSL Codex slice, not this workflow.

## Re-running / iterating

```
Workflow({ scriptPath: ".../docs-user-site--diataxis/workflows/g3-user-docs-fanout.js" })
# resume with cached completed agents after an edit:
Workflow({ scriptPath: "...", resumeFromRunId: "wf_910e9292-7b7" })
```

## Companion: `g3-user-docs-scaffold-pilot.js` (run this FIRST)

The fan-out above is the *second* half of the recommended lifecycle. The first half is
`g3-user-docs-scaffold-pilot.js` (run `wf_b885234c-937`), which:

1. **Scaffold** phase — stands up the Lume skeleton + Diátaxis sections + the README standard and
   its `check-readme-standard.ts` checker (two agents, `parallel()` barrier).
2. **Pilot** phase — generates the reference page **and** standardized README for **one** unit
   (`@netscript/logger`) to PROVE the `deno doc` → page pipeline end-to-end.
3. **Verify** phase — builds the site, confirms the pilot page rendered, and runs the gates.

It demonstrates the parts the fan-out assumes already exist: **staged `phase()` barriers**
(Scaffold → Pilot → Verify, each a `parallel()` that must finish before the next) and the
**prove-on-one-before-spending-tokens-on-N** discipline. The pattern for any docs effort is:
**scaffold + pilot one unit → inspect the green Verify → only then fan out.** Cheap insurance — a
broken `deno doc` mapping or Lume `location` is caught on 1 unit, not 50.

```
Workflow({ scriptPath: ".../docs-user-site--diataxis/workflows/g3-user-docs-scaffold-pilot.js" })
```
