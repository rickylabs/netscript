You are OpenHands running for the NetScript repository.

User task:
Trigger comment:
@openhands-agent model=openrouter/qwen/qwen3.7-max provider=openrouter output=pr-comment iterations=1200

use harness

# IMPL-EVAL — docs v3 build + #87 forward-fix (PR #106 `docs/v3-build`)

You are the IMPL-EVAL evaluator (separate session from the generator). Independently verify the
implementation on this PR branch and emit a verdict. Do NOT trust generator self-reports — verify
every claim against the committed files and the real framework surface via `deno doc` and source.

## SKILL (activate before evaluating)

- **netscript-harness** — you are IMPL-EVAL; read `.llm/harness/evaluator/protocol.md`,
  `.llm/harness/evaluator/verdict-definitions.md`, the docs scope overlay
  `.llm/harness/workflow/` + `SCOPE-docs.md`, and the gate matrix. Emit one verdict:
  `PASS` | `FAIL_FIX` | `FAIL_RESCOPE` | `FAIL_DEBT`.
- **netscript-doctrine** — docs must describe the real `packages/`/`plugins/` public surface; the
  public-vs-contributor CLI boundary is doctrine (core of the Blocker being verified).
- **netscript-deno-toolchain** — verify EVERY documented API/type/function/flag with
  `deno doc <module>` / `deno doc --filter <symbol>`. This is the zero-invented-symbols gate.
- **netscript-cli** — ground the public `netscript` CLI vs the local contributor `netscript-dev` CLI.
- **netscript-tools** — validation evidence discipline; use the scoped check/lint/fmt wrappers if you
  validate generated TS.
- **openhands-handoff** — your own handoff/runtime conventions.
- **rtk** — prefix read-heavy `git`/`grep`/`ls` with `rtk` to keep logs compact.

## Context — what to evaluate

