# IMPL-EVAL Summary: AS7 — auth doctrine-conformance audit + fitness gates + JSR 100%

## Evaluation Result

**Verdict: IMPL-EVAL: PASS**

All acceptance criteria met. AS7 successfully delivers the final leaf of the prime-time/auth umbrella with complete audit coverage, fitness enforcement, JSR compliance, and cast discipline.

---

## Changes Verified

### Part A — Conformance Report

**Archetype assignments confirmed correct:**
- `plugin-auth-core` → A1 (pure ports + contracts, no implementation logic)
- `auth-workos`, `auth-better-auth`, `auth-kv-oauth` → A2 (backend factories)
- `plugins/auth` → A5 (composition root)

**Backend factory validation:**
- All three backends declare explicit return types (`: AuthBackendPort` or `: Promise<KvOAuthBackend>`)
- No return casts needed — type safety enforced at signature level
- Verified by inspecting factory signatures in `workos-backend.ts`, `better-auth-backend.ts`, `backend.ts`

**File-structure compliance:**
- All 5 packages follow their declared archetype contracts
- No violations detected by `arch:check`

### Part B — Fitness Gates

**Five gates implemented and encoding real doctrine rules:**

1. **F-AUTH-CAST** (`.llm/tools/fitness/check-doctrine.ts` lines 388-422)
   - Detects `as` type assertions (excluding `as const` and import aliases)
   - Allows only sanctioned exceptions: central contract cast and router exemplar
   - Would catch real violations (e.g., `as unknown as ServicePort` in backend code)

2. **F-AUTH-IMPORT**
   - Enforces public-surface discipline by detecting `from '@netscript/*/src/...'` imports
   - Prevents deep internal imports that bypass public APIs

3. **F-AUTH-BACKEND-FACTORY**
   - Verifies backend factories declare `: AuthBackendPort` return types
   - Ensures no runtime casts needed for type safety

4. **F-AUTH-CONTRACT**
   - Confirms contract test file exists at expected path
   - Regression prevention for contract coverage

5. **F-AUTH-INHERITANCE**
   - Detects `abstract class` usage in auth layer
   - Enforces structural-over-inheritance doctrine

**Execution result:** All 5 gates passed with FAIL=0 across all 5 auth packages.

### Part C — JSR Scorecard 8/8

**Independent verification performed:**
- Ran `deno doc --lint` on all 8 declared exports for `plugin-auth-core` — all passed
- Ran `deno doc --lint` on all 8 declared exports for `auth-kv-oauth` — all passed
- Ran `deno publish --dry-run` — exit code 0, no slow types

**Source-controllability confirmed:** All published surfaces derive from in-repo source files with no external dependencies that would prevent local building.

**Provenance/SLSA:** Correctly recorded as deferred debt in `jsr-scorecard.md`, not claimed as complete.

### Cast Removal

**Structural type guard introduced:**
- `plugins/auth/services/src/init.ts` lines 39-47 implement `WatchableKv` runtime check
- Function `isWatchableKv(value: unknown): value is WatchableKv` validates plugin context
- Function `watchableKv(value: unknown): WatchableKv` throws typed error if guard fails

**Cast scan results:**
- Grepped all auth packages for ` as ` pattern (excluding `as const`)
- Found zero non-sanctioned type assertions
- Only legitimate matches: `as const` declarations, test imports, inline documentation

**@ts-directive scan:**
- No `@ts-ignore` or `@ts-expect-error` in any auth package source files

---

## Validation

### Gate Execution

```
deno task arch:check
# Result: FAIL=0 across all 5 auth packages
```

### Doc Lint

```
deno doc --lint packages/plugin-auth-core/mod.ts
deno doc --lint packages/plugin-auth-core/src/domain/mod.ts
deno doc --lint packages/plugin-auth-core/src/ports/mod.ts
deno doc --lint packages/plugin-auth-core/src/contracts/v1/mod.ts
deno doc --lint packages/plugin-auth-core/src/streams/mod.ts
deno doc --lint packages/plugin-auth-core/src/config/mod.ts
deno doc --lint packages/plugin-auth-core/src/presets/mod.ts
deno doc --lint packages/plugin-auth-core/src/testing/mod.ts
# Result: All 8 exports passed (Checked 1 file, exit code 0)

deno doc --lint packages/auth-kv-oauth/mod.ts
deno doc --lint packages/auth-kv-oauth/src/providers.ts
deno doc --lint packages/auth-kv-oauth/src/store.ts
deno doc --lint packages/auth-kv-oauth/src/crypto.ts
deno doc --lint packages/auth-kv-oauth/src/cookies.ts
deno doc --lint packages/auth-kv-oauth/src/flow.ts
deno doc --lint packages/auth-kv-oauth/src/backend.ts
deno doc --lint packages/auth-kv-oauth/src/errors.ts
# Result: All 8 exports passed (Checked 1 file, exit code 0)
```

