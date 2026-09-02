# Evaluation: Slice E — unregistered `generate resource` command (#1354, PR #1954)

## Metadata

| Field          | Value                                                                              |
| -------------- | ---------------------------------------------------------------------------------- |
| Run ID         | `feat-cli-resource-slice-command--1354-e`                                          |
| Target         | `packages/cli` — `src/public/features/generate/resource/` (5 new files)            |
| Archetype      | `6 — CLI / Tooling`                                                                |
| Scope overlays | `frontend` (hosted runtime acceptance deferred to Slice G)                         |
| Evaluator      | Independent IMPL-EVAL session (Claude Fable 5.1), 2026-09-02; read-only on product |

Evaluated state: `git diff origin/main...750160fe1` on branch `feat/cli-resource-slice-command`
(merge-base `9a191bdda`). Worktree HEAD is `85e28ccde`; `git diff --stat 750160fe1 HEAD` touches only
`.llm/runs/.../implement.md` (3+/1-), so the product diff is identical. Locked plan:
`origin/feat/cli-resource-slice-plan:.llm/runs/feat-cli-resource-slice--1354/plan.md` (D1, D2, D3,
D8, multi-client seam, Slice E). This file replaces the earlier Opus 5 evaluation that assessed the
uncommitted tree at `3a794be67`; every gate below was re-run by this session.

## Process Verification

