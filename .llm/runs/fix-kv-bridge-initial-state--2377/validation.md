# Validation

- Structured tests via `deno task test --unstable-kv --frozen`: bridge-watch-initial, bridge, watch-initial and watch-review. **80 passed, 0 failed, 11 ignored**, raw exit 0. Ignored cases require a configured Redis backend; no Redis result claimed. Baseline same existing suites: 74 passed/11 ignored.
- New tests alone after restoring fix: **6 passed, 0 failed**, raw exit 0. Counted batch-read wrapper explicitly supplies getMany (Memory does not); optional path separately tests its absence. Acknowledged-snapshot test proves zero bridge batch reads and exactly the adapter's own per-key snapshot reads. Held-read cases cover cancellation cleanup/error propagation; no claim they alone prove the ended guard.
- Negative control: retain new tests; restore only the bridge from main 14816a4; run the plain-iterable first/later-frame regression. **0 passed, 1 failed, raw exit 1**, because unchanged stored key is absent. Restore fixed bridge in finally, then prove all 6 new cases green.
- Structured check `--root packages/kv --ext ts,tsx --deno-arg --frozen`: **58 files, 0 failed batches/findings, raw exit 0** (wrapper defaults --unstable-kv). Initial fixture key type widened to symbol-capable KvKey was corrected to inferred string keys without casts; no suppressions.
- Structured lint/fmt for the two changed TS files: **PASS**, raw exit 0.
- Allowlisted `quality-gate`: **PASS**, raw exit 0 (quality:scan, deps:check and arch:check); no source suppressions.
- Scoped `doc:lint --root packages/kv`: **PASS**, 0 errors (baseline also 0). Scoped JSR audit/publish dry-run: **PASS**, raw exit 0. No export, dependency, permission or lock change.

No local scaffold.runtime: this leaf changes the public bridge's optional third-party fallback only, no scaffold output/plugin runtime wiring. First-party initial snapshots still use the original path and are regression-tested with Memory and native Deno KV. Runtime E2E scheduling, labels and merge remain coordinator-owned.
