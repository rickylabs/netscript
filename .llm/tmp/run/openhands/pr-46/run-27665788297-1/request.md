You are OpenHands running for the NetScript repository.

User task:
Trigger comment:
@openhands-agent model=openrouter/minimax/minimax-m3 iterations=2000 output=pr-comment

**Task: complete test-suite inventory — AUDIT ONLY. Do NOT modify, fix, or delete any test in this run.**

`use harness` — follow `.agents/skills/netscript-harness/SKILL.md`. The full brief is committed on this branch at `.llm/tmp/run/test-suite-inventory--audit/README.md`; read it first, then follow it.

**Mission.** Produce a complete, defensible inventory of EVERY automated test in this repository. This inventory drives a downstream Codex test-fix slice and gates the JSR publish: no publish until tests are green or obsolete failing tests are deleted with rationale.

**Skills — state them.** In your summary, explicitly list which skills you activate and why. Candidates: `netscript-harness`, `netscript-doctrine` (packages/plugins), `deno-fresh` (apps/fresh-ui), `aspire` (apphost/e2e), `jsr-audit` — plus any others you find useful.

**Work incrementally, by slices, writing early.** Your iteration budget is finite and the workflow commits whatever is on disk at cutoff. Grow `.llm/tmp/run/test-suite-inventory--audit/inventory.md` after every slice — never defer writing. Keep the Slice-progress checklist at the top current so a resumed run continues cleanly and a budget-cut run still leaves usable output.

**Discovery first.** Enumerate every test file (`**/*_test.ts`, `*_test.tsx`, `*.test.ts`, `*Tests.cs`, …) and every `test` / `test:*` / `e2e:*` / `check:*` task in `deno.json`. Record totals, then proceed slice by slice: core, packages, plugins, services, apps + fresh-ui, contracts/background/sagas/triggers/workers, dotnet, root e2e.

**Per test, record:** location · role (what it protects) · quality (solid/thin/flaky/dead) · status (pass/fail/ignored/skipped — with the exact command + result line as evidence) · verdict (keep/rewrite/refactor/relocate/delete/replace) · rationale.

**Priority — do this FIRST.** `deno task test` was last RED: **477 passed / 11 failed / 12 ignored** (measured on `feat/package-quality-wave6-cli` @ `443d69f5`). Enumerate those **11 failures** by name + file + failing assertion and verdict each: stale/obsolete → delete-candidate (with rationale), or doctrine-valuable-but-broken → keep + rewrite/refactor. This subset is the immediate input to the Codex fix slice.

**Status rules.** Run the smallest command that proves pass/fail; targeted `deno` commands must pass `--unstable-kv`; record the command + result line as evidence. Do NOT fix anything — inventory only.

**Deliverables.** Grow `inventory.md` (slice-progress checklist, discovered totals, per-area tables, the 11-failure focus table, final verdict-count roll-up). Write your run summary to `OPENHANDS_SUMMARY_PATH` before exit, including the list of skills you activated.

**Guardrails.** Do not post GitHub comments (the workflow owns comments). Preserve all existing files; no destructive git; never delete lock files/caches or run `deno cache --reload`.


Issue/PR title: test-suite green-up (inventory + fixes) [S1]

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
- Write /home/runner/work/_temp/openhands/27665788297-1/summary.md before exit. Include Summary, Changes, Validation,
  Responses to review comments or issue comments when relevant, and Remaining risks.
- Do not write or reuse .llm/tmp/openhands/summary.md. Write only the run-scoped path
  from OPENHANDS_SUMMARY_PATH.
- If output_mode is thread-replies, optionally write /home/runner/work/_temp/openhands/27665788297-1/replies.json as
  an array of {"comment_id": number, "body": string} objects for PR review-thread replies.
- The workflow records durable trace metadata under .llm/tmp/run/openhands/pr-46/run-27665788297-1.

Trigger metadata:
- event: issue_comment
- issue_or_pr: 46
- is_pr: true
- output_mode: pr-comment
- selected_model: openrouter/minimax/minimax-m3
- selected_provider: OPENROUTER
- action_run: https://github.com/rickylabs/netscript/actions/runs/27665788297
