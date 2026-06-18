You are OpenHands running for the NetScript repository.

User task:
Trigger comment:
@openhands-agent model=openrouter/qwen/qwen3.7-max output=pr-comment iterations=300 use harness

## ROLE — IMPL-EVAL (slice G3-FUI, fresh-ui namespace-type exports)

You are the **IMPL-EVAL** evaluator for PR #58 (`fix/fresh-ui-namespace-exports` → `release/jsr-readiness`), the framework-source slice of Group 3. This is a **separate evaluator session** from the generator (a WSL Codex thread authored it; you validate, you do not self-certify). Read `.llm/harness/evaluator/protocol.md` + `.llm/harness/evaluator/verdict-definitions.md` and the SCOPE-frontend overlay.

**Branch tip to evaluate:** `8c26459` (`fix/fresh-ui-namespace-exports`).

### What landed (1 commit, 8 files, all under `packages/fresh-ui/`)
Exports the 7 previously-private `*Namespace` types (`Accordion`/`Dialog`/`Drawer`/`Popover`/`Sheet`/`Tabs`/`Tooltip`) and re-exports them from `interactive.ts`, to clear the 7 `error[private-type-ref]` — the only `deno doc --lint` debt in the 26-unit publish census (fresh-ui A1 gate).

### Re-verify (do not trust — run and paste raw output)
1. `deno doc --lint packages/fresh-ui/mod.ts packages/fresh-ui/interactive.ts packages/fresh-ui/primitives.tsx` — expect **0** (was 7).
2. `deno task --cwd packages/fresh-ui check` (or `deno check --unstable-kv` on the 3 public entries) — expect 0.
3. **`deno lint packages/fresh-ui/`** — specifically check for **`no-explicit-any`** hits introduced by this change (see ruling question).
4. Confirm scope: `git show 8c26459 --stat` — every file under `packages/fresh-ui/`; no `deno.json` `version` edit, no catalog/scaffold-versions edit, no `deno.lock` churn, no deleted files.

### THE RULING QUESTION (central)
To clear the *secondary* private-type-refs that appear once the namespace types are public, the implementation changed each member from `typeof <Subcomponent>` (e.g. `Item: typeof AccordionItem`) to **`(props: any) => unknown`**. This minimizes the export surface but **degrades public type precision** and **injects `any`** into the published types.

Alternative: **export the underlying subcomponent functions** (`AccordionItem`, …) and keep `typeof`, preserving full type precision at the cost of more named exports.

Rule on which approach should ship:
- **(a)** accept the minimal/lossy `(props: any) => unknown` approach as-is;
- **(b)** require the `typeof`-preserving approach (export subcomponents) — i.e. `FAIL_FIX` with that direction.

State your recommendation **and** whether `any` in the public surface passes the repo's lint/doctrine bar. If `deno lint` flags `no-explicit-any`, that likely forces (b).

### Verdict
Emit `PASS` / `FAIL_FIX` / `FAIL_RESCOPE` / `FAIL_DEBT` with reasoning, the raw gate output, and an explicit (a)-vs-(b) ruling. Preserve lock hygiene: do **not** commit `deno.lock` or source churn. Two `FAIL_*` cycles then escalate.


Issue/PR title: fix(fresh-ui): export 7 *Namespace types to clear private-type-ref deno doc lint

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
- Write /home/runner/work/_temp/openhands/27782247051-1/summary.md before exit. Include Summary, Changes, Validation,
  Responses to review comments or issue comments when relevant, and Remaining risks.
- Do not write or reuse .llm/tmp/openhands/summary.md. Write only the run-scoped path
  from OPENHANDS_SUMMARY_PATH.
- If output_mode is thread-replies, optionally write /home/runner/work/_temp/openhands/27782247051-1/replies.json as
  an array of {"comment_id": number, "body": string} objects for PR review-thread replies.
- The workflow records durable trace metadata under .llm/tmp/run/openhands/pr-58/run-27782247051-1.

Trigger metadata:
- event: issue_comment
- issue_or_pr: 58
- is_pr: true
- output_mode: pr-comment
- selected_model: openrouter/qwen/qwen3.7-max
- selected_provider: OPENROUTER
- action_run: https://github.com/rickylabs/netscript/actions/runs/27782247051
