# Context Pack: PR 0B desired-state agentic runtime controller

## Run Metadata

| Field | Value |
| --- | --- |
| Issue / PR | #576 / draft #585 |
| Branch | `refactor/epic-574-agentic-runtime-controller` |
| Worktree | `/home/codex/repos/netscript-epic-574-pr0b-controller` |
| Base | PR #584 sign-off `9b75470` |
| Phase | S4 implementation/gates complete; coordinator Tier-A review pending |
| Thread | `019f4b72-2ea4-7050-917e-6d6918371265` (resume only) |

## Current State

Research and Design are complete, and coordinator Plan-Gate approval authorized S1. S1 now provides
schema `1.0` contracts, value-free desired/observed/checkpoint state, separate read/mutation ports,
and a pure deterministic reconciliation planner. Equal state plans no actions, actions are data
only, and deferred capability requests return explicit blocked intents.

Tier-A requested three S1 corrections: preserve the complete PR 0A observed component vocabulary
while restricting bootstrap to an installable subset, make command modes legal by construction and
runtime-guarded, and give configure a desired-state content reference plus a dedicated read-only
source port. All three are implemented in the existing S1 files.

Focused tests pass `18/18`; scoped check, lint, format, `git diff --check`, secret/content scans, and
lock proof pass. All six files remain within their locked LOC budgets. No dependency or `deno.lock`
change occurred. Coordinator substantive review approved S1 implementation/remediation head
`197bc51` in supervisor sign-off commit `ac71896`.

S2 now provides the canonical read-only CLI edge, controller/result renderers, complete PR 0A
foundation translation, strict value-free local-state migration/storage, and read-only mobile
capability translation. Tier-A found four gaps in `2ad1d9c`; remediation restores safe desired and
observed summaries with real status filters, makes untyped desired/persisted/checkpoint reads strict,
connects the mutation guard to the actual ports object, and runs the sentinel through real input,
failure, renderer, and writer paths. Coordinator substantive review approved S2 in supervisor
sign-off `6756a54`. S3 now provides data-only Codex/Claude/Gemini/provider lifecycle adapters.
Tier-A remediation pins Codex launches to the inspected Git HEAD and makes launch observation fail
closed on complete route identity and process result. Coordinator substantive review approved S3
remediation head `d597c08`. S4 now implements explicit-port transactional apply, checkpoint-first
execution, reverse compensation, caller-selected fallback/restore, and strict idempotent rollback;
automated gates pass and coordinator review is pending. S5 has not started.

## Locked Boundaries

- #576 owns the controller contract, generic explicit operations, adapters, rollback, and wrappers.
- #577 owns provider/OpenRouter profiles and credential injection.
- #578 owns Gemini grounded evidence acquisition.
- #579 owns automatic quota fallback state/history/reset policy.
- #580 owns durable sender locking and live Codex remote repair.
- #581 owns canonical routing/model policy migration.
- #582 owns full rollout canaries and promotion.
- Deferred live capability returns a structured block; it never succeeds or mutates.

## Slice State

1. S1 contract/state/ports/pure planner: coordinator-approved at `ac71896`.
2. S2 controller/renderers/foundation/local-state/mobile adapters and read-only canonical CLI:
   coordinator-approved at `6756a54`.
3. S3 Claude/Codex/Gemini/provider lifecycle adapters: coordinator-approved at `d597c08`.
4. S4 transactional apply, explicit fallback/restore, rollback, and failure behavior: implementation
   and gates complete; coordinator Tier-A review pending.
5. S5 compatibility wrappers, documentation, and full scoped gates: not started.

## S1 Files and Evidence

- `.llm/tools/agentic/runtime/contract.ts`
- `.llm/tools/agentic/runtime/state.ts`
- `.llm/tools/agentic/runtime/ports.ts`
- `.llm/tools/agentic/runtime/planner.ts`
- `.llm/tools/agentic/runtime/contract_test.ts`
- `.llm/tools/agentic/runtime/planner_test.ts`
- Focused test: exit 0, `18 passed | 0 failed`, with `--no-lock` and no permissions.
- Scoped wrappers: check/lint/format exit 0 across all 6 files with 0 findings.
- Hard LOC budgets: PASS (`220`, `152`, `123`, `348`, `257`, `274` lines respectively).
- Secret-bearing/content field scans: PASS. `deno.lock` matches S1 commit `9f59ad8` exactly.
- Drift/debt: none. Deferred implementation remains assigned to #577 through #582 as planned.

## S2 Files and Evidence

- New: `agentic-runtime.ts`, `runtime/{controller,output}.ts`,
  `runtime/adapters/{foundation,local-state,mobile-control}-adapter.ts`, and
  `runtime/controller_test.ts`.
- Updated: `deno.json`, `.llm/tools/agentic/README.md`, and required run artifacts.
- Remediated tests: focused changed set `16 passed | 0 failed`; complete current agentic/runtime set
  `96 passed | 0 failed`.
