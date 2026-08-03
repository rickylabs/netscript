use harness

# Slice: saga engine correctness (#1064, #1065, #1066)

Worktree: `/home/codex/repos/ns004-sagas` · branch `fix/1064-saga-durability` · base `origin/main`
@ `f663fe0e4`.

## SKILL

Load, in order:

- `.agents/skills/netscript-harness` — run loop, slice contract, commit trail.
- `.agents/skills/netscript-doctrine` — `plugins/` archetype, public surface, fitness gates.
- `.agents/skills/netscript-pr` — branch/PR/label/milestone rules. `Closes #N` goes in the PR
  **body**; every `gh` call passes `--repo rickylabs/netscript`.
- `.agents/skills/netscript-tools` — scoped check/lint/fmt wrappers, `quality:scan`, `arch:check`.
- `.agents/skills/rtk` — prefix read-heavy `git`/`gh`/`grep` with `rtk`.

## Scope

Three wave-four defects on one surface — the saga engine, its KV store, and the runtime that
`createDurableSagaRuntime` builds. Read the full issue bodies first; they carry exact reproductions,
root causes and acceptance criteria written so a happy-path test cannot close them.

- **#1064 (p0)** `POST /publish` hangs forever under the scaffold's default redis cache backend.
  `SagaEngine.#persistTransition → KvSagaStore.save` blocks on the atomic commit; the Redis-backed
  `KvStore` adapter does not honour the atomic-commit contract `KvSagaStore` depends on. The
  scaffolded path and the tested path are not the same path.
- **#1065 (p1)** `sagaCompensate` effects are silently dropped — `createDurableSagaRuntime` wires no
  compensator by default and an unhandled effect kind is discarded rather than rejected.
- **#1066 (p0)** the engine ignores the definition's `.correlate()` extractor and keys instances on
  `message.correlationKey ?? "<sagaId>:<messageType>"`, collapsing every distinct workflow onto one
  shared instance.

## Rules

- Contract first: fix the atomic-commit contract and the effect/instance-key resolution, then tests.
- Every acceptance checkbox in each issue must be satisfied. #1066 explicitly requires a test with
  **two concurrent workflows on different correlation values** — a single-instance happy path does
  not close it. #1064 requires the Redis-backed adapter proven, not just Deno KV.
- No silent-drop paths left behind: an unhandled effect kind fails loudly.
- Do not expand into #1013 / #1015 (separate slices). If you find they are the same root cause, say
  so in the PR rather than absorbing them.

## Gates

`deno task check` · `deno task test` for the touched packages/plugins · scoped lint/fmt wrappers ·
`deno task quality:scan` · `deno task arch:check`. Verify the artefact, never the exit code — a
piped command reports the last stage's status.

## Deliverable

One draft PR closing #1064, #1065, #1066, driven to ready-for-merge. Commit per slice; push and
comment the commit hash + gate evidence on the draft PR before starting the next slice.

## Supervisor addendum (PR-A supervisor, 2026-08-03)

**Draft PR is already open: #1075** — https://github.com/rickylabs/netscript/pull/1075
(branch `fix/1064-saga-durability`, base `main`, seeded with one empty commit). Do **not** open
another PR. Push to this branch and comment gate evidence on #1075 after each slice.

### Diagnose before you fix — read the actual failure, do not infer it

The supervisor's own source read narrowed #1064 to `RedisKvAdapter.atomic()` in
`packages/kv/adapters/redis.adapter.ts` (~line 446): it `WATCH`es on the primary client, then
issues reads through `this.get()` and a `MULTI`/`EXEC` on that same client. `packages/kv/tests/`
contains **zero** Redis adapter tests, which is exactly how the contract drifted.

That is a *hypothesis*, not a diagnosis. **Reproduce the hang empirically against a real Redis
before changing a line.** In the 0.0.3 release every stated diagnosis of a red gate was wrong until
someone read the output. Capture the real evidence (where execution actually stops, and why) in
the PR comment.

### Redis for the repro must be YOUR container

The machine is shared with three live wave-four demo runs. `docker ps` currently shows
`redis-wnkhnbqd`, `garnet-fgxbsxkb` and `postgres-a3084932` — **all foreign. Do not connect to,
restart, or remove any of them.** Start your own Redis on your own port, prove ownership by name
and by path containment, and tear it down when the slice ends
(`deno task agentic:leak-check` / `agentic:teardown --apply`).

### Acceptance the supervisor will actually check

- **#1064** — a regression test that exercises `KvSagaStore` over the **Redis** adapter. A fake or
  in-memory stand-in that mimics `ioredis` does **not** satisfy this: the bug is precisely that the
  real adapter's behaviour differs from the contract, so a fake written from the contract will pass
  against broken code. Also cover `kv.list` (the empty-registry symptom) and prove `save` either
  completes or **fails loudly with a timeout and a log line** — never hangs.
- **#1065** — a test asserting a returned `sagaCompensate(...)` actually invokes the registered
  `.compensate()` branch through the **default** `createDurableSagaRuntime`. And no silent-drop
  path anywhere: an unhandled effect kind throws or error-logs naming the effect and the missing
  option.
- **#1066** — a test with **two concurrent workflows on different correlation values** getting
  **separate** instances. Confirm it genuinely fails against the pre-fix engine (state the observed
  failure in the PR comment); a single-instance happy path passes against the broken code, so a
  test that passes both before and after is worthless. Instance-key precedence
  (extractor → explicit `correlationKey` → default) must be documented on the sagas capability page.
  Current broken resolution lives in `resolveInstanceId` / `resolveCorrelationKey` at
  `packages/plugin-sagas-core/src/runtime/saga-engine.ts` ~441/455.

### Review-blocking, not negotiable

A new `// deno-lint-ignore` or `as unknown as` added to green a wrapper is a **review-blocking
finding**, not a pass. Verify the artefact, never the exit code — `deno task check | tail` exits 0
while type checking fails. Deno refuses dependencies younger than ~24h: use
`--minimum-dependency-age=0` (note `deno x` re-invokes in a child that does not inherit the flag).

### Concurrent slice — do not resolve overlaps silently

The plugin-wiring slice is running concurrently in `/home/codex/repos/ns004-plugins`. If you need
to touch a file it owns (plugin install/registry/scaffold wiring), **stop and say so in your
report** rather than editing it. Two slices independently authoring one file cost this project
85+/80- of conflict once.

### If you are blocked

Say so and stop — a gate you cannot green, an issue that turns out to be epic-scope, a dependency
on another slice. Do not silently narrow scope and do not expand 0.0.4's scope; name 0.0.5
candidates instead.
