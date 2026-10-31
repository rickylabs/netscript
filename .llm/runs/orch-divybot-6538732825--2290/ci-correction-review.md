# Independent CI correction slice review

## IMPL-EVAL #2290, feature tier, round 3: review of the CI fix before commit

**Result: PASS, no blockers.** The fix regenerates two generated files with the repo's own generators, and the regenerated content matches the public API and docs already reviewed at 4d1ebfb. Nothing else changed: no source, runtime, test, lock or CI config, and no gate was weakened. The only thing left is the generated-asset freshness gate, which can only give a meaningful result after the commit.

**What changed.** The base is still 4d1ebfb with a dirty working tree. Besides run artifacts, only two generated files differ:
- `packages/cli/src/kernel/assets/agent-docs-prose.generated.ts` (2 lines)
- `packages/mcp/src/infrastructure/export-surfaces/export-surface-corpus.generated.ts` (3 lines)

**What's inside them.** I decompressed the old and new versions of both files and compared them.
- **Agent docs:** still 202 pages. Only `pages/reference/service/index.md` and `pages/tutorials/workspace/05-route-authz/index.md` changed. Their new text is the same reference and tutorial prose I reviewed in rounds 1 and 2: the 404/410 sections, the retired-path rules, the corrected wording of the tutorial's API table, and table rows for `PROCEDURE_ERROR_CODES`, `ProcedureErrorCode`, `AuthzDecision` and `ProcedurePolicyResolution`.
- **Export corpus:** still 304 rows, and no symbol was removed.
  - **Service root (`.`):** gains `PROCEDURE_ERROR_CODES` and `ProcedureErrorCode` (109 to 111 symbols). The `ContractAuthorizerOptions` signature gains `retiredPaths?`. The doc comments for `AuthzDecision` and `createContractAuthorizer` and the two new symbols match the committed source.
  - **Service `./auth`:** adds two re-export references (53 to 55 symbols).
  - **Plugin `./service`:** only the doc comment of its re-exported `AuthzDecision` changed. Its signature and symbol count (35) are the same.
  - That matches `ci-correction-export-delta.json`.

**CI root cause.** In `.github/workflows/ci.yml`, the quality job runs four freshness gates: agent-docs-prose, mcp-export-corpus, assets-barrel and publish-assets. I ran these myself without changing any tracked file:

| Check | Result |
| --- | --- |
| `check:agent-docs-prose` (the gate that failed in CI) | exit 0, fresh, no stale paths; git status of tracked files unchanged afterwards |
| `check:mcp-export-corpus` | exit 0, 35 packages, 304 subpaths, 9006 symbols |
| `check:publish-assets` | exit 0 |
| Generated MCP file: `deno fmt --check` and `deno lint` | clean |
| `deno check` on both generated files | exit 0 |
| `packages/mcp/tests/embedded-export-surface-corpus_test.ts` | 2 passed |

**Repo hygiene.**
- No lock-file changes.
- No hand edits to generated files are evident: each file's content matches what its native generator produces.
- The `--allow-dirty` flag was used only for writing, and every freshness check ran without it.
- The new and updated run artifacts contain no environment paths, hosts, tokens or credentials.
- The supervisor scope extension and the drift entry both correctly record that the earlier claim that these generated files are only checked on main was wrong, including my own plan-review agreement with that claim.

**Still pending (not source problems).**
- The generated-asset freshness gate (`check:assets-barrel`) runs `git diff --exit-code` on the CLI prose file, so it can only pass meaningfully after this commit. I didn't run the generator, because it writes tracked files.
- The CLI and MCP publish dry runs are still being reconciled by the generator session.
- The quality steps after the failed freshness check, and the coordinator-armed e2e-cli runtime check, still need CI at the new head. I didn't observe any CI result for this fix.
- The new head needs an exact-head review once it is pushed.

VERDICT: PASS
