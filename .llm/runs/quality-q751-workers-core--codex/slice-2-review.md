# Slice 2 Review — quality-q751-workers-core--codex

- Reviewer session: Anthropic Opus 4.8, high effort (Tier-A supervisor slice-review gate; separate
  from the GPT-5.6 Sol implementer recorded in `supervisor.md`).
- Date: 2026-07-12
- Scope: Slice 2 = uncommitted working-tree changes since `ac532d94` to
  `src/builders/builder-types.ts`, `src/builders/job-builder.ts`, `src/builders/task-builder.ts`,
  `src/builders/workflow-builder.ts`, `src/public/root.ts`.
- Nature: substantive pre-commit slice review of GPT-authored implementation (not PLAN-EVAL, not
  final IMPL-EVAL). No source edited; the sole write this session is this file. Owner prohibited PRs.

## Verdict

`PASS` (corrected 2026-07-12 — see "Correction recheck" below)

> **Original verdict: `FAIL_FIX`** on one blocking defect (F1 — vacuous `build()` typestate guard).
> The implementer applied the exact proposed fix; the recheck below reproduces the guard as now
> having teeth on both surfaces, with all gates still green. **F1 is RESOLVED; verdict flips to
> `PASS`.**

The slice is strong on its headline goals — **immutability is genuine, every builder `as unknown as`
cast is removed, canonical domain types replace the duplicate builder shapes, and all automated gates
(check/lint/fmt/scanner/tests) are green.** The sole blocker (F1) has been corrected: `build()` now
hard-rejects an unconfigured (`'initial'`) builder on both the `.` root and `./builders` surfaces,
matching the working `payload` guard pattern. The two non-blocking carry-forwards (the `./builders`
definition-type widening and the Slice-3-owned findings) remain for IMPL-EVAL.

## Evidence summary

| Gate (Slice 2 scope) | Result | Evidence |
| --- | --- | --- |
| Scanner (`scan-code-quality.ts --root … --max-allow 5`) | PASS for Slice 2 | All **19** prior builder+root findings (16 builder + 3 root `as unknown as`) are gone; 0 findings across `builders/*` and `public/root.ts`. Remaining 8 are Slice-3 files (`runtime/composition-root.ts`, `testing/job-fixtures.ts`). `allowCount:0`. |
| Scoped check (`run-deno-check.ts --root … --ext ts,tsx`) | PASS | 110 files, `totalOccurrences:0`, 0 failed batches. |
| Scoped lint | PASS | `exitCode:0`, 0 occurrences; no new `deno-lint-ignore`. |
| Scoped fmt | PASS | `findings:0, failedBatches:0` (this slice arrived already formatted). |
| Package tests (`deno task test`) | PASS | 25 passed / 0 failed (incl. contract-soundness, memory-worker handler execution, `createTestWorkersRuntime`). |
| Typestate probe (build guard) | **FAIL → PASS (corrected)** | Was: `defineJob('j').build()` etc. compiled with no error (F1). Now: all three initial-state `build()` calls are rejected on both surfaces — see Correction recheck. |
| Typestate probe (payload guard) | PASS | `defineJob('j').handler(...).payload()` correctly rejected: `TS2684 … 'this' … not assignable to method's 'this' of type 'never'`. Still holds post-correction. |

## Substantive verification

### 1. True immutable typestate — CONFIRMED (construction), with one gating gap (F1)
- **Immutability is real.** `JobBuilderImpl` / `TaskBuilderImpl` / `WorkflowBuilderImpl` each hold a
  single `readonly #data`, and **every** method returns `new …Impl(...)` with copied state — no
  `this as unknown as …` self-rebrand anywhere (the 16 builder casts the scanner flagged during the
  Slice-1 review are all gone).
- **Transitions reparameterize correctly.** `entrypoint()` → `'entrypoint-set'`, `handler<NP,NR>()`
  → `'handler-set', NP, NR` (drops the prior handler via destructuring, then sets the new one),
  `payload<NP>()` → new `…, NP, …` instance. Each returns a freshly-typed instance, not a mutated
  one.
- **`payload()` typestate is genuinely enforced.** The `this: TConfigured extends 'handler-set' ?
  never : …Builder<…>` guard hard-rejects `.handler(...).payload()` (verified: `TS2684`). This is a
  real improvement — the pre-slice `payload()` had no guard at all.
- **`build()` typestate is NOT enforced — see F1.**

### 2. Handler / payload soundness — SOUND
Handler signatures now alias the canonical domain handler types (`DomainJobHandler`,
`DomainTaskHandler`); `payload()` after `handler()` is blocked; `handler()` strips the previous
handler before installing the new one so a re-typed payload cannot smuggle a stale handler of the old
type. Check passes across 110 files.

