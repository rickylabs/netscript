You are OpenHands running for the NetScript repository.

User task:
Trigger comment:
@openhands-agent model=openrouter/qwen/qwen3.7-max output=pr-comment iterations=600 use harness

Activate SKILL
- netscript-harness
- netscript-doctrine
- jsr-audit
- deno-fresh
- aspire

**PLAN-EVAL (re-run) — independent evaluator session for [5d6 query + server + final surface — RFC 14/16].** A prior eval run did the analysis but was cut off before persisting its verdict — `plan-eval.md` was never committed. Redo the evaluation and COMMIT the artifact this time. The PLAN generator committed `design.md` (366 lines) + `plan.md` (366 lines, 30-slice lock) + `research.md` (430 lines) + measurement artifacts (`doc-lint-aggregate.json`, per-module doc-lint logs, `dry-run.log`) to `.llm/tmp/run/feat-package-quality-wave5-apps--5d6-query/`. You are the INDEPENDENT evaluator — you did not write these. This is the FINAL unit in the chain.

**WRITE-ARTIFACT-FIRST (the prior run's failure mode — do NOT repeat it): your FIRST action is to create `.llm/tmp/run/feat-package-quality-wave5-apps--5d6-query/plan-eval.md` as a section skeleton (one heading per verify item + a Verdict heading), then fill and re-save it as you evaluate each item. Budget your reading so the artifact + the OPENHANDS_SUMMARY_PATH summary are BOTH written and committed well before the iteration limit. The summary's final line MUST be the verdict line.**

Verify (binary PASS/FAIL each, write each ruling into plan-eval.md as you go):
1. the typed island query bridge (server-loader -> island-props -> client-hook) is DECIDED with concrete types/flow.
2. the `createQueryFactories` + `createServiceClient` Transport seam is specified (boundary, types, ownership).
3. `defineFreshApp` extension points documented + backward-compatible, alpha-surface protection scoped.
4. the RFC 14 seam audit is complete; in-scope vs deferred items explicit.
5. **OPEN-DECISION JUDGMENT (strict, binary):** design.md ~L48 flags `createQueryOptionsFor` "design TBD with supervisor", and plan.md §Questions for supervisor asks whether to keep `useQuery`/`useMutation` aliases. For EACH: genuine BLOCKER (unresolved decision leaking into IMPL) or safe-to-defer WITH a documented default the plan can proceed on?

CRITICAL gate check (sibling 5d4 failure mode): does `plan.md`'s fitness-gate table list EVERY gate the archetype requires per `.llm/harness/gates/archetype-gate-matrix.md`? Flag any required gate omitted WITHOUT N/A rationale. Confirm each applicable gate maps to a slice and slice numbers match the commit-slice lock (no off-by-one). Reconcile doc-lint / over-cap / private-type-ref budgets against committed artifacts (`doc-lint-aggregate.json` reports a deduplicated 276 / 115 / 157 / 4 — confirm plan slice budgets trace to these), and confirm drift.md references nothing absent from plan.md.

Evaluate against `.llm/harness/evaluator/plan-protocol.md`, the gate matrix, the BINDING umbrella `plan.md`, and `handover-5d6-plan.md`.

Output: `plan-eval.md` committed to the run dir (binary PASS/FAIL per item + gate-by-gate findings + ruling on the 2 open decisions). Summary via `OPENHANDS_SUMMARY_PATH` ending with EXACTLY one verdict line: `VERDICT: APPROVED` or `VERDICT: NEEDS-REVISION` + remaining blockers. Evaluation ONLY — zero edits to plan/design/research, no implementation, no merging. Do NOT emit any `@openhands-agent` block.

Issue/PR title: [5d6] fresh query + server + final surface — RFC 17 bridge, defineFreshApp, RFC 14 seam audit (PLAN pending)

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
- Write /home/runner/work/_temp/openhands/27468361894-1/summary.md before exit. Include Summary, Changes, Validation,
  Responses to review comments or issue comments when relevant, and Remaining risks.
- Do not write or reuse .llm/tmp/openhands/summary.md. Write only the run-scoped path
  from OPENHANDS_SUMMARY_PATH.
- If output_mode is thread-replies, optionally write /home/runner/work/_temp/openhands/27468361894-1/replies.json as
  an array of {"comment_id": number, "body": string} objects for PR review-thread replies.
- The workflow records durable trace metadata under .llm/tmp/run/openhands/pr-39/run-27468361894-1.

Trigger metadata:
- event: issue_comment
- issue_or_pr: 39
- is_pr: true
- output_mode: pr-comment
- selected_model: openrouter/qwen/qwen3.7-max
- selected_provider: OPENROUTER
- action_run: https://github.com/rickylabs/netscript/actions/runs/27468361894
