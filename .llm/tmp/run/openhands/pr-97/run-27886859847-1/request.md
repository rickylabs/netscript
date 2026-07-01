You are OpenHands running for the NetScript repository.

User task:
Trigger comment:
@openhands-agent model=openrouter/qwen/qwen3.7-max output=pr-comment

**use harness** — run as **IMPL-EVAL** (separate evaluator session) for this AS6 leaf PR. You are the evaluator; the generator does not self-certify. Read `.llm/harness/evaluator/protocol.md` + `.llm/harness/evaluator/verdict-definitions.md` and emit one verdict: `PASS` / `FAIL_FIX` / `FAIL_RESCOPE` / `FAIL_DEBT`.

## SKILL
- `netscript-harness` — IMPL-EVAL protocol, verdict vocabulary, evaluator separation.
- `netscript-doctrine` — plugin archetype + public-surface/gate conformance for `plugins/auth` and the CLI scaffold seams.
- `netscript-cli` — scaffold/local-source/JSR import resolution + package-copy mechanics being changed.
- `netscript-tools` — scoped check/lint/fmt wrappers, raw-git verification, lock hygiene, the `e2e:cli` gate.
- `netscript-deno-toolchain` — `deno doc`, `publish:dry-run`, dependency/version inspection.
- `jsr-audit` — JSR readiness / slow-types / doc-lint scoring for the touched published packages.
- `rtk` — token-compressed git/grep/ls inspection.

## Scope under evaluation
5 commits, base `75eb85c5` → HEAD `62ae3ab4`. Adds `plugin-auth-core` + `auth-{workos,better-auth,kv-oauth}` to the CLI fixed package vocabulary (local copy list, local + JSR import resolvers, scaffold package/workspace constants), wires `auth` into the `scaffold.runtime` e2e, honesty README, dead-stream-mirror removal, JSR readiness. Edits confined to `plugins/auth/**`, `.llm/tools/scaffold-e2e-test.ts`, `packages/cli/**`.

## PRIMARY verification — auth boot parity (do this first, it decides the verdict)
The headline e2e (`deno task e2e:cli run scaffold.runtime --cleanup --format pretty`, reported `passed=47 failed=0`) makes the auth resource healthy **only via a `runtime.auth-smoke-env` gate** that injects dummy `NETSCRIPT_AUTH_*` env; without it the pre-fix runs failed `aspire-wait-auth` (exit 18). README L117-119 claims generated apps "can boot the auth service without provider credentials."
**Determine the real-user truth:** scaffold a fresh local-source project, `plugin add auth`, generate, and `aspire start` following ONLY the documented README steps. Does the auth resource become healthy out-of-the-box (scaffold ships safe appsettings/env defaults), or does it fail exactly like the pre-fix runs because only the e2e runner injects the env?
- If the scaffold ships defaults / the README accurately tells a user the minimal env to set and that path boots auth → not a blocker.
- If a fresh scaffold fails to boot auth AND the docs don't give a working minimal path → `FAIL_FIX`: the apphost/appsettings template must wire `NETSCRIPT_AUTH_*` placeholders (packages/cli + Aspire scaffold — pre-authorized), or the README claim is corrected to match reality. Name the exact file + missing wiring.

## Also verify
- Re-run the gates independently: scoped `run-deno-check`/lint/fmt on `plugins/auth` + the touched `packages/cli` files; `plugins/auth` test + verify + `doc --lint` + `publish:dry-run` (zero slow-types); the CLI copier/import-resolver tests; and the headline `scaffold.runtime` e2e. Report raw exit codes.
- **Zero-cast rule (program-wide):** no `as` / `as unknown as` / `@ts-*` anywhere in the diff except the two sanctioned exceptions (centralized contract seam; top-level router `any`). Any other cast → `FAIL_FIX`.
- Confirm `deno.lock` is untouched and no edits leak outside the three allowed paths; the six pre-existing `.llm/tmp/run/openhands/**/request.md` CRLF files must stay unstaged.

## Known debt — do NOT `FAIL_DEBT` on this
Extending the CLI fixed package lists for auth is a deliberate temporary bridge. The scalable replacement — a manifest-declared, dynamically-resolved plugin→package registry so third-party authors need no core-CLI edits — is a tracked follow-up on its own branch (supervisor task #67). Treat as accepted debt, not a new violation.

## Boundaries
Lock hygiene: do not commit `deno.lock` or source churn unless a reviewed fix requires it. If you change anything, push to this PR branch with an explicit refspec and report it. Report the raw verdict + per-gate exit codes + the boot-parity finding in your PR comment.

Issue/PR title: AS6: e2e scaffold.runtime auth path + honesty docs + CLI package-copy unblock

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
- Write /home/runner/work/_temp/openhands/27886859847-1/summary.md before exit. Include Summary, Changes, Validation,
  Responses to review comments or issue comments when relevant, and Remaining risks.
- Do not write or reuse .llm/tmp/openhands/summary.md. Write only the run-scoped path
  from OPENHANDS_SUMMARY_PATH.
- If output_mode is thread-replies, optionally write /home/runner/work/_temp/openhands/27886859847-1/replies.json as
  an array of {"comment_id": number, "body": string} objects for PR review-thread replies.
- The workflow records durable trace metadata under .llm/tmp/run/openhands/pr-97/run-27886859847-1.

Trigger metadata:
- event: issue_comment
- issue_or_pr: 97
- is_pr: true
- output_mode: pr-comment
- selected_model: openrouter/qwen/qwen3.7-max
- selected_provider: OPENROUTER
- action_run: https://github.com/rickylabs/netscript/actions/runs/27886859847
