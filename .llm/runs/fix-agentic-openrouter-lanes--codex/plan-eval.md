# PLAN-EVAL — fix-agentic-openrouter-lanes--codex

- Plan evaluator session: Claude Opus 4.8 (opposite-family local PLAN-EVAL), 2026-07-12
- Run: `fix-agentic-openrouter-lanes--codex`
- Surface / archetype: `.llm/tools/agentic` internal CLI/runtime tooling · Archetype 6 (CLI / Tooling)
- Scope overlays: none

## Checklist results

| Plan-Gate item                          | Result | Evidence / location |
| --------------------------------------- | ------ | ------------------- |
| Research present and current            | PASS   | `research.md` §Re-baseline: carried-in `dashboard-design--orchestrator/run-eval.md` re-derived against `main` @ `ec61dc78` on 2026-07-12; bootstrap `f5dba45e`. Spot-checked 3 load-bearing findings against tree (see below) — all confirmed. |
| Decisions locked                        | PASS   | `plan.md` §Locked Decisions D1–D5, each with rationale (profile materialization/Responses-only, truthful exit-0, typed finite capability data, exhaustive credential-free canaries, live-turn-is-only-viability-proof). |
| Open-decision sweep                     | PASS   | `plan.md` §Open-Decision Sweep: 2 "must resolve now" (Codex-vs-Claude lane; OpenRouter Anthropic base/model mapping) + 1 "safe to defer" (remote control). Evaluator sweep found no unflagged rework-forcing decision; slice ordering isolates deterministic work (Slice 1) from the live-probe resolution (Slice 2). |
| Commit slices (< 30, gate + files each) | PASS   | `worklog.md` §Design/Commit Slices: 3 ordered slices, each names proof + gate + files (launcher/exit/thread; live GLM lane + support boundaries; exhaustive preset canary). |
| Risk register                           | PASS   | `plan.md` §Risk Register (5 risks: secret leak, spend, CLI drift, false-green canary, lock churn) + §Anti-Patterns (AP-11/25/18/24). |
| Gate set selected                       | PASS   | `plan.md` §Fitness Gates: Static, universal F-1/F-3/F-5/F-10/F-11/F-12/F-15..F-19, F-CLI-1..31 (reviewed), Runtime (live canary), Consumer — matches Archetype 6 column. Note on F-2/F-4 below. |
| Deferred scope explicit                 | PASS   | `plan.md` §Non-Scope (#582 promotion, native Claude remote, PR #685) + `worklog.md` §Deferred Scope. |
| jsr-audit surface scan (pkg/plugin)     | N/A    | `research.md` §jsr-audit: internal `.llm/tools/agentic` tooling, no package export / JSR publish surface. Correct N/A with reason. |

## Spot-check evidence (load-bearing findings vs. tree)

- **Finding 2 (false exit-1 on success):** confirmed — `codex/launch-codex-slice.ts:468-471`, `await child.status` then `WARN: no thread id captured` → `Deno.exit(1)` regardless of a completed turn.
- **Finding 3 (profile renderer already correct, launcher must materialize):** confirmed — `runtime/adapters/codex-profile-adapter.ts:7-8` emits `netscript-openrouter.config.toml`; L52 emits `wire_api = "responses"`.
- **Finding 4 (Claude adapter hard-codes unimplemented):** confirmed — `runtime/adapters/claude-adapter.ts:78` "Claude launch and resume are not implemented by the S3 static-smoke adapter".
- **Finding 6 (preset registry):** confirmed — `runtime/provider-profiles.ts:102/126` `OPENROUTER_PRESET_IDS` / `OPENROUTER_PRESETS`; volatile base URLs imported from `config/` (L42-43), consistent with the no-hardcoded-volatile guard.

## Open-decision sweep (evaluator-run)

None unflagged. The two lane-viability unknowns are correctly marked "must resolve now" and are resolved by bounded live probes inside Slice 2; Slice 1 (deterministic launcher profile/exit/thread fixes) carries no dependency on that resolution, so deferring the probe does not force Slice 1 rework. The "both lanes prove incompatible" case is a genuine capability unknown (a rescope trigger, not a deferred decision) and is bounded by D5 + the mission's "at least one lane" acceptance.

## Verdict

`PASS`

## Notes

- **F-2 / F-4 (non-blocking):** the enumerated Fitness Gates list skips F-2 (helper-reinvention scan) and F-4 (inheritance audit), which the matrix marks `required` for Archetype 6 and are not package-only. During implementation, record manual/`PENDING_SCRIPT` evidence for both (both are low-risk on this data-first surface), and explicitly mark the package-publishability gates F-6/F-7/F-8/F-9 as `N/A (internal tooling)` — consistent with the accepted N/A jsr-audit scan — so IMPL-EVAL has an unambiguous gate ledger.
- Acceptance discipline is sound: D5 ("empty exit-0 is not success") plus the required redacted live GLM turn is the correct, non-stubable proof for the lane-viability findings. Keep the live transcript (key-redacted) in this run dir per the brief.
- Lock hygiene (`--no-lock`, diff inspection per commit) and secret handling (private child shell, redacted evidence only) are correctly pre-committed in the Risk Register.
