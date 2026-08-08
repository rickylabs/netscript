# IMPL-EVAL — release-0.0.5--orchestration/slices/w2-a-1325

- Evaluator session: Claude · Fable 5 · medium (native opposite-family, `formal_impl_evaluation`,
  evaluates=openai), 2026-08-09 — separate session from the generator (Codex · GPT-5.6 Sol · low)
- Under evaluation: PR #1394, `origin/fix/triggers-generated-kv-adapter-bootstrap@da8e20bf8`
  against base `c383b2e84` (8 commits)
- Evaluator surface: read-only from `/home/codex/repos/ns005-stable-opus5`; validation runs executed
  in a detached scratch worktree at `da8e20bf8` under the session scratchpad; the live
  `/home/codex/repos/ns005-w2a` worktree was never entered.

## Verdict

`PASS`

## What was verified to reach it

Ordered by decisiveness. Every load-bearing generator claim was either independently re-executed or
checked for internal consistency against the head tree; none failed.

### 1. The probe proves registration, not file-writing — falsified independently (decisive)

The Redis probe (`plugins/triggers/src/adapter/resources/resources.test.ts:138`) writes the emitted
artifact into `plugins/triggers/.tmp/`, imports it with a cache-busting query under
`CACHE_PROVIDER=redis` + `REDIS_URI`, then calls `getKv()` and asserts
`getActiveProvider() === 'redis'`. I ran the falsification myself in a scratch worktree at head:

- Head state, `deno test --config plugins/triggers/deno.json --allow-all --unstable-kv
  plugins/triggers/src/adapter/resources/resources.test.ts` → **10 passed, 0 failed, exit 0**
  (matches the S2/Tier-A claim).
- Then stripped the single emitted line from
  `plugins/triggers/src/adapter/resources/glue/runtime.stub.ts` and re-ran: the probe **failed**
  with `KvConnectionError: Redis/Garnet KV provider was auto-detected but the Redis adapter is not
  registered` thrown at `packages/kv/application/shared.ts:221` via `getKv()` at `shared.ts:126` —
  before any factory or network call. 9 passed, 1 failed.

The failure stack traces through the **workspace** `packages/kv/application/shared.ts` for both the
registration boundary and the test's `getKv` — the glue and the assertion observe the same
`@netscript/kv` module instance (both resolve through `plugins/triggers/deno.json`'s import map in
the same process; the cache-busting query applies only to the top-level temp file, so dependency
identity is preserved). An emitted-but-inert import cannot pass: the assertion is a registry side
effect (`adapterRegistry` populated by `packages/kv/redis.ts:34` on import), not import text. The
sagas text-only assertion the issue rejects is supplemented at the E2E layer (finding 4).

### 2. The RED test can fail today, by the exact recorded mechanism

- The PLAN-EVAL-recorded failing path (`KvConnectionError` "Redis adapter is not registered" at
  `packages/kv/application/shared.ts`, before factory/network) is **still the mechanism at head** —
  my falsification run reproduced it verbatim today.
- RED-first commit ordering is real: at `fc73e3a01` the stub contains **zero** `kv/redis`
  occurrences while the behavioral probe exists (`getActiveProvider` present); the import lands in
  `060f43430`. The S1 "8 passed / 1 failed, exit 1" claim is consistent (the denokv test was added
  later in `5909e088c`, hence 8 not 9).

### 3. The enumeration is honest

Re-verified at head: exactly `plugins/{workers,sagas,triggers}/src/adapter/resources/glue/` carry
`runtime.stub.ts`; `plugins/streams` and `plugins/ai` have **zero** `@netscript/kv` references
(recursive grep over both trees); `auth`'s KV use is its copy-mode HTTP service, not a generated
background runtime. `KV_BACKGROUND_RUNTIME_RESOURCES` (`packages/cli/e2e/src/domain/cli-surface.ts:197`)
enumerates exactly `WORKERS, SAGAS, TRIGGERS`; `runtimeResources()` consumes the constant; the unit
test locks the triple and asserts sagas/triggers waits carry `--status healthy`. I ran
`runtime-gates_test.ts` myself: **14 passed, 0 failed, exit 0**.

