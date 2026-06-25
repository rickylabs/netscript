# Worklog

## Design

### Public Surface

- `.llm/tools/jsr-provision-packages.ts`: Deno CLI invoked by CI to ensure every publishable
  workspace member exists in JSR and is linked to `rickylabs/netscript`.
- `.llm/tools/release.ts`: Deno CLI invoked by the supervisor to validate and create a deterministic
  GitHub Release via `gh release create`.
- `.github/workflows/publish.yml`: release/workflow-dispatch publish lane with a pre-dry-run
  provisioning step.

### Domain Vocabulary

- `PublishableMember`: existing discovery result from `.llm/tools/publish-workspace.ts`.
- `GitHubRepo`: owner/name tuple used in JSR package `githubRepository` PATCH.
- `PackageResult`: per-package state, `exists` or `created`, plus `linked`.
- `PackageFailure`: compact package/action/reason failure row.
- `ApiResult`: guarded JSR API response, either ok or typed error.
- `Options`: parsed CLI flags for each tool.

### Ports

- JSR management API via Web `fetch`.
- Local filesystem reads for workspace discovery, root version, and release notes.
- `Deno.Command` in `release.ts` only for `gh release create`.

### Constants

- JSR API base: `https://api.jsr.io`.
- Default scope: `netscript`.
- Default repo: `rickylabs/netscript`.
- Tag pattern: `^v\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$`.

### Commit Slices

1. Tooling/workflow hardening slice: add provisioning CLI, deterministic release CLI, workflow
   preflight step, harness artifacts, validation evidence.

### Deferred Scope

- Real package creation/linking against JSR.
- Real GitHub Release/tag creation.
- Package/plugin code changes and full runtime scaffold e2e.

### Contributor Path

- To add a package-management action, extend `jsr-provision-packages.ts` around `requestApi` and the
  guarded `ApiResult` model.
- To change release creation behavior, update `buildReleaseArgs` in `release.ts` and prove the
  `--dry-run` argv output.

## Implementation Notes

- `jsr-provision-packages.ts` imports `discoverWorkspaceMembers` instead of reimplementing discovery.
- Provisioning order per package is `GET`, optional `POST`, then `PATCH`.
- Missing `JSR_API_TOKEN` prints the skip line and exits 0.
- `--dry-run` with a token performs GET-only and reports intended create/link actions.
- `release.ts` validates tag shape, workspace version equality, and non-empty notes file before
  invoking `gh`.

## Validation

| Gate | Result | Evidence |
| --- | --- | --- |
| Targeted type check | PASS | `deno check --unstable-kv .llm/tools/jsr-provision-packages.ts .llm/tools/release.ts` exited 0 |
| Broad tools check | BLOCKED unrelated | `run-deno-check.ts --root .llm/tools --ext ts` failed in pre-existing `.llm/tools/fitness/check-manifest-integrity.ts` due missing `packages/fresh-ui/registry/manifest.ts` and implicit-any parameters |
| Format wrapper | PASS | `run-deno-fmt.ts --root .llm/tools --ext ts --include '^(\\.llm/tools/(jsr-provision-packages|release)\\.ts)$'` selected 2 files, 0 findings |
| Lint | PASS | `deno lint --config /dev/null .llm/tools/jsr-provision-packages.ts .llm/tools/release.ts` checked 2 files |
| Root lint wrapper | BLOCKED by config | wrapper selected 2 files but `deno lint` returned `No target files found` because root config excludes `.llm/` |
| Workflow YAML | PASS | `deno eval --no-lock` with `jsr:@std/yaml` parsed `.github/workflows/publish.yml` |
| Workflow hardening | PASS | scan: `checkoutV4=false`, `checkoutV5Count=1`, `ensureBeforeDryRun=true`, publish uses `run-publish.ts`, no `deno publish` workflow step |
| Provision no-token dry-run | PASS | printed discovered 31 members and `JSR_API_TOKEN not set — skipping provisioning (assuming packages already provisioned)`; exit 0 |
| Release dry-run | PASS | printed `gh release create v0.0.1-alpha.1 --target main --notes-file .llm/tmp/run/fix-jsr-first-publish-provisioning--e2e/release-notes.md --repo rickylabs/netscript --title v0.0.1-alpha.1 --prerelease`; exit 0 |
| Release mismatch | PASS | `v0.0.2-alpha.1` failed with `Release tag version 0.0.2-alpha.1 does not match workspace version 0.0.1-alpha.1.` |
| Type casts | PASS | no `as` casts added in the two new tools |

