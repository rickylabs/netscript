use harness

## SKILL

- `netscript-harness` — run dir, worklog/drift, RED→GREEN discipline, separate-session eval.
- `netscript-cli` — `init` / scaffold writers, generated app `deno.json` and workspace catalog contract.
- `deno-fresh` — Fresh 2 + Vite production build and its Deno import-map resolver.
- `netscript-doctrine` — `packages/cli` archetype gates before changing product code.
- `netscript-deno-toolchain` — catalog law: `catalog:` is npm-only / workspace-resolver-only.
- `netscript-pr` — PR body/labels/milestone; `Closes #1971` only when acceptance is fully evidenced.
- `netscript-tools` — scoped validation wrappers; durable gate receipts via `.llm/tools/gates/run-gate.ts`.

# Implement brief — #1971 scaffold: production `deno task build` fails on `catalog:` zod specifier (P0)

Branch `fix/scaffold-build-catalog-zod` (from `main` `574e9ce57`), worktree `007-leaf-1971`.
Generator: Codex `gpt-5.6-sol` · high. Evaluator is a separate opposite-family session (not you).
Run dir: `.llm/runs/fix-scaffold-build-catalog-zod--0.0.7/`. Issue #1971 holds the canonical
reproduction and acceptance — read it first (`gh issue view 1971`).

## Situation (verified raw evidence in #1971)

- A local-source scaffold (`netscript-dev init … --db sqlite --service --service-name users`) fails
  `deno task build` in `apps/<name>-web` **immediately after init** (exit 1) and again after
  `db:generate`. Error: `[vite:load-fallback] Could not load catalog: (imported by
  routes/examples/users/(_lib)/route-contract.ts): ENOENT … open 'catalog:'`.
- The generated app import map emits `"zod": "catalog:"` — origin
  `packages/cli/src/kernel/constants/scaffold/scaffold-app-catalog.ts:58` (`SCAFFOLD_APP_IMPORTS`),
  emitted by `packages/cli/src/kernel/adapters/templates/app/generate-app-deno-json.ts`; the
  workspace root catalog is `SCAFFOLD_WORKSPACE_CATALOG` via
  `packages/cli/src/kernel/templates/workspace/deno-json.ts`.
- The hosted `scaffold.design-production-exclusion` gate in PR #1945 (now correctly placed after
  `DATABASE_CODEGEN`) is red for exactly this reason; #1945 stacks behind this fix. `scaffold.runtime`
  never runs a production build, which is why this shipped unnoticed.

## Task (acceptance mirrors #1971)

1. **Reproduce** exactly per the issue's shell block (use `.llm/tmp/` scratch, not the worktree
   tree). Record exit codes and the raw Vite error in `worklog.md`. Also check whether other
   `catalog:` app-import entries (not only `zod`) are reachable from the production route graph.
2. **Determine the contract**: why does Fresh's Vite plugin resolve workspace-member `catalog:`
   entries for dev/`deno check` but not for `deno task build`? Decide between (a) emitting the
   concrete `npm:zod@<catalog version>` specifier in the app import map (the root catalog keeps the
   version authority — do not duplicate a second version source), (b) a resolver-level fix if the
   Fresh/Vite integration is ours, or (c) another doctrine-compliant option. Record the decision and
   rejected alternatives in `plan.md` before source edits (bounded PLAN-EVAL: N/A is acceptable if
   the contract is fully determined by the reproduction; say so in the worklog).
3. **RED**: a deterministic regression in `packages/cli` that fails before the repair — preferred: a
   scaffold-output unit test asserting the emitted app `deno.json` import map contains no
   `catalog:` value for a specifier that a production build must resolve (or the equivalent
   contract for your chosen option). One commit, raw failing output in the worklog.
4. **GREEN**: the product fix. Update the scaffold writer tests, `check:assets-barrel` /
   generated carriers if templates changed, and the scaffold snapshot/golden tests. Then prove the
   consumer path locally: repeat the issue's shell block — `deno task build` must exit 0 both
   immediately after init and after `db:generate`. Raw output in the worklog.
5. Scoped gates at the exact head (below); PR with `Closes #1971`, labels
   `type:fix area:cli area:fresh priority:p0 gate:e2e orchestrator:fixes status:impl ci:full`,
   milestone `0.0.7`, non-draft as soon as RED+GREEN are pushed so hosted tiers run. Post a phase
   summary comment; leave DoD boxes that need hosted/eval evidence unticked and say so. Note in the
   PR body that #1945 is the gate that will lock this behaviour post-merge.

## Ceiling

`packages/cli/**` (src, assets/templates, tests, e2e unit tests) and the run dir. No `deno.json`
root/catalog edits, no `deno.lock` churn, no `.github/` changes, no release refs, no changes to
`packages/fresh*` unless step 2 proves the resolver is ours (then stop and report `BLOCKED:` with
the evidence rather than widening scope). Never run the hosted scaffold-runtime suite locally (no
runtime lease); the scaffold + `deno task build` consumer proof in `.llm/tmp/` is required and fine.
Do not commit anything under `.llm/tmp/`.

## Local gates before each push

- `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/cli --ext ts,tsx`
- `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all <changed test paths>`
- `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/cli --ext ts,tsx`
- `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/cli --ext ts,tsx`
- `deno task check:assets-barrel` (if any template/asset changed) and `deno task quality:gate`
- `deno task check` (repo-wide) before the final push.

Report each push as `HEAD <sha>` with exit codes. Stop for the separate IMPL-EVAL; never merge.
