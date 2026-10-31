# Required test-shard repair — independent IMPL-EVAL

**[PHASE: IMPL-EVAL] [VERDICT: PASS]**

Reviewed source **98846602fe0fc8f64bdc3ddafd1808466b6d1bd1**. Retained separate native Anthropic evaluator, exact `claude -p --model claude-opus-5-5 --effort high`, closed stdin/read-only Read/Glob/Grep tools. Exit0, successful response, observed model usage claude-opus-5-5; clean source and head unchanged before/after. The reviewer read the actual reports and source but executed no commands. Provider-side identity attestation and private session identifiers are not published.

The supervisor accepts this test-source/local-evidence sign-off. It does not certify final CI or renew READY. Every protected context must be satisfied at the final pushed head; current actual8 shard jobs plus check-test and quality must succeed. Same-head old draft-run skipped aggregators cannot substitute. Informational deps-report remains skipped by unchanged policy, as on green main run41151193922; report that distinction without pretending it executed. Final external CI proof must be posted after this evidence-only commit so the checked head stays current.

## Evaluator response

REVIEWED 98846602fe0fc8f64bdc3ddafd1808466b6d1bd1

# CI test-shard repair (issue #2415, PR #2468): PASS for the source and local evidence

The change fixes the two failing CI tests without weakening what they check. I found no blockers. The required CI condition is still pending; see the last section.

## Why it passes
- **The failures were stale counts, not product bugs.**
  - The CI report for test-2 shows its one failure as a 26-versus-22 count mismatch. The test-5 report records exactly one failure (1625 passed, 1 failed).
  - The local before-run fails on the same 26-versus-22 message in two places.
  - The MCP package's own test pins `TOOL_NAMES.length` at 26 and requires the tool registry to match `TOOL_NAMES` exactly, in order (`packages/mcp/tests/registry_test.ts:7,99`). The old 22 predates the four S2 registry tools.
- **The new assertions are stricter, not looser.**
  - Both tests now compare the actual JSON-RPC `tools/list` output against the public `@netscript/mcp` `TOOL_NAMES`, including names and order (`packages/cli/src/public/features/agent/init/init-agent_test.ts:384`, `packages/cli/e2e/tests/agent/agent-mcp-stdio_test.ts:203`).
  - That catches a CLI host that drops, adds or reorders tools. A bare count only caught size changes, and the 26 count is still pinned by the package that owns it.
- **The prior-release restart test keeps its old checks.** Still in place:
  - the pinned prior-release host fixture
  - the generated migration target specifier
  - the real CLI restart through `listToolsAfterHostRestart`
  - the explicit OpenAPI tool-triad assertions
- **The stdio smoke test checks more.** It keeps every earlier check:
  - initialize, server name and instructions
  - the `doctor` and `get_app_status` result shapes
  - `find_guidance` routing
  - the `execute_command` denial for `deploy`
  - the `definePage` export search

  It then calls all four registry tools over the real stdio JSON-RPC process and requires:
  - every response to be a non-error
  - a list with limit 1 to return one item and a nonzero total
  - a `button` search hit
  - `cn` to come back with content byte-identical to `packages/fresh-ui/registry/lib/cn.ts`
  - the add-command tool to return exactly `{ command: 'netscript', args: ['ui:add', 'button'] }`, with nothing executed
- **The change is bounded.** The diff is two test files. They add no skips, ignores, timeouts or production-code imports beyond the public `@netscript/mcp` export. I didn't diff the commit, so the "no other files changed" statement is the implementer's.

## Receipts I read (I ran nothing myself)
- **CI shard reports**, from the merge checkout of the failing run:
  - test-2: 1429 passed, 1 failed, 6 ignored, with the failure shown as 26 versus 22
  - test-5: 1625 passed, 1 failed, 3 ignored
- **Focused tests:** before, 30 passed and 2 failed, exit 1, both on 26 versus 22. After, 32 passed, 0 failed, 0 ignored, exit 0.
- **Wrappers:** check, lint and format each selected the 2 files with 0 findings and no refusals. Lint exits 0.
- **Quality gate:** the durable receipt records `98846602…` as both requested and actual head, outcome PASS, exit 0.

## Still pending: not certified by this review
- **Required CI must be observed at the final head.** READY needs that head's current non-draft CI run to show the following, all SUCCESS:
  - all eight `check-test` shard jobs
  - the current `check-test` aggregator
  - `quality`

  The required contexts also have to be satisfied live. A SKIPPED aggregator from an earlier draft run at the same head doesn't count. The local results above and the earlier `quality` success are not a substitute.
- **`deps-report` is skipped on PRs by workflow policy.** The protected-branch rules list `quality`, `check-test` and `deps-report`. The unchanged workflow intentionally skips `deps-report` on pull requests; main's own green run also shows it SKIPPED with `quality` and `check-test` passing. Report that as a policy fact, not as a pass or a flake waiver.
- **Older limitations still stand.** The Docker-dependent `scaffold.runtime --cleanup` run remains unproven, and the full Fresh UI doc-lint still has the same 123 component findings. This test-only repair re-ran neither.
