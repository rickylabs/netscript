# Worklog: G2 #841 SDK auto-update

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `beta11-cli--orchestrator/slices/g2-841-autoupdate` |
| Branch | `feat/desktop-frontend-841-autoupdate` |
| Draft PR | [#849](https://github.com/rickylabs/netscript/pull/849) → `feat/desktop-frontend` |
| Archetype | `4 — Public DSL / Builder` plus integration/runtime subtype gates |
| Scope overlays | none |

## Design

### Public Surface

- Export map: `@netscript/sdk/auto-update` → `packages/sdk/src/auto-update/mod.ts`.
- `createReleaseClient(config: AutoUpdateReleaseConfig): ReleaseClient` — validates pinned release
  config and resolves the per-channel/per-target URLs.
- `startAutoUpdate(options: StartAutoUpdateOptions): AutoUpdateStartResult` — the only function
  that touches the native updater on behalf of applications.
- Caller shape fixed before implementation:

  ```ts
  import { startAutoUpdate } from '@netscript/sdk/auto-update';

  const result = startAutoUpdate({
    release: {
      baseUrl: 'https://releases.example.com/my-app',
      channel: 'stable',
      publicKey: '<base64-ed25519-public-key>',
      manualUpdateUrl: 'https://example.com/downloads/my-app',
    },
    policy: { checkOnLaunch: true, intervalMs: 60 * 60 * 1000 },
    onUpdateReady(event) {
      if (event.applyMode === 'manual') {
        showManualUpdate(event.manualUpdateUrl);
      }
    },
  });
  ```

### Domain Vocabulary

- `AutoUpdateReleaseConfig` — compiled app trust/config input: base URL, channel, public key, manual
  installer URL.
- `ReleaseTarget` — `Deno.build.os` and `Deno.build.arch` rendered as `<os>-<arch>`.
- `ReleaseClient` — immutable resolved release descriptor consumed by the updater adapter.
- `AutoUpdatePolicy` — launch-enabled optional recurrence or launch-disabled required recurrence.
- `AutoUpdateReadyEvent` — discriminated automatic-relaunch versus manual-installer event.
- `AutoUpdateRollbackEvent` — structured native rollback reason and current app version.
- `AutoUpdateStartResult` — discriminated `started`, `scheduled`, or `disabled` outcome.
- `DesktopRuntimeGeneration` — internal `legacy` versus `namespaced` provenance used only in tests
  and diagnostics, not as consumer branching API.

### Ports

- `DenoAutoUpdateRuntime` (internal) — minimal callable/version structure resolved from old or new
  Deno globals; it exists because upstream is moving and unit tests must replace it.
- `RollbackTelemetryPort` (internal) — one `reportRollback(event)` behavior, implemented with
  `@netscript/telemetry/tracer` and replaced by a recording fake in tests.
- `AutoUpdateScheduler` (internal) — one delayed-start behavior for the interval-only policy;
  isolates `setTimeout` in tests without inventing a general clock framework.

No public port or adapter type is exported. Consumers depend on NetScript events/options only.

### Constants

- `DEFAULT_RELEASE_CHANNEL` — `'stable'`.
- `AUTO_UPDATE_APPLY_MODES` — `automatic`, `manual`.
- `AUTO_UPDATE_START_STATUSES` — `started`, `scheduled`, `disabled`.
- `AUTO_UPDATE_DISABLED_REASONS` — `not-desktop`, `missing-version`, `missing-updater` as needed by
  the structural resolver result.
- `AUTO_UPDATE_TELEMETRY_NAMES` — tracer/span/event names for rollback.
- `NATIVE_AUTO_APPLY_SUPPORT` (internal) — darwin/linux true, windows false until #35269 ships.

### Commit Slices

| # | Slice | Gate | Files |
| --- | --- | --- | --- |
| 1 | Prove the public release contract and per-channel/per-arch URL resolver, including HTTPS/trust validation and a documented subpath. | Release-client unit test; scoped check/lint/fmt; focused `quality:scan`; `arch:check:repo --root packages/sdk`; root `arch:check`. | `packages/sdk/src/auto-update/domain/constants.ts`, `packages/sdk/src/auto-update/domain/types.ts`, `packages/sdk/src/auto-update/application/release-client.ts`, the build-target portion of `packages/sdk/src/auto-update/adapters/deno-auto-update-adapter.ts`, `packages/sdk/src/auto-update/mod.ts`, `packages/sdk/mod.ts` documentation only, `packages/sdk/deno.json`, `packages/sdk/tests/auto-update/release-client_test.ts`, SDK README module mention, nested run artifacts |
| 2 | Prove the upstream-churn seam, policy scheduling, plain-run no-op, Windows staged/manual event, automatic event, public-key forwarding, and rollback telemetry ordering. | Focused wrapper unit test; SDK test set; scoped check/lint/fmt; focused quality/doctrine; root `arch:check`. | `packages/sdk/src/auto-update/application/start-auto-update.ts`, extend `packages/sdk/src/auto-update/adapters/deno-auto-update-adapter.ts` with old/new updater resolution, `packages/sdk/src/auto-update/adapters/netscript-rollback-telemetry.ts`, `packages/sdk/src/auto-update/mod.ts`, `packages/sdk/tests/auto-update/start-auto-update_test.ts`, nested run artifacts (+ `drift.md` only if facts change) |
| 3 | Prove the published consumer surface: public-subpath compile, README example, zero new doc diagnostics, clean publish list/slow types, and no text imports. | Consumer scoped check; README doctest; full SDK tests; doc lint; JSR audit helper; raw package dry-run; release preflight; scoped wrappers; quality/doctrine; root `arch:check`. | `packages/sdk/README.md`, `packages/sdk/tests/readme-doctest_test.ts`, `packages/sdk/tests/type-fixtures/auto-update-consumer_type.ts`, any doc-only refinements to `packages/sdk/src/auto-update/mod.ts`, nested `worklog.md` + `context-pack.md` |

All implementation slices are <30, ordered contract-first, and include run-artifact reconciliation.
Each slice is commit → explicit-refspec push → PR phase comment → worklog/context update; the
supervisor performs the substantive review/sign-off gate.

### Deferred Scope

- Actual platform apply/failed-launch rollback E2E — #457 owns it.
- Release server, patch, installer, and URL hosting — #456 owns it.
- Manual update UI component — #843 owns it and consumes the typed event.
- Combined artifact update transaction — #834/#825.
- Additional named channels/rings — stable follow-up after policy ratification.

### Contributor Path

Open `packages/sdk/src/auto-update/mod.ts` for the consumer contract. Follow
`application/start-auto-update.ts` for policy orchestration, then the two named adapters for the
moving Deno runtime and NetScript telemetry. To adopt a future upstream namespace or enable Windows
native apply, change the single adapter/capability constant and extend its fixture matrix; consumer
code and release config do not change.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-07-17 23:46 CEST | plan | nested run activated | Required skills/run-loop/doctrine/gates read; branch confirmed exactly at integration baseline. |
| 2026-07-17 23:55 CEST | plan | research and design checkpoint | Live issues/RFC/upstream state re-baselined; public contract, files, slices, and gates locked. No implementation created. |
| 2026-07-18 00:03 CEST | plan | supervisor handoff prepared | Plan-only commit `c7e61dcc` pushed; draft PR #849 opened against integration with required labels and milestone 13. Readiness comment follows the final metadata commit. |
| 2026-07-18 00:12 CEST | 1 | release contract and URL seam complete | Plan-Gate PASS recorded; literal `linux-x86_64` and `darwin-aarch64` URLs pinned; HTTPS/key validation and executable-source global-isolation proof pass. |
| 2026-07-18 00:21 CEST | 2 | native runtime orchestration complete | S1 Tier-A review PASS recorded. Old/proposed namespace resolution, launch/interval policy, Windows manual event, and telemetry-first rollback are implemented; full SDK tests pass. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| Native Option A supersedes rev 10 for thin clients | Owner-ratified live issue/RFC state is newer; snapshot updater is beta.14. | #840/#841, PR #822 OF-L |
| Dedicated subpath, not root re-export | Enforces one seam while preserving root surface size. | plan D1, doctrine A1/A2/F-5 |
| Trusted manual URL from app config | Windows UX needs a safe link without parsing unsigned manifest extensions. | plan D3/D8 |
| Support both `desktopVersion` and `desktop.appVersion` | Upstream proposal renames as well as nests the property. | denoland/deno#35939 |
| No native E2E here | #457 owns real apply/rollback and Windows manual-flow proof. | issue #841 acceptance and user brief |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| Rev 10 updater authority superseded by owner Option A | significant | yes |
| Proposed upstream namespace renames version property to `appVersion` | significant | yes |
| Local Deno is 2.9.3 while the toolchain skill still states 2.9.0 | minor | yes |
| Deno adapter build-target shell moved from slice 2 to slice 1 per Plan-Gate isolation note | minor | yes |

## Gate Results

### Static Gates

| Gate | Command or check | Result | Notes |
| --- | --- | --- | --- |
| Baseline package dry-run | `deno publish --dry-run --allow-dirty` in `packages/sdk` | PASS | Exit 0; no actual slow-type warning. |
| Baseline full-export doc lint | `deno task doc:lint --root packages/sdk --pretty` | BASELINE | One unrelated transitive private ref; zero missing JSDoc. |
| Slice 1 unit | `deno test --allow-all packages/sdk/tests/auto-update/release-client_test.ts` | PASS | 4 passed; two literal target URLs, trust validation, and source-isolation proof. |
| Slice 1 scoped check | `.llm/tools/run-deno-check.ts --root packages/sdk --ext ts --pretty` | PASS | 62 files, 0 diagnostics; wrapper supplied `--unstable-kv`. |
| Slice 1 scoped lint | `.llm/tools/run-deno-lint.ts --root packages/sdk --ext ts --pretty` | PASS | 62 files, 0 findings. |
| Slice 1 scoped format | `.llm/tools/run-deno-fmt.ts --root packages/sdk --ext ts --pretty` | PASS | 62 files, 0 findings. |
| Slice 1 entrypoint doc lint | `deno doc --lint packages/sdk/src/auto-update/mod.ts` | PASS | 0 diagnostics after exporting the constant-derived target vocabularies. |
| Slice 2 focused unit | `deno test --allow-all packages/sdk/tests/auto-update/start-auto-update_test.ts packages/sdk/tests/auto-update/release-client_test.ts` | PASS | 11 passed; old/proposed/fallback/no-op/policy/Windows/rollback matrix. |
| Slice 2 full SDK tests | `deno test --allow-all packages/sdk/tests/` | PASS | 28 passed, 0 failed; complete directory run per G4 CI lesson. |
| Slice 2 scoped check | `.llm/tools/run-deno-check.ts --root packages/sdk --ext ts --pretty` | PASS | 65 files, 0 diagnostics; wrapper supplied `--unstable-kv`. |
| Slice 2 scoped lint | `.llm/tools/run-deno-lint.ts --root packages/sdk --ext ts --pretty` | PASS | 65 files, 0 findings. |
| Slice 2 scoped format | `.llm/tools/run-deno-fmt.ts --root packages/sdk --ext ts --pretty` | PASS | 65 files, 0 findings. |
| Slice 2 entrypoint doc lint | `deno doc --lint packages/sdk/src/auto-update/mod.ts` | PASS | 0 diagnostics across the expanded public surface. |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| JSR baseline | PASS_WITH_BASELINE | research.md surface scan | New subpath must be independently clean. |
| Slice 1 quality scan | PASS | `deno task quality:scan --root packages/sdk` | No findings; one unrelated pre-existing test allowance. |
| Slice 1 focused doctrine | PASS_WITH_BASELINE | `deno task arch:check:repo --root packages/sdk` | FAIL=0; existing README/A9 advisories only. |
| Slice 1 root architecture | PASS_WITH_BASELINE | `deno task arch:check` | Exit 0; repository-wide pre-existing warnings only. |
| Slice 2 quality scan | PASS | `deno task quality:scan --root packages/sdk` | No findings; one unrelated pre-existing test allowance. |
| Slice 2 focused doctrine | PASS_WITH_BASELINE | `deno task arch:check:repo --root packages/sdk` | FAIL=0; existing README/A9 advisories only. |
| Slice 2 root architecture | PASS_WITH_BASELINE | `deno task arch:check` | Exit 0; repository-wide pre-existing warnings only. |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Plain-run structural probe | PASS | Deno 2.9.3 reported no desktop properties | Confirms missing-property path must no-op. |
| Wrapper behavior | PASS | `start-auto-update_test.ts` + full SDK directory run | Plain-run no-op, namespace matrix, scheduling, manual/automatic events, and telemetry ordering pass. |
| Real native apply/rollback | N/A | #457 | Explicitly outside this run. |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| --- | --- | --- | --- |
| `@netscript/sdk/auto-update` fixture | NOT_RUN | planned slice 3 | Awaiting implementation. |

## Handoff Notes

- PLAN-EVAL should inspect D3/D5/D6/D8 first: trust inputs, interval-only semantics, and Windows
  truthfulness are the load-bearing design decisions.
- Confirm the evaluator accepts Archetype 4 with A2/A3 subtype gates rather than a package-wide
  reclassification.
- Draft PR #849 opened with `type:feat`, `area:sdk`, `wave:v1`, `priority:p1`, `status:plan`,
  milestone `0.0.1-beta.11`, and a closing keyword only for #841.
- PR #849 now carries the sole lifecycle label `status:impl`; milestone and closing keyword are
  unchanged.
- Slice 1 initially found a comment-only false positive in the isolation assertion and private type
  references in doc lint. The final test strips comments before scanning executable source, and the
  target constants are public alongside their derived unions; both gates now pass.
- Reconcile note: #841 remains open and correctly owned by draft PR #849; #457 remains the E2E
  owner; no new PR comment changed scope. Stop for Tier-A substantive slice review before slice 2.
- S1 Tier-A review: `PASS` with sign-off for `d2321cae`; D1/D4, adapter isolation, HTTPS
  validation, and tuple constants explicitly accepted.
- S2 reconcile note: #841 remains open with PR #849 as its only closing PR; milestone 13 and
  `status:impl` remain correct; #457 still owns native E2E. Stop for Tier-A review before slice 3.
