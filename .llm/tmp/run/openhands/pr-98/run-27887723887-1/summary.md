# IMPL-EVAL Summary — PR #98

## Verdict: PASS

All evaluation criteria satisfied. The bounded retry on transient Prisma schema-engine crash is correctly implemented, narrowly scoped, and does not mask real errors.

## Evaluation Criteria

### 1. Root-Cause Soundness ✅
Verified `isRetriableMigrationFailure` classifier matches ONLY the transient signature:
- `ERR_STREAM_PREMATURE_CLOSE`
- `Premature close`
- `Schema engine exited`

Test `does not match non-retriable errors` confirms real errors (`P1001`, `P1012`, generic Prisma errors) are NOT retried. The classifier is case-insensitive and regex-based.

### 2. Idempotency Claim ✅
The retry wraps `prisma migrate dev` / `prisma migrate deploy`, both idempotent operations. The transient crash occurs during schema-engine subprocess spawn, **before any migration SQL is written** (confirmed in commit message). Re-invocation is safe.

### 3. No Masking / Honest Logs ✅
- **stderr capture**: Non-interactive mode pipes stderr, captures it for classification, AND logs it via `console.error(result.stderr)`
- **Interactive mode**: stderr is `'inherit'`, bypasses retry entirely (single-shot)
- **No swallowing**: Classifier reads captured stderr; user sees the same stderr

### 4. Type Soundness ✅
Grep scan for TypeScript suppression patterns (`as unknown as`, `as any`, `@ts-ignore`, `@ts-expect-error`, `@ts-nocheck`): **0 matches**.

Only match was in a comment ("spawns as a child process"), not a cast.

### 5. Lock Hygiene ✅
`deno.lock` is NOT in `git show --stat 4335a939`. The word "deno.lock" appears only in the commit message text.

Files changed:
- `packages/database/scripts/migrate.ts`
- `packages/database/scripts/mod.ts`
- `packages/database/tests/migrate-retry_test.ts`

### 6. Tests ✅
Ran `deno task --cwd packages/database test`:
- 7 leaf tests passed (5 behavioral + 2 classifier)
- All 5 behavioral cases covered:
  - Retry-then-succeed (2 transient failures → success)
  - Bounded stop at maxAttempts
  - NO-retry on real schema error (no masking)
  - Interactive single-shot (no retry)
  - First-attempt success
- Classifier tests: matches transient signature, rejects real errors

Scoped validation wrappers:
- `deno check` (packages/database): 0 errors
- `deno lint` (packages/database): 0 errors
- `deno fmt` (packages/database): 0 changes needed

### 7. Scope ✅
Changes confined to:
- `packages/database/scripts/migrate.ts` (core fix: retry logic + classifier)
- `packages/database/scripts/mod.ts` (export surface)
- `packages/database/tests/migrate-retry_test.ts` (new test file)

No out-of-scope edits. Package boundaries respected.

## Changes

### Core Implementation (`migrate.ts`)
- Added `isRetriableMigrationFailure` classifier (regex-based, case-insensitive)
- Added `runPrisma` helper returning `{ code, stderr }`
- Added `runPrismaWithRetry` with bounded retry (max 4 attempts, linear backoff)
- Interactive runs force single-shot (`interactive === true` bypasses retry)
- Non-interactive runs capture stderr for classification AND surface it via console

### Export Surface (`mod.ts`)
- Exported `isRetriableMigrationFailure`, `runPrismaWithRetry`, `PrismaInvocation`, `PrismaInvocationResult`

### Tests (`migrate-retry_test.ts`)
- 7 test cases covering all behavioral and classifier scenarios
- Uses `PrismaSpawnMock` for deterministic test execution
- No real Prisma invocations (test isolation)

## Validation

### Gate Commands (all passed)
```bash
deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/database --ext ts,tsx
# Exit code: 0

deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/database --ext ts,tsx
# Exit code: 0

deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/database --ext ts,tsx
# Exit code: 0

deno task --cwd packages/database test
# 7 leaf tests passed
```

### Cast Scan
```bash
grep -rn 'as unknown as\|as any\|@ts-ignore\|@ts-expect-error\|@ts-nocheck' packages/database/*.ts
# 0 matches (only false positive in comment)
```

### Lock Hygiene
```bash
git show --stat 4335a939 | grep deno.lock
# No match (word appears in commit message only)
```

## Remaining Risks

1. **Windows-specific transient**: The fix addresses a Windows-only schema-engine crash. Linux/macOS may not exhibit this behavior, but the retry is harmless (classifier won't match non-transient errors).

2. **Prisma version coupling**: The fix targets Prisma 7.x schema-engine behavior. Future Prisma versions may change the error signature, requiring classifier updates.

3. **Backoff tuning**: Fixed 200ms backoff over 4 attempts (800ms total) is reasonable but not empirically tuned. If the transient persists longer, the retry will fail. This is acceptable (surfacing the real error is better than infinite retry).

4. **No e2e verification**: The evaluator did NOT run the full `scaffold.runtime` e2e suite. The flake is low-rate (~5-20% per run), so a single pass proves nothing. The unit tests + classifier correctness are the primary evidence.

## Conclusion

The fix is sound, narrowly scoped, and well-tested. The classifier correctly distinguishes transient schema-engine crashes from real migration errors. The retry is idempotent and does not mask failures. All static analysis gates pass. Lock hygiene is preserved.

**Verdict: PASS**