| Check                                             | Result | Evidence                                                                                                                                     |
| ------------------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Touch set is exactly the five authorized files    | PASS   | `git diff --stat origin/main...750160fe1`: 5 product files + 8 run artifacts; nothing else in `packages/`/`plugins/`                          |
| `public-command-dependencies.ts` untouched        | PASS   | `git diff origin/main...750160fe1 -- packages/cli/src/public/features/root/public-command-dependencies.ts` → 0 lines                          |
| `deno.lock` unchanged                             | PASS   | `git diff origin/main...750160fe1 -- deno.lock` → 0 lines                                                                                    |
| No carriers moved / no generated corpus delta     | PASS   | diff contains only additions (1436 insertions, 0 deletions, no renames)                                                                      |
| Command is unregistered                           | PASS   | grep for `generate-resource|GenerateResource|generateResource` outside `features/generate/resource/` → no hits; `generate-group.ts` and root dependency/tree files carry no `resource` registration |
| Drift recorded for the 6→5 file ceiling change    | PASS   | `drift.md` "serialized root dependency overlap removed" (owner directive, #1664 overlap)                                                       |
| Generator ≠ evaluator                             | PASS   | this session did not author any product file                                                                                                 |

## Static Gates

| Gate                                                                                        | Exit | Result                                                                        |
| ------------------------------------------------------------------------------------------- | ---: | ----------------------------------------------------------------------------- |
| `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/cli --ext ts,tsx` |    0 | 960 files, 8 batches, 0 failed batches, 0 diagnostics                         |
| `run-deno-test.ts -- --allow-all .../generate-resource_test.ts`                             |    0 | 3 passed, 0 failed, 0 ignored                                                 |
| `run-deno-test.ts -- --allow-all .../generate-resource-command_test.ts`                     |    0 | 9 passed, 0 failed, 0 ignored                                                 |
| `deno task arch:check`                                                                      |    0 | all roots `FAIL=0`; `cli` root `FAIL=0 WARN=60 INFO=1` (baseline, unchanged) |
| `deno task quality:gate`                                                                    |    0 | quality:scan `ok:true`, findings `[]`, 7/7 pre-existing allowances; doctrine `FAIL=0` |
| `deno task docs:readme-fences`                                                              |    0 | PASS readmes=36 fences=168 checked=73 type_errors=7 (pre-existing)            |
| `deno task docs:jsdoc-examples`                                                             |    0 | PASS checked=359 failures=0; `deferredCensus.unboundName=116` (≤116 ceiling), `typeError=14` |

Production purity: `grep "Deno\.\|console\.\|process\."` over the three non-test files → no hits.
`any` / `as unknown as` / `deno-lint-ignore` in the five files → none (the two
`as [string, ...string[]]` narrowings live in test fixtures only).

## Fitness Gates (plan conformance)

### D1 / D8 — layering

- `generate-resource-command.ts` (presentation, Cliffy) composes `generate-resource.ts`
  (application orchestration) through `GenerateResourceDependencies`; the use case imports only
  `kernel/application/resource-slice/*`, `kernel/ports/*`, and `@std/path`. No presentation import
  enters the application file. PASS.
- Nonzero exit is a typed `ResourceSliceConflictError extends CliExitError`
  (`generate-resource-command.ts:24-32`) thrown from the action (`:69`); no `Deno.exit` in the
  feature layer. PASS.
- Output goes through injected `printText`/`printJson` defaulting to the presentation
  `outputText`/`outputJson`. PASS.

### D2 / multi-client seam

- `--client` is forwarded unchanged: `toGenerateResourceRequest` copies `input.client`
  (`generate-resource-input.ts:37`), and `executeGenerateResource` calls
  `dependencies.resolveClient(appRoot, request.client)` (`generate-resource.ts:120`). No discovery,
  no default, no `?? first` fallback exists in product code. Proven by
  `command forwards the explicit client selector unchanged and emits text`
  (`generate-resource-command_test.ts:57`) and by the `client` rejection case at `:188`
  (resolver rejection → zero writes). The fail-closed ambiguity rule itself belongs to Slice A's
  `client-selector.ts` (#1950), which plugs into this `ResourceClientResolver` seam. PASS.
- Static absolute routes: the command does no route parsing; `normalizeResourceSliceInput` →
  `normalizeStaticRoute` (`resource-slice-contract.ts:302-309`) rejects non-`/`-prefixed,
  trailing-slash, `//`, and any `? # : [ ] *` syntax. Command-level proof: the `input` case at
  `generate-resource-command_test.ts:188` (`--route orders` → rejection, zero writes); kernel proof
  `rejects empty resource normalization and non-static route syntax`
  (`resource-slice-contract_test.ts:50`). PASS.

### D3 — proof cases exercised through the command

| D3 proof                                                                                   | Test (file:line)                                                                                       | Status |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ | ------ |
| 1. every pre-apply failure leaves the app byte-identical (input / client / procedure / Fresh staging / shared transform) | `invalid input, client, procedure, Fresh staging, and shared transform never mutate the app` — `generate-resource-command_test.ts:188` (5 cases; `getFiles()` equals snapshot and `writes()===0` per case) | PROVEN |
| 2. default unresolved conflict reports every path + manual action, exit non-zero, zero writes | `conflict output is emitted before a typed nonzero exit error` — `:173` (unowned foreign page; `CONFLICT routes/orders/index.tsx`, `exitCode 1`, `writes()===0`) | PROVEN |
| 3. identical second run exits 0, every output skipped, zero bytes written                  | `identical second command run exits zero and performs zero writes` — `:85`                              | PROVEN |
| 4. later additive option selects, renders, dry-runs against an edited base, names move/rename | `later option dry-run reports an edited base and performs no writes` — `:97` (`--form --dry-run`; `WRITE ...orders-form` reported, `owned-edited` + `Move or rename`, files equal snapshot, `writes()===0`, `exitCode 1`) | PROVEN |
| 5. valid marker + mismatched body hash is `owned-edited`, never replaced incl. `--force`  | `force leaves unowned and owned-edited targets byte-identical` — `:129` (PAGE edited after generation, `--force`; conflict list = {PAGE, FORM}; files equal snapshot) | PROVEN |
| 6. positively owned divergent leaf replaced only under `--force`, exactly one write        | `force replaces exactly one positively owned divergent leaf` — `:156` (`markOwnedResourceSliceLeaf` recomputed marker; `writes()===1`; one `WRITE` line; content restored) | PROVEN |
| 7. unmarked/foreign content is unowned, conflicts, never replaced incl. `--force`         | `:129` (FORM = `// app-owned form`) and `:173` (foreign page, default run)                              | PROVEN |

Ordering (select → render → conflict → write) is visible in `executeGenerateResource`
(`generate-resource.ts:111-178`): resolve → `readPriorVariants` (marker metadata only) → union of
variants → `planResourceSlice` → `renderResourceSlice` → `stage` → `transformSharedSources` →
`readCurrent` → `reconcileResourceSlice` → early return for `dry-run`/`conflict` → apply loop. The
apply loop is the only `fs.writeFile` site and is reachable only when `status === 'ready'`. Use-case
level ordering is also asserted by `resource use case resolves, stages, preflights, then applies
deterministic paths` (`generate-resource_test.ts:41`, event trace) and additive union by
`resource use case carries prior marker options into a later request` (`:78`).

Not proven through the command (see Findings): a **conflict-free** `--dry-run` (status `dry-run`,
exit 0, zero writes on a ready plan). Structurally guaranteed by the `status !== 'ready'` early
return since the reconciler never emits an `applyPlan` under `dryRun`
(`reconcile-resource-slice.ts:96-101`), but no test at the command or use-case level asserts it.

## Runtime Gates

Not applicable to this slice: the command is unregistered and the hosted/Aspire acceptance is
owned by Slice G per the locked plan. No `e2e:cli`, Aspire, Docker, or browser execution attempted.

## Consumer Gates

`docs:readme-fences` and `docs:jsdoc-examples` re-run green (table above); the slice adds no public
export, README, or JSDoc example, and `unboundName` stays at the 116 ceiling.

## Anti-Pattern Check

| Pattern                                   | Result                                                                                   |
| ----------------------------------------- | ---------------------------------------------------------------------------------------- |
| Second client selector / auto-pick        | absent — resolver seam only                                                              |
| Second template authority                 | absent — `loadResourceSliceTemplateAssets` + `renderResourceSlice` reused               |
| `Deno.*` / console in application code    | absent                                                                                   |
| Process exit outside `bin/`               | absent; typed `CliExitError` subclass                                                    |
| `any` / unsafe casts / lint-ignore        | absent in product; quality:scan findings `[]`                                            |
| Journal / lock / rollback / `--keep|--replace|--abort|--recover` | absent (narrowed D3 honored)                                        |
| Per-leaf disposition prompts              | absent; report + remedy text only                                                        |

## Arch-Debt Delta

None added. No new allowance, lint-ignore, or `arch:check` warning introduced (cli root stays at
`WARN=60`).

## Findings

### LOW-1 — conflict-free `--dry-run` not proven through the command

`generate-resource-command_test.ts:97` exercises `--dry-run` only together with an `owned-edited`
conflict, where zero writes would hold even without `--dry-run`. D3 step 6 ("emit the complete
candidate/conflict report and write no application targets") is otherwise unproven for the
happy-path case (fresh app, `--dry-run` → `status: 'dry-run'`, `exitCode: 0`, every path reported
as `write`, `writes()===0`). The implementation is structurally correct
(`generate-resource.ts:164-173` returns before the apply loop for any non-`ready` status), so this
is a coverage gap, not a behavior defect. Suggested fix: one additional command test; can ride with
Slice F.

### LOW-2 — pre-apply failures outside the reconciler are untyped `Error`s

`generate-resource.ts:119` (no app root), `:162` (`preflight-failed`), `:219` (router shape
conflict), `:230` (state shape conflict) throw plain `Error` rather than a `CliExitError` subclass
(`UsageError`/`ConfigError`). The reconcile conflict path is correctly typed
(`ResourceSliceConflictError`). Behavior is fail-closed with zero writes in every case (proven at
`generate-resource-command_test.ts:188`), and the pattern matches the pre-existing Slice C kernel
validation, so exit-code mapping falls to the binary's generic handler. Recommend typing these when
Slice F wires the real resolvers and exit mapping.

### NIT-1 — validation order differs slightly from D3 step 1

D3 step 1 lists "parse and validate all flags" before app/client/procedure resolution;
`executeGenerateResource` resolves app/client/procedure (`:115-125`) before
`normalizeResourceSliceInput` (`:126`) validates resource/route. No write-safety impact (both
precede any staging), but an invalid `--route` currently costs a client/procedure resolution first.

### NIT-2 — `templates: Parameters<typeof renderResourceSlice>[1]`

`generate-resource.ts:72` derives the templates type positionally instead of naming the exported
asset type; a named type would make the dependency bundle self-describing for Slice F.

## Lessons for Promotion

- A `--dry-run` proof that only covers the conflicting case does not isolate the flag's own
  guarantee; pair it with a ready-plan dry-run assertion. Candidate for the D3 proof checklist.

## Verdict

PASS_IMPL_WITH_FINDINGS

Slice E lands exactly the five authorized files, leaves the shared dependency root, the command
tree, `deno.lock`, and carriers untouched, keeps the command unregistered, forwards `--client`
unchanged through an injected resolver seam with no auto-pick, and proves all seven D3 cases through
the command with byte-identical snapshots and write counters. All seven requested gates exit 0.
The two LOW findings (missing happy-path dry-run test; untyped non-reconciler pre-apply errors) do
not block merge and can be absorbed by Slice F.
