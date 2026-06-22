You are OpenHands running for the NetScript repository.

User task:
Trigger comment:
@openhands-agent model=openrouter/qwen/qwen3.7-max output=pr-comment

use harness

Run **IMPL-EVAL** (final evaluator pass) on this PR — a small, contract-first framework slice. You
are a SEPARATE evaluator session from the generator; do not trust the PR description, re-verify
everything against source. Read `.llm/harness/evaluator/protocol.md`,
`.llm/harness/evaluator/verdict-definitions.md`, and the archetype gates for a package with a public
export surface, then emit one verdict: `PASS`, `FAIL_FIX`, `FAIL_RESCOPE`, or `FAIL_DEBT`.

## Scope of this slice (R0 only)

Adds a type-safe better-auth `plugins` / `betterAuthOptions` passthrough to `createNetscriptBetterAuth`
in `packages/auth-better-auth/src/better-auth.ts`. R1–R5 of the seamless-auth roadmap in
`.llm/harness/debt/arch-debt.md` are explicitly OUT OF SCOPE. The diff touches only
`packages/auth-better-auth/{src/better-auth.ts,tests/better-auth_test.ts}` plus run artifacts under
`.llm/tmp/run/docs-v4-ia-deepening/r0-seam/`.

## Verify (against source, not the description)

1. **Contract / type-safety.** `NetscriptBetterAuthOptions` gains `plugins?: BetterAuthOptions['plugins']`
   and `betterAuthOptions?: Omit<BetterAuthOptions, 'database' | 'plugins'>`. Confirm a consumer can
   pass `plugins: [organization()]` with NO cast and it type-checks.
2. **Merge precedence.** In `configureNetscriptBetterAuthOptions`, confirm `database` (the NetScript
   Prisma adapter) is applied LAST and CANNOT be overridden by `betterAuthOptions` or `plugins`.
   Confirm explicit NetScript fields (secret/baseURL/…) still flow through.
3. **Zero-cast rule.** No new `as` / `as unknown as` / `any` anywhere in the diff. The whole point of
   R0 is a type-safe surface — a cast is an automatic finding.
4. **Runtime caveat.** The `plugins` JSDoc must state that table-backed plugins (organization,
   twoFactor, admin, apiKey) need their schema generated/migrated (R1) before they run, while
   stateless plugins (bearer, jwt) run through R0 alone. Confirm the wording does NOT use the words
   "honest/honesty/honestly".
5. **Gates (run them yourself, scoped to the package).**
   - `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/auth-better-auth --ext ts,tsx`
   - `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/auth-better-auth --ext ts,tsx`
   - `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/auth-better-auth --ext ts,tsx`
   - `deno test --allow-all --unstable-kv packages/auth-better-auth/`
   Report raw exit codes. Confirm the two new tests assert plugin forwarding AND database-wins
   precedence, and that they do not require a live DB.
6. **Scope discipline.** Confirm NO R1–R5 work leaked in (no schema generation, no InteractiveFlowPort,
   no org helpers, no fluent builder, no plugin-aware mappers).

## Lock / artifact hygiene (do NOT introduce churn)

Do NOT commit a re-resolved root `deno.lock`, and do NOT leave stray files. If your verification run
mutates `deno.lock` or drops junk, discard it before finishing — the PR must stay limited to the
package source + tests + the r0-seam run artifacts. Report the exact file set you observed.

## Verdict

Emit the verdict line clearly. If `PASS`, say so and confirm the slice is merge-ready pending human
review. If a `FAIL_*`, list each finding with file:line and the minimal fix.

## SKILL
- `.agents/skills/netscript-harness` — IMPL-EVAL protocol, verdict definitions, gate order
- `.agents/skills/netscript-doctrine` — package public-surface + archetype gates
- `.agents/skills/netscript-deno-toolchain` — `deno doc`/check/lint/fmt and the scoped `.llm/tools/run-deno-*` wrappers
- `.agents/skills/netscript-tools` — scoped validation wrappers + raw-git verification + lock-hygiene


Issue/PR title: feat(auth-better-auth): better-auth plugins / options passthrough (R0 seam)

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
- Write /home/runner/work/_temp/openhands/27942743122-1/summary.md before exit. Include Summary, Changes, Validation,
  Responses to review comments or issue comments when relevant, and Remaining risks.
- Do not write or reuse .llm/tmp/openhands/summary.md. Write only the run-scoped path
  from OPENHANDS_SUMMARY_PATH.
- If output_mode is thread-replies, optionally write /home/runner/work/_temp/openhands/27942743122-1/replies.json as
  an array of {"comment_id": number, "body": string} objects for PR review-thread replies.
- The workflow records durable trace metadata under .llm/tmp/run/openhands/pr-108/run-27942743122-1.

Trigger metadata:
- event: issue_comment
- issue_or_pr: 108
- is_pr: true
- output_mode: pr-comment
- selected_model: openrouter/qwen/qwen3.7-max
- selected_provider: OPENROUTER
- action_run: https://github.com/rickylabs/netscript/actions/runs/27942743122
