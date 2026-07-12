# PLAN-EVAL — quality-q751-workers-core--codex

- Plan evaluator session: Anthropic Opus 4.8, high effort (separate opposite-family session; implementer is GPT-5.6 Sol) — 2026-07-12
- Run: `quality-q751-workers-core--codex`
- Surface / archetype: `packages/plugin-workers-core` — Archetype 3 (Runtime / Behavior)
- Scope overlays: none

## Checklist results

| Plan-Gate item                          | Result | Evidence / location |
| --------------------------------------- | ------ | ------------------- |
| Research present and current            | PASS   | `research.md` §Re-baseline re-derives the rejected commit `006c859a` (14 allowances) against `main` @ `3b3d615b`; clean baseline stated as 50 findings / 0 allowances. **Spot-checked and confirmed against the tree**: scanner returns exactly `ok:false`, 50 findings, `allowCount:0` across 14 files. |
| Decisions locked                        | PASS   | `plan.md` §Locked Decisions D1–D6 each carry rationale (0-allowance target, `z.input`/`z.output` derivation, immutable builder typestate, upstream stream generics, canonical ports, no single-cast loophole). |
| Open-decision sweep                     | PASS   | `plan.md` §Open-Decision Sweep lists both open items ("does any allowance survive", "is oRPC doc-lint debt fixed") as safe-to-defer with notes. My independent sweep (below) found no rework-forcing deferral. |
| Commit slices (< 30, gate + files each) | PASS   | `worklog.md` §Design slice table: 3 ordered slices, each naming its proving gate and file globs. All 50 findings map onto exactly one slice (see Notes). Well under 30. |
| Risk register                           | PASS   | `plan.md` §Risk Register: 5 risks (Zod default/coerce variance, builder state loss, canonicalization breaking consumers, upstream producer overload narrowing, `deno.lock` churn) each with a concrete mitigation. |
| Gate set selected                       | PASS   | `plan.md` §Fitness Gates + §Validation Plan cover the Archetype-3 required set: static (scanner/check/lint/fmt/publish/doc-lint), fitness F-1–F-19 (`arch:check`), runtime (package `deno task test`, grounded by real `tests/runtime/*`, `tests/executor/*`, `tests/contracts/*`), and conditional consumer/public-surface checks. Lock-diff gate included. |
| Deferred scope explicit                 | PASS   | `plan.md` §Non-Scope + §Deferred Scope + §Hidden Scope: no behavior redesign, no export-map change, pre-existing oRPC doc-lint private-type debt left intact, no scaffold/release surface. |
| jsr-audit surface scan (pkg/plugin)     | PASS   | `research.md` §"jsr-audit surface scan" scans all 17 `deno.json` exports, names slow-type risks (concrete Zod return/`z.input`/`z.output` aliases, oRPC route annotations must not widen IO, import-not-redeclare upstream stream types), no export-map change; baseline `deno publish --dry-run` = PASS, 0 slow types (**re-confirmed on tree: "Dry run complete / Success"**). |

## Open-decision sweep (evaluator-run)

No rework-forcing open decision found.

- **Allowance survival** — decidable only during implementation; target 0, ceiling 5, each survivor requires a documented structural impossibility and independent review. Deferring cannot force rework: allowances are subtractive, not architectural.
- **Runtime identity vs adapter (D5)** — the "add stable `id`/capability to the concrete impl, or use a typed adapter" choice is bounded per-collaborator and does not branch the plan; either resolution preserves behavior. Confirmed `ShutdownManager`/`WorkflowExecutor` are concrete classes that the composition currently reaches via `as unknown as` port casts, so both resolutions are available.
- **Consumer breakage scope** — plan preserves export names/structural shapes and runs a root public-surface check plus compiler-identified consumer checks; conditional selection is sound for a type-only boundary change and does not force rework.
- **oRPC doc-lint debt** — pre-existing (`workers-contract-structural-server-export`, arch-debt.md:1057), explicitly out of scope; deferral is bookkeeping-neutral.

## Verdict

`PASS`

## Notes

- **Finding→slice coverage (verified exhaustively).** The 50 scanner findings partition cleanly across the three slices:
  - Slice 1 (`config/*`, `contracts/v1/*`, `streams/*`): config 6 + contract-definition 1 + contract-schemas 11 + contract-types explicit-any 1 + streams 4 = **23**.
  - Slice 2 (`builders/*`, `public/root.ts`): job 6 + task 6 + workflow 4 + root 3 = **19**.
  - Slice 3 (`runtime/*`, `testing/*`): composition-root 5 + job-fixtures 3 = **8**.
  - Total 50, no orphan finding. The research bucket counts (builders 16, config+contract-schemas 17, streams 4, composition 5) all reconcile.
- **Load-bearing spot-checks confirmed against the tree:** scanner 50/0/14 exact; upstream `defineStreamSchema`/`createDurableStream`/`DurableStreamProducer`/`StateSchema` exported from `plugin-streams-core/mod.ts` (finding #5 basis real); debt entry `workers-contract-structural-server-export` present; 17 export keys; publish dry-run green.
- **Evaluator separation honored:** this Opus 4.8 session is opposite-family to the GPT-5.6 Sol implementer recorded in `supervisor.md`; owner's no-PR directive and high-effort lane override are recorded in `drift.md`. No PR opened; the sole write this session made is this file.
- **Carry-forward for IMPL-EVAL (not plan-gate blockers):** (1) The Archetype-3 runtime gate is satisfied via existing package runtime tests staying green — IMPL-EVAL should confirm those tests actually exercise start/stop/failure paths (`tests/runtime/*`, `tests/executor/*`) rather than only typechecking, per the Arch-3 false-done state. (2) `deno task test` targets `tests/` only; the co-located `src/**/*_test.ts` (e.g. `kv-worker-idempotency-store_test.ts`) is outside that glob — if a slice touches its typing, run it explicitly. (3) Enforce D6: any single cast introduced to green the scanner token is a review-blocking finding, and `quality:scan` + `arch:check` must run in the Tier-A slice review, not the scoped wrappers alone.
