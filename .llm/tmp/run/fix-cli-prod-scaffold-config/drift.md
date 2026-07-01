# Drift

## 2026-06-26

- Severity: minor
- Item: The exact scoped lint/fmt wrapper commands for `packages/cli` are blocked by the root
  Deno config's `packages/cli/` lint/fmt exclusions. They select files but Deno reports no targets,
  so the wrappers exit non-zero with zero findings. Supplemental touched-file lint/fmt with
  `--no-config` passed.

## 2026-06-26

- Severity: significant
- Item: Full `scaffold.runtime` failed after the D1 target step passed. The failure is the separate
  database generation reliability path: `Timed out waiting for Aspire resource
  prisma-generate-postgres to complete.` This is outside D1/D3/D5 and matches a separately active
  db-init/db-generate reliability slice.