- Scoped check/lint: exit 0, zero findings. Owned runtime/CLI format: exit 0, zero findings.
- Live doctor repeat: expected exit 2; normalized semantic output, controller tree, and repository
  state all equal.
- Passed-ports mutation proxy resolves zero mutation surfaces; before/after temp state-tree hashes
  equal. Strict unknown-key and real sentinel flows pass; lifecycle argv is N/A until S3.
- Drift: broad locked format include reaches four untouched S5 wrapper findings; recorded in
  `drift.md`, with no diff in those files and a green owned-surface format verdict.
- Debt: none.

## S2 Remediation Evidence

- Focused changed tests: `16 passed | 0 failed`; complete current set: `96 passed | 0 failed`.
- Scoped check/lint/owned format: exit 0, zero findings (`32`/`20`/`13` selected files).
- Live doctor twice: exits 2; timing-normalized semantics, 16-component summary, controller tree,
  and repository state all equal. Live agent filter narrowed to Codex; unmatched session returned
  exit 3 with `missing_identity`.
- Actual passed-ports mutation guard: zero mutation resolutions across doctor, status, bootstrap
  plan, and configure plan; temp tree unchanged.
- Strict parser matrix rejects unknown top-level/version/agent/route/worktree/session keys.
- Real sentinel flow rejects desired/persisted/checkpoint inputs and stays absent from results,
  renderers, and owned writes. Content-bearing lifecycle argv is N/A in S2 and deferred to S3.
- Locked LOC budgets, `git diff --check`, scope/secret scans, and lock hygiene pass. Existing broad
  format-scope drift remains; no new architecture debt.

## S3 Files and Evidence

- New: `runtime/adapters/{codex,claude,gemini,provider}-adapter.ts` and
  `runtime/adapters_test.ts`; updated only the value-free agent command-plan types in `ports.ts`.
- Codex launch/resume command plans preserve file/worktree/thread identities, reuse handoff,
  git-safety, launch-log, and turn parsing primitives, and select distinct launch/resume wrappers.
  Resume argv cannot contain the launch wrapper or `send-message-v2`.
- Claude exposes bounded static-smoke planning only; live login/mobile canaries return an explicit
  unsupported diagnostic and remain owner work.
- Gemini normalizes installed/auth observations; live evidence is an explicit issue #578 block.
  OpenRouter/custom routes are explicit issue #577 blocks.
- Provider validation accepts only complete finite route/session identity plus allowlisted conflict
  key names. It never accepts or acquires credential values, selects profiles, or mutates defaults.
- Focused tests: `9 passed | 0 failed`; complete current set: `105 passed | 0 failed`.
- Scoped check/lint/owned format: exit 0, zero findings (`37`/`25`/`18` selected files).
- Route, command-construction, no-rival, unsupported-capability, sentinel, effect, scope, LOC,
  `git diff --check`, and unchanged-lock gates pass. Each new adapter is <=198 LOC; focused test is
  369 LOC; CLI remains untouched at 150 LOC.
- No real sender, provider login, live Gemini/Claude/mobile canary, network/write mutation,
  dependency, lock, S4 transaction, or S5 wrapper action occurred. Existing format-scope drift
  remains unchanged; no new architecture debt.

## 2026-07-10 Reconciliation Pause

- Desired future component/research lane is Antigravity CLI (`agy`), replacing Gemini CLI.
- S1-S3 Gemini implementation remains historical and requires an explicit compatibility migration.
- S4 final remediation is paused; S5 and #578 have not started.
- Future refactor surfaces: runtime contract/state/planner, foundation/local-state/provider/Gemini
  adapters, focused tests, and README. Replace the adapter with an Antigravity adapter while
  explicitly reading/refusing legacy persisted `gemini` state; do not create an executable alias.
- Canonical acceptance requires `/home/codex/.local/bin/agy` under user `codex`. Preserve
  `~/.gemini`; never touch `/root/.local/bin/agy`.
- Auth, subscription/quota, JSON/output, full exit codes, web research/citations, and instruction
  compatibility remain unpassed canaries.
- Resume only thread `019f4b72-2ea4-7050-917e-6d6918371265` after revised-scope review.

## S3 Remediation Evidence

- Codex launch exact argv now ends with `--expect-base <inspected git.head>`; an empty inspected
  HEAD returns `missing_identity` and no request.
- Launch observation validates the expected route's thread/worktree/model identity and the parsed
  process result after bounded capture. Missing identity, route mismatch, and nonzero exit map to
  `missing_identity`, `route_conflict`, and `process_failed` respectively; absent exit remains valid
  under the parser contract.
- Focused adapter tests remain `9 passed | 0 failed`; the complete current set remains
  `105 passed | 0 failed`. Scoped check/lint/owned-format select 37/25/18 files and report zero
  findings.
- Exact launcher-contract, no-rival/effect, sentinel/content, LOC, scope, patch, and unchanged-lock
  gates pass. Adapter/test LOC are `219/350` and `391/450`; `deno.lock` remains blob
  `8694862878e6f9a430bf56497a4d5bf3f8eb1f3d`.
