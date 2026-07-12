# PLAN-EVAL — quality-q753-runtime--codex

- Plan evaluator session: Claude · Anthropic · Opus 4.8 · high (separate opposite-family PLAN-EVAL) — 2026-07-12
- Run: `quality-q753-runtime--codex`
- Surface / archetype: Ten scoped package/plugin roots; Archetypes 2 (integration) + 3 (runtime/behavior) + 4 (public DSL) + 5 (plugin)
- Scope overlays: none

## Checklist results

| Plan-Gate item                          | Result | Evidence / location |
| --------------------------------------- | ------ | ------------------- |
| Research present and current            | PASS   | `research.md` §Re-baseline: carried-in suppression pass rejected, hard-reset to mandated base `3b3d615b`. I confirmed `HEAD = 3b3d615bb535…` and reproduced the base scan (see below). |
| Decisions locked                        | PASS   | `plan.md` §Locked Decisions D1–D6, each with rationale (hard-reset base, proper-typing-not-re-cast, `$queryRawUnsafe` for plain strings, allowance-requires-named-conflict, preserve API/behavior, byte-identical `deno.lock`). |
| Open-decision sweep                     | PASS   | `plan.md` §Open-Decision Sweep marks 3 items; the only "must resolve now" (public API/deps) is resolved to "none". My independent sweep found no rework-forcing open decision (see below). |
| Commit slices (< 30, gate + files each) | PASS   | `plan.md` §Commit Slices: 3 ordered slices, each with a Proving-gate column and a Files column; slice 1 packages, slice 2 plugin contract + saga persistence, slice 3 durable streams + acceptance. |
| Risk register                           | PASS   | `plan.md` §Risk Register: 5 risks with concrete mitigations (call-shape preservation, exported-alias use, guard strength, per-slice gating, derive-before-allow). |
| Gate set selected                       | PASS   | `plan.md` §Fitness Gates + §Validation Plan: F-1–F-19 per matrix, F-6 per-unit `publish --dry-run`, F-7 per-unit `doc:lint`, code-quality acceptance scanner `--max-allow 6`, `arch:check`, lock-hygiene diff. Matches `archetype-gate-matrix.md` for Arch 2/3/4/5. |
| Deferred scope explicit                 | PASS   | `plan.md` §Non-Scope + `worklog.md` §Deferred Scope: no features/exports/dep changes/migrations; connector-convergence work stays under existing debt (`arch-debt.md` `triggers-connector-sound-deferred`, `streams-connector-sound-deferred`, owner #172). |
| jsr-audit surface scan (pkg/plugin)     | PASS   | `research.md` §"jsr-audit surface scan": all ten export maps scanned; public names unchanged, no upstream re-export; slow-type risks named (durable-stream factory generics, oRPC builder/error-map inference, mysql2 dynamic imports); each mapped to a slice; publish + doc:lint gate per unit. |

## Open-decision sweep (evaluator-run)

No open decision would force rework if deferred:

- **Acceptance scanner root set** is not written as a literal command in `plan.md`, but it is deterministic and reproducible: only the ten-root set (`packages/{queue,kv,database,cron,logger,prisma-adapter-mysql,plugin}` + `plugins/{sagas,triggers,streams}`) yields the recorded baseline of **31 findings / 12 allowances**. Not rework-forcing; noted below for the worklog.
- **`$queryRaw` → `$queryRawUnsafe` (D3)** is a locked decision with rationale, not an open one. It is a slight tension with D5 ("preserve runtime behavior") because it changes the Prisma method, but it is the semantically correct boundary for a plain string (the current code forges a `TemplateStringsArray`); left to IMPL-EVAL to confirm parity via tests.
- **Whether any allowance survives** is correctly marked safe-to-defer: each survivor must name an upstream declaration conflict, ceiling is `--max-allow 6`, target is zero.

## Verdict

`PASS`

## Notes

Spot-checks against the tree (all load-bearing findings verified):

1. **Baseline (finding #1) — exact match.** `deno run .llm/tools/quality/scan-code-quality.ts` over the ten roots returns `findings=31, allowCount=12`; with `--max-allow 6` it reports `ok:false` / `allowLimitExceeded{limit:6,count:12}`, exactly as `research.md`/`worklog.md` claim. Findings concentrate in packages (queue 9, kv 7, database 4, prisma-adapter-mysql 4, plugin 3, cron 2, logger 2); all 12 allowances are in `plugins/sagas` (8) and `plugins/triggers` (4).
2. **Timer casts (finding #2) — confirmed.** `setInterval(...) as unknown as number` / `setTimeout(...) as unknown as number` in `packages/cron/adapters/memory.adapter.ts` (lines 127, 202) and `packages/kv/adapters/memory.adapter.ts` (lines 325, 411, 489). `ReturnType<typeof setInterval>` is a valid typed replacement.
3. **Forged `TemplateStringsArray` (finding #4) — confirmed.** `$queryRaw(query as unknown as TemplateStringsArray, ...params)` in mssql/mysql/postgres adapters; D3's `$queryRawUnsafe` boundary is the correct upstream API for a string.
4. **`defineStreamSchema` (finding #8) — confirmed.** `packages/plugin-streams-core/src/builders/define-stream-schema.ts:26` declares `defineStreamSchema<TDef extends StreamStateDefinition>(collections: TDef): StateSchema<TDef>`, so trigger/saga stream types can be derived from the factory return type rather than hand-written parser facades.

Non-blocking observations for the implementer / IMPL-EVAL (none unchecks a box):

- Record the **literal acceptance command** (the ten `--root` flags + `--max-allow 6`) in `worklog.md` so IMPL-EVAL measures against the identical surface.
- `research.md` finding #8 says "four durable-stream allowances"; the scan shows six durable-stream allowances total (sagas 2 + triggers 4) — "four" matches the triggers subset only. Immaterial since the target is zero allowances.
- `packages/plugin-streams-core` itself carries 4 in-repo scanner findings but is **excluded** from both the acceptance root set and the plan scope (it is referenced only for `deno doc` inspection). This is consistent with the owner's acceptance gate; consider naming it explicitly as deferred so it is not mistaken for an oversight.
- Owner constraints honored by the plan: proper typing over suppression (zero-allowance target, D2/D4), no PR creation (`supervisor.md`/`drift.md`), byte-identical `deno.lock` (D6). No product source was modified before this gate (`git status` shows only the untracked run dir).
