You are OpenHands running for the NetScript repository.

User task:
Trigger comment:
@openhands-agent model=openrouter/minimax/minimax-m3 output=pr-comment

# PLAN-EVAL (harness Plan-Gate, hard gate) — docs v3 IA plan

You are the **PLAN-EVAL** evaluator for this planning PR. This is a separate-session evaluator pass
**before** any implementation. Render an independent verdict — **do not assume the plan is correct, and
do not let the author's framing orient you.** Read the artifacts, apply the protocol and the Plan-Gate
checklist, and judge.

A previous PLAN-EVAL run crashed (workflow failure) before rendering a verdict; this is a clean re-run.

## What to read (all on this PR branch `docs/v3-ia-plan`)

Run directory: `.llm/tmp/run/docs-v3-ia-plan--supervisor/`
- `plan.md` — the plan (locked decisions D1–D4, open-decision sweep §2a, workstreams §3, ordered commit
  slices §4, executable gate table + leakage-scanner spec §5).
- `research.md` — research + baseline + reproducibility section.
- `doc-architecture-v3.md` — the locked IA tree, hub template, tutorial tracks, diagram/xref systems.
- `worklog.md` — contains the `## Design` checkpoint.
- `drift.md`, `commits.md` — harness artifacts.
- `surface-inventory.md` — 32-unit / 242-subpath public-surface classification matrix.
- `hub-content-contracts.md` — per-capability content contracts for the 8 complex hubs.
- `tutorial-proof-plans.md` — proof-or-rescope gates for the ungrounded tutorial tracks.
- `codex-panel-findings.md` — a prior unoriented adversarial panel's findings (3 blockers / 6 majors /
  1 minor). You may use it as one input, but **form your own verdict**; do not treat the author's claim
  that those findings are "resolved" as established.
- `ground/leakage-diagram-barraising.md`, `ground/playground-showcase-map.md` — grounding.

## Protocol

Follow `.llm/harness/evaluator/plan-protocol.md` and the Plan-Gate checklist
`.llm/harness/gates/plan-gate.md` exactly. Verify (at minimum): a Design checkpoint exists; an
open-decision sweep resolves the rework-prone choices; commit slices are enumerated (<30) with touched
file sets and proving gates; the mandatory run artifacts are present; the public-surface inventory is
complete and every shipped subpath is classified; tutorial-track grounding claims are honest; acceptance
gates are executable (named commands, roots, expected outputs) rather than slogans; and the public-voice
plan is internally consistent (e.g. no term both flagged as leakage and preserved as public vocabulary).

Independently spot-check claims against the actual repository (export maps under `packages/**` and
`plugins/**`, the playground showcase, the CLI sources) where the plan asserts facts.

## Output

Write your verdict to `.llm/tmp/run/docs-v3-ia-plan--supervisor/plan-eval.md` AND post it as a PR comment.
Emit exactly one verdict token: **`PASS`** or **`FAIL_PLAN`**. If `FAIL_PLAN`, enumerate each unmet
Plan-Gate item with the file/section and the specific required change. Do not fix the plan yourself; do
not implement anything.

## Lock / hygiene

This is a planning-only PR (no `docs/site/**`, no `packages/**`/`plugins/**` code, no `deno.lock`
changes). Do not commit source churn or lock re-resolution. If your run produces a `deno.lock` diff or
trace files, do not push them onto the branch.

## SKILL

Load and apply these repo skills before evaluating (read each `SKILL.md`; `.agents/skills/<name>/SKILL.md`
if not mirrored under `.claude/skills/`):
- `netscript-harness` — harness phases, Plan-Gate, PLAN-EVAL protocol, evaluator separation, run artifacts.
- `netscript-doctrine` — package/plugin archetype + public-surface framing (to judge the
  internal-vs-public `archetype` decision and surface classification).
- `netscript-deno-toolchain` — `deno doc` / export-map inspection to verify the surface inventory.
- `netscript-cli` — to verify the CLI-surface and marketplace-stub claims.
- `netscript-tools` — validation evidence + raw git/registry verification.
- `openhands-handoff` — evaluator handoff/output conventions.


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
- Write /home/runner/work/_temp/openhands/27908862931-1/summary.md before exit. Include Summary, Changes, Validation,
  Responses to review comments or issue comments when relevant, and Remaining risks.
- Do not write or reuse .llm/tmp/openhands/summary.md. Write only the run-scoped path
  from OPENHANDS_SUMMARY_PATH.
- If output_mode is thread-replies, optionally write /home/runner/work/_temp/openhands/27908862931-1/replies.json as
  an array of {"comment_id": number, "body": string} objects for PR review-thread replies.
- The workflow records durable trace metadata under .llm/tmp/run/openhands/pr-105/run-27908862931-1.

Trigger metadata:
- event: issue_comment
- issue_or_pr: 105
- is_pr: true
- output_mode: pr-comment
- selected_model: openrouter/minimax/minimax-m3
- selected_provider: OPENROUTER
- action_run: https://github.com/rickylabs/netscript/actions/runs/27908862931
