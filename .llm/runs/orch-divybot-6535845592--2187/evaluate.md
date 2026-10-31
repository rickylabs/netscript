# Independent S1 implementation evaluation

**SLICE-REVIEW: PASS.** I found no blockers in the S1 working-tree candidate against base `7907293`. This was a read-only review: I changed no files and mutated nothing beyond the temporary directories the tests create and remove.

**Production change matches the approved plan**
- **Adapter (`watchers-file-watcher-adapter.ts`):**
  - The event counter is incremented and its id stored before the `await` on the hash.
  - When both `modifiedAt` and `size` are present, the key is `file-watch:` plus the SHA-256 of `[triggerId, path, kind, modifiedAt, size]`, so its length is fixed. A size of 0 counts as present.
  - If either field is missing, the key is `file-watch:` plus a random UUID.
  - The callback timestamp, `contentHash` and `stableChecks` are not part of the key.
  - The hash helper is private to the module, so the public surface is unchanged.
- **Processor (`trigger-processor.ts`):** only `resolveDedupTtl` changed. Explicit `ttlMs` (including 0) still wins. File-watch otherwise defaults to 0; webhook and scheduled keep 24 hours.
- **#2165 behaviour is untouched:** the store's `resolveKey` and the definition-key override did not change. The existing test where `definition-key` overrides `adapter-key` still passes.
- **Downstream jobs:** a worker job now inherits the bounded file-change key, which the docs describe accurately.

**Each acceptance item has a test** (`tests/file-watch-idempotency_test.ts` and the adapter unit test):
- **Two modifications seconds apart, default definition:** covered for missing, partial and null-mtime metadata, with a real 2-second gap, plus a real-filesystem polling run.
- **Same after restart:** the disk KV is closed and reopened, with a new processor and adapter. A sentinel value proves the database persisted, and the test asserts the restarted event counter repeats its id. Both the missing-metadata and same-snapshot cases are covered.
- **True duplicate (same mtime and size):** two processors share one disk database. While the first handler is blocked, the second gets `TriggerDeduplicatedError`; after completion the duplicate runs. Eligibility after restart is covered by the same-snapshot restart test.
- **Different missing-metadata changes running at once:** they do not share a claim.
- **Key format:** each of the five fields is changed independently, and six incomplete-metadata shapes each get unique UUIDs across adapter restarts.
- **Other cases:** a path over 2 KiB passes through disk KV with a bounded key; explicit TTLs of 0 and 60,000 apply; webhook and scheduled keep 86,400,000 ms.
- **Docs:** `docs/site/durable-workflows/triggers.md` matches the code, including the in-flight-only default, tuple versus UUID keys, override precedence and key inheritance by worker jobs.

**Negative controls**
I did not rerun them. Working each test through by hand against the original code gives the same counts you reported:

| Reverted | Fail / pass | Failing tests |
| --- | --- | --- |
| Both files | 15 / 2 | All 7 adapter tests and all 8 regression tests. The long-path and TTL-default controls pass. |
| Adapter only | 8 / 9 | The 7 adapter tests and the concurrent test |
| TTL only | 2 / 15 | Same-snapshot after completion, and same-snapshot after restart |

Each failure is an assertion or the expected `TriggerDeduplicatedError`, not a setup or type error.

**What I reran myself**
- **Tests:** the two new files plus `trigger-processor_test.ts` gave 24 passed, 0 failed. That count includes the real-filesystem test.
- **Static checks:** `deno check --unstable-kv --frozen` on the changed and new files is clean, and lint is clean.
- **Scoped quality scan:** 0 findings, 0 allowances.
- **Unsafe code:** the diff adds no `as unknown`, `deno-lint-ignore` or `any`.
- **Lockfile:** `deno.lock` is unchanged.

**Scope, doctrine and privacy**
- **Scope:** every changed file is in the authorized write surface. Moving the integration suite into the existing `tests/` directory is recorded in `drift.md` and `supervisor.md`, and that folder is an allowed name.
- **Doctrine:** no new exports, dependencies, ports or debt.
- **Known red gates:** `quality:gate` and full-export doc lint still fail only on the findings already present before any edits. They are correctly recorded as not green and are not attributed to this change.
- **Privacy:** the run artifacts and the lesson file contain no host paths, ports or session ids.

**Not blockers, for the final evaluation**
- The real-filesystem test depends on timing: 500 ms polling, 5 s deadlines, and an exact count of 3 events. If CI is flaky, look there first.
- That test strips metadata. The full-metadata path is proven through the deterministic watcher input, not through a real watcher.
- The memory-based testing file-watch adapter does not reproduce the new key. This is outside the authorized surface.

SLICE-REVIEW: PASS

## Final-head attestation

This independent review covers the S1 candidate before its sign-off commit. After push and ready-for-review, the same evaluator conversation will attest the exact pushed SHA. That immutable final verdict is published as a PR phase comment and in the excluded canonical READY handoff; this tracked record is not itself a final-head attestation. Only the coordinator merges.
