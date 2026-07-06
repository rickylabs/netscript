# Owner batch — beta.5 overnight run — MORNING SUMMARY (final, 2026-07-06)

## TL;DR

**Beta.5 is cut-ready.** All chartered steps are complete: 11 PRs merged (all single-loop
IMPL-EVAL'd, adversarially reviewed, CI-green incl. scaffold gates), the eis-chat validation gate
ran (its sole blocker was owner-moved to beta.6 as #494), and no gate blockers remain on the
0.0.1-beta.5 milestone from this run. What's left is the cut itself (owner executes
`release:cut`) + the e2e-cli-prod re-proof at cut.

## Merged this run (final)

| PR | Scope | Main sha |
| --- | --- | --- |
| #487 | CI skip-expensive lanes (owner addendum 2) | 37e6818c |
| #484 | #305 doctrine quick-win | 7ce447d7 |
| #486 | #306 harness+skills revamp | — |
| #485 | #307 stale-code W2+W4 | — |
| #488 | #219 FA-fix (streamPath + identity-encoding + Vite contract) | 927ad485 |
| #492 | #479 AI reference docs (3 pages + cross-links) | f89623a2 |
| #491 | #346 deploy S10 cloud targets (Refs #346, scope remains) | 3aa4d77d |
| #489 | #402 T1 telemetry convention (closes #402) | f88847d0 |
| #490 | #347 deploy S11 CI templates + cache hardening (closes #347) | a227bc93 |
| #483 | #303 enterprise surface sweep (Refs #303, partial by design) | 5baa0250 |
| #493 | #403 telemetry T2 ports/adapters restructure (closes #403) | f91dc503 |

## Step 3 — eis-chat validation gate (ran, GATE-FAIL → resolved)

18-row coverage matrix vs eis-chat@master with a compile+run probe. Core verdict: durable chat,
abort, 4 providers, registry/BYOK, tools, agent loop, persistence, embeddings, MCP core all
COVERED — the `@netscript/fresh/ai` durable plane *exceeds* eis-chat's hand-rolled equivalents.
Sole blocker (per-turn generation options + reasoning unreachable via shipped adapters) filed as
**#494** and owner-moved to **beta.6** → beta.5 unblocked. Full findings filed as **#494–#501**
(1 beta.6, 5 stable, 2 backlog) + anti-scope list in the worklog.

## Needs-user decisions (carried)

1. **#305 full-rewrite scope** — only the quick-win shipped (#484); 12-chapter rewrite needs scoping.
2. **#307 Wave 5** — deferred by design (W3 was blocked on #305).
3. **#345 (Deploy S9)** — parked per owner audit (deferred to stable).
4. **#346 reconciliation** — S10 merged with `Refs`; decide close-vs-remaining-scope on the issue.
5. **#348 (Deploy S12)** — held during quota outage; beta.5 or slip? Brief prepared, ready to launch.
6. **Label/gate drift** — `area:harness` missing; `e2e-cli-gate` vs `gate:e2e` naming drift.
7. **Codex quota is a binding overnight constraint** — outage #2 held until Jul 7 03:52; the entire
   run's implementation lanes rode the Opus fallback (drift-recorded). Consider a second seat or
   off-hours budgeting if overnight runs continue.
8. **Windows-only `plan-init_test.ts` path-sep follow-up** — candidate issue, not yet filed.
9. **IMPL-EVAL model drift note** — #493's eval ran on repo-default Kimi K2.6 (missing `--model`
   flag on dispatch; owner accepted). Consider pinning the default model in the OpenHands workflow
   so a bare `@openhands-agent` cannot silently downgrade the lane binding.

## Release cut checklist (owner executes)

- [ ] `release:cut` per skill (clean sibling worktree; env-split deno-Windows/gh-WSL).
- [ ] e2e-cli-prod re-proof green after publish (hard release gate).
- [ ] publish.yml all-31 green.
- [x] Run artifacts pushed via chore-branch PR (this PR).
- [x] All beta.5 program PRs merged; no gate blockers on the milestone from this run.

## Evaluator-artifact pattern (process note for future evals)

Three of this run's four FAIL verdicts contained evaluator artifacts requiring independent
verification before acting: a hallucinated finding, a stale-baseline two-dot diff (T1 additions
misread as #483 deletions), and a per-file doc-lint invocation false-flag (#493). The
verify-before-obey discipline (merge-base + full-root reproduction) is now recorded in the
worklog; consider folding an explicit "baseline + invocation discipline" preamble into the eval
prompt template (done ad hoc for #493's dispatch — it prevented a repeat stale-baseline artifact
but not the doc-lint one).
