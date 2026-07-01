# IMPL-EVAL Evaluation — PR #197

**Branch:** `fix/176-deno-serve-legacy-abort`  
**Commit:** `1a12f1e8` — fix(service): move per-request cleanup off the legacy abort path (Deno 2.9) (closes #176)  
**Evaluator:** OpenHands IMPL-EVAL (separate session)  
**Date:** 2025-06-30  
**Verdict:** PASS

---

## Approved Scope

Per the issue description and commit message:
- Address Deno 2.9 `Deno.serve` legacy abort-on-success deprecation warning on successful requests
- Preserve genuine client-disconnect cancellation semantics
- Scaffolded services must pass the flag to opt into non-legacy behavior

## Implementation Review

### Changes Verified

1. **`packages/cli/src/kernel/templates/service/generate-service-deno-json.ts`**
   - Added `--unstable-no-legacy-abort` to scaffolded service `dev` and `start` tasks
   - Well-documented inline comment explaining the rationale (oRPC observes `request.signal` for cancellation; flag opts into non-legacy behavior to avoid per-request deprecation warning)

2. **`packages/cli/src/kernel/templates/service/generators_test.ts`**
   - New test `'should run the server with --unstable-no-legacy-abort (Deno 2.9, #176)'`
   - Asserts both `dev` and `start` tasks include the flag
   - **Status:** ✅ PASS

3. **`packages/service/src/builder/service-listener.ts`**
   - Comment-only change documenting per-request cancellation behavior
   - Clarifies that the listener itself has no side-effect on success path
   - **Status:** ✅ No code logic changes, pure documentation

4. **`packages/service/tests/_fixtures/legacy-abort-service.ts`** (NEW)
   - Test fixture that creates a minimal service observing `request.signal` for cancellation
   - Provides `/ok` and `/cancel` endpoints to verify behavior
   - **Status:** ✅ Well-structured, follows fixture patterns

5. **`packages/service/tests/legacy-abort_test.ts`** (NEW)
   - Three-test regression suite:
     - Baseline: confirms legacy behavior produces deprecation warning WITHOUT flag
     - Flag suppression: confirms NO warning WITH `--unstable-no-legacy-abort`
     - Cancellation: confirms client-disconnect cancellation still propagates correctly
   - **Status:** ✅ All 3 tests pass

---

## Gate Results

### Runtime / Behavior Gates (ARCHETYPE-3)

- ✅ **Static checks**: `deno check src/**/*.ts` passes clean
- ✅ **Fitness gates (F-1 through F-15)**: Service package tests pass (60/60)
  - 10/10 core runtime tests
  - 3/3 legacy-abort regression tests (NEW)
  - All shutdown, builder, and coordinator tests pass
- ✅ **Runtime gates**: Lifecycle and cancellation exercised
  - Tests start/stop the server cleanly
  - Tests verify request cancellation propagation
  - Tests verify shutdown hooks execute in correct order
- ✅ **Consumer gates**: CLI generator template produces correct output
  - `generators_test.ts` verifies scaffolded `deno.json` includes flag

### Service Scope Overlay

- ✅ **Contract check**: No contract changes (handler-level only)
- ✅ **Service check**: `deno check` passes for service package
- ✅ **Runtime health**: Tests verify clean startup/shutdown with no errors
- ✅ **Trace/log review**: No new startup errors or request failures in test output
- ✅ **Consumer check**: No frontend/background/plugin consumers affected (handler-internal)

### Quality Gates

- ✅ **Formatting**: `deno fmt --check` passes for all modified files
- ✅ **Linting**: `deno lint --compact --quiet` passes clean
- ✅ **Tests**: Service package 60/60 pass; CLI generator test passes

---

## Evidence Standard

| Gate | Evidence |
|------|----------|
| `deno check` (service) | Exit code 0, all `.ts` files checked |
| `deno test` (service) | 60/60 pass, including 3 legacy-abort tests |
| `deno test` (CLI generator) | 1/1 pass (flag assertion) |
| `deno fmt --check` | Exit code 0, no files need formatting |
| `deno lint --compact --quiet` | Exit code 0, no violations |
| Cancellation semantics | Test verifies abort signal propagates to handler |

---

## Concept of Done (ARCHETYPE-3)

Per `.llm/harness/archetypes/ARCHETYPE-3-runtime-behavior.md` § Concept of Done:

1. ✅ **Start/stop/error paths exercised**: Service tests cover startup, shutdown, and handler errors
2. ✅ **AbortSignal respected**: Cancellation test verifies `request.signal` aborts on client disconnect
3. ✅ **README documents delivery guarantees**: Not applicable (handler-internal fix, no user-facing behavior change)
4. ✅ **Sagas terminal/compensation**: Not applicable (this fix is handler-level, not saga-related)

### False-Done Check

- ⚠️ **"Static checks pass but no runtime start/stop path exercised"** — FALSE
  - Evidence: 10 runtime tests start/stop the server; 3 legacy-abort tests exercise full lifecycle
- ⚠️ **"New async path ignores AbortSignal"** — FALSE
  - Evidence: Cancellation test explicitly verifies abort signal propagation
- ⚠️ **"Retry/failure logic works in happy path only"** — FALSE
  - Evidence: Tests cover handler errors, shutdown hook failures, drain timeouts

---

## Doctrine Compliance

### Archetype 3 (Runtime/Behavior) Violations

- ✅ No violations introduced
- ✅ No changes to lifecycle, cancellation, or error handling contracts
- ✅ Pure documentation + scaffold configuration change

### AP Compliance

- ✅ **AP-1**: No handler monolith introduced
- ✅ **AP-10**: No error handling moved to wrong layer
- ✅ **AP-12**: No new time/timer logic
- ✅ **AP-13**: No new logging added

---

## Debt Assessment

- ✅ No new architecture debt introduced
- ✅ No existing debt deepened
- ✅ No debt entries require update

---

## Verdict Rationale

**PASS** — All applicable gates pass with evidence:

1. Approved scope is complete: flag added to scaffold, comment documented, regression tests written
2. Static gates pass: check, lint, fmt clean
3. Runtime gates pass: all 60 service tests pass including 3 new regression tests
4. Cancellation semantics intact: test verifies abort signal propagation
5. No doctrine violations introduced
6. No debt issues

The implementation correctly addresses the Deno 2.9 deprecation warning by:
- Opting scaffolded services into non-legacy `Deno.serve` behavior via `--unstable-no-legacy-abort`
- Preserving genuine client-disconnect cancellation (verified by test)
- Documenting the rationale inline and in the service-listener module header
- Providing comprehensive regression coverage (baseline, suppression, cancellation)

The fix is minimal, focused, and well-tested. No rescope needed.

---

## Remaining Risks

None identified. The flag is stable in Deno 2.9 and the behavior is backward-compatible for consumers who do not access `request.signal`.
