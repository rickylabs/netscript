# Drift

- RTK not installed; use direct git/gh and structured Deno wrappers.
- Owner model/effort override supersedes current pinned matrix routes; exact grant in supervisor.md.
- Scoped Refs-only PR instruction conflicts with later mandatory Closes footer. Keep Refs first and
  required exact footer; retain unproven evidence explicitly rather than claiming readiness to merge.

## CI follow-up: generated documentation carrier

CI quality found the streams docs edit had not refreshed the embedded consumer prose. This is a
real owned failure, not baseline drift. Extend the declared write surface by the derived
`packages/cli/src/kernel/assets/agent-docs-prose.generated.ts`; regenerate with the existing
`gen:agent-docs-prose` and `gen:publish-assets` commands. Only the rendered streams page changes,
no corpus entry is removed, and no runtime source or dependency changes.

Repeated owner activity requested repairing close-gate and keeping the PR green. Its nine issue
acceptance boxes were checked with validated linked evidence; the true full-runtime checkbox stays
unchecked until executed CI. An existing workflow_dispatch was launched on GitHub-hosted runners
without changing coordinator-owned labels or running the suite locally. The generated-prose fix
moves the head, so runtime CI and exact-head IMPL-EVAL must be refreshed for the new head.

## CI export-corpus closure and main integration

After prose freshness passed, CI quality exposed the next real stale artifact: the MCP public
export-surface corpus reflects the new optional directory fields and contribution constructor.
Extend derived scope to packages/mcp/src/infrastructure/export-surfaces/export-surface-corpus.generated.ts.
Refresh through gen:mcp-export-corpus and all downstream native asset generators, not hand edits.

Main advanced to 15cffa2fee5b6d543ecae2981a3563b1b74ca789 (#2517 saga read-model work and #2421
native host-policy work). Merge main normally, preserving all retained foreign run evidence and
upstream source. No rebase/force push. Automatic merge needs no custom source resolution. The
streams legacy entrypoint now delegates to main's native service factory; it still selects storage
through STREAMS_DATA_DIR. Our contribution and AppHost wiring are unchanged. Regenerate from the
coherent combined source using the documented --allow-dirty generation mode while merge is pending;
freshness checks run without that flag. New-head E2E and final exact-head evaluation are required.
