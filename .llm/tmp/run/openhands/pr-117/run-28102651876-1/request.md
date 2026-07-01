You are OpenHands running for the NetScript repository.

User task:
Trigger comment:
@openhands-agent model=openrouter/minimax/minimax-m3 provider=openrouter output=pr-comment iterations=250

use harness — **PLAN-EVAL for PR2 (package README revamp, PR #117).** Separate-session plan gate. Two prior runs exhausted their iteration budget by over-exploring. This prompt is deliberately narrow: your ONLY deliverable is the verdict file. Budget hard.

## MECHANICS — read first, do exactly this, then STOP
1. Read 4 files ONCE (no re-reads): `.llm/tmp/run/docs-readme-revamp/{plan.md,authoring-spec.md,research.md}` and `.llm/harness/gates/plan-gate.md`. Skim `sota-readme-dossier.md` headings only.
2. Run ONLY these targeted live-page checks (do NOT inspect all 31 packages, do NOT read package sources — this is a PLAN gate, not authoring):
   - `ls docs/site/reference/` (confirm the page set exists)
   - `sed -n '1,25p' docs/site/durable-workflows/index.md` (confirm it references streams + a `/reference/streams/` card → validates XREF-1)
   - `sed -n '1,20p' docs/site/background-processing/index.md` (confirm it does NOT cover streams → validates XREF-1)
   - `ls docs/site/reference/cli docs/site/tutorials` (confirm cli ref + tutorials exist → validates XREF-2)
3. WRITE `.llm/tmp/run/docs-readme-revamp/plan-eval.md` with a `PASS`/`FAIL_PLAN` verdict + a short evidence line per question below, then `git add` that one file, `git commit`, and STOP. Do not explore further. **A run that ends without a committed verdict file is a total failure — emit the verdict even if you must base it on the evidence gathered so far.**

## SKILL
- `.agents/skills/netscript-harness` — plan-gate, evaluator protocol, verdict definitions.
- `.agents/skills/jsr-audit` — README-on-JSR rendering rubric.
- `.agents/skills/netscript-doctrine` — docs voice (no "honesty"/candor framing).

## The plan author has ALREADY ground-truth-verified the cross-ref map
`authoring-spec.md` records three precision notes the author verified against the live pages on this branch:
- **XREF-1** streams + streams-core → `/durable-workflows/` (NOT background-processing).
- **XREF-2** cli has no pillar → `/reference/cli/` + a real scaffold tutorial.
- **XREF-3** hub-level family reference is meaningful (a pillar link passes when the hub discusses the package's family).
Your job is to JUDGE soundness + SPOT-CHECK (via the step-2 commands), not to re-derive the whole map.

## Verdict must answer (one short evidence line each — be decisive)
1. **Cross-ref soundness.** Do the step-2 spot-checks confirm XREF-1 and XREF-2? Is XREF-3's "hub-level family ref is meaningful" rule sound, or does it weaken D4's anti-name-match requirement into a loophole?
2. **Overrides justified.** Are the 3 NetScript overrides in authoring-spec.md ([OVERRIDE-1] unversioned imports per D6, [OVERRIDE-2] 3-target Documentation section + no placeholder Discord, [OVERRIDE-3] no per-package maturity callout) each justified vs. doctrine + the JSR publish surface?
3. **Link gate enforceable (C2).** Is the link-verification gate (static resolve against `docs/site/**` + meaningfulness check) actually enforceable as described, or does it need a concrete script the plan fails to name?
4. **Boundary + `/docs` removal.** Does the lane stay within the CLAUDE.md doc-authoring exception (no `packages/`/`plugins/` SOURCE edits beyond the `docs/**/*.md` publish-glob config edit in D5)? Is D5's "strip dead links + drop publish globs, no folder deletion" correct?

If a cross-ref claim is wrong, an override is weak, or the link gate is not enforceable → `FAIL_PLAN`. Otherwise `PASS`. Do NOT author any README.


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
- Write /home/runner/work/_temp/openhands/28102651876-1/summary.md before exit. Include Summary, Changes, Validation,
  Responses to review comments or issue comments when relevant, and Remaining risks.
- Do not write or reuse .llm/tmp/openhands/summary.md. Write only the run-scoped path
  from OPENHANDS_SUMMARY_PATH.
- If output_mode is thread-replies, optionally write /home/runner/work/_temp/openhands/28102651876-1/replies.json as
  an array of {"comment_id": number, "body": string} objects for PR review-thread replies.
- The workflow records durable trace metadata under .llm/tmp/run/openhands/pr-117/run-28102651876-1.

Trigger metadata:
- event: issue_comment
- issue_or_pr: 117
- is_pr: true
- output_mode: pr-comment
- selected_model: openrouter/minimax/minimax-m3
- selected_provider: OPENROUTER
- action_run: https://github.com/rickylabs/netscript/actions/runs/28102651876
