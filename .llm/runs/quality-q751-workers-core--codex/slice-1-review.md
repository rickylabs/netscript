# Slice 1 Review — quality-q751-workers-core--codex

- Reviewer session: Anthropic Opus 4.8, high effort (Tier-A supervisor slice-review gate; separate
  from the GPT-5.6 Sol implementer recorded in `supervisor.md`).
- Date: 2026-07-12
- Scope: Slice 1 = `src/config/*`, `src/contracts/v1/*`, `src/streams/*` of
  `packages/plugin-workers-core`.
- Nature: substantive pre-commit slice review of GPT-authored implementation (not PLAN-EVAL, not
  final IMPL-EVAL). No source edited; the sole write this session is this file. Owner prohibited PRs.

## Verdict

`PASS`

**Every substantive acceptance criterion PASSES** (casts/suppression, Zod variance, oRPC narrowing,
stream correlation, isolated declarations, public compat, tests/scanner). The initial pass returned
`FAIL_FIX` for a single, purely mechanical blocker — the `deno fmt` gate was red on all 5 changed
files (plan Validation Plan step 4 requires 0 errors). That blocker (F1) has since been remediated:
the scoped fmt gate was re-run and is now green (`filesSelected:110, failedBatches:0, findings:0`).
No source or non-review file was edited by this review session. Verdict updated to `PASS`.

> Verdict history: `FAIL_FIX` (fmt red on 5 files) → `PASS` (2026-07-12, after fmt remediation;
> scoped fmt re-run reports `findings:0`). All substantive evidence below is unchanged.

## Evidence summary

| Gate (Slice 1 scope) | Result | Evidence |
| --- | --- | --- |
| Scanner (`scan-code-quality.ts --root packages/plugin-workers-core --max-allow 5`) | PASS for Slice 1 | `ok:false` overall, but **0 findings and 0 allowances in every Slice 1 file**; all 27 remaining findings are in Slice 2/3 files (`builders/*`, `public/root.ts`, `runtime/composition-root.ts`, `testing/job-fixtures.ts`). |
| Scoped check (`run-deno-check.ts --root packages/plugin-workers-core --ext ts,tsx`) | PASS | 110 files, `totalOccurrences:0`, 0 failed batches. |
| Scoped lint | PASS | `exitCode:0`, 0 occurrences; no new `deno-lint-ignore`. |
| Scoped fmt (`run-deno-fmt.ts … --ext ts,tsx`) | PASS (after remediation) | Initial run: 5 not-formatted files (F1). Re-run after remediation: `filesSelected:110, failedBatches:0, findings:0`. |
| Targeted tests (`deno test tests/streams/ tests/contracts/`) | PASS | 7 passed / 0 failed, incl. `workers contract exposes a precise, non-loosened type surface` and `WorkerJobSchema keeps the public job stream surface thin`. |
| Publish dry-run (`deno publish --dry-run --allow-dirty`) | PASS | "Success / Dry run complete"; no slow types → isolated-declarations bar met. |
| Lock hygiene (`git diff 3b3d615b -- deno.lock`) | PASS | No churn. |

## Substantive verification (all sound)

### 1. No cast / suppression loophole — CONFIRMED
Every `as unknown as` in the Slice 1 surface is removed and replaced by a *checked* construct, not a
scanner-token dodge (honors D6):
- `config/{job,task,workers}-config.ts`: intermediate schema consts now carry a real
  `z.ZodType<T>` annotation (`z.ZodType<JobConfig>`, `z.ZodType<TaskConfig>`,
  `z.ZodType<RetentionConfig | undefined>`, `z.ZodType<WorkersConfigData | undefined>`); the public
  `ConfigSchema<T>` consts are then a plain assignment. This is a *double* compile-time proof — the
  `z.object(...)` must match `T`, and `z.ZodType<T>` must satisfy `ConfigSchema<T>` — where the old
  code bypassed both with `as unknown as`.
- `contracts/v1/workers.contract-schemas.ts`: all 11 `as unknown as ContractSchema<…>` casts dropped;
  the `*ZodSchema` consts keep explicit `z.ZodObject<Shape>`/`typeof` annotations and assign directly.
- `contracts/v1/workers.contract-types.ts`: only a JSDoc-prose change (`(options: any)` →
  `(options: unknown)`); no runtime cast. Scanner clean on the file.
- `streams/schema.ts` and `streams/producer.ts`: the `as unknown as`, `as never`, and structural
  facades are gone (see §4).

Scanner confirms: **0 unsafe-cast/any findings across all Slice 1 files.**

### 2. Zod input/output/default variance — SOUND
- `WorkerExecution`/`WorkerJob` are now `Readonly<z.output<typeof …ZodSchema>>` — derived from the
  schema, not hand-authored parallel shapes.
- Optionality is reconciled honestly: `ExecutionRecordSchema.pick({…}).partial({…})` /
  `JobResponseSchema.pick({…}).partial({…})` make exactly the fields the `…Shape` type wraps in
  `z.ZodOptional<…>` optional, so `z.ZodObject<WorkerExecutionShape>` is a *checked* annotation over
  the real `.pick().partial()` result (check passes — a drift would error).
- Entity schemas expose the input axis precisely:
  `WorkerStreamEntitySchema<WorkerExecution, z.input<typeof WorkerExecutionZodSchema>>`, with
  `parse(value: TInput): TOutput`. Input≠output is modelled, not erased.
