## Merge packet — PR #1965 (#1881 / #863 gate 3) — exact head `9cff705f5`

**Head:** `9cff705f5796fa1249b10bd7f686bdcba53e2a2e` on `test/aspire-1881-readme-quickstart`, base `main` (converged on `2b8867d32`, post-#1952). Head has not moved since the evaluator ran.

**Content:** root README `<!-- readme-quickstart:start/end -->` markers + executable `aspire wait postgres --status healthy --timeout 60`; pure fail-closed parser (`<version>`/`<port>` only); `readme.quickstart` suite — one no-retry receipt gate per README command, `createCleanupGates()` appended unchanged; drift tests; `e2e-cli-prod.yml` step after `quickstart.walk`. Diff vs main: 13 non-harness files, gate code + README + workflow only; no `packages/*/src` product code, no `plugins/`, no lockfile.

**Evidence at this exact head**
- IMPL-EVAL (separate session, OpenRouter z-ai/glm-5.3-flash xhigh): **PASS** — comment 5518714015; thread-side opposite-family Claude eval also PASS (`slices/leaf-1881/thread-evaluate.md`).
- Core CI run 33701216889: `quality` ✅ `check-test` ✅ `close-gate` ✅ (rerun after body reconciliation) `code-quality` ✅ `scaffold-static` ✅ `desktop-native-linux` ✅.
- Review threads: `review-threads PASS threads=0 unanswered=0`.
- Local scoped gates: e2e check 233 files/0 errors, e2e tests 322/322, fmt clean, `e2e:cli gates readme.quickstart` lists 11 README gates + cleanup, `check:aspire-version-parity` PASS after manifest regen, carrier checks PASS (no delta).
- Runtime tiers (`scaffold-runtime` postgres/sqlite, run 33702032229) are broad tiers not exercising the new suite; per coordinator they are not a merge precondition. The new `readme.quickstart` executes for the first time in the Canary 9 prod run.

**State:** `status:ready-merge`, non-draft, `MERGEABLE` (state `UNSTABLE` solely from the pending broad runtime tiers). `Part of #1881` — no closing keyword by design (D-335): #1881 box 1 requires the attached hosted transcript, which is the **Canary 9 admission gate**, post-merge.

**Request:** squash-merge exact head `9cff705f5`. After merge: Canary 9 prod run must show `readme.quickstart` green; attach that transcript to #1881, then close it.
