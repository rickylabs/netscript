# Opposite-family review — #1080 mandatory real-Redis CI regression gate

Reviewer: Claude (Fable 5), separate session from the Codex implementation lane.
Scope: uncommitted diff after `3f3cc6cb8` — `.github/workflows/ci.yml`, `deno.json` tasks,
`.llm/tools/validation/redis-regression-gate.ts` + `_test.ts`. Review only; no source edits.

Verdict: PASS

## Boundary assessment

1. **Redis service + job env — PASS.** `check-test` declares a `redis:7-alpine` service with a
   `redis-cli ping` health check (interval 5s, 10 retries) and job-level
   `NETSCRIPT_TEST_REDIS_URL: redis://127.0.0.1:6379` (`.github/workflows/ci.yml:86-96`). Both
   named integrations gate only on that env var (`packages/kv/tests/redis.adapter_test.ts:27`,
   `packages/plugin-sagas-core/tests/stores/kv-saga-store_redis_test.ts:29`), so with the job env
   present they execute rather than skip. The restart test additionally requires container-control
   env and remains intentionally ignored — correctly out of scope.
2. **Fail-closed on missing env — PASS.** `requireRedisRegressionUrl` throws before any test
   launch (`redis-regression-gate.ts:67-76,102`), and protocol is validated (`redis:`/`rediss:`).
   Independently reproduced: `env -u NETSCRIPT_TEST_REDIS_URL deno task test:redis-regression`
   exits **1** with `refusing silently skipped Redis tests`.
3. **Exact-name `ok` observation — PASS.** The gate requires exit success **and** a per-line
   observation of each exact test name with `ok` (`redis-regression-gate.ts:97-113`). The two
   constants match the `Deno.test` names verbatim (`redis.adapter_test.ts:26`,
   `kv-saga-store_redis_test.ts:28`). Neither name contains the substring `ok`, so the line match
   cannot be satisfied spuriously; an ignored/skipped test yields no `... ok` line and fails the
   gate.
4. **Negative control surgical + restored — PASS.** `removeRedisAtomicSerialization` removes
   exactly the #1075 `atomicTail` field and the serialization wrapper via `replaceExactlyOnce`,
   which throws if the source has drifted (0 or >1 matches) — verified against the live adapter
   (`packages/kv/adapters/redis.adapter.ts:75,447-465` matches the wrapper string byte-for-byte;
   pure test 2 asserts this against current source). Each file is run individually and its own
   named test must report `FAILED`; restoration is in `finally`
   (`redis-regression-gate.ts:134-136`), covering thrown paths inside the process. The task
   restricts writes to `--allow-write=packages/kv/adapters/redis.adapter.ts` only.
5. **CI turns red on real regression — PASS.** If the checked-in adapter regresses to pre-#1075
   behavior, the preceding "Required real-Redis regression tests" step fails on the multi-winner
   assertions (`assertEquals(outcomes.filter(ok).length, 1)` under 16 concurrent writers in both
   tests). If the adapter merely drifts textually, the negative-control step fails loudly on
   `expected exactly one …` rather than passing vacuously. Broken source is never committed; the
   mutation is workspace-local in CI.
6. **Permissions/syntax/ordering/hygiene — PASS.** Steps order sensibly: check → required gate →
   negative control → repo-wide test (a SIGKILL'd negative control would leave a broken adapter
   that makes the later repo-wide test red, never green — fail-safe direction). Workflow YAML is
   well-formed; `deno.lock` untouched; `deno.json` adds only the two tasks. No false-positive path
   found: the negative control fails unless the *named* test reports `FAILED`, so an unrelated
   failure (e.g. dead-endpoint test) cannot satisfy it; the required gate additionally requires
   overall exit 0, so an unrelated failure cannot pass it either.

## Independently run gates

- `env -u NETSCRIPT_TEST_REDIS_URL deno task test:redis-regression` → exit 1,
  `refusing silently skipped Redis tests` (boundary 2, reproduced).
- `deno test --allow-read .llm/tools/validation/redis-regression-gate_test.ts` → 3 passed,
  0 failed (matches author evidence).
- No local Redis service available in this review session; the real-Redis and negative-control
  runs rely on the author's evidence (both named tests `ok`; negative control: both `FAILED` with
  16 winners vs 1 expected; `git diff --exit-code` clean after restoration), which is consistent
  with the mechanics verified above.

## Findings (severity-ordered)

- **Info** — `runTests` spawns `deno test --allow-all` while the parent task pins
  `--allow-env=NETSCRIPT_TEST_REDIS_URL`; `--allow-run` is unscoped. Acceptable for internal
  validation tooling, worth tightening to `--allow-run=deno` later.
- **Info** — a hard kill (SIGKILL/runner teardown) during the local negative-control run would
  leave the adapter dirty in the working tree; `git status` surfaces it and CI workspaces are
  ephemeral, so no green-CI risk. No action required.
- **Info** — name↔file pairing in the negative control is positional
  (`REDIS_REGRESSION_FILES[i]` ↔ `REDIS_REGRESSION_TEST_NAMES[i]`); currently correct, fragile
  only if the arrays are ever reordered independently.

No FIX-severity findings. The slice meets all six acceptance boundaries.

## Remediation verification (post-review cleanup)

The positional-pairing Info finding is resolved. `REDIS_REGRESSION_FILES` and
`REDIS_REGRESSION_TEST_NAMES` are replaced by a single `REDIS_REGRESSIONS` record array pairing
each file with its exact test name (`redis-regression-gate.ts:3-12`); both the required gate
(`:104,111`) and the negative control (`:126`) destructure `{ file, name }` from the same record,
so file↔name drift by independent reordering is no longer possible. Gate semantics are otherwise
unchanged: fail-closed env check, exit-success + exact-name `ok` observation, surgical
replace-exactly-once mutation with `finally` restoration all remain as reviewed. The pure test
file needed no change (it imports only `REDIS_ADAPTER_PATH`, `removeRedisAtomicSerialization`,
`requireRedisRegressionUrl`).

Independently re-run after the cleanup:

- `deno test --allow-read .llm/tools/validation/redis-regression-gate_test.ts` → 3 passed, 0 failed.
- `env -u NETSCRIPT_TEST_REDIS_URL deno task test:redis-regression` → exit 1,
  `refusing silently skipped Redis tests`.

The remaining two Info notes (unscoped `--allow-run`, SIGKILL-dirty-worktree) are accepted as-is.

Verdict: PASS (retained)
