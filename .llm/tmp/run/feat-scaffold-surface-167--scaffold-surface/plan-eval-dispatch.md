use harness

You are the **PLAN-EVAL** evaluator (separate session) for the unified plugin-command-contract
re-architecture on branch `feat/scaffold-surface-167` (PR #172, issue #167, task #157). This is the
hard Plan-Gate: **no implementation may begin until this returns `PASS`.** Do not implement anything.
Read, evaluate against the plan-gate, and emit a verdict.

## SKILL

Activate these repo skills before evaluating (each applies):

- `netscript-harness` — you are running PLAN-EVAL; follow `evaluator/plan-protocol.md` +
  `gates/plan-gate.md` and the evaluator-separation contract. This is the controlling skill.
- `netscript-doctrine` — the plan reshapes `packages/plugin`, `packages/cli`, and all 5 `plugins/*`;
  verify archetype selection (5 Plugin / 6 CLI), axioms (esp. **A4** base-classes-stub-only, **A5**
  composition-over-inheritance, **A7** @std/Web-first, **A11** name-extension-axes), the
  **no-cross-package-implementation-inheritance** rule (doctrine 03 L162-175), and layering
  (`domain→ports→application→adapters→presentation`; CLI→plugin direction;
  `@netscript/plugin/adapter` must NOT import `@netscript/cli`).
- `jsr-audit` — the new `./adapter` export and every touched package must stay JSR-publishable
  (no slow types, `@module` + symbol JSDoc, clean publish file list); confirm the plan keeps this.
- `netscript-deno-toolchain` — the S8 `plugin verify` tool must WRAP native `deno doc --lint` /
  `deno publish --dry-run` + repo wrappers, not reinvent linters; confirm the plan does so.
- `netscript-tools` — gate-evidence rules + scoped check/lint/fmt wrappers the slices must use.
- `netscript-cli` — CLI verb/dispatch surface (`FRAMEWORK_VERBS`, `deno x -A jsr:<pkg>/cli <verb>`).
- `openhands-handoff` — you are the OpenHands evaluator; write the summary artifact, output to the
  PR comment.

## What to read

On the checked-out PR branch:

1. `.llm/tmp/run/feat-scaffold-surface-167--scaffold-surface/research.md` (esp. the
   `## RE-ARCHITECTURE v2` section: the 3-overlapping-mechanisms + 3-forked-item-bases duplication
   map, the `FRAMEWORK_VERBS` discovery, the Vite grounding, the doctrine reconciliation, and the
   locked decisions D-UNIFY/D-MANDATORY/D-OPTIONAL/D-ONE-ITEM/D-RENAME/D-OWN).
2. `.llm/tmp/run/feat-scaffold-surface-167--scaffold-surface/plan.md` (the full v2 plan: the
   `@netscript/plugin/adapter` `NetScriptPlugin` contract + seams, the ONE `ItemScaffolder`, the
   `PluginCommandRunner` that fixes the `PluginCli.run()` A4 violation, the `createPluginAdapter`
   factory, slices S1–S9, the maintainer-tooling section, and the Definition of Done).
3. `.llm/tmp/run/feat-scaffold-surface-167--scaffold-surface/context-pack.md` (state + next actions).
4. `.llm/harness/gates/plan-gate.md` and `.llm/harness/evaluator/plan-protocol.md` (your protocol).
5. Spot-check ground truth against current code: `packages/plugin/src/cli/*` (the bones —
   `PluginCli.run()`, `PluginItemScaffolder`, `mountPluginCli`, `routeVerb`),
   `packages/cli/.../dispatch/dispatch-plugin-verb.ts` (`FRAMEWORK_VERBS`),
   `packages/cli/.../add/add-plugin.ts` (the host config wiring the plan KEEPS vs the
   `renderPlugin()` full-source branch the plan DELETES). Use `deno doc` to inspect public surface.

## How to judge (emit PASS or FAIL_PLAN)

Apply `gates/plan-gate.md`. Scrutinize specifically — the plan PASSES only if all hold, else
`FAIL_PLAN` with precise, file/line-anchored, actionable findings:

1. **One contract, no duplication.** The plan genuinely collapses the THREE overlapping mechanisms
   (`renderPlugin()` full-source copy, the v1 thin-scaffold pass, the `src/scaffolding/`
   string-concatenation generator) and the THREE forked base-less item-scaffolder contracts into ONE
   core-owned `ItemScaffolder` + ONE `NetScriptPlugin` contract. No fourth mechanism is introduced.
2. **Doctrine-legal extension.** Plugins supply a typed contract object via `createPluginAdapter`
   (composition + seams, Vite-style), with NO `plugins/*` adapter `extends`-ing a base from
   `@netscript/plugin` (doctrine 03). Shared mandatory-command logic lives WITHIN `@netscript/plugin`.
   `PluginCli.run()` orchestration is moved to a `PluginCommandRunner` so the spine stays A4 stub-only.
3. **Layering + JSR.** `@netscript/plugin/adapter` does not import `@netscript/cli`; the new export is
   JSR-publishable (explicit return types, `@module`/symbol docs, clean file list, dry-run green).
4. **No source leak.** A plugin stays a dependency: no plugin TS source (`services/`, `router`,
   `contracts`, `src/runtime`, `src/aspire`, `bin/`) is stringified into userland; only userland glue
   + the allowed Prisma schema are emitted. The negative e2e (S5) actually proves this.
5. **Item generator soundness.** The ONE `ItemScaffolder` uses type-checked stub source + typed
   identifier substitution — NEVER string concatenation, NEVER `.template` files — and drives BOTH
   `install` (starter set) and `add <resource>` (user id) from the SAME path.
6. **Command taxonomy + rename.** Mandatory install/doctor/info/update/remove (shared core logic,
   plugin seams) + optional `add`/`generate <resource>`; the breaking rename/namespace
   (`plugin install <kind>` / `<kind> add <resource>` / `<kind> generate <resource>`) is coherent and
   the CLI dispatch rewire (S4) keeps the host-side config wiring + `copyPluginSchemasToRootDb`.
7. **Author tooling (S8/S9) is real and dogfooded.** `plugin verify` composes native/repo tools
   (`deno doc --lint`, `deno publish --dry-run`, manifest schema, `arch:check`, contract-completeness)
   into one report — no bespoke linters; `plugin new` emits a conforming skeleton on the SAME item
   generator that passes `plugin verify` + dry-run with zero edits.
8. **Gates-as-actual-gates + DoD.** `arch:check`/`plugins:check` extended over `packages/plugin` + 5
   plugins and made merge-blocking; the slice plan is correctly sequenced, each slice independently
   gated/committed/pushed, zero dead/duplicate code at the end, no new casts beyond the 2 sanctioned,
   no `any`, no `deno.lock` churn, forward-only (no force-push).
9. **Re-baseline.** The plan reflects current `main`/branch reality, not a stale carried-in plan.

## Output

Write your verdict to
`.llm/tmp/run/feat-scaffold-surface-167--scaffold-surface/plan-eval.md` (record evaluator model,
run id, verdict, and each finding). Emit a single clear **`PASS`** or **`FAIL_PLAN`** with a
prioritized findings list. Post the summary to the PR #172 comment. Do not edit source or plan files;
you are the evaluator, not the generator.
