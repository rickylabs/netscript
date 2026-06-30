You are OpenHands running for the NetScript repository.

User task:
Trigger comment:
@openhands-agent model=openrouter/qwen/qwen3.7-max output=pr-comment

use harness. You are the **IMPL-EVAL** evaluator (final pass) for the #172b/c/d plugin runtime-store relocation + `@netscript/kv` migration slices plus the follow-up auth fitness-gate unblock, on branch `feat/scaffold-surface-167`. You are a SEPARATE session from the generator. Do NOT implement or fix — read the evidence, verify against the live checkout, emit a verdict.

## SKILL (activate before evaluating; read each SKILL.md)
- `.agents/skills/netscript-harness` — the IMPL-EVAL protocol (`.llm/harness/evaluator/protocol.md`), `verdict-definitions.md`, slice/commit discipline.
- `.agents/skills/netscript-doctrine` — ARCHETYPE-5 connectors + sibling ARCHETYPE-2/3 `-core` packages; layering (`domain→ports→application→adapters→presentation`); `-core` depending on `@netscript/*` primitives is conformant/encouraged, not a leak.
- `.agents/skills/netscript-deno-toolchain` — `deno doc`/`deno why` to confirm the migrated stores use the `@netscript/kv` `KvStore` surface and the new `-core` deps resolve.
- `.agents/skills/jsr-audit` — the publish bar: `deno publish --dry-run` (triggers-core keeps `--allow-slow-types`, must not regress).

## What to read
- `.llm/harness/evaluator/protocol.md` + `.llm/harness/evaluator/verdict-definitions.md`.
- Run artifacts under `.llm/tmp/run/feat-scaffold-surface-167--adapter-relocation/`: `plan.md` (locked D-KV/D2/D3/D4, slices S-b/S-c/S-d incl. S-b.5/S-c.5, Risks R1–R5, gates), `research.md`, `plan-eval.md` (cycle-2 PASS), `worklog.md` (gate evidence), `commits.md`, `drift.md`.

## Commits under evaluation (verify each against the live tree)
- `6e907b4b` S-b sagas → `plugin-sagas-core/stores` (+KV migration, S-b.4 connector rewire, S-b.5 doc-fence split)
- `6c8769c4` S-c triggers → `plugin-triggers-core/{stores,adapters}` (+KV migration, S-c.5 test-double rename)
- `87ecf8e6` S-d workers → `plugin-workers-core/stores` (relocate-only reference)
- `6c7cdd8a` docs(harness) run-artifact record
- `36d44f7c` fix(harness) auth arch fitness-gate unblock (gate-scope correction; `.llm/tools/fitness/check-doctrine.ts` only)

## What to verify (read real code; do not trust the worklog)
1. **KV migration soundness (R3 hard stop):** migrated sagas+triggers production stores use `@netscript/kv` (`KvStore`/`AtomicCheck`/`AtomicMutation`/`AtomicResult`/`list({prefix})`) with ZERO `Deno.openKv`/`Deno.Kv`/`Deno.KvKey` escape hatch; optimistic-concurrency + idempotency + prefix-scan semantics preserved; a `MemoryKvAdapter`-backed test proves engine-agnostic behavior per migrated store.
2. **Relocation correctness:** the four store/adapter sets landed in the right `-core/{stores,adapters}` folders; connectors import them from `@netscript/plugin-<kind>-core` (no connector→core leak; no shim, zero-compat alpha break per D4).
3. **S-b.5 / S-c.5:** the single `durable-sagas.md` fence split (re-grep zero remaining relocated-symbol imports via the connector `/runtime` path); the triggers test-double rename to a distinct non-colliding name with zero stale refs.
4. **Gate change (`36d44f7c`) is sound, not a soundness regression:** `check-doctrine.ts` only (a) corrected the auth contract-cast allow-list regex to the actual sanctioned `} as unknown as Parameters<typeof oc.errors>[0]` site at `auth.contract.ts:177`, and (b) exempts test paths (`/tests/`, `_test.ts`, `.test.ts`) from the auth cast + `@ts-*` checks — PRODUCTION auth source remains fully gated and no auth production/test file was modified.
5. **Gates green:** `deno task arch:check` EXIT=0 with all 13 roots `FAIL=0`; scoped check/lint/fmt over touched roots; `deno test --unstable-kv` for migrated stores; dry-runs warning-only (triggers-core `--allow-slow-types` not regressed). No `deno.lock` hand-edit; report the lock delta. Zero new production `any`/casts beyond the 2 sanctioned categories.
6. **Scope discipline:** no creep beyond relocation + KV migration + gate-unblock; the net-new triggers-core feature-backing routes (#181 / `TRIGGERS-CONNECTOR-DEFERRED-ROUTES`) were NOT folded in.

## Output
Write `.llm/tmp/run/feat-scaffold-surface-167--adapter-relocation/evaluate.md` and post a PR-comment summary on #172. Emit `PASS`, `FAIL_FIX`, `FAIL_RESCOPE`, or `FAIL_DEBT` with specific, actionable findings citing decision IDs (D-KV/D2/D3/D4), slice names (S-b/S-c/S-d incl. S-b.5/S-c.5), risk IDs (R1–R5), and gate names. Do NOT implement. Lock hygiene: do not commit `deno.lock` re-resolution or source churn; if a fix is required, report it for a reviewed Codex slice.


Issue/PR title: Re-architect plugin scaffold surface (#157): thin, typesafe, no plugin-source copy

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
- Write /home/runner/work/_temp/openhands/28416306379-1/summary.md before exit. Include Summary, Changes, Validation,
  Responses to review comments or issue comments when relevant, and Remaining risks.
- Do not write or reuse .llm/tmp/openhands/summary.md. Write only the run-scoped path
  from OPENHANDS_SUMMARY_PATH.
- If output_mode is thread-replies, optionally write /home/runner/work/_temp/openhands/28416306379-1/replies.json as
  an array of {"comment_id": number, "body": string} objects for PR review-thread replies.
- The workflow records durable trace metadata under .llm/tmp/run/openhands/pr-172/run-28416306379-1.

Trigger metadata:
- event: issue_comment
- issue_or_pr: 172
- is_pr: true
- output_mode: pr-comment
- selected_model: openrouter/qwen/qwen3.7-max
- selected_provider: OPENROUTER
- action_run: https://github.com/rickylabs/netscript/actions/runs/28416306379
