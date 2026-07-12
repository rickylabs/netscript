# PLAN-EVAL — quality-q750-contracts--codex

- Plan evaluator session: Claude Opus 4.8 (Anthropic), separate opposite-family session — 2026-07-12
- Run: `quality-q750-contracts--codex`
- Surface / archetype: `packages/contracts` — Archetype 4 (Public DSL / Builder)
- Scope overlays: none
- Generator: OpenAI GPT-5.6 Sol (`gpt-5.6-sol`), high effort (separate session — generator ≠ evaluator confirmed)

## Checklist results

| Plan-Gate item                          | Result | Evidence / location |
| --------------------------------------- | ------ | ------------------- |
| Research present and current            | PASS   | `research.md` re-baseline section rejects unreachable carried-in commit `11a2e3fe` and re-derives against baseline `3b3d615b` (confirmed a real commit; current HEAD `f66e5767` is the plan commit on top). Load-bearing findings spot-checked live (below). |
| Decisions locked                        | PASS   | `plan.md` Locked Decisions L1–L7 with rationale; Archetype 4 / Keep confirmed against doctrine; Axioms A1/A2/A8/A9/A14 mapped. |
| Open-decision sweep                     | PASS   | `plan.md` Open-Decision Sweep (3 items, all "safe to defer" with notes); `research.md` open-questions = none rework-forcing. Evaluator sweep found no unflagged rework-forcing decision (below). |
| Commit slices (< 30, gate + files each) | PASS   | 3 ordered slices; each names its proving gate and files. All 8 finding-bearing files map to a slice (below). |
| Risk register                           | PASS   | `plan.md` Risk Register — 6 risks with mitigations (consumer regress, input variance, CRUD marker loss, slow/private published types, cast-relocation, lock churn). |
| Gate set selected                       | PASS   | Fitness gates F-1..F-12, F-14..F-19 match `ARCHETYPE-4` exactly; Validation Plan enumerates 10 ordered gates (scanner → check/lint/fmt → tests → doc lint → publish dry-run → arch:check → consumer → lock hygiene). Runtime N/A (type-only), consumer required (public helper types change). |
| Deferred scope explicit                 | PASS   | `plan.md` Deferred Scope + Non-Scope sections (no runtime/route/dep/layout redesign; no `deno.lock`; no `deno-lint-ignore`; oRPC private-type-ref cleanup deferred). |
| jsr-audit surface scan (pkg/plugin)     | PASS   | `research.md` jsr-audit section scans all four exports (`.`,`./crud`,`./query`,`./transform`); publish dry-run passes without `--allow-slow-types` (verified live); doc:lint recorded (12 baseline private-type-ref, 0 missing JSDoc). Two named risks (slow inferred exported types; exposed optional/coerced input) each have a mitigation + slice. |

## Spot-checks against the current tree (load-bearing)

- **Finding #1 (scanner baseline).** Ran `scan-code-quality.ts --root packages/contracts`: `ok:false`, **50 findings, allowCount 0**. Counted 43 `unsafe-cast` + 7 `any`/blanket-ignore — exact match to research. Confirmed.
- **Findings #3/#4 (facade).** `src/domain/schema-types.ts` confirms `ContractSchema<TOutput = unknown>` (output-only) and `ContractObjectSchema` whose `extend`/`merge` return `...<unknown>`, erasing shape. Confirmed.
- **Finding #6 (helper factories).** `src/application/zod-helpers.ts` shows 9 `as unknown as Contract*Schema` returns over real `z.number()/z.string()/z.codec` values. Confirmed (9 scanner hits).
- **Finding #7 (CRUD casts).** `crud/create-crud-contract.ts:310,318,329,330,332` are the `as unknown as` casts named in the plan. Confirmed.
- **Finding #9 (archetype).** `docs/architecture/doctrine/10-codebase-verdict-and-handoff.md:43` classifies `@netscript/contracts` as Archetype **4 / Keep**. Confirmed — gate set is correctly derived.
- **jsr publish bar.** `deno publish --dry-run --allow-dirty` from the package exits 0 without `--allow-slow-types`. Confirmed; the "explicit annotations required or publish regresses" risk is real and owned by slices 2–3.

Working tree remained clean after spot-checks; no `deno.json`/`deno.lock` churn introduced by the evaluation.

## Slice ↔ finding coverage

| File (finding family)                         | Slice | Proving gate |
| --------------------------------------------- | ----- | ------------ |
| `src/application/paginated-query.ts` (3 any)  | 1     | scanner delta + scoped wrappers + tests |
| `src/application/transform-helpers.ts` (6)    | 1     | scanner delta + scoped wrappers + tests |
| `src/domain/schema-types.ts` (facade)         | 2     | scanner delta + schema tests + doc/publish |
| `src/domain/schemas.ts` (13)                  | 2     | scanner delta + schema tests + doc/publish |
| `src/application/zod-helpers.ts` (9)          | 2     | scanner delta + schema tests + doc/publish |
| `schemas/filters.ts` (5)                      | 2     | scanner delta + schema tests + doc/publish |
| `schemas/pagination.ts` (9)                   | 2     | scanner delta + schema tests + doc/publish |
| `crud/create-crud-contract.ts` (5)            | 3     | final scanner `--max-allow 8` + all gates |

Every one of the 50 findings falls inside a sliced file with a named proving gate.

## Open-decision sweep (evaluator-run)

None that force rework if deferred. Reviewed candidates:

- **`ContractSchema<TOutput>` → `ContractSchema<TOutput, TInput>` public signature change.** Adding an optional second type parameter is source-compatible for one-arg consumers; the change is locked under L1/L2, flagged in Hidden Scope, and gated by the consumer checks (Validation Plan step 9). Not an open rework-forcing decision.
- **`ContractObjectSchema.extend`/`merge` becoming shape-preserving.** Locked under L4; regression risk owned by the Risk Register + consumer gates. Not open.
- **Named Zod shape alias vs explicit factory return-type (per schema).** Correctly "safe to defer" — both satisfy L1/L3 and must pass isolated-declaration publish analysis; it is a per-schema implementation choice, not a cross-cutting decision.
- **Allowance ceiling of 8 vs target zero.** Not rework-forcing: L6 permits a survivor only after a concrete typed attempt proves a named upstream structural limitation, each individually documented, target zero, empty table preferred. This is a guarded fallback protocol, not a deferred decision. IMPL-EVAL will judge any survivor.

## Verdict

`PASS`

## Notes

- Generator/evaluator separation is satisfied: GPT-5.6 Sol generated; this is a separate Claude Opus 4.8 session per the recorded opposite-family route in `supervisor.md`.
- Owner overrides (no PR / commit-trail replaced by local artifacts + force-pushed branch history; `high` rather than `xhigh` effort; remote-control `disabled`) are recorded in `supervisor.md` and `drift.md` as minor accepted drift. These are lane/mechanics overrides and do not bear on Plan-Gate soundness.
- Carry into IMPL-EVAL: (1) confirm final scanner is `ok:true` with the survivor table empty or every survivor individually justified under L6 (prior rejected pass used 41 allowances — a green-by-suppression result must be rejected); (2) verify `deno publish --dry-run` still passes without `--allow-slow-types` after native generics are introduced (the primary jsr risk); (3) confirm no new `deno-lint-ignore`/`as unknown as` was introduced to green a wrapper, and no `deno.lock` churn.
