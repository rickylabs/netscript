# Slice 3 Review — quality-q751-workers-core--codex

- Reviewer session: Anthropic Opus 4.8, high effort (separate opposite-family slice-review gate;
  independent of the GPT implementer).
- Date: 2026-07-12
- Scope: Slice 3 = uncommitted working-tree changes since `4408c4e3` to
  `src/runtime/runtime-types.ts`, `src/runtime/composition-root.ts`, `src/registry/registry-types.ts`,
  `src/shutdown/shutdown-manager.ts`, `src/workflow/workflow-executor.ts`, `src/testing/job-fixtures.ts`,
  and `tests/runtime/job-dispatcher_test.ts`.
- Nature: substantive pre-commit slice review. No source edited; the sole write this session is this
  file. Owner prohibited PRs.

## Verdict

`PASS` (corrected 2026-07-12 — see "Correction recheck" below)

> **Original verdict: `FAIL_FIX`** on one blocking finding (F1 — a +9 `deno doc --lint` private-type-ref
> regression from the canonical-type aliasing). The implementer applied the preferred remedy (expose
> the alias dependency types through `runtime/mod.ts` + `registry/mod.ts`, and rewrite the
> schema-derived domain types that leaked private schema symbols as explicit, equivalent structural
> contracts). The recheck below reproduces **runtime and registry entrypoints at 0 private-type-refs**
> and the full package at **combined 13** (below the pre-Slice-3 baseline of 24), with all other gates
> still green and the rewrites proven exactly equivalent. **F1 is RESOLVED; verdict flips to `PASS`.**

The original review body (below) is retained unchanged for the audit trail.

Slice 3 nails its headline mandate — **all eight remaining scanner casts are removed by genuine
structural typing, not moved or hidden; the runtime ports are now canonical; permission and
job-definition changes are sound; no suppression was added; and scanner/check/lint/fmt/tests/publish
are all green.** But the canonical-type aliasing introduced a **measurable, slice-owned
`deno doc --lint` private-type-ref regression (+9 by dedup-by-file; runtime subpath 0→16, registry
subpath 0→1 at entrypoint granularity)** on the published surface. That regression violates the
plan's locked "no regression from baseline / do not deepen it" doc gate (Validation Plan #7, Fitness
Gate JSR/docs, arch-debt `workers-contract-structural-server-export`) and the drift-watch obligation
to log any doc-lint regression before proceeding — and it is currently **unlogged and unaccepted**.
One bounded finding (F1). The remedy is low-cost and does not require redesign.

## Evidence summary

| Gate (Slice 3 scope) | Result | Evidence |
| --- | --- | --- |
| Scanner (`scan-code-quality.ts --root packages/plugin-workers-core --max-allow 5`) | **PASS** | `{"ok":true,…,"findings":[],"allowCount":0,"allowances":[]}` — all 8 prior Slice-3 findings gone; 0 findings, 0 allowances. |
| Scoped check (`run-deno-check.ts --ext ts,tsx`) | **PASS** | 110 files, 1 batch, `failedBatches:0`, `totalOccurrences:0`. Authoritative proof the alias/`Pick<>` structural typing compiles without casts. |
| Scoped lint | **PASS** | `exitCode:0`, 0 occurrences; no new `deno-lint-ignore`. |
| Scoped fmt (`--check`) | **PASS** | 110 files, `findings:0, failedBatches:0`. |
| Package tests (`deno task test`) | **PASS** | 25 passed / 0 failed (incl. `createTestWorkersRuntime wires memory ports`, memory-worker handler exec, `InProcessJobDispatcher` sourceUrl-before-entrypoint, workflow/shutdown paths). |
| Publish dry-run (`deno publish --dry-run --allow-dirty`) | **PASS** | `Success — Dry run complete`; no slow-type diagnostics. |
| `deno.lock` | **CLEAN** | `git diff --exit-code 3b3d615b -- deno.lock` → no churn. |
| Doc-lint (`deno task doc:lint --root …`) | **FAIL (regression)** | Combined private-type-ref **24 → 33 (+9)**, entirely in Slice-3 files: `runtime-types.ts +7`, `composition-root.ts +1`, `registry-types.ts +1`. See F1. Measured apples-to-apples by stashing only the Slice-3 source/test diff and re-running the identical command. |
| Suppressions added | **NONE** | Diff adds zero `quality-allow` / `deno-lint-ignore` / `@ts-ignore` / `@ts-expect-error` / `as unknown as` / `as never`. The only `as` tokens added are import aliases (`JobId as DomainJobId`, …). Pre-existing test suppressions live in non-Slice-3 files and are untouched. |

