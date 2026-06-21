You are OpenHands running for the NetScript repository.

User task:
Trigger comment:
@openhands-agent model=openrouter/qwen/qwen3.7-max provider=openrouter output=pr-comment iterations=40

use harness

# IMPL-EVAL — S4 shared backend session crypto + JSR-clean backend surfaces (PR #95)

You are an **IMPL-EVAL evaluator** in a separate session from the generator (WSL Codex). Independently
RE-RUN the gates — do not trust the worklog. Emit a verdict as a PR comment only: `IMPL-EVAL: PASS`,
`FAIL_FIX`, `FAIL_RESCOPE`, or `FAIL_DEBT`. Do NOT commit code fixes (a benign deno.lock re-resolution
+ your run trace are the only allowed commits).

## SKILL (activate before evaluating — read each SKILL.md)
- **`netscript-harness`** — IMPL-EVAL protocol, verdict definitions, evaluator separation. Read
  `.llm/harness/evaluator/protocol.md` + `verdict-definitions.md`.
- **`netscript-doctrine`** — `@netscript/auth-workos` and `@netscript/auth-better-auth` are
  backend-adapter packages (Archetype-2: pure adapter → typed port); `@netscript/plugin-auth-core` is
  the shared core (ports/contracts/crypto). Verify public surface + archetype gates + no upstream-coupling
  leaks.
- **`jsr-audit`** — §5 JSR readiness for all three packages: doc-lint over each FULL export map, no
  slow-types, dry-run.
- **`netscript-deno-toolchain`** — `deno doc`/`deno publish`/version inspection.
- **`netscript-tools`** — scoped check/lint/fmt wrappers, raw git verification, lock hygiene.
- **`netscript-pr`** — posting the verdict comment / labels.
- **`rtk`** — compress git/grep/deno-task output.

## Boundary under review
`packages/auth-workos`, `packages/auth-better-auth`, `packages/plugin-auth-core` (crypto / error
taxonomy / public surface) + this slice's harness artifacts under
`.llm/tmp/run/feat-framework-prime-time--supervisor/slices/auth-s4-backends/`. Branch
`feat/prime-time/auth-s4-backends` → umbrella `feat/prime-time/auth`. Commits `8dede9a7`, `82b04fbc`.

## Cast policy (framework-wide)
Only TWO casts are permitted anywhere: (1) the single centralized contract `as unknown as
<XContractV1>`; (2) the top-level router `any`. For these three packages the ONLY acceptable assertion
is the pre-existing S1 contract seam `) as unknown as AuthContractV1` at
`plugin-auth-core/src/contracts/v1/auth.contract.ts:338`. Everything else must be zero.

## Hard checks (re-run, do not trust the worklog)
1. **Zero casts** — grep `as never`, ` as any`, `as unknown`, ` as [A-Z][A-Za-z]+` over
   `auth-workos/src` and `auth-better-auth/src` → **zero matches** each. Over `plugin-auth-core/src` →
   **exactly one** match, the contract seam at `auth.contract.ts:338`. Any extra match = `FAIL_FIX`.
2. **Shared crypto lifted** — `plugin-auth-core/src/ports/mod.ts` exports the timing-safe HMAC
   session-token crypto (e.g. `createHmacSessionTokenCrypto`); `better-auth-backend.ts` and
   `workos-backend.ts` consume it and no longer carry duplicate local HMAC implementations. Confirm the
   compare is timing-safe (constant-time), not `===` on the token.
3. **Error-taxonomy interop** — `backend-error-interop_test.ts` asserts both backends map failures into
   the shared core error taxonomy; no dead/declared-but-unused codes remain.
4. **JSR-surface honesty** — the public better-auth options type is a local JSR-clean subset (NOT the
   full upstream `BetterAuthOptions`/`Auth` alias, which drags better-auth private internals into
   `deno doc --lint`). Confirm the object passed to `betterAuth()` is still validated internally against
   `BetterAuthOptions`. Same JSR-cleanliness check for the WorkOS public surface.
5. **Gates (scoped, per package)** — re-run and report exit codes for each of the three roots:
   `run-deno-check.ts --root <pkg> --ext ts,tsx` (+`--unstable-kv` where it touches workspace KV),
   `run-deno-lint.ts`, `run-deno-fmt.ts`; `deno test --unstable-kv --allow-all <pkg>`.
6. **JSR §5** — `deno doc --lint` over each package's FULL export map (mod + every subpath export in
   `deno.json`); package-scoped `deno publish --dry-run --allow-dirty` → zero slow-types for all three.
7. **Lock hygiene** — `git diff --quiet -- deno.lock` (the drift notes a benign better-auth resolver
   entry may appear from the schema-gen wrapper path — if present, confirm it is a resolver re-resolution,
   not a version-pin change).
8. **Scope** — diff touches only the three packages + the slice harness dir; `@netscript/cli`,
   `plugins/auth`, `packages/service` untouched.

Report each check with the exact command + exit code. Verdict heading `## OpenHands Agent — Completed`
with `**Verdict: IMPL-EVAL: PASS**` (or the failure verdict).


Issue/PR title: S4 — shared backend session crypto + JSR-clean backend surfaces (zero-cast)

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
- Write /home/runner/work/_temp/openhands/27883784314-1/summary.md before exit. Include Summary, Changes, Validation,
  Responses to review comments or issue comments when relevant, and Remaining risks.
- Do not write or reuse .llm/tmp/openhands/summary.md. Write only the run-scoped path
  from OPENHANDS_SUMMARY_PATH.
- If output_mode is thread-replies, optionally write /home/runner/work/_temp/openhands/27883784314-1/replies.json as
  an array of {"comment_id": number, "body": string} objects for PR review-thread replies.
- The workflow records durable trace metadata under .llm/tmp/run/openhands/pr-95/run-27883784314-1.

Trigger metadata:
- event: issue_comment
- issue_or_pr: 95
- is_pr: true
- output_mode: pr-comment
- selected_model: openrouter/qwen/qwen3.7-max
- selected_provider: OPENROUTER
- action_run: https://github.com/rickylabs/netscript/actions/runs/27883784314
