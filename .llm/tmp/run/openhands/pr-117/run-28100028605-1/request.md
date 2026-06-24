You are OpenHands running for the NetScript repository.

User task:
Trigger comment:
@openhands-agent model=openrouter/minimax/minimax-m3 provider=openrouter output=pr-comment iterations=200

use harness — **PLAN-EVAL for PR2 (package README revamp, PR #117).** You are the PLAN-EVAL evaluator, a separate session from the generator. Read `.llm/harness/evaluator/plan-protocol.md` + `.llm/harness/gates/plan-gate.md`, then evaluate the PR2 plan. Emit `PASS` or `FAIL_PLAN` with concrete reasons grounded in commands you ran, and write your verdict to `.llm/tmp/run/docs-readme-revamp/plan-eval.md` (commit it on this branch). Do NOT author any README — this is the plan gate only.

## MECHANICS (a prior run exhausted its iteration budget — be decisive)
Your #1 deliverable is the VERDICT FILE. Budget your steps: read the four artifacts once, run the
targeted live-page checks for the XREF claims, then WRITE `.llm/tmp/run/docs-readme-revamp/plan-eval.md`
and `git add` + `git commit` it on this branch (commit only that file). Do NOT exhaustively read all
31 package sources — this is the PLAN gate, not authoring. If you run low on budget, emit `PASS` or
`FAIL_PLAN` based on the evidence gathered so far rather than ending with no verdict. An incomplete run
with no verdict file is the worst outcome.

## SKILL
- `.agents/skills/netscript-harness` — phase model, plan-gate, evaluator protocol, verdict definitions.
- `.agents/skills/jsr-audit` — publish-surface / README-on-JSR rendering rubric.
- `.agents/skills/netscript-doctrine` — docs voice doctrine (no "honesty"/candor framing).
- `.agents/skills/rtk` — prefix read-heavy git/grep with `rtk`.

## What to read (branch `docs/readme-revamp`, PR #117)
- `.llm/tmp/run/docs-readme-revamp/research.md` — README inventory (31), cross-ref map, `/docs` reality, voice constraints.
- `.llm/tmp/run/docs-readme-revamp/plan.md` — locked decisions D1–D7, slices C0/C1/C2, gates, debt.
- `.llm/tmp/run/docs-readme-revamp/authoring-spec.md` — the RECONCILED C1 contract (D3 folded against the dossier) incl. the new ground-truth cross-ref precision notes XREF-1/2/3.
- `.llm/tmp/run/docs-readme-revamp/sota-readme-dossier.md` — the verified SOTA dossier (Track 1, the source the spec reconciles).

## Hard questions the verdict must answer
1. **Reconciliation soundness.** Does `authoring-spec.md` faithfully fold dossier Track 1? Are the THREE flagged NetScript overrides (`[OVERRIDE-1]` unversioned imports per D6, `[OVERRIDE-2]` D4 3-target Documentation section with no placeholder Discord, `[OVERRIDE-3]` no per-package maturity callout) each justified, or do any contradict doctrine / the publish surface?
2. **Cross-ref correctness (D4) — verify against the LIVE pages on this branch.** Is the package→reference+pillar map in `authoring-spec.md` accurate against the actual `docs/site/reference/**` page set and the pillar-hub `index.md` card grids? Specifically re-verify the three precision notes the spec now claims:
   - **XREF-1:** `streams` + `plugin-streams-core` route to `/durable-workflows/` (NOT `/background-processing/`). Confirm `docs/site/durable-workflows/index.md` carries an `API Reference: triggers and streams → /reference/streams/` card and that `docs/site/background-processing/index.md` does NOT cover streams.
   - **XREF-2:** `cli` has no pillar family → its Documentation section links `/reference/cli/` + a real scaffold tutorial, not a forced pillar. Confirm `/reference/cli/` exists and that no pillar hub claims cli.
   - **XREF-3:** hub-level family representation is meaningful — a pillar link passes when the hub discusses the package's family even if it links a sibling ref page (e.g. background-processing → `/reference/workers/` for workers/queue/cron/watchers). Is this a sound meaningfulness rule, or does it weaken D4?
   Are the 4 `-core` exceptions (plugin-workers/sagas/triggers/streams-core → sibling plugin ref + pillar) the right targets, and is DOC-REF-CORE-PAGES debt the correct disposition (vs. adding `-core` ref pages in this PR)?
3. **`/docs` removal scope (D5).** Is "strip dead `./docs/*.md` links + drop `docs/**/*.md` publish globs, no folder deletion" complete and correct? Is the publish-glob edit genuinely within the doc-authoring boundary (config, not framework source)?
4. **JSR rendering risk.** Will the skeleton render correctly on JSR (absolute links only, no relative paths, badge/`<picture>` caveats)? Flag any GitHub-only device that breaks on JSR.
5. **Eval mechanics (C2).** Is the link-verification gate (static resolve against `docs/site/**` + live HEAD + meaningfulness check) actually enforceable, or does it need a concrete tool/script the plan doesn't name? Does the meaningfulness check operationalize XREF-3 (accept hub-level family refs) without degenerating into the regex-name-match anti-pattern D4 forbids?
6. **Boundary.** Confirm the lane stays within the CLAUDE.md doc-authoring exception (no `packages/`/`plugins/` SOURCE edits beyond publish-glob config).

Be adversarial: if the cross-ref map has a wrong target, an override is weak, or the link gate isn't enforceable, that's `FAIL_PLAN`. Ground every claim in a command you ran against the live branch. Do NOT author any README — this is the plan gate only.


Issue/PR title: docs(readme-revamp): package + framework README revamp (PR2)

Operational contract:
- Read AGENTS.md first.
- Your iteration budget is limited. Create deliverable files in the repository
  workspace EARLY and grow them incrementally as you learn; never defer all
  writing to the end of the run. Uncommitted workspace files are committed back
  to the branch automatically when the run ends, even if you run out of budget.
- If the task says "use harness", follow .agents/skills/netscript-harness/SKILL.md.
- If the work touches packages/ or plugins/, use .agents/skills/netscript-doctrine/SKILL.md.
- Use rtk for read-heavy git/grep/gh/docker commands when it is available.
- Preserve user changes and avoid destructive git commands.
- Run the smallest validation that proves the change.
- Do not post GitHub issue or PR comments directly. The workflow owns GitHub comments.
- Write /home/runner/work/_temp/openhands/28100028605-1/summary.md before exit. Include Summary, Changes, Validation,
  Responses to review comments or issue comments when relevant, and Remaining risks.
- Do not write or reuse .llm/tmp/openhands/summary.md. Write only the run-scoped path
  from OPENHANDS_SUMMARY_PATH.
- If output_mode is thread-replies, optionally write /home/runner/work/_temp/openhands/28100028605-1/replies.json as
  an array of {"comment_id": number, "body": string} objects for PR review-thread replies.
- The workflow records durable trace metadata under .llm/tmp/run/openhands/pr-117/run-28100028605-1.

Trigger metadata:
- event: issue_comment
- issue_or_pr: 117
- is_pr: true
- output_mode: pr-comment
- selected_model: openrouter/minimax/minimax-m3
- selected_provider: OPENROUTER
- action_run: https://github.com/rickylabs/netscript/actions/runs/28100028605