## Discovered Members

`aspire`, `auth-better-auth`, `auth-kv-oauth`, `auth-workos`, `cli`, `config`, `contracts`,
`cron`, `database`, `fresh`, `fresh-ui`, `kv`, `logger`, `plugin`, `plugin-auth-core`,
`plugin-sagas-core`, `plugin-streams-core`, `plugin-triggers-core`, `plugin-workers-core`,
`prisma-adapter-mysql`, `queue`, `runtime-config`, `sdk`, `service`, `telemetry`, `watchers`,
`plugin-auth`, `plugin-sagas`, `plugin-streams`, `plugin-triggers`, `plugin-workers`.

## Follow-up Fix Validation

Reviewer request: make public `GET /scopes/{scope}/packages/{package}` unauthenticated, skip `PATCH`
when the public package JSON already links to the target repo, require `JSR_API_TOKEN` only when a
real write is needed, and avoid crashing on non-JSON error bodies.

Public package shape inspected with `GET https://api.jsr.io/scopes/std/packages/assert`: response
contains `githubRepository.owner` and `githubRepository.name`, e.g. `denoland/std`.

| Gate | Result | Evidence |
| --- | --- | --- |
| Targeted type check | PASS | `deno check --unstable-kv .llm/tools/jsr-provision-packages.ts .llm/tools/release.ts` exited 0 |
| Format wrapper | PASS | `run-deno-fmt.ts --root .llm/tools --ext ts --include '^(\\.llm/tools/(jsr-provision-packages|release)\\.ts)$'` selected 2 files, 0 findings |
| Lint | PASS | `deno lint --config /dev/null .llm/tools/jsr-provision-packages.ts .llm/tools/release.ts` checked 2 files |
| No-token dry-run public GETs | PASS | `env -u JSR_API_TOKEN deno run --allow-net --allow-read --allow-env .llm/tools/jsr-provision-packages.ts --dry-run` exited 0 |
| No-token real run public GETs | PASS | `env -u JSR_API_TOKEN deno run --allow-net --allow-read --allow-env .llm/tools/jsr-provision-packages.ts` exited 1 with `write needed but no token` failures and no writes attempted |

No-token dry-run output:

```text
discovered 31 workspace members: aspire, auth-better-auth, auth-kv-oauth, auth-workos, cli, config, contracts, cron, database, fresh, fresh-ui, kv, logger, plugin, plugin-auth-core, plugin-sagas-core, plugin-streams-core, plugin-triggers-core, plugin-workers-core, prisma-adapter-mysql, queue, runtime-config, sdk, service, telemetry, watchers, plugin-auth, plugin-sagas, plugin-streams, plugin-triggers, plugin-workers
aspire: created + would-link
auth-better-auth: created + would-link
auth-kv-oauth: created + would-link
auth-workos: created + would-link
cli: created + would-link
config: created + would-link
contracts: created + would-link
cron: created + would-link
database: created + would-link
fresh: created + would-link
fresh-ui: created + would-link
kv: created + would-link
logger: created + would-link
plugin: created + would-link
plugin-auth-core: created + would-link
plugin-sagas-core: created + would-link
plugin-streams-core: created + would-link
plugin-triggers-core: created + would-link
plugin-workers-core: created + would-link
prisma-adapter-mysql: created + would-link
queue: created + would-link
runtime-config: created + would-link
sdk: created + would-link
service: created + would-link
telemetry: created + would-link
watchers: created + would-link
plugin-auth: created + would-link
plugin-sagas: created + would-link
plugin-streams: created + would-link
plugin-triggers: created + would-link
plugin-workers: created + would-link
provisioned 31/31 (created 31, linked 0), failures 0
```
