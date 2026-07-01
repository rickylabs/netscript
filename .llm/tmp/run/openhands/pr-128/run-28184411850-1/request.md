You are OpenHands running for the NetScript repository.

User task:
Trigger comment:
@openhands-agent model=openrouter/minimax/minimax-m3 provider=openrouter output=pr-comment iterations=800

use harness

You are running **PLAN-EVAL** (separate evaluator session) for this PR — the Deno 2.9.0 adoption track (toolchain bump + low-risk wins). This is a **hard gate**: emit a verdict only; do NOT implement anything.

## SKILL

Activate and follow before evaluating (read each SKILL.md):

- `.agents/skills/netscript-harness` — 8-phase model, Plan-Gate, plan-protocol, verdict definitions.
- `.agents/skills/netscript-deno-toolchain` — **authoritative** for the repo's Deno toolchain, version pins, `deno task` features, `deno publish`, catalog law. Use it to judge whether the plan's 2.9 feature claims and pin-site inventory are correct.
- `.agents/skills/netscript-tools` — repo tooling (`run-parallel-tasks.ts`, scoped gate wrappers), validation evidence rules.

## What to read

1. `.llm/harness/gates/plan-gate.md` + `.llm/harness/evaluator/plan-protocol.md` (your checklist).
2. `.llm/tmp/run/chore-deno-2.9-adoption--adoption-plan/research.md` and `plan.md` (the artifacts under evaluation).
3. Spot-verify the cited repo ground truth: the 7 version-pin sites (`.github/toolchain.env`, `.github/workflows/{ci,e2e-cli,publish}.yml`), `deno.json` tasks (`ci:quality`, `check`, `lint`, `fmt:check`), `.llm/tools/run-parallel-tasks.ts`, and `packages/cli/src/maintainer/adapters/packages-copier.ts` (for the C5 deferral rationale).

## Evaluate

Walk the Plan-Gate checklist. In particular confirm:

1. **Research is current and grounded** — 2.9 feature claims are accurate (no invented APIs); the version-pin inventory and task-runner sites are real and complete; the "2.9 does NOT fix the https-asset blocker" claim is correct.
2. **Scope is right-sized and decisions locked** — C0–C4 are genuinely config/CI/docs (no `packages/`/`plugins/` source edits), so the supervisor lane is valid; no open decision would force rework when sliced.
3. **Deferral is sound** — C5 (copy→`"links"`) is correctly held as a spike-gated framework-SOURCE Codex slice with concrete, real blockers (subpath resolution by bare specifier, `catalog:` against source, MySQL-adapter prune on immutable source). `bundle --declaration` and lockfile-seeding decided-out are justified.
4. **Bump-risk is handled, not hand-waved** — `Deno.serve` compression-off (#35486) + min-dep-age (#35458) + `deno.lock` reseed are covered by C0's gate (`scaffold.runtime` + CI `deno install`) and the D6 lock-approval gate; the gate set is the right merge-readiness proof.
5. **No silent scope or risk** — anything bounded is logged.

Emit **PASS** or **FAIL_PLAN** with decision/file-level required changes. Per `gates/plan-gate.md`, two FAIL_PLAN cycles then escalate; this is cycle 1. Post the verdict as a PR comment.


Issue/PR title: chore(deno-2.9): adoption track — toolchain bump + low-risk wins (planning-only)

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
- Write /home/runner/work/_temp/openhands/28184411850-1/summary.md before exit. Include Summary, Changes, Validation,
  Responses to review comments or issue comments when relevant, and Remaining risks.
- Do not write or reuse .llm/tmp/openhands/summary.md. Write only the run-scoped path
  from OPENHANDS_SUMMARY_PATH.
- If output_mode is thread-replies, optionally write /home/runner/work/_temp/openhands/28184411850-1/replies.json as
  an array of {"comment_id": number, "body": string} objects for PR review-thread replies.
- The workflow records durable trace metadata under .llm/tmp/run/openhands/pr-128/run-28184411850-1.

Trigger metadata:
- event: issue_comment
- issue_or_pr: 128
- is_pr: true
- output_mode: pr-comment
- selected_model: openrouter/minimax/minimax-m3
- selected_provider: OPENROUTER
- action_run: https://github.com/rickylabs/netscript/actions/runs/28184411850
