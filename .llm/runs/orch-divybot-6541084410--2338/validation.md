# Validation evidence

Source baseline: `f6839463668c5dae4ca7234d26909e74e10b89c0`.
Runtime implementation: `515a42d31d785fd8176aae275e578af8b7cfa42e` ( source/slice review in impl-eval-source.md).
No dependencies or lock files changed. Commands below are repository-native verdict sources; output logs/receipts with operational metadata remain outside public Git under the assignment privacy rule.

| Command / scope | Result |
| --- | --- |
| Structured test wrapper: core + real server idempotency + retention | exit 0; 87 passed, 0 failed, 0 ignored |
| Structured check wrapper: core + idempotency service test, `--ext ts,tsx --deno-arg --frozen` | exit 0; 64 files, zero diagnostics |
| Structured lint/fmt wrappers, same 64-file scope | exit 0; zero findings, full selection coverage |
| Structured consumer-fixture check with its standalone config and `--no-lock` | exit 0; one selected file, zero diagnostics |
| `quality:gate`, via allowlisted gate runner | PASS, exit 0; includes dependency checks and all-roots architecture |
| `doc:lint --root packages/plugin-streams-core --pretty` | exit 0, combined export graph: zero errors |
| JSR audit of core | dry-run OK; only warning is the scanner misclassifying the slow-type-check banner |
| Native checked package `deno publish --dry-run --allow-dirty` | exit 0; Success without allow-slow-types |
| `docs:links` | exit 0; zero broken links/anchors |
| `docs:snippets` | exit 0; 26 checked tier-one fences, 13 justified existing exemptions |
| Generated corpus + bundle structured tests | exit 0; 10 passed, 0 failed |
| Structured check of two changed generated carriers | exit 0; zero diagnostics |
| Structured lint/fmt of changed MCP generated corpus | exit 0; zero findings |
| CLI encoded prose carrier | repository lint/fmt exclusion retained; native deterministic generation/freshness + type-check used |
| Native `check:mcp-export-corpus` | exit 0 |
| Native `check:agent-docs-prose` | exit 0, fresh; includes docs build and rendered-output checks |
| Native `check:publish-assets` | exit 0 |
| Focused runtime positive/full-revert control | fixed: 9 passed; reverted production: 8 failed/1 passed, exit 1; see negative-controls.md |
| Reference-server fixture stability | 20 consecutive focused suites; 180 passed results |
| `check:review-threads` on PR #2510 | PASS; zero threads/unanswered at source reconciliation |
| Read-only `maint:leak-check` | exit 0; 24 unproven existing/transient entries reviewed and left untouched |
| Local scaffold.runtime | NOT RUN, explicitly prohibited by owner |
| e2e-cli CI | REQUIRED, coordinator must arm e2e-cli-gate; not claimed by local evidence |

The isolated standalone entrypoint doc-lint counts (10 private references) also exist on baseline; combined export-map doc-lint is clean. The first exploratory consumer command forced a nonexistent private lock and failed; the standalone fixture's intended no-lock check passes without changing any lock. One exploratory TAP run was interrupted on the upstream server's idle-socket shutdown issue; only completed subsequent structured runs are counted above.

Final immutable-head receipt/check results and final exact-SHA evaluator verdict belong on the PR phase comment and canonical READY report. Keeping them there avoids an evidence-only commit invalidating the SHA it claims to review. Final CI state is a snapshot, not a claim of future success. Only coordinator merges.
