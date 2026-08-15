# Drift Log: quality-scan-root-coverage

Drift is append-only. Record facts that diverge from the plan, RFC, doctrine, or current-state
documentation.

## 2026-08-15 — Launcher metadata pre-seeded the run directory

- **What:** The initial worktree check found the target run directory untracked because the agentic
  launcher had written `codex-thread-ids.md` before this session began.
- **Source:** Initial `git status --short --branch` and the launcher-authored file.
- **Expected:** A clean worktree before harness bootstrap.
- **Actual:** Only the target run directory was untracked; its sole file matched the requested
  thread, worktree, branch, baseline, and route.
- **Severity:** minor
- **Action:** accept
- **Evidence:**
  `.llm/runs/release-0.0.7-internals--orchestration/slices/quality-scan-root-coverage/codex-thread-ids.md`

## 2026-08-15 — Historical doctrine-root omission is already repaired

- **What:** Live base research found that the issue's historical hand-maintained `arch:check` root
  omission no longer exists.
- **Source:** `deno.json:163-164`; `.llm/tools/fitness/check-doctrine.ts:26-42,86-104`;
  `.llm/tools/fitness/check-doctrine_test.ts:23-32`.
- **Expected:** Carried-in evidence named `packages/plugin-streams-core` as absent from an
  `arch:check` root list.
- **Actual:** Both doctrine tasks use dynamic `--all-roots`; tests require 36 top-level units and
  explicitly require Streams. The live defect is the narrow `quality:scan` task plus the lack of a
  published-member coverage invariant.
- **Severity:** minor
- **Action:** accept and narrow the plan
- **Evidence:** `research.md` findings F1, F3, and F5.

## Coordinator amendment and blocked evaluator route — 2026-08-15

**Amendment recorded.** The 2026-08-15 reset dispatch does not pre-dispatch Fable 5; it requires a
coordinator amendment recording a genuinely architectural PLAN question. The coordinator granted
that amendment for this leaf on 2026-08-15, on the grounds that the plan defines the fail-closed
published-member **denominator** and **ancestry semantics** for what a cross-repository merge gate
proves, reconciles **35 published members against 36 doctrine roots**, and must preserve the
intentional CLI-E2E exclusion without recreating a silent gap. The bound route was therefore native
Claude **Fable 5 (`fable-5`), effort `medium`**, `/remote-control` — the canonical
`formal_plan_evaluation` Claude binding in `routing-policy.ts`.

| ID  | Kind                    | Exact evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Disposition                                                                                                                                                                                                                                                                                                                                                                          | State                                                                                                                                                                                                                                                                                                                                                                                                   |
| --- | ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D-1 | Blocked evaluator route | The granted Fable 5 PLAN-EVAL session `fdfe4f7c-f2a7-4ed1-b605-3d28c59fac7a` (bridge `cse_01DuK4jWPPEMMQmgLnqpknDA`, cwd this worktree) reached `state: failed` with `There's an issue with the selected model (fable-5). It may not exist or you may not have access to it.` `respawnFlags` confirm the requested route was exactly `--model fable-5 --effort medium --remote-control`; `tokens: null` and `cliVersion: null` show it failed **before inference**, so no cost and no output. This repeats the `model_not_found` outcome this lane already recorded on 2026-08-13T20:42:11Z for the same model. | **No substitution.** The reset dispatch forbids silent substitutes, and the amendment authorized Fable specifically, so an Opus or OpenRouter fallback would require a fresh coordinator decision rather than a supervisor judgement call. The failed session was stopped, and the leaf head, worktree, run artifacts, and PR were verified untouched. Escalated to the coordinator. | **Classified by the coordinator as transport/model-unavailable drift — explicitly NOT PLAN-EVAL cycle 1.** No gate cycle was consumed: zero tokens, no inference, no verdict, no artifact, no PR comment, no repository mutation. The formal PLAN-EVAL that follows on the owner-default native Opus 5 route is therefore **cycle 1**, not cycle 2, and the two-failure eval loop counter is untouched. |

Plan head `da76d9d8440a969f0715ca035ea6304bbf039efd` remains the immutable PLAN-EVAL target; local,
remote, and PR head all still equal it. Implementation remains prohibited until a `PASS` is recorded
in `plan-eval.md`.

### Route amendment 2 — 2026-08-15

Owner policy defaults formal gates to **native Opus 5**. After the Fable transport failure the
coordinator amended the route for this gate to native Claude **Opus 5, effort `medium`**, Remote
Control enabled, evaluating the immutable plan head `da76d9d8440a969f0715ca035ea6304bbf039efd`. The
Fable amendment above remains recorded as the rationale that was granted and attempted; it is
superseded for execution only, not withdrawn as a judgement about the plan's architectural weight.
