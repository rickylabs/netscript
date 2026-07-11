use harness

# Slice brief — #464 FAI-9: beta.6 capability e2e merge gate (generative-UI + MCP widget round-trip)

## SKILL
netscript-harness, netscript-cli, netscript-tools

## Identity (per lane-policy)
Provider openai · model GPT-5.6 Sol · effort medium. Implementation slice under Tier-A supervisor
`fb43bc3e`. Branch: `test/464-fai9-capability-gate` off `origin/main` (after PR #597 and the T8
#409 PR merge — the suite files you touch were just modified by both).

## Objective
Issue #464 (Closes #464 in the supervisor's PR body). The generative-UI render assertion half of
FAI-9 already exists (`behavior.ui-render`, PR #597). Your slice adds the missing half:

**MCP widget round-trip smoke** under `scaffold.runtime`: against the running scaffolded app
(Aspire up), exercise the plugin-ai MCP surface end-to-end for the UI widget path — list/fetch the
MCP UI widget resource (the seam McpUiWidget consumes, FAI-8 / #257) and assert the round trip:
resource is served, payload shape matches what `McpUiWidget.tsx` consumes, and a `render_ui`-tool
JSON tree from the MCP tool surface renders through the FB5 renderer (reuse the existing
`behavior.ui-render` machinery/fixtures where sensible).

- New gate id(s) in `packages/cli/e2e/src/domain/cli-surface.ts`, gate defs under
  `src/application/gates/scaffold/`, selected into `scaffold.runtime` in
  `suites/scaffold/capability-suites.ts`, mirrored in the suite-registry test.
- The gate must FAIL if the MCP widget seam or the renderer install is missing (that is its
  merge-gate purpose).

## Acceptance
- `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` green including the new gate.
- Scoped wrapper check/lint/fmt over `packages/cli` green; no new `as` casts; no lock churn.
- Commit in slices; push each with
  `git push origin HEAD:refs/heads/test/464-fai9-capability-gate`. Do NOT open the PR. Write
  `.llm/runs/beta6-ship--orchestrator/worklog-464.md` and commit it.