This PR is the docs v3 build (S01–S20 of the PASSed IA plan) plus a forward-fix slice that resolved
the surviving findings of a corrected adversarial review (#87). Branch HEAD should be `40b0d059`.
Three fix commits on top of the v3 build + an `origin/main` reconciliation merge (`338bf6ad`, which
brought the auth layer onto this branch):

- `58da675f` — fix public CLI surface, worker concurrency env, sandbox qualifier, enterprise voice
- `ce6e0d1f` — add six grounded missing-feature how-tos
- `40b0d059` — generate auth reference unit + xref

Pre-flight: `git fetch origin docs/v3-build` and evaluate `origin/docs/v3-build` (= `40b0d059`).

## What the fix slice CLAIMS (verify each independently)

1. **P1-02 (was BLOCKER) — public CLI surface.** Public `netscript plugin add <pkg>` accepts only
   `--project-root` (`packages/cli/src/public/features/plugins/dispatch/plugin-verb-command.ts`); the
   kind-based `<kind> --name --samples --no-samples --force` form is the LOCAL `netscript-dev`
   (`packages/cli/src/local/features/plugins/add/add-local-plugin-command.ts`). Verify the source,
   then confirm every public CLI example in the docs is either a valid public form or explicitly the
   `netscript-dev` contributor path. Sites to re-check: `capabilities/background-jobs.md`,
   `capabilities/durable-sagas.md`, `capabilities/triggers.md`, `capabilities/index.md`,
   `glossary.md`, `tutorials/storefront/05-shipping-webhook.md`, `tutorials/erp-sync/01-scaffold.md`,
   `tutorials/workspace/04-provision-job.md`, `cli-reference.md`. FAIL_FIX if any public example still
   shows the contributor-only kind form as if it were public.
2. **P1-03 — worker concurrency env.** Runtime honors `WORKERS_CONCURRENCY`
   (`plugins/workers/bin/runtime.ts`); Aspire emits `WORKER_CONCURRENCY`
   (`plugins/workers/src/aspire/workers-contribution.ts`). Verify, then confirm capability/deploy docs
   use `WORKERS_CONCURRENCY` with the mismatch note.
3. **P1-04 — subprocess sandbox qualifier.** Confirm the "strongest isolation" lines now state only
   Deno tasks get `.permissions()` sandboxing; Python/.NET/shell inherit OS permissions.
4. **Six new how-tos (zero invented symbols — the highest-risk surface).** Verify each documented
   symbol with `deno doc`: `roll-out-runtime-overrides.md` (`watchRuntimeConfig`),
   `add-a-task-runtime-adapter.md` (`createDefaultTaskExecutor({adapters})`),
   `build-a-server-validated-form.md` (`definePage().withForm()`),
   `build-a-validated-ingestion-queue.md` (`createTypedQueue`),
   `publish-a-durable-stream.md` (`createDurableStream`, `flush()`),
   `restrict-worker-task-permissions.md` (`.permissions()`, `buildDenoPermissionFlags`). Any symbol,
   type, option, or flag that does not exist in the real surface = FAIL_FIX.
5. **Auth generated reference (hand-authored — verify carefully).** No checked-in reference generator
   existed, so the agent HAND-AUTHORED `docs/site/reference/{auth,plugin-auth,plugin-auth-core,
   auth-kv-oauth,auth-workos,auth-better-auth}/index.md` in the generated-style format from `deno doc`.
   Verify the documented auth symbols actually exist and live on the package each page claims (e.g.
   `defineOAuthProvider` is exported by `@netscript/auth-kv-oauth`, NOT `@netscript/plugin-auth-core`;
   `AuthBackendPort`, `AuthBackendOperationUnsupportedError` in `@netscript/plugin-auth-core`;
   `createKvOAuthBackend`/`createWorkosBackend`/`createBetterAuthBackend` on their adapters). Confirm
   `ref:auth*` units are wired in `docs/site/_data/xref.ts` and nav in `docs/site/_data.ts`, and that
   any asserted "generated reference unit" COUNT was bumped consistently (no stale "22 units" claim).
6. **Enterprise voice (P2 rewrites).** Confirm the 11 rewritten passages read as production framework
   docs. HARD CHECK: the words "honest/honesty/honestly" and candor-announcing framing are BANNED in
   docs — grep `docs/site` (excluding `_plan/`) and FAIL_FIX on any hit in authored prose.
7. **Build green.** From `docs/site`, run the Lume build (`deno task build`) and confirm it succeeds
   with no Vento/Lume errors. A red build = FAIL_FIX.

## GUARDRAILS — do NOT flag these as defects (they are correct/intentional)

- `.compensate(eventType, handler)` is REAL (`packages/plugin-sagas-core/src/builders/define-saga.ts`)
  — saga compensation examples are correct.
- Track-C subprocess proof is intentionally deferred — not a missing-feature defect.
- The auth layer IS present on this branch (post-`338bf6ad` reconciliation). Auth-absence findings
  would be stale-baseline false alarms — verify against the actual branch tree, not origin/main.

## Output

Write your verdict to the PR as a comment: the verdict token, a per-item PASS/FAIL table for items
1–7 with file:line + `deno doc` evidence for any FAIL, and (if FAIL_*) a concrete, minimal fix list.
If you must commit anything, do NOT churn `deno.lock` or add scratch/junk files to the PR branch —
keep the change set to your evaluation artifact only.


Issue/PR title: docs(site): v3 build run — IA restructure + enrich (closes #26 #27 #28)

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
- Write /home/runner/work/_temp/openhands/27919706056-1/summary.md before exit. Include Summary, Changes, Validation,
  Responses to review comments or issue comments when relevant, and Remaining risks.
- Do not write or reuse .llm/tmp/openhands/summary.md. Write only the run-scoped path
  from OPENHANDS_SUMMARY_PATH.
- If output_mode is thread-replies, optionally write /home/runner/work/_temp/openhands/27919706056-1/replies.json as
  an array of {"comment_id": number, "body": string} objects for PR review-thread replies.
- The workflow records durable trace metadata under .llm/tmp/run/openhands/pr-106/run-27919706056-1.

Trigger metadata:
- event: issue_comment
- issue_or_pr: 106
- is_pr: true
- output_mode: pr-comment
- selected_model: openrouter/qwen/qwen3.7-max
- selected_provider: OPENROUTER
- action_run: https://github.com/rickylabs/netscript/actions/runs/27919706056
