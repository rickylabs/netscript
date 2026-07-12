# Evaluation: `packages/plugin-workers-core` type-quality elimination (#751)

Allowed result values: `PASS`, `FAIL`, `N/A`, `NOT_RUN`. This is the final **IMPL-EVAL** pass.

## Metadata

| Field          | Value                                                                         |
| -------------- | ----------------------------------------------------------------------------- |
| Run ID         | `quality-q751-workers-core--codex`                                            |
| Target         | `packages/plugin-workers-core`                                                |
| Archetype      | `3 — Runtime / Behavior`                                                       |
| Scope overlays | `none`                                                                         |
| Evaluator      | Anthropic Opus 4.8, high effort — separate session from the GPT-5.6 Sol implementer — 2026-07-12 |
| Base / HEAD    | base `3b3d615b` → HEAD `d8f0e894`                                              |

Independent IMPL-EVAL. Not the implementer, not the PLAN-EVAL session (PLAN-EVAL was Opus session
`26bd7bb6`; slice reviews were Opus sessions `c2028493`/`c73951cb`/`d2768a42`). All probes below were
re-run by this session against committed HEAD `d8f0e894`; the only file this session writes is this
`evaluate.md`. No source, commit, push, PR, or other run artifact was modified.

## Process Verification

| Check                                   | Result | Evidence |
| --------------------------------------- | ------ | -------- |
| Plan-Gate passed before implementation  | PASS   | `plan-eval.md` = `PASS` (Opus session `26bd7bb6`), dated before the three slice commits. |
| Design section exists in worklog        | PASS   | `worklog.md` §Design (Public Surface / Domain Vocabulary / Ports / Constants + 3-slice Commit table). |
| Commit slices match design plan         | PASS   | `ac532d94` Slice 1 (schema/contract/stream), `4408c4e3` Slice 2 (builder typestate), `d8f0e894` Slice 3 (runtime/fixtures). Order matches the design table; 3 slices, well under 30. |
| Each slice has a passing gate + Tier-A review | PASS | Three opposite-family slice reviews (`slice-{1,2,3}-review.md`), each with a real `FAIL_FIX`→`PASS` remediation loop (fmt; vacuous `build()` guard; doc-lint regression). No lane self-certified. |
| Generator ≠ evaluator (session separation) | PASS | Implementer GPT-5.6 Sol; all reviews + this IMPL-EVAL are Opus. Recorded in `supervisor.md`/`drift.md`. |
| Commit trail (PR override)              | PASS   | Owner prohibited PRs; `drift.md` logs the override; local artifacts + branch commits are the authorized trail. |
| SKILL chapter in briefs (rule 13)       | PASS (minor nit) | `slice-2`/`slice-3` review prompts lack a formal `## SKILL` heading but name `netscript-harness/SKILL.md` inline; reviews demonstrably ran `quality:scan`/`arch:check`/`doc:lint`. Heading-format nit only, non-blocking. |
| Close-gate / release-gate               | N/A    | No issue closed via PR, no `Closes #N`, no release cut. Non-release run. |

## Static Gates (all independently re-run at HEAD `d8f0e894`)

| Gate            | Command | Result | Evidence |
| --------------- | ------- | ------ | -------- |
| Scanner (exact) | `scan-code-quality.ts --root packages/plugin-workers-core --max-allow 5` | PASS | `{"ok":true,...,"findings":[],"allowCount":0,"allowances":[]}` — 0 findings, **0 allowances** (target, not just ceiling 5). |
| Scoped check    | `run-deno-check.ts --root … --ext ts,tsx` | PASS | 110 files, 1 batch, `failedBatches:0`, `totalOccurrences:0`. |
| Scoped lint     | `run-deno-lint.ts --root … --ext ts,tsx` | PASS | `exitCode:0`, 0 occurrences; no new `deno-lint-ignore`. |
| Scoped fmt      | `run-deno-fmt.ts --root … --ext ts,tsx` | PASS | `filesSelected:110, failedBatches:0, findings:0`. |
| Doc lint        | `doc:lint --root packages/plugin-workers-core` | PASS / RECORDED | Combined `privateTypeRef:13`, `missingJSDoc:0`; `runtime/mod.ts`=0, `registry/mod.ts`=0 (each independently `deno doc --lint` exit 0). See Arch-Debt Delta. |
| Publish dry-run | `deno publish --dry-run --allow-dirty` | PASS | `Success — Dry run complete`; no slow types (isolated-declarations bar met). |
| Export-map diff | `git diff --stat 3b3d615b HEAD -- …/deno.json` | PASS | Empty — no export-map key added/removed. |
| Lock hygiene    | `git diff --exit-code 3b3d615b -- deno.lock` | PASS | No churn (exit 0). |