## Substantive verification (all PASS)

### 1. The eight scanner casts are genuinely removed — CONFIRMED
The 8 findings the Slice-2 review handed forward were 5 `as unknown as` in `composition-root.ts`
(`jobRegistry`, `worker`, `shutdown`, `taskExecutor`, `workflowExecutor` return-object bridges, plus
the inner single-`as` option casts) and 3 in `job-fixtures.ts` (`jobStorage as unknown as …`,
`worker as unknown as …`, `.build() as unknown as JobDefinition`, and the `handler as never`). Every
one is gone and replaced by a **direct assignment that type-checks** — not relocated, not token-dodged:

- `composition-root.ts` now assigns `jobRegistry`, `worker`, `shutdown`, `taskExecutor`,
  `workflowExecutor` straight into the frozen runtime object. This compiles only because the ports
  were made canonical (below) and the concrete classes genuinely satisfy them. The `options.scheduler!`
  non-null assertion is also removed via a captured `const scheduler = options.scheduler` inside the
  `if (options.scheduler)` guard — behavior identical.
- `job-fixtures.ts` returns the real `BuilderJobDefinition<TId,TPayload,TResult>` from
  `defineJob(...).build()` with no cast; the handler is typed `BuilderJobHandler<TPayload,TResult>`.
- `tests/runtime/job-dispatcher_test.ts` replaces a loose `const job: JobDefinition = {…}` literal
  with `{ ...defineJob(id).entrypoint(...).build(), sourceUrl, source, executionType } satisfies
  JobDefinition` — honest conformance, no annotation-widening.

The clean 110-file check + green scanner (0/0) is the objective proof the casts were not pushed
elsewhere.

### 2. Runtime ports remain structural / canonical — CONFIRMED (D5, AP-3)
`runtime-types.ts` now aliases the parallel hand-declared contracts onto the actual implemented types:
`RuntimeJobStoragePort = RegistryJobStoragePort`; `RuntimeTaskExecutor =
Pick<TaskExecutor,'execute'|'id'|'supports'>`; `RuntimeWorkflowExecutor = Pick<WorkflowExecutor,
'execute'> & {id}`; `RuntimeShutdownManager = Pick<ShutdownManager,'register'|'shutdown'> & {id}`;
`RuntimeShutdownResource = ShutdownResource`; options types point at the real
`MultiRuntimeTaskExecutorOptions` / `WorkflowExecutorOptions` / `ShutdownManagerOptions`. The two
concrete identity additions — `ShutdownManager.id = 'shutdown-manager'` and
`WorkflowExecutor.id = 'workflow-executor'` — are **honest additive readonly fields** that let the
real defaults satisfy the `{id}` ports without a cast (exactly the plan's "add concrete runtime
identity fields … where actual default implementations need to satisfy ports"). This is the intended
de-duplication, not a facade.

### 3. Canonical permission + job-definition changes are sound — CONFIRMED, with a surface note
`RuntimePermissions` (both the runtime and registry copies) now alias the single canonical
`TaskPermissionsInput = TaskPermissionsInputSchema['_output']`. This is **more correct than the code
it replaces**: the old hand-rolled bag declared `net/read/write/env/run/ffi` as *required*, but the
domain job/task definition schema stores `TaskPermissionsInputSchema.optional()` where every field is
`.optional()`. The alias makes the published type match what the schema actually parses (all-optional),
collapsing two divergent parallel declarations into the canonical one. `JobId/JobResult/JobContext/
JobHandler/JobDefinition` likewise alias the domain brands/shapes (`DomainJobId` is the identical
`TId & {__brand:'JobId'}`), so the aliasing is structurally sound. Note for changelog/IMPL-EVAL: this
is a real (sound) published-surface refinement on the `runtime`/`registry` subpaths — nested
permission fields become optional and `RuntimeWorkflowDefinition` narrows from `Record<string,unknown>
& {id;name}` to `DomainWorkflowDefinition<TId>`; no in-repo consumer breaks (110-file check green).

### 4. No unnecessary broadening — CONFIRMED
Every alias moves toward a *narrower/canonical* type, not a looser one: option bags go from
`Readonly<Record<string,unknown>>` to the concrete option types; the workflow definition narrows to
the domain type; permissions align to the schema output. The only "widening" (permission fields
becoming optional) is a correctness alignment to the Zod schema, not a loss of precision. No `unknown`
/`any`/index-signature was introduced to force an assignment.

### 5. No type-only circular dependency introduced — CONFIRMED
All new imports in `runtime-types.ts` are `import type` (fully erased at emit → no runtime cycle).
Checked the back-edges at file granularity: `domain/`, `registry/`, `shutdown/`, `workflow/`, and
`executor/` do **not** import from `runtime/`. `runtime-types.ts` imports `abstracts/task-executor.ts`,
which imports `executor/executor-types.ts` (not `runtime-types.ts`) — so no cycle on that path. The
`abstracts/` files that do import `runtime-types.ts` (`job-dispatcher.ts`, `job-scheduler.ts`) are not
imported back by `runtime-types.ts`. No import cycle exists, and `deno check` (110 files) confirms the
type graph resolves.

### 6. Lifecycle behavior preserved — CONFIRMED
`createWorkersRuntime` returns the same frozen object with the same fields, `start()/stop()`
unchanged; `shutdown.register` for `worker` (priority 20) and `scheduler` (priority 30) is unchanged
apart from the closure-capture refactor. `build()` still throws its runtime "requires an entrypoint or
handler" error. The 25-test suite (worker execution, runtime wiring, dispatcher import order, workflow,
idempotency, streams) is green.

