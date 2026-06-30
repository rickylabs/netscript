You are OpenHands running for the NetScript repository.

User task:
Trigger comment:
@openhands-agent model=openrouter/minimax/minimax-m3 output=pr-comment iterations=150

use harness

# PLAN-EVAL — #172b/c/d plugin runtime-store relocation + `@netscript/kv` migration (PR #172, branch feat/scaffold-surface-167)

You are the **PLAN-EVAL** evaluator for a harnessed framework-architecture run. You are a SEPARATE
session from the generator; do NOT implement, relocate, or edit any source. Read the plan + research,
apply the plan-gate, verify the plan's claims against the live branch code, and emit a verdict. Run
on `openrouter/minimax/minimax-m3`. The PR-comment trigger checks out the PR branch
(`feat/scaffold-surface-167`) — evaluate against that checkout.

## SKILL

Activate and follow these repo skills before evaluating (read each `SKILL.md`; mandatory):

- `.agents/skills/netscript-harness` — the 8-phase model, the PLAN-EVAL protocol, and the plan-gate
  you enforce. You are the Plan-Gate hard stop: no relocation/migration slice may start before your
  `PASS`.
- `.agents/skills/netscript-doctrine` — ARCHETYPE-5 connectors + sibling ARCHETYPE-2/3 `-core`
  packages; the layering rules (`domain → ports → application → adapters → presentation`) and folder
  vocabulary (file 05). Use it to check that placing stores/adapters in `-core/{stores,adapters}` and
  letting `-core` depend on `@netscript/*` primitives is doctrine-conformant, not a layering leak.
- `.agents/skills/netscript-deno-toolchain` — `deno doc` / `deno why` to spot-check the
  `@netscript/kv` public surface the plan adopts (does `KvStore` really expose `get/set/delete/list`
  + `AtomicCheck/AtomicMutation/AtomicResult` for the versionstamp optimistic-concurrency the saga
  store needs?) and to confirm the new `-core` deps resolve.
- `.agents/skills/jsr-audit` — the publish bar: confirm the plan's gate (`deno publish --dry-run`
  WITHOUT `--allow-slow-types`, except triggers-core which keeps its existing flag and must not
  regress) is the right certification for each touched `-core` package.

## What to read

1. `.llm/harness/evaluator/plan-protocol.md` and `.llm/harness/gates/plan-gate.md` — your protocol
   and checklist.
2. `.llm/tmp/run/feat-scaffold-surface-167--adapter-relocation/research.md` — the re-baseline,
   `@netscript/kv` surface, the relocation+migration map grounded against the worktree.
3. `.llm/tmp/run/feat-scaffold-surface-167--adapter-relocation/plan.md` — the locked design (D-KV,
   D2, D3, D4), slices S-b/S-c/S-d, gates, debt. This is the artifact under evaluation.
4. The committed debt entry `.llm/harness/debt/arch-debt.md` →
   `PLUGIN-RUNTIME-ADAPTER-RELOCATION (#172b/c/d)`.

## What to verify against ground truth (read the real code — do not trust the plan's claims)

- **The defect is real:** confirm `plugins/sagas/src/runtime/kv-saga-store.ts` (+
  `kv-saga-runtime-stores.ts`) and `plugins/triggers/src/runtime/kv-trigger-runtime-stores.ts`
  actually hardwire `Deno.openKv`/`Deno.Kv`/`Deno.KvKey` + the native fluent
  `.atomic().check({versionstamp}).set().commit()`, and that
  `plugins/workers/src/runtime/worker/worker-idempotency-store.ts` (`KvWorkerIdempotencyStore`) is
  already on `@netscript/kv` (the reference the migration mirrors).
- **The target primitive supports the port:** verify `@netscript/kv` (`packages/kv`) exposes the
  `KvStore` interface with `list({prefix})` and the atomic types the saga store's list-heavy +
  versionstamp operations require — i.e. the migration is feasible without re-introducing a
  Deno-specific escape hatch. If `KvStore.atomic`/`list` cannot express the saga store's
  optimistic-concurrency + prefix-scan semantics, that is a `FAIL_PLAN`.
- **Layering / cycles:** confirm `@netscript/kv`, `@netscript/cron`, `@netscript/watchers` do NOT
  import any `@netscript/plugin-*-core` (so the new `-core → primitive` deps create no cycle), and
  that `arch:check` would still pass (no connector → core leak introduced).
- **Surface-break safety (D2):** the plan claims a pre-flight grep proves no first-party consumer
  (scaffold emitter, e2e, docs fences) imports these stores via the connector `./runtime` path.
  Sanity-check that claim — if any first-party code imports them from `@netscript/plugin-<kind>/runtime`,
  the zero-compat break needs a migration step the plan is missing.
- **Scope discipline:** the plan must not silently widen beyond relocation + KV migration (e.g. it
  must NOT fold in the net-new triggers-core feature-backing routes — that is the separate
  PLAN-EVAL-gated task #181 / `TRIGGERS-CONNECTOR-DEFERRED-ROUTES`).

## What to evaluate

- **D-KV** is sound and feasible (the central decision): migrate sagas+triggers KV stores onto
  `@netscript/kv` with the workers structural-port pattern, preserving optimistic-concurrency +
  idempotency semantics, engine chosen at the composition root.
- **D2 / D3 / D4** placement + zero-compat decisions are correct and complete.
- **Slices** S-b/S-c/S-d are dependency-correct, independently committable, each with its own gate
  (incl. a `MemoryKvAdapter`-backed test proving engine-agnostic behavior).
- **Gates adequacy:** scoped check/lint/fmt, `deno test --unstable-kv`, dry-run (no new slow types),
  `arch:check`, no `deno.lock` hand-edit, zero new `any`/casts (only the 2 sanctioned categories).
- **Guiding principle** is correctly stated: `-core` depending on `@netscript/*` primitives is the
  encouraged direction; there is no "minimize -core deps" rule. Confirm no stale "D1"/"minimize core
  deps" framing survives in the plan/research/debt.

## Output

Write your verdict to
`.llm/tmp/run/feat-scaffold-surface-167--adapter-relocation/plan-eval.md` and post a PR-comment
summary on PR #172. Emit `PASS` or `FAIL_PLAN` with specific, actionable findings (cite decision IDs
D-KV/D2/D3/D4, slice names S-b/S-c/S-d, and gate names). Do NOT implement. Lock hygiene: do not touch
`deno.lock`, source, or any `packages/`/`plugins/` files; write only `plan-eval.md` under this run
folder.


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
- Write /home/runner/work/_temp/openhands/28412780609-1/summary.md before exit. Include Summary, Changes, Validation,
  Responses to review comments or issue comments when relevant, and Remaining risks.
- Do not write or reuse .llm/tmp/openhands/summary.md. Write only the run-scoped path
  from OPENHANDS_SUMMARY_PATH.
- If output_mode is thread-replies, optionally write /home/runner/work/_temp/openhands/28412780609-1/replies.json as
  an array of {"comment_id": number, "body": string} objects for PR review-thread replies.
- The workflow records durable trace metadata under .llm/tmp/run/openhands/pr-172/run-28412780609-1.

Trigger metadata:
- event: issue_comment
- issue_or_pr: 172
- is_pr: true
- output_mode: pr-comment
- selected_model: openrouter/minimax/minimax-m3
- selected_provider: OPENROUTER
- action_run: https://github.com/rickylabs/netscript/actions/runs/28412780609