### 4. The E2E invariant is a real strengthening, not a relabel

At base `c383b2e84`, `runtime.wait.sagas`/`runtime.wait.triggers` gates existed but had **no**
timeout entry in `ASPIRE_RESOURCE_WAIT_TIMEOUT_SECONDS`, so the splice adding
`--status healthy --timeout N` never ran — they waited only for default resource state, which a
crash-looping runtime can satisfy transiently. At head, `isKvBackgroundRuntime()` forces
`--status healthy --timeout 300` for all three (`runtime-gates.ts:101-103`). This is precisely the
gate that would have caught the #1325 crash-loop, and it now covers the saga sibling too.

### 5. Gate integrity — the three named gates are provably in the executed set

- `deno task e2e:cli gates scaffold.runtime` (read-only listing, verified from
  `gates-command.ts`) at head lists **75 gates** including `runtime.wait.workers`,
  `runtime.wait.sagas`, `runtime.wait.triggers` (lines 38/40/42) and `cleanup.aspire-stop`.
- The claimed `passed=76 failed=0` initially looked like an over-count; it is exactly right:
  74 main gates + `cleanup.aspire-stop` + the synthetic `cleanup.docker-created-containers` step the
  runner pushes as `passed` when `--cleanup` prunes containers
  (`suite-runner.ts:96-108`). **76 is only reachable if every main gate — including all three KV
  waits — executed and passed with zero skips**; an absent or skipped gate makes the arithmetic
  impossible. The worklog additionally records per-gate timings (workers 1.109s, sagas 451ms,
  triggers 520ms, aspire-stop 1.318s), the post-run leak report shows only the known foreign
  `redis-jfgcbtaf` (owner `/home/codex/repos/w6-review-desk`, untouched). I did not re-run the
  serialized suite (token not granted to this session); the recorded run passes every internal
  consistency check available.
- `deno task quality:gate` → **exit 0**, no FAIL rows; `deno task arch:check` → **exit 0**, no FAIL
  rows — both re-run by me at head, not taken on assertion.
- Diff scan (`packages/`, `plugins/`, `.llm/runs/**` excluded): **zero** new `deno-lint-ignore`,
  `@ts-ignore`, `@ts-expect-error`, `as unknown as`, or `any`. The one added `as RunContext` in
  `runtime-gates_test.ts` follows the file's 8 pre-existing occurrences of the same fixture pattern.
- Re-ran sagas focused suite (**7 passed, exit 0**) and both `verify-plugin.ts` entrypoints
  (**exit 0, `"findings": []`** each).
- No `deno.lock` churn in the diff.

### 6. Thinness and parity are respected

The entire production change is **one composed line** in the trigger glue stub —
`import '@netscript/kv/redis';` — the same core-owned side-effect entrypoint the saga glue and all
copy-mode services already compose. Provider selection and registration stay in `@netscript/kv`
(`application/auto-detect.ts`, `application/shared.ts`); no policy, detection, or registry logic
entered plugin code. The enumerated invariant lives in `packages/cli/e2e`, which is **not a
published surface**: `packages/cli/e2e/deno.json` has `"publish": false` and `packages/cli`
excludes `e2e/`. Neither accepted `plugins/triggers` debt (verification-shape `arch-debt.md:846`,
connector convergence `arch-debt.md:424`) is deepened — the diff touches only the stub emission
string, tests, and a `.gitignore`.

### 7. Scratch hygiene is publish-safe

Probe temp files are created under `plugins/triggers/.tmp/`
(`makeGeneratedRuntimeTempFile`, resolved as `../../../.tmp/` from the test — plugin root, not
`src/`). The publish include is `src/**/*.ts` plus named root files; `.tmp/` matches no include
pattern, and the new `plugins/triggers/.gitignore` ignores `.tmp/`, so a killed test can neither
publish nor commit a stray `.ts` file. `finally` cleanup removes the files on the normal path.

