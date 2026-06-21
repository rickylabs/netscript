You are OpenHands running for the NetScript repository.

User task:
Trigger comment:
@openhands-agent model=openrouter/qwen/qwen3.7-max provider=openrouter output=pr-comment iterations=800

use harness

Run **IMPL-EVAL** for PR #102 — AS7, the FINAL leaf of the prime-time auth umbrella (`feat/prime-time/auth`, PR #86). You are a separate evaluator session; the generator does NOT self-certify. Check out the PR branch (`feat/prime-time/auth-as7-fitness`, base `feat/prime-time/auth` @ `91613467`). Read `.llm/harness/evaluator/protocol.md` and `.llm/harness/evaluator/verdict-definitions.md` and follow them exactly. Emit exactly one terminal verdict at the end.

## SKILL (activate before evaluating — read each `SKILL.md`; if absent under `.claude/skills/`, read `.agents/skills/<name>/SKILL.md`)
- **netscript-harness** — IMPL-EVAL protocol, verdict definitions, archetype + gate matrix, the no-self-certify rule.
- **netscript-doctrine** — THE axis AS7 audits: archetype identification, package file-structure contract, public-surface discipline, composition-over-inheritance vs abstract/base classes, structural ports + typed factories + extension points. Judge the conformance report against `docs/architecture/doctrine/*` and `.llm/harness/archetypes/ARCHETYPE-*.md`.
- **jsr-audit** — verify Part C: `deno doc --lint` over the FULL export set (not `mod.ts` alone) + `deno publish --dry-run` (0 slow types) per published auth package; confirm the 8/9 source-controllable claim and that provenance is NOT faked.
- **netscript-tools** — `arch:check` / scoped `run-deno-{check,lint,fmt}.ts` wrappers, raw git verification, lock hygiene, evidence capture.
- **netscript-deno-toolchain** — `deno doc` to enumerate each package's real public surface; `deno why` for dependency-edge checks.
- **netscript-pr** — verdict comment conventions.

## What AS7 claims to deliver (verify each against the diff, do not take on trust)
- **Part A** `conformance-report.md` — per-surface archetype + file-structure + abstraction-shape verdicts for `plugin-auth-core` (A1), `auth-workos`/`auth-better-auth`/`auth-kv-oauth` (A2 backends), `plugins/auth` (A5), `service/src/auth` seam (A4). Confirm the archetype assignments are correct and the PASS verdicts are justified by the actual code (backends are pure `AuthBackendPort` factories with no return casts and no deep `@netscript/*/src` imports; extension point is the named registry `Map<string,AuthBackendPort>`+default).
- **Part B** `fitness-gates.md` + `.llm/tools/fitness/check-doctrine.ts` (+~220 lines) — 5 wired gates (`F-AUTH-CAST`, `F-AUTH-IMPORT`, `F-AUTH-BACKEND-FACTORY`, `F-AUTH-CONTRACT`, `F-AUTH-INHERITANCE`). Re-run `deno task arch:check` and confirm EXIT 0 with FAIL=0 across all auth roots. Confirm each gate actually encodes the doctrine rule it claims (read the check-doctrine.ts logic) and would catch a real violation (spot-check by reasoning, or by a throwaway local mutation if you wish).
- **Part C** `jsr-scorecard.md` — every published auth surface 8/8 source-controllable. Re-run at least 2 packages' `deno publish --dry-run` and a full-export `deno doc --lint` to confirm 0 slow types / 0 doc-lint failures. Confirm provenance/SLSA is recorded as deferred debt, not claimed.
- **Cast removals** — the generator replaced non-sanctioned assertions in plugin stream/service typing with structural types + a `WatchableKv` runtime guard, and re-exported `InteractiveFlowPort`/`InteractiveCallbackResult`. Confirm: (a) no NEW non-sanctioned cast anywhere in the auth layer (`as`/`as unknown as`/`as never`/`@ts-*`); only the sanctioned central contract cast + the `plugins/*/services/src/router.ts` `any`+`deno-lint-ignore` exemplar are allowed; (b) the auth + plugin test suites stay green (`deno test --unstable-kv --allow-all plugins/auth packages/auth-* packages/plugin-auth-core`).

## Two judgment calls you MUST rule on explicitly
1. **`arch:check` re-scoping.** `deno task arch:check` previously ran `check-doctrine.ts` repo-wide and was **already red on pre-existing non-auth historical debt** before AS7. This PR narrows `arch:check` to the 5 auth roots (green) and preserves the repo-wide scan as **`arch:check:repo`** (still red on unrelated debt), with debt in `.llm/harness/debt/arch-debt.md`. Decide whether narrowing the shared task name is acceptable (defensible: it was never green, debt preserved + recorded) or whether it should stay repo-wide / be named differently. State your ruling; if you require a rename, that is FAIL_FIX with the exact change.
2. **Pre-existing sibling tool errors (disclosed, out of scope).** `.llm/tools/fitness/check-manifest-integrity.ts` has 16 pre-existing `TS7006`/`TS2307` errors (missing `packages/fresh-ui/registry/manifest.ts`, implicit-any params). AS7 did NOT touch this file (only `check-doctrine.ts`). Confirm it is pre-existing on the base and unrelated to AS7's gates; it should not block this PR (note it for a separate cleanup), but say so explicitly.

## Scope expectations
AS7 is audit + additive enforcement only — NOT a behavioral/type refactor (those were S1–S7). Cast removal to satisfy the cast-policy gate is in-scope. Structural findings deferred to `arch-debt.md` are acceptable if recorded with rationale. `@netscript/cli` and `deno.lock` must be untouched (confirm empty diff). PLAN-EVAL was waived per the locked appended plan + the user's overnight implementation mandate; that waiver is recorded in `drift.md` and is acceptable — do NOT fail solely on the missing PLAN-EVAL.

## Verdict
Run the gates yourself; do not rely on the worklog's self-reported table. End your comment with exactly one of:
- `Verdict: IMPL-EVAL: PASS` — all gates green, conformance verdicts justified, gates encode real rules, JSR 8/8 confirmed, no non-sanctioned casts, both judgment calls resolved acceptably.
- `Verdict: IMPL-EVAL: FAIL_FIX` — concrete, small fixes required (list each with file + exact change).
- `Verdict: IMPL-EVAL: FAIL_RESCOPE` — the slice does materially more/less than its plan.
- `Verdict: IMPL-EVAL: FAIL_DEBT` — a deferred item should have been done in-slice.


Issue/PR title: AS7 — auth doctrine-conformance audit + fitness gates + JSR 100% (final auth leaf)

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
- Write /home/runner/work/_temp/openhands/27897233968-1/summary.md before exit. Include Summary, Changes, Validation,
  Responses to review comments or issue comments when relevant, and Remaining risks.
- Do not write or reuse .llm/tmp/openhands/summary.md. Write only the run-scoped path
  from OPENHANDS_SUMMARY_PATH.
- If output_mode is thread-replies, optionally write /home/runner/work/_temp/openhands/27897233968-1/replies.json as
  an array of {"comment_id": number, "body": string} objects for PR review-thread replies.
- The workflow records durable trace metadata under .llm/tmp/run/openhands/pr-102/run-27897233968-1.

Trigger metadata:
- event: issue_comment
- issue_or_pr: 102
- is_pr: true
- output_mode: pr-comment
- selected_model: openrouter/qwen/qwen3.7-max
- selected_provider: OPENROUTER
- action_run: https://github.com/rickylabs/netscript/actions/runs/27897233968
