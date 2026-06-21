You are OpenHands running for the NetScript repository.

User task:
Trigger comment:
@openhands-agent model=openrouter/qwen/qwen3.7-max provider=openrouter output=pr-comment iterations=800

use harness

You are IMPL-EVAL, a hard, adversarial merge-readiness gate for ONE auth-layer slice (**S7 —
doctrine, legacy, security-defaults & docs polish**) in the NetScript framework. You run in a
SEPARATE session from the implementer (WSL Codex). Certify ONLY this slice. Default to FAIL on
ambiguity. Every claim must cite a file:line in the PR diff or a command exit code — no prose-trust.

This is PR **#101**, head `feat/prime-time/auth-s7-doctrine-defaults`, base umbrella
`feat/prime-time/auth`. Check out the PR branch and evaluate its diff vs the base.

## SKILL (activate before evaluating)
- `netscript-harness` — IMPL-EVAL protocol, verdict definitions, run-loop, gate evidence rules.
- `netscript-doctrine` — Archetype-5 (plugin/service) vs Archetype-2 (kv-oauth backend),
  single-source-of-truth, public-surface hygiene (doctrine 02), legacy-leftover removal.
- `netscript-tools` — scoped gate wrappers (`run-deno-{check,lint,fmt}.ts`), raw git verification,
  lock-hygiene, OpenHands junk-file landmine.
- `netscript-deno-toolchain` — `deno doc`/`deno publish --dry-run`/slow-types/`why` for surface verification.
- `jsr-audit` — doc-lint must cover the FULL export set, not mod.ts alone.
- `rtk` — token-compressed `git`/`grep` output for diff inspection.

## S7 SCOPE (the EXACT change to certify — five non-overlapping sweeps; NO behavior change)
S7 sweeps lower-severity doctrine/legacy/security-default/docs findings. It must NOT alter the
behavior of the five auth procedures, the durable `auth.*` streams, or any backend port, and must
NOT touch `@netscript/cli` or alter S1–S6's seams.

**(a) Version single-source.** `AUTH_PLUGIN_VERSION` (`plugins/auth/src/constants.ts`) is the single
   source; `definePlugin(...)` (`plugins/auth/public/mod.ts`), `createService(..., version)`
   (`plugins/auth/services/src/main.ts`), and `deno.json version` all derive from / equal it, and the
   verify-plugin expectation matches the unified value. Confirm the four formerly-divergent sources
   (`0.0.1-alpha.0` / `1.0.0` / `0.1.0` / `1.0.0`) now agree. **The unified value MUST be
   `0.0.1-alpha.0`** — this matches every sibling plugin (`plugins/workers`, `plugins/sagas`,
   `plugins/triggers`, `plugins/streams` all pin `0.0.1-alpha.0`); the auth plugin is unpublished, so
   a `1.0.0`/`0.1.0` tag is wrong. FAIL if any of the four sources or the verify-plugin expectation
   reads anything other than `0.0.1-alpha.0`. The decision + sibling-consistency rationale must be in
   `worklog.md`.

**(b) `startAuthStreamMirror` no-op removed (or deliberately internal + un-invoked).** Confirm the
   confirmed no-op (`plugins/auth/streams/producer.ts`) plus its dead satellites
   (`normalizeMirrorOptions`, `isAbortSignal`, `AuthStreamMirrorOptions`, the `main.ts` fire-and-forget
   call, the `streams/server.ts` export) are GONE — OR, if kept, it is `@module`-internal and NO LONGER
   invoked from `main.ts`. CRITICAL: confirm via diff that it was truly a no-op (no real event-emit
   path removed) — the durable `auth.*` emit paths must remain intact. `streams/server.ts` module doc
   must now describe the real barrel (lifecycle emitters + schema), not a "mirror."

**(c) Security defaults confined to test paths.** `resolveKvOAuthKey`
   (`plugins/auth/services/src/backend-registry.ts`): the `new Uint8Array(32).fill(7)` deterministic
   key MUST now THROW (via `requiredEnv`/equivalent) in non-test paths when a kv-oauth store is
   requested without a real key, and the deterministic key is confined to the in-memory test registry
   factory ONLY. `toRequest` (`plugins/auth/services/src/routers/v1-helpers.ts`): the
   `https://app.example.test` fallback host + forced `x-forwarded-proto: https` MUST require a real
   request base / configured origin in non-test paths; the placeholder is confined to test fixtures.

**(d) README + manifest metadata.** `plugins/auth/README.md` expanded to sibling-plugin depth (full
   export map `.`/`./public`/`./plugin`/`./contracts`/`./services`/`./streams`/`./streams/server`,
   durable `auth.*` events + `createAuthStreamDB` recipe, complete `NETSCRIPT_AUTH_*`/`WORKOS_*`/
   `BETTER_AUTH_*` env reference, mount/usage recipe). Manifest `repository` URL repointed away from
   `github.com/rickylabs/netscript-start` to the canonical repo; `documentation` URL resolves.