- `workers-config.ts` `WorkersConfigObjectSchema.transform(...).optional()` assigns to
  `z.ZodType<WorkersConfigData | undefined>` (input defaults to `unknown`, so `parse(unknown)` is
  correct for a transform). The default/coerce-variance risk from the plan Risk Register is handled.

### 3. oRPC base-error runtime narrowing preserves schemas — SOUND
The old `{ ...BASE_PLUGIN_ERRORS } as unknown as Parameters<typeof oc.errors>[0]` is replaced by
`requireContractSchema()`, a genuine runtime guard (`'~standard' in value`) that **returns the same
schema value** (identity) when valid and **throws at module load** otherwise, assembled into
`basePluginErrors … satisfies ErrorMap`. Verified against source: `BASE_PLUGIN_ERRORS`
(`packages/plugin/src/contract-base/domain/base-errors.ts:62`) has **exactly** the three keys
`NOT_FOUND`, `VALIDATION_ERROR`, `INTERNAL` that are narrowed — no error is dropped, the vocabulary
is preserved, and the actual Zod `data` schemas flow through unchanged. Downstream
`baseContract` / routes / `implement()` are unchanged. Contract tests (base-seam + soundness) pass.

### 4. Stream schema/entity/producer types stay correlated — SOUND
- `StreamSchemaDefinition = StreamStateDefinition` and
  `WorkersStreamSchema<TDef> = StateSchema<TDef>` adopt the upstream generics (verified via
  `deno doc` + source `packages/plugin-streams-core/src/domain/stream-schema.ts`).
- `workersStreamSchema = defineStreamSchema(workersStreamDefinition)` — **no cast**; the definition
  literal (`schema: typeof Worker…ZodSchema`, `type`, `primaryKey`) satisfies
  `Record<string, CollectionDefinition>` (schema is `unknown` upstream, so a Zod schema fits).
- Producer wrapper: `WorkersStreamProducer.upsert` is now generic
  (`<TEntity extends keyof WorkerStreamEntities>`), and the impl calls upstream
  `DurableStreamProducer.upsert<K extends keyof TDef & string>(entityType, value: Record<string, unknown>)`
  — the `{ ...value }` spread is exactly what satisfies the mutable `Record<string, unknown>` param
  (verified against `create-durable-stream.ts:165`). `createDurableStream({ schema: workersStreamSchema })`
  binds `TDef = WorkersStreamDefinition`, so `'execution' | 'job'` correlate end-to-end. No cast.

### 5. Isolated declarations & public compatibility — CREDIBLE
- Publish dry-run success ⇒ no slow types; every moved const keeps an explicit annotation feeding
  `--isolatedDeclarations`.
- No export-map key added/removed.
- One benign public narrowing: `WorkerExecutionRecord.status` `string` → `WorkerExecution['status']`
  (`'cancelled' | 'completed' | 'failed' | 'timeout'`, from `ExecutionRecordSchema.shape.status`).
  This is a fidelity improvement, not a break: no in-repo package imports
  `@netscript/plugin-workers-core`'s `WorkerExecutionRecord` (the `plugins/workers/*` matches are
  that package's own local type of the same name), and the intra-package check (110 files) is clean.

### 6. Targeted check/tests/scanner evidence — SUFFICIENT for Slice 1
Scoped check + lint clean, 7 targeted stream/contract tests green (incl. the soundness test that
guards against exactly this erasure), scanner 0/0 on the slice, publish dry-run green, lock
unchanged. Adequate for a type-only boundary slice.

## Findings

### F1 (RESOLVED, was BLOCKING, mechanical) — `deno fmt` gate red on all 5 changed files

**Status: RESOLVED (2026-07-12).** The scoped fmt gate was re-run and is now green
(`filesSelected:110, failedBatches:0, findings:0`); the five files below are formatted. The original
finding is preserved verbatim for the record.

`deno fmt --check` fails on:
- `src/config/job-config.ts` — `JobConfigSchema` assignment should collapse to one line.
- `src/config/task-config.ts` — `TaskConfigSchema` assignment should collapse to one line.
- `src/config/workers-config.ts` — the `.transform((config …) => ({ … }))` block is under-indented
  (2 spaces where fmt wants 4/6/8), plus the trailing `).optional()` wrapping.
- `src/contracts/v1/workers.contract-schemas.ts` — `JobTriggerInputSchema` and `SSEEventSchema`
  assignments should collapse to one line.
- `src/streams/schema.ts` — `workersStreamSchema = defineStreamSchema(workersStreamDefinition)`
  re-wrap.

All are whitespace-only artifacts of the annotation edits; none affects semantics. Per the plan's
own Validation Plan (step 4: fmt "0 errors") this gate must be green before the Slice 1 sign-off
commit. As the Tier-A slice-review gate, I will not certify a slice whose owned files fail a required
gate (no false-green), even a trivial one.

**Required fix (implementer):**
```
deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-fmt.ts \
  --root packages/plugin-workers-core --ext ts,tsx --write
# or: deno fmt packages/plugin-workers-core/src/{config,contracts/v1,streams}
```
Then re-confirm `run-deno-fmt.ts … --ext ts,tsx` reports `findings:0`. No other change is needed;
re-review is limited to re-running the fmt gate.

## Carry-forward (non-blocking, for IMPL-EVAL / later slices)
- Slices 2 & 3 still carry the 27 `as unknown as` findings (builder typestate, `public/root.ts`,
  composition-root ports, job-fixtures) — expected, owned by those slices; not this slice's concern.
- The `contract-types.ts` `any`→`unknown` edit is prose-only and legitimate; flagged only so
  IMPL-EVAL knows the scanner delta there came from a comment, not a code cast.