## Findings

### F1 (BLOCKING) — Slice 3 deepens the package's `deno doc --lint` private-type-ref debt (+9), unlogged, against a locked no-regression gate

By aliasing exported `runtime`/`registry` subpath types onto canonical types that live in sibling
modules **and are not re-exported through those subpath entrypoints**, Slice 3 raises the package's
`deno doc --lint` private-type-ref count from **24 to 33** (combined, dedup-by-file), all attributable
to Slice-3 files (`runtime-types.ts` +7, `composition-root.ts` +1, `registry-types.ts` +1). At
entrypoint granularity the `runtime` subpath goes **0 → 16** and `registry` **0 → 1**. Both entrypoints
were clean before this slice.

The 16 new `runtime/mod.ts` diagnostics (each `public type 'X' references private type 'Y'`):

```
TaskRegistryPort → TaskDefinition            JobId → JobId (Domain)
JobResult → JobResult (Domain)               JobContext → JobContext (Domain)
JobHandler → JobHandler (Domain)             RuntimePermissions → TaskPermissionsInput
JobDefinition → JobDefinition (Domain)       RuntimeJobStoragePort → RegistryJobStoragePort
RuntimeTaskExecutor → TaskExecutor           RuntimeTaskExecutorOptions → MultiRuntimeTaskExecutorOptions
RuntimeWorkflowExecutor → WorkflowExecutor   RuntimeWorkflowDefinition → WorkflowDefinition
RuntimeWorkflowOptions → WorkflowExecutorOptions
RuntimeShutdownManager → ShutdownManager     RuntimeShutdownResource → ShutdownResource
RuntimeShutdownOptions → ShutdownManagerOptions
```
plus `registry/mod.ts`: `RuntimePermissions → TaskPermissionsInput`.

Why this is blocking, not a mere note:
- **It violates an explicitly locked gate.** Plan Validation Plan #7 and Fitness Gate JSR/docs both
  require doc-lint "recorded with **no regression** from baseline"; the arch-debt entry
  `workers-contract-structural-server-export` is annotated "**do not deepen it**." This slice deepens
  it.
- **Drift-watch was not honored.** Plan/worklog require logging any doc-lint regression *before
  proceeding*; there is no drift.md entry and no owner acceptance for this deepening. An independent
  gate cannot certify a slice that silently regressed a gated metric.
- **It is a genuine published-surface degradation.** Consumers running `deno doc` on the
  `@netscript/plugin-workers-core/runtime` and `/registry` subpaths now get 16 + 1 unresolved
  private-type references where they previously got none; generated docs lose those type links.

Not publish-blocking in the narrow sense (`deno publish --dry-run` passes — private-type-ref is a doc
lint, not a slow-type error), and the aliasing that causes it is exactly the D3/D5 canonicalization the
plan wanted. That tension is real, but the resolution the plan mandates is to **log + accept**, not to
regress silently.