**(e) `auth-kv-oauth` dead-enum prune.** The still-never-thrown `KvOAuthErrorCode` members are pruned
   (candidates `state_mismatch`/`nonce_mismatch`/`id_token_invalid`). VERIFY each pruned code is
   genuinely never thrown post-S3 (S3 made `refresh_reuse_detected`/`refresh_failed` live — those must
   REMAIN). Any optional low-sev surface items either landed cleanly or were deferred to a debt entry
   recorded in `drift.md`.

## CERTIFICATION CHECKS (report each PASS/FAIL with evidence)
1. **Zero new casts.** `rg -n "as unknown as|as any|: any|as never|as <[A-Z]|@ts-(ignore|nocheck|expect-error)"`
   over the diff's touched files. None of these packages is the contract package, so there is NO
   tolerated new cast (the sole pre-existing sanctioned `authV1 as any` in `router.ts` is S6's, must be
   untouched). ANY new cast in handler/business-logic/port/contract code = FAIL. If removing dead code
   exposed an existing cast, it must be eliminated cleanly, not retained.
2. **Each scope item (a)–(e) landed as specified**, cited by file:line in the diff. Specifically:
   version single-sourced (verify-plugin green at the unified value); no-op removed/internalised with
   doc corrected and no real emit path lost; both security defaults throw/are-confined in non-test;
   README expanded + manifest URLs corrected; still-dead enum codes pruned (live S3 codes retained).
3. **Boundary / no regression.** filesTouched stays within `plugins/auth/**`, `packages/auth-kv-oauth`,
   and `packages/plugin-auth-core` docs/surface only. `@netscript/cli` UNTOUCHED. No change to S1's
   contract seam, S2's handler binding, S3's kv-oauth error-throw behavior, S4's crypto/error symbols,
   S5's service-auth context, or S6's capability seam. No public symbol silently removed from any
   exports map beyond the intended `startAuthStreamMirror`/`streams/server` cleanup (which must be an
   honest, documented surface change, verify-plugin still green).
4. **Public-surface soundness (JSR).** `deno doc --lint` over the FULL export set of `plugins/auth` and
   `packages/auth-kv-oauth` (and `packages/plugin-auth-core` if its docs surface was touched) → 0
   issues. `deno publish --dry-run --allow-dirty` (scoped per package) → zero slow-type warnings,
   expected file list, `description` ≤ 250 chars.
5. **Gates green (capture raw exit codes; any non-zero unrelated to a proven pre-existing issue = FAIL):**
   - `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root plugins/auth --ext ts,tsx` (add `--unstable-kv`)
   - same `--root packages/auth-kv-oauth` (and `--root packages/plugin-auth-core` if touched)
   - `run-deno-lint.ts` and `run-deno-fmt.ts` for each touched root (`--ext ts,tsx`, source TS only)
   - Targeted tests MUST include: a non-test `resolveKvOAuthKey` path that THROWS without a real key; a
     test-registry path still using the deterministic key; verify-plugin green at the unified version;
     and the streams test suite green with NO reference to `startAuthStreamMirror`.
   - Do NOT run the expensive `scaffold.runtime` E2E (out of scope for S7).
6. **Hygiene.** `deno.lock` UNCHANGED (no dependency genuinely changed) — any churn must be a clean
   re-resolution with a stated reason, else FAIL. No stray junk files (watch the known OpenHands
   `summary.md` / stray-file landmine). No secrets/tokens committed.

## VERDICT
Emit your verdict as a PR comment line in the **canonical kinded form**, exactly one of:
`**Verdict: IMPL-EVAL: PASS**`, `**Verdict: IMPL-EVAL: FAIL_FIX**`, `**Verdict: IMPL-EVAL: FAIL_RESCOPE**`,
or `**Verdict: IMPL-EVAL: FAIL_DEBT**` (per `evaluator/verdict-definitions.md`). Then, for each check
1–6, one line with concrete file:line or exit-code evidence. If FAIL, list the exact blocking items +
the minimal fix, pointing at the exemplar (sagas/workers/plugin-auth-core). Non-blocking nits may be
listed separately and labeled NIT — they do not change a PASS. Certify ONLY S7; FAIL for any scope
creep beyond the boundary above.

Preserve lock hygiene: do not commit `deno.lock` or source churn. Keep the verdict to the PR comment —
do not push files to the branch.


Issue/PR title: S7 — auth doctrine, legacy, security-defaults & docs polish

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
- Write /home/runner/work/_temp/openhands/27896195698-1/summary.md before exit. Include Summary, Changes, Validation,
  Responses to review comments or issue comments when relevant, and Remaining risks.
- Do not write or reuse .llm/tmp/openhands/summary.md. Write only the run-scoped path
  from OPENHANDS_SUMMARY_PATH.
- If output_mode is thread-replies, optionally write /home/runner/work/_temp/openhands/27896195698-1/replies.json as
  an array of {"comment_id": number, "body": string} objects for PR review-thread replies.
- The workflow records durable trace metadata under .llm/tmp/run/openhands/pr-101/run-27896195698-1.

Trigger metadata:
- event: issue_comment
- issue_or_pr: 101
- is_pr: true
- output_mode: pr-comment
- selected_model: openrouter/qwen/qwen3.7-max
- selected_provider: OPENROUTER
- action_run: https://github.com/rickylabs/netscript/actions/runs/27896195698