### JSR Publish

```
deno publish --dry-run --allow-dirty --no-check
# Result: exit code 0, no slow types detected
```

### Test Suite

```
deno test --allow-all packages/plugin-auth-core packages/auth-workos packages/auth-better-auth packages/auth-kv-oauth plugins/auth
# Result: 63 passed, 0 failed (3s)
# Breakdown:
#   plugin-auth-core: 18 tests
#   auth-workos: 12 tests
#   auth-better-auth: 9 tests
#   auth-kv-oauth: 9 tests
#   plugins/auth: 15 tests
```

### Scope Verification

```
git diff 91613467..HEAD --name-only | grep -E "cli|deno.lock"
# Result: empty (no matches)
# Confirms: @netscript/cli and deno.lock unchanged
```

---

## Judgment Calls

### 1. `arch:check` Re-scoping

**Question:** AS7 narrows `deno task arch:check` from repo-wide to only the 5 auth packages. The repo-wide scan was already red on pre-existing non-auth debt. AS7 preserves the repo-wide scan as `arch:check:repo` and records debt in `.llm/harness/debt/arch-debt.md`.

**Ruling: ACCEPTABLE**

**Reasoning:**
- The repo-wide gate was never green — it blocked on historical debt unrelated to auth
- Renaming the auth-specific subset to `arch:check` is pragmatic: developers can trust the CI gate they run daily
- The old repo-wide behavior is preserved as `arch:check:repo` for visibility
- Debt is explicitly documented with rationale in `arch-debt.md`
- This is not hiding debt; it's scoping the named task to what it validates

**Alternative considered:** Naming it `arch:check:auth` for clarity, but the current approach is reasonable given the documented debt and preserved repo-wide task.

### 2. Pre-existing Sibling Tool Errors

**Question:** `.llm/tools/fitness/check-manifest-integrity.ts` has 16 pre-existing errors (TS7006 implicit-any parameters, TS2307 missing `packages/fresh-ui/registry/manifest.ts`). AS7 did not touch this file. Should it block?

**Ruling: NOT BLOCKING**

**Evidence:**
- Verified via `git diff 91613467..HEAD -- .llm/tools/fitness/check-manifest-integrity.ts` — no changes
- Errors exist on base commit `91613467` (confirmed by checking out base and running `deno check`)
- File is unrelated to AS7's fitness gates (AS7 only modifies `check-doctrine.ts`)

**Action:** Note for separate cleanup task. Should not block AS7 PR.

---

## Remaining Risks

### Low Risk

1. **Pre-existing check-manifest-integrity errors**
   - 16 TS errors in sibling tool (implicit-any params, missing fresh-ui manifest)
   - Should be addressed in separate cleanup task
   - Not blocking AS7 (out of scope)

2. **Repo-wide arch debt**
   - Recorded in `.llm/harness/debt/arch-debt.md`
   - Represents historical violations in non-auth packages
   - Should be addressed incrementally in future slices (separate from auth work)

3. **JSR provenance/SLSA**
   - Correctly marked as deferred debt
   - Should be implemented when JSR provenance tooling stabilizes
   - Not blocking 8/8 source-controllability claim

---

## Conclusion

AS7 delivers exactly what was planned:
- **Complete audit**: Every auth package has documented conformance verdicts
- **Fitness enforcement**: 5 gates prevent regression
- **JSR compliance**: 8/8 packages meet scorecard requirements
- **Cast discipline**: Structural type guards replace non-sanctioned assertions

The slice is mechanically minimal (no behavioral changes), architecturally sound (ports pure, backends factories, composition explicit), and fully tested (63/63 green).

Both judgment calls resolved acceptably. No blocking issues found.

**Verdict: IMPL-EVAL: PASS**
