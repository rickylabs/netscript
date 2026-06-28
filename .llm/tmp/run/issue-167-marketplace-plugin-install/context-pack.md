# Context Pack: Issue #167 marketplace plugin install

## Run Metadata

| Field | Value |
| ----- | ----- |
| Run ID | `issue-167-marketplace-plugin-install` |
| Branch | `feat/plugin-install-jsr-dx` |
| Current phase | `close` |
| Archetype | ARCHETYPE-6 (CLI/tooling) + ARCHETYPE-5 (plugin packages) |
| Scope overlays | service (process spawn + JSR network) |

## Current State

Issue #167 is implemented through S11 and S12 is the closeout slice. The branch now contains the
Deno-native JSR plugin installer foundation: public `plugin add` resolves official bare kinds to
verified `@netscript/plugin-<kind>` JSR packages, validates the package and manifest statically,
classifies trust, confirms third-party installs, runs the plugin's own dx `./scaffold` entrypoint
under the configured Deno permission tier, verifies integrity for JSR sources, and runs declared
post-install scripts after a successful non-dry scaffold.

The pre-merge production boundary is explicit: before alpha.13 is published, validation can exercise
the true userland project shape only with `--local-path <repo>/plugins/<kind>`. The real
`deno x jsr:@netscript/plugin-<kind>/scaffold` leg is post-publish validation owned by
`e2e-cli-prod` after alpha.13.

## Delivered Mechanism

1. **Resolve**: bare official kinds resolve through the D1 alias map to verified
   `@netscript/plugin-<kind>` package identities; scoped specs resolve as explicit third-party JSR
   packages.
2. **Validate JSR**: the CLI reads `meta.json`, `<version>_meta.json`, JSR API metadata, and the
   published `scaffold.plugin.json` without executing plugin code.
3. **Static protocol classify**: `@netscript/plugin/protocol` owns the versioned manifest schema and
   scaffolder context/result contract; manifests are parsed with Zod-backed static validation.
4. **Confirm external**: first-party `@netscript/*` packages are trusted; non-`@netscript` packages
   require confirmation unless explicitly bypassed by `--skip-confirmation` / `--ci`.
5. **Run plugin dx `./scaffold`**: the CLI orchestrates, but each plugin owns its deterministic
   scaffold output. Local-path maintainers run `deno run <plugin>/scaffold.ts`; JSR sources run
   `deno x jsr:<pkg>/scaffold`.
6. **Integrity + post-scripts**: JSR package files are checked against `_meta.json` sha256 values
   before execution; declared post-scripts run only after a successful non-dry scaffold.

## Trust And Permission Tiers

| Tier | Applies to | Execution policy |
| ---- | ---------- | ---------------- |
| First-party trusted | `@netscript/*` | Trusted scaffold execution matching the existing first-party dx trust model; e2e may opt into fresh-alpha dependency age handling. |
| Third-party confined | all other scopes | Confirmation required by default; scaffold runs with `--allow-read=<projectRoot>`, scoped `--allow-write` paths for generated plugin/service/database/Aspire areas, `--deny-net`, and `--deny-run`. |

## Userland No-Leak Guarantee

S11 added `scaffold.userland-install`, which creates a project outside the checkout under
`/tmp/netscript-userland-install-*`, runs the public CLI entrypoint, installs `worker` through an
explicit first-party `--local-path`, and asserts both positive and negative conditions:

- expected artifacts exist: `deno.json`, `plugins/workers/mod.ts`,
  `plugins/workers/scaffold.plugin.json`, `plugins/workers/services/src/main.ts`,
  `plugins/workers/database/schema.prisma`, and `workers/mod.ts`;
- copied source indicators do not exist: `packages/`, `plugins/workers/src`,
  `plugins/workers/scaffold.ts`, `plugins/workers/worker`, `plugins/workers/tests`, monorepo
  absolute paths, `file://` monorepo paths, or local `../packages` imports.

Evidence: `deno task e2e:cli run scaffold.userland-install --cleanup --format pretty` passed
`passed=5 failed=0 skipped=0`, and `deno task e2e:cli run scaffold.runtime --cleanup --format pretty`
remained green at `passed=48 failed=0 skipped=0`.

## Completed

- S1 published the installer protocol from `@netscript/plugin/protocol`.
- S2 added the CLI resolver and static JSR validator.
- S3 added confirmation, trust tiers, and permission flag building.
- S4 added scaffold dispatch, integrity verification, post-scripts, dry-run, and source-mode flags.
- S5 routed plugin add through dx scaffolders and preserved `scaffold.runtime`.
- S6-S10 added package-owned `./scaffold` entrypoints for workers, sagas, triggers, streams, and auth.
- S11 added the true-userland install e2e gate and kept `scaffold.runtime` green.
- S12 recorded deferred backlog debt and closeout context.

