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
