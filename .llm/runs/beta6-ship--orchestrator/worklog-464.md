# Worklog — #464 FAI-9 MCP widget round-trip gate

## Identity

- Supervisor session: `fb43bc3e`
- Implementation thread: `019f4e9d-54c6-7d41-a8a2-3bd3e867d3e3`
- Lane: OpenAI · GPT-5.6 Sol · medium
- Branch: `test/464-fai9-capability-gate`
- Baseline: `542ceaef` (`origin/main`, including PRs #597 and #598)
- Implementation commit: `caa4931f`
- Push: `origin/test/464-fai9-capability-gate`

## Harness drift

- D1: PLAN-EVAL and the parent run's missing plan artifacts were owner-waived in the slice brief.
  Implementation followed the supervisor-approved fixture contract supplied on 2026-07-11.
- IMPL-EVAL and Tier-A slice review remain supervisor-owned; this implementation lane does not
  self-certify.

## Implementation

- Added `behavior.mcp-widget-roundtrip` to the stable CLI E2E gate surface.
- Added a single-process loopback MCP Streamable HTTP fixture using `Deno.serve` on an ephemeral
  port. It exercises the default TanStack connector through `createMcpTransportPool`, lists the
  prefixed tool, calls it, and verifies the extracted `ui://` resource metadata.
- Passed the extracted resource through `mcpUiFrameAttributes` and `McpUiWidget`, verifying theme
  propagation, restrictive sandbox normalization, no-referrer policy, and rendered iframe markup.
- Selected the gate into `scaffold.runtime` immediately after `behavior.ui-render` and mirrored the
  selection in the suite registry test.

## Validation

- `deno task e2e:cli gates scaffold.runtime` — PASS; the new gate is selected in behavior phase.
- `deno test --allow-all packages/cli/e2e/tests/presentation/suite-registry_test.ts` — PASS, 7/7.
- `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/cli --ext ts,tsx`
  — PASS, 597 files, 5 batches, 0 findings.
- `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/cli --ext ts,tsx`
  — PASS, 597 files, 3 batches, 0 findings.
- `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/cli --ext ts,tsx`
  — PASS, 597 files, 3 batches, 0 findings.
- First full runtime attempt reached the new gate with all preceding gates green, then failed in 5
  ms because Deno 2.9 rejects `--allow-net` on `deno eval`. Aspire cleanup passed. The flag was
  removed and the exact captured gate command was replayed in the retained generated project — PASS.
- Final `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` — PASS, 58 passed / 0
  failed. `behavior.mcp-widget-roundtrip` passed in 301 ms; `cleanup.aspire-stop` passed.
- `git diff --check` — PASS.
- Added casts: none.
- `deno.lock` churn: none.

## Handoff

- No PR opened, per supervisor instruction.
- Supervisor should perform substantive slice review and opposite-family IMPL-EVAL before sign-off.
