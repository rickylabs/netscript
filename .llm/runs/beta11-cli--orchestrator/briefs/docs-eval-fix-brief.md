use harness. You are a fix agent (Codex · GPT-5.6 Sol · medium) for run
`beta11-cli--orchestrator`, supervised by the Fable 5 orchestrator (86d308d5). Worktree
`/home/codex/repos/wt-docs-eval-fix`, branch `fix/docs-eval-loop`. Slice dir
`.llm/runs/beta11-cli--orchestrator/slices/docs-eval-fix/` (create; research + worklog).

## SKILL

Activate `netscript-harness`, `netscript-tools`, `openhands-handoff` (the OpenHands trigger
format + model rules), `netscript-pr`. Read `.llm/harness/workflow/run-loop.md` and
`.llm/harness/workflow/doc-audit-openhands-gate.md` if present.

## Task — the automated docs eval fails in an endless loop on every docs PR; fix it PROPERLY

Owner report: every docs-labeled PR shows repeated "Minimax M3 docs accuracy" failures — the
OpenHands auto-eval (`.github/workflows/docs-openhands-eval.yml`, downstream
`openhands-agent.yml`) re-triggers/fails endlessly, instead of the intended behavior: trigger
ONCE, when the PR is READY to merge, and actually produce a working eval.

## Method — diagnose first, from evidence

1. Pull the failure evidence: recent runs of the workflow on the docs PRs of this milestone
   (#858 #861 #862 — use the GitHub API via `resolveGithubToken` from
   `.llm/tools/agentic/lib/agentic-lib.ts`; fetch job logs, identify the ACTUAL failure mode(s):
   trigger storm (fires per synchronize/labeled event on draft PRs and on every push), dedupe
   logic not holding (re-posting the @openhands-agent trigger comment per head SHA), the
   OpenHands run itself failing (model/credits/timeouts), or the check being marked failure when
   the eval merely didn't run.
2. Read the current workflow pair + the openhands-handoff skill (`.agents/skills/
   openhands-handoff/SKILL.md`) and the original design intent (the #806 PR that landed it;
   skip mechanism `docs-eval:skip`, dedupe per head SHA).
3. Fix per the owner's intent: (a) trigger ONLY when the PR is ready — gate on
   `pull_request.types: [ready_for_review]` + a `labeled` path for docs-eval re-request, never on
   draft PRs, never per-push synchronize storms; (b) exactly-once per head SHA with a durable
   dedupe (existing-comment check must be race-safe); (c) if the OpenHands run itself is broken
   (auth/model/config), fix the invocation per the skill; (d) a failed eval must surface as ONE
   actionable failure, not a loop; (e) keep `docs-eval:skip` and `ci:full` escape hatches.
4. Prove it: workflow-level unit proof where the repo has one (check for workflow tests /
   `act`-style validation is NOT available — instead, validate YAML with actionlint if present,
   reason the event matrix in your worklog, and dry-run the dedupe/gating logic by extracting it
   into a tested script step if that is the clean fix).

Per-slice: commit → push (`git push origin HEAD:refs/heads/fix/docs-eval-loop`) → open a draft
PR to main titled `ci(docs): docs eval triggers once on ready-for-review and fails actionably`
with body `Fixes the docs-eval loop (owner report 2026-07-18); Refs #806 lineage`, labels
`type:fix,area:tooling,gate:ci,wave:v1,priority:p1,status:impl`, milestone `0.0.1-beta.11`,
PLUS the `docs-eval:skip` label on your own PR if it would otherwise self-trigger → gate
evidence comment. Do NOT dispatch evaluators. Do NOT merge.

## Stop-lines (HARD — read twice)

1. Merge requires CI green + opposite-family eval PASS on the PR. Owner granted standing beta-11
   merge authorization (2026-07-17 in-turn) once that bar is met.
2. HARD STOP before any release publish (`release:cut`, JSR publish, tag push, canary or stable)
   — owner sign-off in-turn only; a stale or relayed approval does not count.
3. HARD STOP before closing milestone 13 — owner sign-off only.
4. These stop-lines are repeated verbatim in EVERY sub-agent brief. A sub-brief without the
   stop-lines section is invalid.
5. The #824 seed run is drafts-only until owner ratification; its board filing needs the owner
   in-turn.