## Loophole-token audit (owner contract core)

| Check | Result | Evidence |
| ----- | ------ | -------- |
| Tokens **added** by the diff (`quality-allow`, `deno-lint-ignore`, `as unknown as`, `as never`, `@ts-ignore`, `@ts-expect-error`) | PASS — **NONE** | `git diff 3b3d615b HEAD` added-line grep returns 0 matches for all six tokens. |
| Residual tokens in tree | ACCEPTABLE | Exactly 1 `as unknown as` (`tests/streams/workers-streams_test.ts:59`) + 1 `as never` (`src/stores/kv-worker-idempotency-store_test.ts:76`). Both are in `_test.ts` files (excluded from scanner scope — `scan-code-quality.ts:85`), both present **verbatim at base** `3b3d615b`, both untouched by the diff. |
| Reduction achieved | STRONG | Base had 50 `as unknown as` + 3 `as never` in the package; HEAD has 1 + 1, both pre-existing test scaffolding. `quality-allow`/`deno-lint-ignore` = 0. |

The rejected prior attempt reached scanner-green with **14** `quality-allow` suppressions
(`research.md` re-derives commit `006c859a`); this run reaches scanner-green with **0** allowances
and **0** added casts. There are **no allowance survivors to explain** — the "explain every survivor"
obligation is vacuously satisfied.

## Substantive typing verification (owner contract)

| Claim | Result | Independent evidence |
| ----- | ------ | -------------------- |
| Boundary types reflect schemas | PASS | Slice-1 review verified Zod `z.input`/`z.output` derivation (`WorkerExecution`/`WorkerJob` = `Readonly<z.output<…>>`, entity `parse(TInput):TOutput`); publish dry-run green ⇒ isolated declarations honored. |
| Builder typestate immutable | PASS | Each builder holds `readonly #data`; grep finds **no** `this as` self-rebrand cast in `builders/*.ts`; scanner 0 across `builders/*`. |
| Builder typestate enforced | PASS (own probe) | Probe A: all 3 ready-state `build()` compile clean **and** all 3 initial-state `build()` `@ts-expect-error` directives are consumed (exit 0). Probe B (negative control): `@ts-expect-error` on a *valid* ready build correctly fails `TS2578` — so Probe A's clean pass is meaningful, not a false green. Enforced on job/task/workflow. |
| Runtime/custom ports remain structural | PASS | `composition-root.ts` has **zero** value casts (only an `import type … as` alias); ports are canonical (`Pick<TaskExecutor,…>`, `RegistryJobStoragePort`, `Pick<ShutdownManager,…> & {id}`); concrete `readonly id = 'workflow-executor'` / `'shutdown-manager'` added honestly per D5. |
| Behavior / export compatibility reasonable | PASS | Export map unchanged; 25 package tests + 5 co-located KV tests green; runtime `build()` throw preserved (per slice reviews); `runtime`/`registry` subpaths gained additive re-exports only (documented carry-forward, no export-map change). |

## Fitness Gates

| Gate | Result | Evidence |
| ---- | ------ | -------- |
| `arch:check` (F-1–F-19 driver) | PASS | Exit 0; every package `FAIL=0`. `plugin-workers-core` = `FAIL=0 WARN=5 INFO=2` — **identical warning set to base** `3b3d615b` (size warnings on `job-spec.ts`/`task.ts`/`contract-definition.ts` + two F-16 folder-cardinality). `task.ts` grew 382→426 and `contract-definition.ts` 548→574 within already-warned files; no new violation class introduced. Matches plan's "PASS or unchanged pre-existing evidence." |
| Slice-review gate | PASS | Three substantive opposite-family reviews before each sign-off; documented remediation loops. |

## Runtime Gates

