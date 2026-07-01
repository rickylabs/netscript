# Context Pack

## Objective

Add deterministic first-publish JSR package provisioning, harden the publish workflow, and add a
safe GitHub Release helper without performing real JSR mutations or creating a release.

## Files Changed

- `.llm/tools/jsr-provision-packages.ts`
- `.llm/tools/release.ts`
- `.github/workflows/publish.yml`
- `.llm/tmp/run/fix-jsr-first-publish-provisioning--e2e/*`

## Current State

- Provisioning tool lists 31 discovered workspace members, exits 0 without `JSR_API_TOKEN`, and uses
  JSR management API order `GET` -> optional `POST` -> `PATCH` when token is present.
- Publish workflow uses `actions/checkout@v5`, adds `Ensure JSR packages exist` before
  `Publish dry-run`, keeps `id-token: write`, and still publishes through `.llm/tools/run-publish.ts`.
- Release tool validates tag/version/notes and prints argv on `--dry-run`.

## Validation Summary

- Targeted type check clean.
- Touched tool formatting clean.
- Explicit lint clean.
- Workflow YAML parse clean.
- No-token provisioning and release dry-run probes clean.
- Mismatch release tag probe fails clearly as expected.

## Known Blockers

- Broad `.llm/tools` wrapper check fails on unrelated pre-existing fitness helper errors.
- Root lint wrapper cannot lint `.llm/` files because `.llm/` is excluded in root lint config.
