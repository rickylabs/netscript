You are OpenHands running for the NetScript repository.

User task:
Trigger comment:
@openhands-agent model=openrouter/qwen/qwen3.7-max provider=openrouter output=pr-comment iterations=1200

use harness

You are the **IMPL-EVAL evaluator** (final, post-implementation pass) for PR #160 —
`integration/alpha11-fixtrain`, the alpha.11 CLI fix-train umbrella that composes four already-merged
slice branches (A/B/C/E) into one integration branch. You are a **separate session from the
generator** (the generator was a WSL Codex thread). Do NOT re-implement; evaluate, independently
re-run the gates, and emit a verdict. This branch is the artifact that ships as alpha.11, so the
**composed** `scaffold.runtime` e2e — not the per-slice e2e — is the merge-readiness proof.

## SKILL
- `.agents/skills/netscript-harness` (GOVERNING — IMPL-EVAL protocol, verdicts, run artifacts, gates).
  Read `.llm/harness/evaluator/protocol.md` + `.llm/harness/evaluator/verdict-definitions.md` +
  `.llm/harness/gates/archetype-gate-matrix.md` before judging.
- `.agents/skills/netscript-cli` (the CLI/init/scaffold surface under evaluation; full-E2E command).
- `.agents/skills/netscript-doctrine` (init is public CLI surface — archetype, public-surface gates).
- `.agents/skills/netscript-tools` (scoped check/lint/fmt wrappers, lock hygiene, raw-git verify).
- `.agents/skills/netscript-deno-toolchain` (`deno doc --lint`, `deps:check`, publish:dry-run, audit).
- `.agents/skills/jsr-audit` (publish-surface / no-leak-into-userland checks).

## What the integration claims (verify, do not trust)
- Merges in order A -> B -> E -> C, each `--no-ff`.
- The ONLY real conflict was two init files —
  `packages/cli/src/public/features/init/init-command.ts` and
  `packages/cli/src/public/features/root/public-command-dependencies.ts` — resolved by **keeping both
  sides**: A's root `--version` + `--dry-run`/`DryRunFileSystemAdapter`, and C's `--cache`
  (default ON) + `--cache-backend redis|garnet|deno-kv` (default redis) + `PromptPort` + interactive
  resolver wired before `executeInit`.
- One extra commit `54d6b6bf fix(cli): centralize internal JSR ranges` (4 lines `deno.lock` +
  `packages/cli/deno.json`) was needed for `deps:check`.
- Self-reported gates all PASS, headline: `scaffold.runtime` e2e = **48 passed / 0 failed**.

## Your evaluation (run from the PR branch on your native Linux env, repo root)
1. **Re-run the headline gate yourself, one pass, do not split it:**
   `deno task e2e:cli run scaffold.runtime --cleanup --format pretty`
   Report the raw exit code and the `passed=/failed=` line. Expect 48/0. Any failure => `FAIL_FIX`
   with the failing suite/test names.
2. Re-run the cheap gates and confirm green: `deno task check`, `deno task lint`,
   `deno task fmt:check`, `deno task test`, `deno task deps:check`, `deno task publish:dry-run`,
   `deno task audit:critical`, `deno task check:scaffold-versions`, `deno task check:assets-barrel`,
   `deno doc --lint packages/cli/mod.ts`.
3. **Conflict-resolution correctness:** read the merged `init-command.ts` and
   `public-command-dependencies.ts`. Confirm NO behavior was dropped — `--version`, `--dry-run`
   (write-free via `DryRunFileSystemAdapter`), cache flags + defaults (on/redis), `PromptPort`
   construction, and the interactive resolver firing before `executeInit` on a TTY without
   `--ci/--yes` must ALL be present and coherent. No leftover conflict markers.
4. **User's #1 priority — no userland leak:** confirm prod/JSR `init` no-copy paths do NOT copy
   `@netscript/*` source into userland (thin stubs only); only local/maintainer mode copies full
   source. Confirm `--cache-backend redis|garnet` emit real Aspire cache resources and `deno-kv` is
   thin (config/schema only) with that limitation recorded in `.llm/harness/debt/arch-debt.md`.
5. **Casts:** confirm NO new `as`/`as unknown as`/`any` casts beyond the two repo-accepted ones
   (centralized contract `as unknown as`, top-level router `any`).
6. **Lock hygiene:** `deno.lock` churn must be limited to the JSR-range normalization; flag any
   broad re-resolution. Do NOT commit lock churn or source edits unless a real fix is required —
   if so, document the rationale in the PR comment.

## Verdict
Write `.llm/tmp/run/alpha11-fixtrain--int/evaluate.md` and post the PR comment with one of:
`PASS` · `FAIL_FIX` · `FAIL_RESCOPE` · `FAIL_DEBT` (definitions per `verdict-definitions.md`).
Lead the comment with the verdict, then: the e2e result line you observed, per-gate pass/fail, the
conflict-resolution finding, the no-leak finding, the cast finding, and any required follow-ups.
Preserve lock hygiene: do not commit `deno.lock` or source churn unless the run explicitly requires a
reviewed fix. Refs #141 #153.


Issue/PR title: Alpha11 CLI fixtrain integration

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
- Write /home/runner/work/_temp/openhands/28295719710-1/summary.md before exit. Include Summary, Changes, Validation,
  Responses to review comments or issue comments when relevant, and Remaining risks.
- Do not write or reuse .llm/tmp/openhands/summary.md. Write only the run-scoped path
  from OPENHANDS_SUMMARY_PATH.
- If output_mode is thread-replies, optionally write /home/runner/work/_temp/openhands/28295719710-1/replies.json as
  an array of {"comment_id": number, "body": string} objects for PR review-thread replies.
- The workflow records durable trace metadata under .llm/tmp/run/openhands/pr-160/run-28295719710-1.

Trigger metadata:
- event: issue_comment
- issue_or_pr: 160
- is_pr: true
- output_mode: pr-comment
- selected_model: openrouter/qwen/qwen3.7-max
- selected_provider: OPENROUTER
- action_run: https://github.com/rickylabs/netscript/actions/runs/28295719710