| Gate | Result | Evidence |
| ---- | ------ | -------- |
| Package tests (`deno task test`) | PASS | 25 passed / 0 failed (contract soundness, memory-worker handler exec, dispatcher import-order, workflow/shutdown, streams). |
| Co-located KV tests | PASS | `deno test src/stores/kv-worker-idempotency-store_test.ts` → 5 passed / 0 failed (outside the `tests/` glob; run explicitly per PLAN-EVAL carry-forward #2). |

## Consumer Gates

| Consumer | Result | Evidence |
| -------- | ------ | -------- |
| Intra-package + published subpaths | PASS | 110-file scoped check clean; publish dry-run green; `runtime`/`registry`/`builders` subpath refinements are additive/narrowing with no in-repo consumer break. |

## Anti-Pattern Check

| AP | Status | Evidence |
| -- | ------ | -------- |
| AP-3 (parallel god/structural facades) | CLEAR | Duplicate builder/runtime/port facades collapsed onto canonical domain/upstream types; scanner 0, check clean. |
| AP-8/AP-11/AP-13/AP-20/AP-22/AP-25 | CLEAR / N/A | No container, no new globals, no console in published code, no lib override, no new sub-barrel, no new edge side effects (type-only slice). |
| AP-19 (runtime permissions / sandbox) | N/A | Untouched; not claimed closed. |

## Arch-Debt Delta

| Metric | Count | Evidence |
| ------ | ----- | -------- |
| New entries | 0 | No new `arch-debt.md` entry required; no `any`/casting/doctrine-FAIL introduced. |
| Resolved entries | 0 | None claimed closed. |
| Deepened violations | 0 against the contract's frame | Doc private-type-ref: **base `3b3d615b` = 4 → pre-Slice-3 `4408c4e3` = 24 → HEAD = 13** (all three independently measured). The named critical surfaces `runtime`/`registry` are **0** (were 0 at base and pre-Slice-3). The pre-existing oRPC **contract**-surface debt (`workers-contract-structural-server-export`) is **unchanged at 4** — not deepened. |
| Unrecorded violations | 0 blocking | See observation below. |

**Doc-lint transparency note (non-blocking).** Versus the *literal* base `3b3d615b` (4), HEAD (13) is
+9, entirely in `streams/` (`schema.ts` 8 + `producer.ts` 1) from Slice-1's plan-mandated (D4) adoption
of the upstream `StateSchema`/`DurableStreamProducer` generics — the three refs are public stream types
pointing at sibling local aliases (`WorkerStreamEntities`, `StreamStateDefinition`, `StateSchema`). The
owner's re-dispatch contract explicitly frames acceptance as "pre-Slice-3 24, final 13; runtime/registry
0," all three of which I confirmed, so this is within the accepted envelope. It is a low-severity
doc-completeness (JSR) item, **not** a doctrine/casting violation and **not** publish-blocking
(dry-run green); no `arch-debt` entry is compelled. Recommended (non-blocking) follow-up: export those
three `streams` local types to drive the package back toward the base 4.

## Findings

| Severity | Finding | Evidence | Required action |
| -------- | ------- | -------- | --------------- |
| low | `streams/` public types reference 9 private sibling aliases (doc-lint), a +9 vs the literal base 4 (within owner-accepted 13; below pre-Slice-3 24). | `deno doc --lint src/streams/mod.ts` | Optional follow-up: re-export the 3 local stream types. Non-blocking. |
| low | `slice-2`/`slice-3` review prompts + this IMPL-EVAL prompt omit a formal `## SKILL` heading (skills named inline). | run-dir prompt files | Cosmetic; note for future briefs. Non-blocking. |

No high- or medium-severity finding survived verification.

## Lessons for Promotion

| Lesson | Pattern | Applies to | Confidence |
| ------ | ------- | ---------- | ---------- |
| Adopting upstream generics can trade `as unknown as` casts for `private-type-ref` doc-lint on the adopting subpath; re-export the referenced types in the same slice. | Type-erasure elimination | Archetype 3 (runtime), any package consuming upstream generic ports | medium |

## Verdict

| Field | Value |
| ----- | ----- |
| Verdict | **PASS** |
| Rationale | Every element of the owner contract is independently verified at HEAD `d8f0e894`: proper typing eliminates **all** code-quality findings (scanner `ok:true`, 0 findings, **0 allowances** under `--max-allow 5`); the diff adds **zero** `quality-allow`/`deno-lint-ignore`/`as unknown as`/`as never` loopholes (the 2 residual test-file casts are pre-existing and outside scanner scope; casts cut from 50+3 to 1+1); boundary types derive from Zod schemas, builder typestate is immutable and enforced (own `@ts-expect-error` probe with negative control), and runtime/custom ports are structural with honest concrete identity fields; scoped check/lint/fmt, 25 package + 5 KV tests, publish dry-run, `arch:check` (FAIL=0, warning set unchanged from base), and lock hygiene are all green; doc private-ref debt is **not deepened** against the accepted frame (base 4 → pre-Slice-3 24 → final 13, runtime/registry 0, contract surface unchanged at 4); and the artifacts truthfully record the rejected prior 14 allowances versus the final 0 with no survivor to explain. The two surviving findings are low-severity, non-blocking, and within the owner-accepted envelope. |
