You are OpenHands running for the NetScript repository.

User task:
Trigger comment:
@openhands-agent model=openrouter/minimax/minimax-m3 provider=openrouter output=pr-comment iterations=800

use harness

You are running a **PLAN-EVAL** (separate evaluator session) for the docs v3 Information-Architecture
plan on PR #105, branch `docs/v3-ia-plan`. You are the gate. The generator does not self-certify; you
render the verdict.

## SKILL

Activate and follow these repo skills before acting (read each `SKILL.md`; if a skill is named but
absent from `.claude/skills/`, read `.agents/skills/<name>/SKILL.md`):

- `netscript-harness` — PLAN-EVAL protocol, Plan-Gate, run artifacts, verdict vocabulary. Read
  `.llm/harness/evaluator/plan-protocol.md`, `.llm/harness/gates/plan-gate.md`,
  `.llm/harness/evaluator/verdict-definitions.md`, and the `SCOPE-docs.md` overlay.
- `netscript-pr` — house format for posting the PLAN-EVAL verdict comment (status token line +
  findings + next), label taxonomy.
- `netscript-doctrine` — only insofar as the plan claims to describe shipped package/plugin surface;
  use `deno doc` to spot-check any capability the plan promises to document.
- `netscript-tools` — raw git verification of branch/PR state and the run-artifact paths.
- `rtk` — token-compressed git/grep/ls reads.

## What to evaluate

The deliverable under review is a **planning-only** artifact set (no doc prose, no framework code).
On branch `docs/v3-ia-plan`, read everything under:

- `.llm/tmp/run/docs-v3-ia-plan--supervisor/research.md`
- `.llm/tmp/run/docs-v3-ia-plan--supervisor/doc-architecture-v3.md`
- `.llm/tmp/run/docs-v3-ia-plan--supervisor/plan.md`
- `.llm/tmp/run/docs-v3-ia-plan--supervisor/ground/leakage-diagram-barraising.md`
- `.llm/tmp/run/docs-v3-ia-plan--supervisor/ground/playground-showcase-map.md`

The intent: take the live documentation site from an "accurate but structurally flat" v3 baseline to
**production-grade public documentation** on par with Medusa, Astro, Laravel, and TanStack.

## How to evaluate

Run the standard PLAN-EVAL per `plan-protocol.md` + `plan-gate.md` with the `SCOPE-docs` overlay.
Beyond the checklist, evaluate this as an unconstrained adversary: find every way the plan is wrong,
incomplete, internally inconsistent, ungrounded, or below a production-grade public-documentation bar.
Do not limit yourself to the categories the plan anticipates. Verify the plan's factual claims against
the actual repository surface on this branch (`deno doc`, export maps, scaffold output) — in
particular whether the public surfaces the plan promises to document actually exist and whether the
tutorial tracks describe apps that can really be built on current `main`. Confirm or refute the plan's
own self-correction that the auth packages exist. Judge whether the IA, the four tutorial tracks, the
design-system/diagram/xref workstreams, and the public-voice cleanup actually close the stated gap or
merely restate it.

You decide the verdict on the merits. Nothing here is a hint about what you should or shouldn't find.

## Output

- Write your full verdict to `.llm/tmp/run/docs-v3-ia-plan--supervisor/plan-eval.md` in the repo and
  commit it to branch `docs/v3-ia-plan` (do not churn `deno.lock`; do not edit `reference/**` or any
  doc prose; planning artifacts only).
- Post ONE PLAN-EVAL comment on PR #105 in the house format, leading with
  `**[PHASE: PLAN-EVAL] [VERDICT: APPROVED|CHANGES_REQUESTED]**`, followed by numbered findings
  (each with severity, location, and the concrete change required) and a short `### Next` section.
- Emit the harness verdict token: **PASS** or **FAIL_PLAN**. No authoring/build run may begin before
  PASS. If FAIL_PLAN, the findings must be specific enough to action without a second round-trip.


Issue/PR title: docs: v3 IA plan — production-grade public docs (planning, draft)

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
- Write /home/runner/work/_temp/openhands/27907934927-1/summary.md before exit. Include Summary, Changes, Validation,
  Responses to review comments or issue comments when relevant, and Remaining risks.
- Do not write or reuse .llm/tmp/openhands/summary.md. Write only the run-scoped path
  from OPENHANDS_SUMMARY_PATH.
- If output_mode is thread-replies, optionally write /home/runner/work/_temp/openhands/27907934927-1/replies.json as
  an array of {"comment_id": number, "body": string} objects for PR review-thread replies.
- The workflow records durable trace metadata under .llm/tmp/run/openhands/pr-105/run-27907934927-1.

Trigger metadata:
- event: issue_comment
- issue_or_pr: 105
- is_pr: true
- output_mode: pr-comment
- selected_model: openrouter/minimax/minimax-m3
- selected_provider: OPENROUTER
- action_run: https://github.com/rickylabs/netscript/actions/runs/27907934927