- Only the Codex adapter, focused adapter test, and mandatory run artifacts changed. No new drift or
  architecture debt; no S4/S5 or child-issue work.

## S4 Files and Evidence

- Updated only existing planned files: `runtime/{controller,state,output}.ts`,
  `runtime/adapters/foundation-adapter.ts`, `runtime/controller_test.ts`, and mandatory run artifacts.
- `runRuntimeCommand` remains read-only/plan-only; `applyRuntimeCommand` alone accepts explicit
  mutation ports. Apply writes `prepared` before any action, executes deterministic order, stops on
  first failure, compensates completed actions in reverse, and records `applied`, `rolled_back`, or
  `partial` without success-shaped failures.
- Explicit rollback validates strict named checkpoints, bounded one-resource-per-action ownership,
  reversibility, uniqueness, and fingerprints; it refuses before mutation and repeats as
  `no_change`. Fallback/restore preserve caller/configured route and idle/new boundary policy.
- Focused S4 tests: `10 passed | 0 failed`; complete set: `107 passed | 0 failed`. Scoped
  check/lint/owned-format: 37/25/18 files, zero findings.
- Live doctor repeat: exits `2/2`, statuses `degraded/degraded`, 16 components; timing-normalized
  semantics plus controller-runtime and agentic-source trees are equal. Full dry-run matrix records
  zero mutation events and equal temp-tree SHA-256 hashes.
- Transaction/failure/rollback/route/sentinel/mode-0600/LOC/scope/patch/lock/manual Archetype 6
  evidence passes. Controller/state/test sit at `297/300`, `299/300`, and `450/450`; `deno.lock`
  remains blob `8694862878e6f9a430bf56497a4d5bf3f8eb1f3d`.
- No new runtime file, dependency, CLI/wrapper edge, sender, provider policy/login, global default,
  or child-issue behavior. Existing broad-format drift remains unchanged; no new debt.

## Next Action

Coordinator substantively reviews S4. Do not start S5 or launch another sender; resume this exact
thread only after coordinator approval.

## S4 Tier-A Remediation Handoff

- Controller-state persistence is transactional: successful apply writes desired/checkpoint/last
  command identity; state or final-checkpoint failure compensates and restores prior persisted state.
- Checkpoints contain complete data-only actions, canonical before/after fingerprints, typed prior
  component/directory/desired-state/route metadata, and prior controller state. Rollback refuses
  external drift and passes exact metadata to compensation.
- Configure has a fresh local-adapter apply/read/rollback/read proof. Fallback and restore carry and
  restore caller route identity. Failed automatic and explicit compensation results are `failed`.
- Blocked apply uses one observation and preserves only its owner diagnostic. Read-stage mapping is
  `probe_failed` / `state_corrupt` / `invalid_checkpoint` / `invalid_state_file`; adapter failures
  are preserved exactly.
- Replacement gates: focused runtime `36 passed`; complete runtime `105 passed`; scoped
  check/lint/format 37/25/18 files with zero findings after correcting the initially detected CLI
  port composition; doctor exits `2/2` with normalized semantics and trees equal; dry-run/source
  trees equal; lock blob unchanged.
- Locked caps pass: CLI 149, contract 220, ports 218, state 300, controller 295, output 185, local
  adapter 349, controller test 416. Existing S5-wrapper format drift is unchanged; no new debt.
- Stop at S4 remediation. Coordinator performs Tier-A re-review; do not self-certify, start S5,
  implement #577-#582, or launch another sender.

## S4 Remediation 2 C5-C8 Handoff

- Partial rollback is durable and retryable per resource; controller state retains checkpoint
  authority until all compensation and prior-state restoration succeed.
- Checkpoint prior metadata is canonical-fingerprint-bound; successful adapters are re-probed before
  advancement. Route/session/worktree/agent/sessionId claims must agree.
- Apply launch/resume/static smoke are honest #580 `capability_deferred` blocks; plan mode stays
  mutation-free. Foundation and local state readers prove canonical owned fingerprints.
- Ownership probe failures return `failed`/exit 5, while drift remains a blocked safety conflict.
- Final generator gates: complete suite 109/0; wrappers 37/25/18 with zero findings. Doctor repeat is
  deterministic but exits 5 because the external PR 0A foundation state now contains deferred
  `antigravity` vocabulary; no migration was authorized in C5-C8.
- Next: coordinator Tier-A re-review. Do not start S5/#578 or self-certify.

### C7 precedence follow-up

Apply-mode lifecycle ownership now wins before provider-route deferral: Gemini/OpenRouter
launch/resume/static smoke are #580 blocks with exit 4. Provider-specific plan/read-only behavior
remains #577/#578. Await coordinator Tier-A re-review.

## Safety

- Native ext4 only; explicit push refspec only.
- No credentials in argv, repo, output, comments, or run artifacts.
- No global provider defaults, provider login, live daemon repair, root formatting, dependency
  change, lock deletion/reload, or rollout promotion.
- Compatibility wrappers are retained; no deletion in #576.
