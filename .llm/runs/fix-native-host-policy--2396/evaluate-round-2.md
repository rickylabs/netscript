# IMPL-EVAL round 2 for PR #2421 at head `ac50f545`

The round-1 blocker is fixed, and I found no new source, architecture, publication-shape or migration blockers.

## Round-1 blocker: fixed
- **Byte-identical move:** git shows `services/src/tests/service-test-fixture.ts` moved to `services/src/tests/test_utils/service-test-fixture.ts` at 100% similarity.
- **Now excluded from publishing:** the new path matches the existing `**/test_utils/**` exclude in `plugins/workers/deno.json`. This is the same pattern the streams sibling uses, and the publish include/exclude rules themselves are unchanged.
- **Imports:** only four lines changed, the import paths in `service_test.ts`, `service-conformance_test.ts`, `service-legacy_test.ts` and `service-lifecycle_test.ts`. No other tracked file outside the run directories still points at the old path.
- **Publish file list:** `publish-file-list.json` lists 92 files: package metadata plus source under `bin`, `contracts`, `jobs`, `services`, `src`, `streams` and `worker`. No `tests/`, `test_utils` or `*_test.ts` file is listed.
- **Unchanged since round 1:** factory, legacy-entrypoint and streams source; `serve` options and export maps; fixture assertions, time budgets and permissions.
- **Folder count:** the `services/src/tests/` entry is still the only test folder there. The 12-entry limit holds in both plugins.

## Debt
- **`HOST-POLICY-PUBLISHED-GRAPH-2396` and `WORKERS-HOST-METADATA-CARDINALITY-2396`:** only the Status lines changed, from proposed to accepted. Owner, target, scope, limits and closing gates are unchanged, which matches my round-1 acceptance.
- **Existing workers (22) and streams (21) type-export debt:** unchanged, with the 2026-11-10 deadline kept.

## Validation limits
- **What I did:** I ran nothing; I only read the code and committed evidence. I checked this round's change with git diffs between the two heads, plus file reads and searches.
- **Test numbers:** the workers 148/0/0 and SDK 137/0/0 results are the implementer's committed evidence, not runs of mine.
- **Publish proof is static only:** the dry-run file list shows what would be packed, not that an installed package works. Real proof against the published package is still owed by the release coordinator (`HOST-POLICY-PUBLISHED-GRAPH-2396`, `e2e-cli-prod` on the first 0.0.9 canary, before stable).
- **CI:** PR CI and the coordinator-armed `e2e-cli-gate` (`scaffold.runtime`) are pending because the PR is still a draft, not green. No local `scaffold.runtime` was run.
- **Known red items, same as main:** the full-export doc lint fails at main's counts (workers 2, streams 3, Fresh 45). The workers OpenAPI document returns 500 here as it does on main; the test proves only that this branch matches main.
- **Next step:** with source approved, the PR can be marked ready, then a final review on the exact head once CI results exist.

VERDICT: MERGE ac50f54502dd5d2f07a62cdd2b562094eb5dee21