Proven-shape remedy (either is acceptable; both are bounded, no redesign):
1. **Preferred — re-export the alias targets through the affected entrypoints** so the references
   resolve to public types. Add `export type { … }` re-exports to `src/runtime/mod.ts` (and the single
   `TaskPermissionsInput` to `src/registry/mod.ts`) for the canonical domain/port/option types the new
   aliases point at (`JobId/JobResult/JobContext/JobHandler/JobDefinition`(domain),
   `TaskPermissionsInput`, `RegistryJobStoragePort`, `TaskExecutor`, `MultiRuntimeTaskExecutorOptions`,
   `WorkflowExecutor`, `WorkflowDefinition`, `WorkflowExecutorOptions`, `ShutdownManager`,
   `ShutdownResource`, `ShutdownManagerOptions`, and the domain `TaskDefinition` referenced by
   `TaskRegistryPort`). This is pure surface hygiene — it introduces no new type and no cast — and
   should drive both entrypoints back to 0. Re-run `deno task doc:lint --root packages/plugin-workers-core`
   and confirm combined ≤ 24 (baseline), then the scanner/check/lint/fmt/25-tests must stay green.
2. **Alternative — owner accepts the deepened debt**: record the +9 (0→16 runtime, 0→1 registry) as an
   explicit drift.md entry with rationale ("cost of D3/D5 canonical aliasing"), update the
   `workers-*` arch-debt note, and reconcile the plan's "no regression" gate. Only valid with explicit
   owner sign-off, since the plan currently forbids deepening.

## What is already correct (carry to IMPL-EVAL once F1 clears)
- 8/8 scanner casts removed by real structural typing; scanner 0 findings / 0 allowances under
  `--max-allow 5`.
- Canonical ports + concrete identity fields are honest; permission/job-definition aliases are sound
  and schema-accurate.
- No suppression markers, no `as unknown as`, no import cycle, no lock churn; check/lint/fmt/tests/
  publish-dry-run all green.
- Published-surface refinements on `runtime`/`registry`/`builders` subpaths (optional permission
  fields, narrowed workflow definition) are intentional and consumer-safe in-repo — note in changelog.

## Reproduction commands (this session)
```
deno run --allow-read .llm/tools/quality/scan-code-quality.ts --root packages/plugin-workers-core --max-allow 5
deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/plugin-workers-core --ext ts,tsx
deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts  --root packages/plugin-workers-core --ext ts,tsx
deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts   --root packages/plugin-workers-core --ext ts,tsx
(cd packages/plugin-workers-core && deno task test)
(cd packages/plugin-workers-core && deno publish --dry-run --allow-dirty)
git diff --exit-code 3b3d615b -- deno.lock
# doc-lint regression (apples-to-apples):
deno task doc:lint --root packages/plugin-workers-core            # post: combined 33
git stash push -- packages/plugin-workers-core/src packages/plugin-workers-core/tests
deno task doc:lint --root packages/plugin-workers-core            # pre:  combined 24
git stash pop
```

---

## Correction recheck (2026-07-12, same reviewer session family)

**F1 remedy applied — preferred path (expose dependency types) + a leak fix.** The implementer kept
the canonical runtime aliases and: (a) added explicit `export type { … }` re-exports to
`src/runtime/mod.ts` (and `TaskPermissionsInput as RegistryTaskPermissionsInput` to
`src/registry/mod.ts`) so every alias target resolves to a public type; and (b) rewrote the
schema-derived domain types that themselves leaked private Zod value symbols
(`typeof Schema['_output']`, `z.output<…>`, `Editable & System` intersections) into explicit,
equivalent structural literals in `domain/constants.ts`, `domain/task.ts`, `domain/job-definition.ts`,
`domain/workflow.ts`, `executor/executor-types.ts`, `telemetry/attributes.ts`, and
`workflow/workflow-step-runner.ts`. Net effect: the doc-lint debt drops **below** the pre-Slice-3
baseline.

**Gates re-run post-correction (fresh evidence):**

