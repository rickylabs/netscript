# Run Summary — PR #326 Validation

## Summary

Validated PR #326: `docs: correct Aspire dashboard scheme http->https on :18888 (corpus-wide)`. This is a docs-only correction that updates all Aspire dashboard `:18888` references from `http://` to `https://` across the documentation corpus while preserving non-dashboard HTTP endpoints.

**Validation verdict:** All 5 validation gates PASS. PR is ready to merge.

## Changes

No changes made in this run — validation only.

**PR commit under review:**
- `0a162b63` — `docs: correct Aspire dashboard scheme http->https on :18888 (corpus-wide)`
- 35 files changed, 57 insertions(+), 57 deletions(-)
- All files under `docs/site/`, zero files under `packages/` or `plugins/`
- No `deno.lock` or source churn committed

## Validation

All checks exit 0.

### 1. Docs build & links (`deno task verify` from `docs/site/`)
- **Exit code:** 0
- Build: 441 pages generated
- Internal links: 18,875 links across 131 pages — all resolve
- Caveat refs: 30 markers across 23 pages — all resolve

### 2. Docs-only scope
- All 35 changed files are under `docs/site/` (confirmed via `git diff --name-only`)
- Zero files outside `docs/` touched

### 3. URL correctness
- **`http://localhost:18888` absent:** grep confirms zero bare `http://localhost:18888` in docs (excluding `_plan/`)
- **`https://localhost:18888` present in emitted site:** verified in `_site/` output for deploy pages and telemetry
- **`http://localhost:18889` preserved:** combo `https://localhost:18888 / http://localhost:18889` appears correctly in:
  - `how-to/deploy-local-aspire.md`
  - `tutorials/erp-sync/05-deploy.md`
  - `tutorials/storefront/06-deploy.md`

### 4. Non-dashboard URLs unchanged
- Service ports `:3001`, `:8091`, `:8092`, `:8093`, `:4318` — zero diff entries for these ports
- OTLP endpoint `http://localhost:4318` and other infrastructure URLs untouched

### 5. Numstat line-ending churn
- Total additions: **57**
- Total deletions: **57**
- Ratio 1.00:1 — all changes are in-line substitutions, no line-ending drift

## Remaining risks

None identified. The change is surgical, confined to documentation, and all validation gates pass cleanly.