### 3. No cast loophole — CONFIRMED (D6 honored)
- Scanner: **0** `unsafe-cast`/any findings in the Slice-2 surface.
- `public/root.ts`: the three `defineJobImpl(id) as unknown as JobBuilder<…>` bridges are removed —
  the impl builders are now *structurally assignable* to root's thin `JobBuilder` interface without a
  cast (confirmed by the clean check).
- The only remaining `as` in the builders is the single branded-id assertion
  `this.#data.id as DomainJobId<TId>` (and `…TaskId`/`…WorkflowId`). This is the idiomatic,
  unavoidable brand assertion (`DomainJobId<TId> = TId & { __brand: 'JobId' }`; a plain string cannot
  otherwise acquire the brand), a single `as` — not an `as unknown as` scanner dodge. Acceptable
  under D6.

### 4. Canonical-type consolidation (builder-types.ts) — SOUND, one public note
`builder-types.ts` stops re-declaring parallel shapes and aliases the domain types
(`JobDefinition = DomainJobDefinition`, `JobHandler = DomainJobHandler`, `JobId = DomainJobId`, etc.)
— exactly the AP-3 de-duplication the plan (D3) called for. `JobId`/domain `JobId` are the identical
`TId & { __brand: 'JobId' }` brand, so the aliasing is structurally sound.

### 5. Behavior compatibility — PRESERVED (runtime), with a public-surface widening note
- **Runtime unchanged.** `build()` still throws
  `"… requires an entrypoint or handler before build()"` at runtime (job-builder.ts:238,
  task-builder.ts:185, workflow-builder.ts:134). No runtime regression from F1 — F1 is compile-time
  only.
- **Main `.` surface unchanged.** `mod.ts` exports the *thin* `JobBuilder`/`JobDefinition`/… from
  `public/root.ts`; those root types are unchanged by this slice (root.ts only touched `build`/
  `payload` signatures + cast removal). Public `defineJob(...).build()` still returns the thin
  `JobDefinition<TId>`.
- **`./builders` subpath widened (non-blocking).** That subpath re-exports
  `JobDefinition`/`TaskDefinition`/`WorkflowDefinition` from `builder-types.ts`, which now alias the
  wider domain definitions (adding `priority`, `source`, `executionType`, `retryDelay`,
  `maxConcurrency`, `persist`, …). This is more faithful to what `build()` actually returns, and **no
  in-repo module imports `@netscript/plugin-workers-core/builders`** (grep clean), so nothing breaks
  in-tree. IMPL-EVAL/changelog should record it as an intentional published-surface change on that
  subpath.

## Findings

### F1 (RESOLVED 2026-07-12) — `build()` typestate guard was vacuous and regressed vs. baseline
The new `build(this: JobBuilder<TId, 'entrypoint-set' | 'handler-set', TPayload, TResult>):
JobDefinition<TId>` does **not** reject `build()` on an unconfigured (`'initial'`) builder. The
`this`-type is a fixed union that does **not** reference the receiver's own `TConfigured`, and the
`JobBuilder` interface instantiations are mutually assignable across states for that check, so the
constraint has no teeth.

Reproduced (workspace specifier, `deno check`):
- `defineJob('j').build()` — **no error** (both `@netscript/plugin-workers-core` and `…/builders`).
- `defineTask('t').build()` — no error.
- `defineWorkflow('w').build()` — no error.
- Contrast (works): `defineJob('j').handler(...).payload()` → `TS2684 … 'this' … of type 'never'`.

Regression vs. committed baseline `ac532d94`, isolated with a minimal model:
- OLD `build(): TConfigured extends 'entrypoint-set' | 'handler-set' ? Def : never` ⇒ result type is
  `never` on `'initial'` (soft guard: downstream use is poisoned).
- NEW `build(this: …fixed union…): Def` ⇒ result type is a live `Def` on `'initial'` (no guard).

Impact: a consumer who calls `.build()` before `.entrypoint()`/`.handler()`/`.step()` now gets a
clean compile and a usable-typed `JobDefinition`, then a runtime throw. Both surfaces (`.` root and
`./builders`) are affected. It contradicts the slice's own JSDoc ("Build … after an entrypoint or
handler has been configured") and the "true typestate" goal.

**Proven fix (mirror the working `payload` guard — make `this` depend on the receiver's own
`TConfigured`).** In each of `job-builder.ts`, `task-builder.ts`, `public/root.ts` (job+task), and
`workflow-builder.ts`+`public/root.ts` (workflow), change `build`'s `this` to a conditional:
```ts
// job/task builders (interface + impl)
build(
  this: TConfigured extends 'entrypoint-set' | 'handler-set'
    ? JobBuilder<TId, TConfigured, TPayload, TResult>   // (…Impl in the class)
    : never,
): JobDefinition<TId, TPayload, TResult>;
// workflow builder
build(
  this: TConfigured extends 'step-set' ? WorkflowBuilder<TId, TConfigured, TPayload, TResult> : never,
): WorkflowDefinition<TId>;
```
Verified in isolation: this form compiles the ready-state `build()` and hard-rejects the `'initial'`
`build()` (`@ts-expect-error` consumed, no `TS2578`). Re-run the per-case typestate probe after the
change; the three `build()`-on-initial cases must then error, and the existing 25 package tests +
scoped check/lint/fmt/scanner must stay green.

