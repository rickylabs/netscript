# Research

Run ID: `fix-jsr-first-publish-provisioning--e2e`

## Scope

Tooling/workflow slice only:

- `.llm/tools/jsr-provision-packages.ts`
- `.llm/tools/release.ts`
- `.github/workflows/publish.yml`
- this run directory

No `packages/`, `plugins/`, lockfile, tag, GitHub Release, or real JSR POST/PATCH work is in scope.

## Findings

- Existing publish workflow triggers on GitHub Release `published` and `workflow_dispatch`.
- Existing publish workflow keeps `permissions.id-token: write` and publishes through
  `.llm/tools/run-publish.ts`, which calls `publishWorkspace`; it is not a bare `deno publish`
  workflow step.
- Existing member discovery lives in `.llm/tools/publish-workspace.ts` as
  `discoverWorkspaceMembers(root)`. The provisioning CLI reuses this export.
- Current discovery returns 31 publishable `@netscript/*` workspace members:
  `aspire`, `auth-better-auth`, `auth-kv-oauth`, `auth-workos`, `cli`, `config`,
  `contracts`, `cron`, `database`, `fresh`, `fresh-ui`, `kv`, `logger`, `plugin`,
  `plugin-auth-core`, `plugin-sagas-core`, `plugin-streams-core`, `plugin-triggers-core`,
  `plugin-workers-core`, `prisma-adapter-mysql`, `queue`, `runtime-config`, `sdk`, `service`,
  `telemetry`, `watchers`, `plugin-auth`, `plugin-sagas`, `plugin-streams`, `plugin-triggers`,
  `plugin-workers`.
- Root `deno.json` version is `0.0.1-alpha.1`; deterministic release tool validation must accept
  `v0.0.1-alpha.1` and reject mismatched tags.
- Broad `.llm/tools` type-check wrapper currently fails on unrelated
  `.llm/tools/fitness/check-manifest-integrity.ts` importing a missing
  `packages/fresh-ui/registry/manifest.ts` and implicit-any parameters. The slice used the allowed
  targeted `deno check --unstable-kv` fallback for the two new tools.

## JSR Audit Surface

This slice does not alter package exports, package metadata, or published source under
`packages/`/`plugins/`. JSR publishability risk addressed here is registry-side first-publish
provisioning: each package must exist in the `@netscript` JSR scope and be linked to
`rickylabs/netscript` before OIDC publish can succeed.

## Open Questions

- None blocking implementation. Real JSR provisioning requires the user/supervisor to add a
  `JSR_TOKEN` repository secret before cutting the release.
