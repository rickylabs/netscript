You are OpenHands running for the NetScript repository.

User task:
Trigger comment:
@openhands-agent model=openrouter/qwen/qwen3.7-max output=pr-comment iterations=500 use harness

Activate SKILL
- netscript-harness
- netscript-doctrine
- jsr-audit
- deno-fresh
- aspire

**PLAN-EVAL (re-eval #4) — independent evaluator session for [5d4 streaming — defer + PSR + e2e streams, RFC 13/16].** The binding `plan.md` was CONSOLIDATED (commit d5c03fc on branch head) to resolve the three re-eval #3 FAIL blockers by folding the already-committed measurement analysis into the plan. You are the INDEPENDENT evaluator — verify the fixes landed; do NOT re-measure from scratch (the artifacts are committed and trusted). Read `.llm/tmp/run/feat-package-quality-wave5-apps--5d4-streaming/{plan.md,design.md,drift.md,research.md}` plus the committed `doc-lint-raw.txt` and `jsr-publish-dry-run-5d4.txt`.

**WRITE-ARTIFACT-FIRST: your FIRST action is to create/overwrite `.llm/tmp/run/feat-package-quality-wave5-apps--5d4-streaming/plan-eval.md` as a section skeleton, then fill + re-save it as you evaluate. The OPENHANDS_SUMMARY_PATH summary's final line MUST be the verdict line.**

Verify each prior FAIL blocker is now RESOLVED (binary PASS/FAIL):

1. **Blocker 1 — Arch-3 gate coverage.** Does `plan.md` §Fitness Gates now list EVERY required Arch-3 gate F-1..F-18 per `.llm/harness/gates/archetype-gate-matrix.md`, each with a status (PASS/PENDING_SCRIPT/N-A) and a slice number or N/A rationale? (Prior: only 8/18, F-1/F-4/F-6/F-8/F-10/F-11/F-12/F-16/F-17/F-18 missing.) Confirm F-17 is the only N/A and its rationale (composition-only, no abstract/derived pair) is sound. Confirm the Static / Runtime-Aspire / Consumer-import gate-family rows exist. Confirm every slice number cited in the gate table actually exists in the §Commit Slices lock (no off-by-one).

2. **Blocker 2 — doc-lint arithmetic.** Does `plan.md` now contain a §Doc-Lint Budget Reconciliation enumerating all 113 errors bucketed by file, assigned to named slices, reconciled to committed `doc-lint-raw.txt` ("Found 113")? Confirm the arithmetic: Slice 1 = 24 (DeferPage 13 + stream-error-boundary 11), Slice 2 = 57 (policy 27 + telemetry 10 + Deferred 8 + DeferIsland 2 + stream 7 + sse 3), Slice 6 = 32 (streams upstream-leak, D-5d4-10) → 113 total, split 63 private-type-ref / 50 missing-jsdoc.

3. **Blocker 3 — JSR-audit findings assignment.** Is F-6 now in the Fitness Gates table? Does `plan.md` contain a §JSR-Audit / Over-Cap Budget Reconciliation triaging all 62 dry-run problems (58 excluded-module → Slice 7 via L-5d4-8; 4 missing-explicit-return-type slow-types in form/+query/ → Slice 9 via L-5d4-9) reconciled to `jsr-publish-dry-run-5d4.txt` ("Found 62 problems")? Are L-5d4-8 and L-5d4-9 now present in §Locked Decisions?

4. **Artifact consistency.** Does `drift.md` no longer contain phantom cross-references — i.e., do D-5d4-8 (Slice 7), D-5d4-9 (Slice 9), and D-5d4-10 (Slice 6) now point at sections/slices/locks that genuinely exist in `plan.md`?

Evaluate against `.llm/harness/evaluator/plan-protocol.md`, the gate matrix, and the BINDING umbrella `plan.md` (`.llm/tmp/run/feat-package-quality-wave5-apps--5d-fresh/plan.md`).

Output: `plan-eval.md` committed to the run dir (binary PASS/FAIL per blocker + the plan-gate checklist). Summary via `OPENHANDS_SUMMARY_PATH` ending with EXACTLY one verdict line: `VERDICT: APPROVED` or `VERDICT: NEEDS-REVISION` + remaining blockers. Evaluation ONLY — zero edits to plan/design/research, no implementation, no merging. Do NOT emit any `@openhands-agent` block.

Issue/PR title: [5d4] fresh defer + streams — PSR (RFC 13) + e2e streams (RFC 16) (PLAN pending)

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
- Write /home/runner/work/_temp/openhands/27468952079-1/summary.md before exit. Include Summary, Changes, Validation,
  Responses to review comments or issue comments when relevant, and Remaining risks.
- Do not write or reuse .llm/tmp/openhands/summary.md. Write only the run-scoped path
  from OPENHANDS_SUMMARY_PATH.
- If output_mode is thread-replies, optionally write /home/runner/work/_temp/openhands/27468952079-1/replies.json as
  an array of {"comment_id": number, "body": string} objects for PR review-thread replies.
- The workflow records durable trace metadata under .llm/tmp/run/openhands/pr-37/run-27468952079-1.

Trigger metadata:
- event: issue_comment
- issue_or_pr: 37
- is_pr: true
- output_mode: pr-comment
- selected_model: openrouter/qwen/qwen3.7-max
- selected_provider: OPENROUTER
- action_run: https://github.com/rickylabs/netscript/actions/runs/27468952079