## Correction recheck (2026-07-12, same reviewer session family)

**Correction inspected.** All six `build()` signatures now make the explicit `this` type conditional
on the receiver's own `TConfigured`, collapsing to `never` in the unconfigured state — the exact
pattern F1 prescribed:

- `job-builder.ts` interface (L76–79) + impl (L237–240): `this: TConfigured extends 'entrypoint-set'
  | 'handler-set' ? JobBuilder<…>/JobBuilderImpl<…> : never`.
- `task-builder.ts` interface (L56–59) + impl (L184–187): same shape over `TaskBuilder`/
  `TaskBuilderImpl`.
- `workflow-builder.ts` interface (L51–53) + impl (L134–136): `this: TConfigured extends 'step-set' ?
  WorkflowBuilder<…>/WorkflowBuilderImpl<…> : never`.
- `public/root.ts` job (L212–215), task (L260–263), workflow (L299–302): same conditional on the thin
  root interfaces.

**Probes I ran myself** (`deno check --unstable-kv` against real specifiers `@netscript/plugin-workers-core`
and `@netscript/plugin-workers-core/builders`; probe files under the job tmp dir, not committed):

| Probe | Expectation | Result |
| --- | --- | --- |
| **Ready-state build()** — `defineJob().handler().build()`, `.entrypoint().build()`, `defineTask` (both), `defineWorkflow().sleep().build()`, all on `.` **and** `./builders` | compile CLEAN (no false positive) | **PASS** — `Check … exit=0`, zero diagnostics. |
| **Initial-state build()** — `defineJob('j').build()`, `defineTask('t').build()`, `defineWorkflow('w').build()` on `.` **and** `./builders`, each under `@ts-expect-error` | every directive CONSUMED (i.e. build() now errors) | **PASS** — check clean, no `TS2578`; all six `@ts-expect-error` consumed ⇒ `build()` on `'initial'` is rejected. |
| **Negative control** — `@ts-expect-error` on a *valid* ready-state `build()` | must report `TS2578` unused ⇒ check FAILS | **PASS (as designed)** — `TS2578 [ERROR]: Unused '@ts-expect-error' directive` + "Type checking failed". Confirms the harness genuinely detects unused directives, so the initial-state probe's clean pass is meaningful, not a false green. |
| **Payload guard regression** — `defineJob().handler().payload()` under `@ts-expect-error` | still rejected (directive consumed) | **PASS** — clean, guard intact. |

**Gates re-run post-correction (fresh evidence):**

| Gate | Result | Evidence |
| --- | --- | --- |
| Scanner (`--root packages/plugin-workers-core --max-allow 5`) | PASS for Slice 2 | `ok:false` overall, but the 8 findings are **exclusively** Slice-3 files (`runtime/composition-root.ts` ×5, `testing/job-fixtures.ts` ×3); **0** in `builders/*` + `public/root.ts`; `allowCount:0`. |
| Scoped check | PASS | 110 files, `failedBatches:0`, `totalOccurrences:0`. |
| Scoped fmt | PASS | `findings:0, failedBatches:0`. |
| `deno.lock` | CLEAN | `git diff --exit-code 3b3d615b -- deno.lock` → no churn. |

(Scoped lint and the 25-test package suite were green on the pre-correction pass; this correction is a
type-annotation-only change to `build`'s `this` parameter with no runtime or lint surface — the clean
110-file check and unchanged formatting confirm no regression. Runtime `build()` still throws its
"requires an entrypoint or handler" error, unchanged.)

**Conclusion.** F1 is fully resolved: `build()` is now a real typestate gate on both published
surfaces, with no false positive on ready builders and no regression to the payload guard. No new
suppression markers, no `as unknown as`, no lock churn. **Verdict: `PASS`.**

## Carry-forward (non-blocking, for IMPL-EVAL / Slice 3)
- `./builders` subpath `JobDefinition`/`TaskDefinition`/`WorkflowDefinition` widened to the canonical
  domain types (see §5) — intentional, no in-repo consumer; note in changelog.
- Slice 3 still carries the 8 `as unknown as` findings in `runtime/composition-root.ts` and
  `testing/job-fixtures.ts` — expected, owned by Slice 3.
- Branded-id single `as` assertions in the three builders are acceptable (idiomatic brand), not a D6
  loophole.