## In Progress

- None for #167. The run is complete after this close slice and awaits adversarial review / IMPL-EVAL.

## Next Steps

1. Run independent IMPL-EVAL for PR #168.
2. After alpha.13 publishes, run `e2e-cli-prod` to validate the real prod
   `deno x jsr:@netscript/plugin-<kind>/scaffold` leg.
3. Treat uninstall, marketplace portal/signature curation, package rename, and standalone protocol
   extraction as separate user-gated programs.

## Key Decisions

| Decision | Source | Notes |
| -------- | ------ | ----- |
| D1 keep `@netscript/plugin-<kind>` names | `plan.md` | Bare official kinds resolve through the verified alias map; Option B rename is deferred. |
| D2 first-party trusted / third-party confined | `plan.md`, S3 worklog | First-party matches existing dx trust; third-party gets confirmation and confined permissions. |
| D3 static protocol validation | `plan.md`, S2 worklog | Never execute plugin code to classify a package. |
| D4 plugin owns scaffolding | `plan.md`, S4-S10 worklog | CLI orchestrates; plugin dx entrypoints emit their own artifacts. |
| D5 deterministic append-once artifacts | `plan.md`, S6-S10 worklog | Enables idempotency and future removal. |
| D6 confined matrix | `plan.md`, S3 worklog | Explicit read/write allow-list with deny-net and deny-run defaults for third-party. |
| D7 dry-run + preview | `plan.md`, S4 worklog | Dry-run writes nothing and skips post-scripts. |
| D8 inline versioned manifest | `plan.md`, S1 worklog | Standalone `@netscript/plugin-protocol` remains deferred. |

## Files Changed

This context pack summarizes already-merged implementation slices. S12 itself changes only:

| Path | Status | Notes |
| ---- | ------ | ----- |
| `.llm/tmp/run/issue-167-marketplace-plugin-install/context-pack.md` | new | Close-phase resumable summary. |
| `.llm/tmp/run/issue-167-marketplace-plugin-install/worklog.md` | changed | Close checkpoint and manual consistency validation. |
| `.llm/tmp/run/issue-167-marketplace-plugin-install/commits.md` | changed after commit | S12 commit ledger entry. |
| `.llm/harness/debt/arch-debt.md` | changed | Deferred #167 backlog records. |
| `.llm/harness/lessons/validation.md` | changed | Reusable true-userland e2e fence lesson. |

## Gates

| Gate family | Current status | Evidence |
| ----------- | -------------- | -------- |
| Static | PASS through S11 | Slices S1-S11 recorded focused check/lint/fmt evidence in `worklog.md`. |
| Fitness | PASS through S11 | `arch:check`, JSR audit, doc-lint, publish dry-run, and per-slice doctrine evidence recorded where applicable. |
| Runtime | PASS through S11 | `scaffold.runtime` passed `48/0` after S5 and again after S11. |
| Consumer | PASS through S11 | `scaffold.userland-install` passed `5/0` outside the checkout and proved no source leak. |
| S12 manual | PASS | Commit hashes in this file match `commits.md`; debt entries follow the registry format and are record-only backlog. |

## Open Questions

- None inside #167. The remaining items are explicitly deferred backlog with arch-debt records.

## Drift and Debt

- Drift: S1 placed protocol in `@netscript/plugin/protocol`; S4 uses `deno run` for local-path because
  Deno rejects local files with `deno x`; S5 satisfied `scaffold.runtime` readers with dx-emitted
  artifacts; S11 validates `--local-path` pre-merge and leaves prod JSR validation to post-publish.
- Debt: S12 records deferred uninstall, marketplace portal/signature curation, Option B package
  rename, standalone protocol package extraction, and the post-publish prod-JSR validation boundary.

## Commits

- `2b3ec931`: feat(plugin): publish installer protocol contract
- `79e4cf08668c32f603705cfd913d4e46cf70f4f2`: feat(cli): add plugin JSR resolver validation
- `bde482fd`: feat(cli): add plugin install confirmation gate
- `d20d7118`: feat(cli): run plugin-owned scaffolders
- `719888139c949441852fe26645c68c9cec299161`: feat(plugin-workers): add owned scaffold entrypoint
- `0b795230`: feat(plugin-sagas): add owned scaffold entrypoint
- `7b64e233f7ddc1cad15acfdea08f29f57baadad8`: feat(plugin-triggers): add owned scaffold entrypoint
- `a14708ec`: feat(plugin-streams): add owned scaffold entrypoint
- `4a5988d6`: feat(plugin-auth): add owned scaffold entrypoint
- `b729796723bd93a0ede5b006df2576ce7f9b8aa0`: feat(cli): route plugin add through dx scaffolders
- `8bff51cb363ac7b8b3e50a563802197200209524`: feat(cli): add true userland plugin install e2e