| Gate | Result | Evidence |
| --- | --- | --- |
| Doc-lint — runtime entrypoint | **PASS** | `deno doc --lint src/runtime/mod.ts` → **0** private-type-refs (was 16). |
| Doc-lint — registry entrypoint | **PASS** | `deno doc --lint src/registry/mod.ts` → **0** (was 1). |
| Doc-lint — full package | **PASS / improved** | `doc:lint --root …` combined `privateTypeRef:13`, `missingJSDoc:0`, `other:0` — **below** the pre-Slice-3 baseline of 24 (and vs. 33 at first Slice-3 submission). |
| Scanner (`--max-allow 5`) | **PASS** | `{"ok":true,…,"findings":[],"allowCount":0,"allowances":[]}`. |
| Scoped check | **PASS** | 110 files, `failedBatches:0`, `totalOccurrences:0`. A clean check also rules out duplicate-export-name conflicts (those are hard `TS2308/TS2323` errors), so the ~40 new `runtime/mod.ts` re-exports collide with nothing. |
| Package tests | **PASS** | 25 passed / 0 failed. |
| `deno.lock` | **CLEAN** | `git diff --exit-code 3b3d615b -- deno.lock` → no churn. |

**Equivalence of the domain rewrites — proven, not asserted.** The risk of a hand-written structural
type silently drifting from its schema was checked directly:

- **Mechanism-verified exactly equivalent:** `TaskType` (≡ `TASK_TYPES` 7-member union),
  `WorkflowStepKind` (≡ `{job,sleep,task}`), `WorkflowStep` (schema shape is exactly
  `{id,kind,taskId?,jobId?,payload?,durationMs?}`), `WorkflowDefinition` (the `WorkflowDefinitionShape`
  **type annotation** constrains `_output` to exactly `{id,steps,timeout?,tags?,metadata?}`, so the old
  `Omit<…>&{…}` and the new explicit literal denote the same type), `WorkerTaskPermissions` (alias
  inlined), `TaskPermissionsInput` (≡ the all-optional input schema).
- **`StoredJobDefinition` / `StoredTaskDefinition` (the two large rewrites) — proven by a bidirectional
  type-equivalence probe** against the still-exported schema outputs:
  ```ts
  type Eq<A,B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
  const jobEquiv:  Eq<StoredJobDefinition,  JobEditable  & JobSystem>  = true; // compiles
  const taskEquiv: Eq<StoredTaskDefinition, TaskEditable & TaskSystem> = true; // compiles
  ```
  `deno check` on this probe exits 0 (⇒ both are exactly equivalent). A **negative control**
  (`Eq<StoredJobDefinition, JobEditable>` — job minus system) correctly fails with `TS2322`, proving the
  probe genuinely detects inequivalence, so the clean pass is meaningful, not a false green.

**No runtime-behavior change.** The correction is type-only re-exports plus two additional class value
re-exports under new alias names (`WorkflowExecutor as RuntimeWorkflowExecutorImplementation`,
`ShutdownManager as RuntimeShutdownManagerImplementation`) — additional public bindings to existing
classes, no new instantiation or side effect. `createWorkersRuntime` output, lifecycle, and the runtime
`build()` throw are unchanged; the 25-test suite confirms.

**Conclusion.** F1 is fully resolved: runtime and registry subpaths are back to 0 private-type-refs,
the full-package doc-lint is 13 (better than baseline 24), and the type rewrites that made it possible
are proven exactly equivalent with no behavior change, no duplicate exports, no new suppression, no
`as unknown as`, and no lock churn. **Verdict: `PASS`.**

## Carry-forward (non-blocking, for IMPL-EVAL / changelog)
- **`runtime` subpath surface expansion.** The fix adds ~40 public re-exports to `src/runtime/mod.ts`
  (aliased `Runtime*` names plus several unaliased ones already public on their home subpaths —
  `JobSuccess`, `JobFailure`, `StoredJobDefinition`, `StoredTaskDefinition`, `TaskContext`,
  `TaskHandler`, `TaskType`, `WorkflowStep`, `WorkflowStepKind`, `WorkflowStepResult`, …). This is the
  sanctioned remedy and collides with nothing, but it is a deliberate published-surface addition on the
  `runtime` subpath — record it in the changelog alongside the earlier `builders`/permission-optionality
  refinements.
- **Explicit structural types now require lockstep maintenance with their Zod schemas.** The rewritten
  `StoredJob/TaskDefinition`, `WorkflowStep`, `WorkflowDefinition`, and the enum unions are currently
  exactly equivalent but that equivalence is not guarded by a committed test — a future schema edit
  could drift the hand-written type. Recommend adding a small type-equivalence test (the `Eq<>` probe
  above, against the `*EditableSchema`/`*SystemSchema` outputs) to the package so the invariant is
  enforced going forward. Recommendation only; not required for this slice.