### 8. Process conformance

PLAN-EVAL `PASS` was recorded (comment 2026-08-08T22:10) before the first implementation slice
(S1 at 22:14). The Design checkpoint exists in `worklog.md`. Every slice has a commit + push +
phase comment (8 commits, 10 phase comments). The serialized-gate discipline was honored
(EXPENSIVE-GATE-REQUEST committed and granted before the single run; no retry). The Tier-A review
produced a real finding (publishable scratch) that was fixed in `3dc7da3b0`. Labels carry exactly
one `status:` (`status:impl-eval`), milestone 0.0.5, and the PR body carries `Closes #1325` — the
correct keyword, since all six boxes are producible from this PR's evidence (below).

## Findings (non-blocking)

1. **Deno KV evidence is unit-level; only Garnet reached a live AppHost.** Plan Validation item 7
   promised "isolated generated AppHost runs for Garnet **and Deno KV**"; delivered was one live
   AppHost run (Garnet, via the granted `scaffold.runtime`) plus the in-process generated-workspace
   denokv scenario (real `Deno.openKv` set/get through the unmodified emitted artifact,
   `resources.test.ts:170`). This narrowing is **not recorded in `drift.md`**. It does not block:
   the issue box says "covered", the PLAN-EVAL-recorded mapping for that box was exactly the
   two-provider scenario set with generated-file immutability, the PR's acceptance-evidence mirror
   cites the unit test honestly, and — demonstrated by my falsification run, where the denokv test
   passed even with the broken stub — the deno-kv adapter needs no bootstrap, so a live denokv
   AppHost adds no discriminating power for this defect class. What the denokv test does prove is
   the real regression risk the fix introduces: the unconditional Redis import does not hijack
   provider selection. Recommend a one-line drift entry before ready-for-review.
2. **Probe-neutralization robustness.** `resetKv()` clears the singleton but not `adapterRegistry`
   (`shared.ts:207-210` never touches the registry). Today nothing in the test file's module graph
   imports `@netscript/kv/redis` (verified by grep and by the RED experiment succeeding), but a
   future static import of it anywhere in that graph would silently defuse the RED-detection.
   Related: plan risk-register row 2 named subprocess isolation; delivered is in-process dynamic
   import with cache-busting, which works today. Worth a comment or registry-reset seam in a later
   slice; not a defect now.

## #1325 acceptance rows — proven / not proven

| Row | Status | Basis |
| --- | --- | --- |
| 1. Generated trigger runtime registers/resolves the configured KV adapter | **Proven** | Behavioral probe green at head (my run, 10/10); falsification run fails without the emitted import |
| 2. Default fresh scaffold starts the trigger resource without manual edits | **Proven** | `scaffold.runtime` raw exit 0 with `runtime.wait.triggers --status healthy` in the verified executed set (arithmetic check, finding 5); suite never edits generated files |
| 3. Redis/Garnet and `CACHE_PROVIDER=denokv` both covered | **Proven at the issue's "covered" bar** | Redis: live AppHost + probe; denokv: real set/get through emitted glue, provider `deno-kv` asserted. Caveat: denokv never reached a live AppHost (finding 1) |
| 4. RED-first generated-output test fails when bootstrap absent | **Proven** | Recorded S1 exit 1 + my independent reproduction today with identical `KvConnectionError` |
| 5. Scaffold runtime E2E installs every KV-backed runtime and proves real health | **Proven** | All three waits in the verified gate set with `--status healthy --timeout 300`; `passed=76` only reachable with all three executed and passed |
| 6. Invariant shared/enumerated so the saga fix cannot ship with a broken trigger sibling | **Proven** | `KV_BACKGROUND_RUNTIME_RESOURCES` drives `runtimeResources()`; unit test locks the triple; healthy waits close the crash-loop escape for all three |

Close-gate note for the orchestrator: the issue's six boxes are still literally unchecked on #1325;
per the close-gate contract they must be checked with the mirrored evidence before any
`status:ready-merge` transition. The PR-body mirror block already matches each box's first line.
