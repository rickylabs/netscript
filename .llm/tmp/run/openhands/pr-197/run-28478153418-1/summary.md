# IMPL-EVAL Summary — PR #197 (fix/176-deno-serve-legacy-abort)

## Summary

Independent IMPL-EVAL pass on commit `1a12f1e8` ("fix(service): move per-request cleanup off the legacy abort path (Deno 2.9) (closes #176)"). Role is evaluator-only — I did not implement, rewrite, or modify any source files. I verified the implementation against the ARCHETYPE-3 (Runtime/Behavior) gates and the SCOPE-service overlay, ran the package gates myself, and wrote the evaluation artifact.

**Verdict: PASS** — all applicable gates pass with evidence.

## Changes

### Files written (this run, evaluator-only)

- `.llm/tmp/run/openhands/pr-197/run-28478153418-1/evaluation.md` — full IMPL-EVAL verdict record.

### Diff reviewed (commit 1a12f1e8 vs fc911ba1, 5 files)

1. `packages/cli/src/kernel/templates/service/generate-service-deno-json.ts` — adds `--unstable-no-legacy-abort` to the scaffolded `dev` and `start` tasks with an inline rationale comment.
2. `packages/cli/src/kernel/templates/service/generators_test.ts` — new test `'should run the server with --unstable-no-legacy-abort (Deno 2.9, #176)'` asserts the flag is present in both `start` and `dev`.
3. `packages/service/src/builder/service-listener.ts` — comment-only module-header note documenting the per-request cancellation contract under Deno 2.9; no code change. The listener still returns `app.fetch(request)` directly with no side-effecting `request.signal` listener.
4. `packages/service/tests/_fixtures/legacy-abort-service.ts` (new) — minimal fixture service that touches `request.signal` (oRPC pattern), exposes `/ok` and `/cancel`, prints `READY <port>` and `CANCELLED` for parent-process assertions.
5. `packages/service/tests/legacy-abort_test.ts` (new) — three-test regression suite: baseline (warning present WITHOUT flag), suppression (warning absent WITH flag), and client-disconnect cancellation propagation.

## Validation

Gates run independently by evaluator:

| Gate | Command | Result |
| --- | --- | --- |
| Service package check | `deno check src/**/*.ts` (from `packages/service`) | ✅ exit 0, all `.ts` files checked |
| Service test suite | `deno test --allow-all --quiet` (from `packages/service`) | ✅ 60 passed, 0 failed (includes the 3 new legacy-abort tests) |
| CLI generator test | `deno test --allow-read --allow-env src/kernel/templates/service/generators_test.ts` (from `packages/cli`) | ✅ 4 passed (covers the new `--unstable-no-legacy-abort` assertion) |
| Formatting (service) | `deno fmt --check src/builder/service-listener.ts tests/legacy-abort_test.ts tests/_fixtures/legacy-abort-service.ts` | ✅ "Checked 3 files" |
| Lint (service) | `deno lint src/builder/service-listener.ts tests/legacy-abort_test.ts tests/_fixtures/legacy-abort-service.ts` | ✅ "Checked 3 files" |

Individual legacy-abort test results:

- `legacy Deno.serve behavior warns on successful requests (baseline repro)` … ok (286 ms)
- `no legacy-abort deprecation on successful requests with --unstable-no-legacy-abort` … ok (197 ms)
- `client disconnect still cancels the in-flight request with the flag` … ok (610 ms)

Archetype / overlay reasoning:

- ARCHETYPE-3 Concept of Done: start/stop/error paths exercised (runtime tests), AbortSignal respected (cancellation test proves it), no false-done states present.
- SCOPE-service overlay: handler-internal fix with no contract, topology, or plugin-surface changes; consumer check not applicable beyond confirming the CLI generator produces the expected output (verified by the new generator test).
- ARCHETYPE-3 AP check: no AP-1 monolith, AP-10 error-layer slip, AP-12 timer logic, or AP-13 logging additions introduced.
- Debt assessment: no new architecture debt; no existing entries deepened.

Note: the CLI package itself is excluded from root `deno fmt`/`deno lint` by root `deno.json` `exclude` rules (`packages/cli/`), so I skipped a redundant CLI fmt/lint run — the CLI generator behavioral gate (the `generators_test.ts` assertion) is the appropriate evidence for those files.

## Remaining risks

- The `--unstable-no-legacy-abort` flag is marked unstable; a future Deno release could rename, promote, or drop it. Scaffolded services will need a one-line update if that happens. This is low risk and does not block the current PR.
- Existing scaffolded services (already-landed `deno.json` files in downstream workspaces) do not auto-upgrade. Consumers need to re-run `netscript new` or manually add the flag to their existing tasks — out of scope for this fix but worth noting in release notes.
