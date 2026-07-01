You are OpenHands running for the NetScript repository.

User task:
Trigger comment:
@openhands-agent model=openrouter/qwen/qwen3.7-max provider=openrouter output=pr-comment iterations=600

use harness

You are the IMPL-EVAL evaluator for PR #135 (branch `fix/cli-jsr-asset-embedding`). TWO prior runs
exhausted budget during orientation and never wrote a verdict. This run MUST finish. Follow these
rules literally:

1. DO NOT explore the repo broadly. DO NOT read large files. Go straight to the commands below.
2. The FIRST thing you do is write a stub verdict file
   `.llm/tmp/run/fix-cli-jsr-asset-embedding--asset-embed/evaluate.md` containing
   `Verdict: PENDING` plus a checklist, then UPDATE it as each check finishes. Never end without a
   final `Verdict:` line and a posted PR comment.

ALREADY VERIFIED by a prior evaluator run (accept as PASS, do NOT redo):
- Check 1 (no reintroduced filesystem asset reads on the JSR prod import path) — PASS. All
  `Deno.readTextFile`/`fromFileUrl` hits are Bucket-B (deploy/config/compile/manifest/plugin-discovery
  and the `maintainer/` namespace), not prod scaffold-asset import paths.
- Check 2 (`deno task check:assets-barrel` diff-clean for cli + plugin + fresh-ui) — PASS.
- Check 3a (`cd packages/cli && deno task publish:dry-run`) — PASS.
- Check 4 (merge-readiness `scaffold.runtime`) — the PR's required CI check
  `scaffold-runtime (aspire + docker + postgres)` is GREEN on the head commit; accept it as PASS and
  cite the check name. Do NOT re-run the full e2e locally.

RUN ONLY these 3 remaining checks (each is cheap; budget accordingly):
- Check 3b: `cd packages/plugin && deno task publish:dry-run` → record pass/fail + any NEW errors
  (pre-existing dynamic-import warnings are acceptable).
- Check 3c: `cd packages/fresh-ui && deno publish --dry-run --allow-dirty` → the 87 PRE-EXISTING
  full-export-map `deno doc --lint` findings (mod.ts/interactive.ts/primitives.tsx runtime surface)
  are acceptable; there must be NO `registry` findings and no NEW errors.
- Check 5: `git diff origin/main...HEAD -- deno.lock | head -50` and `git diff --stat origin/main...HEAD`
  → confirm no unintended `deno.lock` re-resolution churn and no stray files in the commit set.

Then write the final verdict (`PASS` / `FAIL_FIX` / `FAIL_RESCOPE` / `FAIL_DEBT`) to evaluate.md AND
post a PR comment whose final line is `Verdict: <X>`, with the 3 command results as evidence. If all 3
pass and the accepted checks hold, the verdict is `PASS`. Do not commit `deno.lock` or any source
churn.

## SKILL
- `netscript-harness` — IMPL-EVAL protocol, verdict definitions (read
  `.llm/harness/evaluator/verdict-definitions.md` only).
- `netscript-cli` — CLI scaffold/asset-loader surface.
- `netscript-tools` — scoped check/lint/fmt wrappers, lock hygiene.
- `jsr-audit` — publish dry-run, asset-shipping vs asset-reading.
- `netscript-deno-toolchain` — publish semantics, `deno doc --lint`.


Issue/PR title: fix(cli): JSR-safe bundled-asset embedding — prod CLI scaffold usable from JSR (alpha.5)

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
- Write /home/runner/work/_temp/openhands/28232116283-1/summary.md before exit. Include Summary, Changes, Validation,
  Responses to review comments or issue comments when relevant, and Remaining risks.
- Do not write or reuse .llm/tmp/openhands/summary.md. Write only the run-scoped path
  from OPENHANDS_SUMMARY_PATH.
- If output_mode is thread-replies, optionally write /home/runner/work/_temp/openhands/28232116283-1/replies.json as
  an array of {"comment_id": number, "body": string} objects for PR review-thread replies.
- The workflow records durable trace metadata under .llm/tmp/run/openhands/pr-135/run-28232116283-1.

Trigger metadata:
- event: issue_comment
- issue_or_pr: 135
- is_pr: true
- output_mode: pr-comment
- selected_model: openrouter/qwen/qwen3.7-max
- selected_provider: OPENROUTER
- action_run: https://github.com/rickylabs/netscript/actions/runs/28232116283
