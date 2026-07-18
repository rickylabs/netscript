# Worklog: G7 #457 native-first thin-client deploy E2E

## Run Metadata

| Field          | Value                                        |
| -------------- | -------------------------------------------- |
| Run ID         | `beta11-cli--orchestrator/slices/g7-457-e2e` |
| Branch         | `feat/desktop-frontend-457-e2e`              |
| Archetype      | `6 — CLI / Tooling`                          |
| Scope overlays | `none`                                       |

## Design

Recorded before any implementation file was created.

### Public Surface

- Built-in suite ID: `DEPLOY.DESKTOP_NATIVE = 'deploy.desktop-native'`.
- Suite factory: `createDesktopNativeDeploySuite(overrides?)` registered through the existing
  built-in suite registry.
- CLI invocation:

  ```text
  deno task e2e:cli run deploy.desktop-native --cleanup --format pretty
  ```

- Platform-aware gate metadata adds optional `platforms` without changing existing gate behavior.
- Existing `GateVerdict.skipped` becomes executable and carries structured `NOT_RUN` evidence.
- No published `@netscript/cli`, SDK, Fresh, Aspire, or plugin export changes.

### Domain Vocabulary

- `ExecutionPlatform` — constant-derived `'linux' | 'windows' | 'darwin'` host axis.
- `PlatformPort` — returns the current execution platform at the runner composition boundary.
- `PlatformApplicability` — supported platform list plus a human/machine-readable reason.
- `NativeDesktopSuiteStatus` — evidence vocabulary `PASS | FAIL | NOT_RUN` (reports retain existing
  `passed | failed | skipped` verdicts).
- `NativeInstallMode` — `isolated-root-dpkg | system-dpkg | msi | dmg | app-bundle`.
- `NativeDesktopFixtureVersion` — `1.0.0` baseline, `2.0.0` healthy update, `3.0.0` failed-launch
  candidate.
- `NativeDesktopEvidence` — installed paths, app version, update-ready mode/version, staged file,
  remote response, failed-launch exit, rollback reason/current version, and cleanup outcome.
- `NativeReleaseFixture` — ephemeral CA, TLS endpoint, Ed25519 keys, channel/target route, sequence,
  signed manifest, and patch paths.
- `RemoteServiceProbe` — response returned through renderer → typed SDK client → Fresh oRPC handler
  → `services__remote__http__0` fetch.

### Ports

- `PlatformPort` — makes applicability testable and keeps `Deno.build` in the system adapter.
- Existing `CommandExecutor` — runs package tools, installed apps, and platform commands with
  timeout/evidence capture.
- Existing `HttpClient` — retains ordinary health probing; native TLS server lifecycle remains an
  adapter-owned process because gates need start/stop state.
- No speculative crypto/updater/installer port: the E2E adapter calls the shipped CLI and OS tools
  as external acceptance boundaries.

### Constants

- `EXECUTION_PLATFORMS` — `LINUX`, `WINDOWS`, `DARWIN`.
- `NATIVE_DESKTOP_SUITE_STATUSES` — `PASS`, `FAIL`, `NOT_RUN`.
- `NATIVE_INSTALL_MODES` — isolated/system dpkg, MSI, DMG, app bundle.
- `DEPLOY.DESKTOP_NATIVE` and `DEPLOY_TITLE.DESKTOP_NATIVE`.
- Native gate IDs:
  - `deploy.desktop.preflight`
  - `deploy.desktop.fixture`
  - `deploy.desktop.package`
  - `deploy.desktop.install`
  - `deploy.desktop.remote-services`
  - `deploy.desktop.update-apply`
  - `deploy.desktop.rollback`
  - `deploy.desktop.windows-manual`
  - `deploy.desktop.cleanup`
- Fixture identity/version/channel constants: `netscript-desktop-e2e`, `1.0.0`, `2.0.0`, `3.0.0`,
  `stable`.

### Commit Slices

| # | Slice                                                                  | Gate                                                                | Files                                                                                                                                                                                                                    |
| - | ---------------------------------------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1 | Truthful platform applicability + `deploy.desktop-native` contract     | Full `packages/cli/e2e/tests/`; scoped check/lint/fmt               | `packages/cli/e2e/src/domain/{cli-surface,gate-definition,platform}.ts`, `src/ports/platform.ts`, `src/adapters/platform/deno-platform.ts`, runner/default composition, suite registry/skeleton, tests, nested artifacts |
| 2 | Common signed fixture + real window/oRPC/remote-service path           | Full E2E tests; fixture contract tests; quality/arch                | `packages/cli/e2e/fixtures/desktop-native/**`, `src/adapters/native-desktop/common/**`, deploy suite gates/tests, nested artifacts                                                                                       |
| 3 | Linux native `.deb` install/apply/failed-launch rollback + blocking CI | Actual one-pass native suite on WSL; full E2E tests; quality/arch   | Linux adapter/bad-runtime fixture/cleanup, `.github/workflows/e2e-cli.yml`, README, nested artifacts                                                                                                                     |
| 4 | Windows MSI staged/manual + macOS best-effort runners and docs         | Full E2E tests; platform construction tests; WSL `NOT_RUN` evidence | Windows/macOS adapters, optional macOS CI job, README, nested artifacts                                                                                                                                                  |

### Deferred Scope

- Windows automatic apply/rollback — upstream unsupported; manual path is authoritative.
- Actual Windows result — owner-hosted execution, `NOT_RUN` here.
- Actual macOS result — best-effort host/CI execution, `NOT_RUN` here until run.
- Graph-mode/snapshot updater — beta.14 / SD-8.
- Production publishing/signing/notarization/CDN — release scope, owner-gated.
- Systemd debt closure — this suite does not claim it without its exact closing gate.

### Contributor Path

Start at `suites/deploy/desktop-native-suite.ts` to see the declarative ordered gates. Follow one
gate into `src/adapters/native-desktop/` for the common driver and then the OS-named adapter. Add a
platform by extending `EXECUTION_PLATFORMS`, implementing one adapter behind the common evidence
contract, registering its platform-limited gate, adding command-construction/full-runner tests, and
documenting whether the leg is blocking or `NOT_RUN`. Do not add shell logic to the suite registry.

## Progress Log

| Time                  | Slice     | Step              | Notes                                                                                                                                                                                                      |
| --------------------- | --------- | ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-07-18 02:11 CEST | plan      | research complete | Re-baselined exact integration SHA; read live #457/#393/#394 and landed G2/G3/G4/G6 contracts.                                                                                                             |
| 2026-07-18 02:11 CEST | plan      | baseline test     | Full CLI-E2E tests: 45 passed, 0 failed.                                                                                                                                                                   |
| 2026-07-18 02:11 CEST | plan      | Design checkpoint | Public surface, vocabulary, ports, constants, four commit slices, deferred scope, and contributor path locked.                                                                                             |
| 2026-07-18 02:11 CEST | plan      | hard stop         | No implementation before separate-session group PLAN-EVAL `PASS`.                                                                                                                                          |
| 2026-07-18            | plan-eval | PASS              | Tier-A group verdict approved D1–D19 as locked; `plan-eval.md` records the supplied verdict and stop lines.                                                                                                |
| 2026-07-18            | 1         | implementation    | Added injected platform detection, gate applicability, structured `NOT_RUN`, the registered `deploy.desktop-native` contract, and an honest fixture preflight that remains red until S2 lands the fixture. |
| 2026-07-18            | 1         | reconcile         | #457 remains partial/open; this slice uses `Refs #457`, does not claim `gate:e2e`, and makes no issue/milestone/status closure. No new owner/evaluator comment changed the locked scope.                   |
| 2026-07-18            | 1         | Tier-A review     | User supplied substantive `PASS` and sign-off for commit `4ccfac47`; authorized proceeding to S2.                                                                                                          |
| 2026-07-18            | 2         | implementation    | Added the versioned native fixture, typed runtime/renderer RPC path, exact remote discovery key, renderer evidence acknowledgement, browser bundle proof, and #456-compatible ephemeral signing material.  |
| 2026-07-18            | 2         | reconcile         | Portable fixture/consumer proof is green, but is not called a native-window run. Linux native install/update/rollback remains `NOT_RUN` until S3 executes it on this host.                                 |
| 2026-07-18            | 2         | Tier-A review     | User supplied `PASS` for `097327b1`, authorized S3, and required the real Linux outcome even if failing.                                                                                                    |
| 2026-07-18            | 3         | implementation    | Added CLI `.deb` packaging, alternate-root `dpkg`, ephemeral CA/server TLS, #456 signed release serving, native launches, apply/rollback assertions, fail-closed platform legs, blocking CI, and owner invocations. |
| 2026-07-18            | 3         | real Linux gate   | Exact one-pass suite exited 1: preflight and fixture passed; installed v1 fetched the signed v2 manifest, then #841 verification failed because packaged runtime op `op_desktop_verify_ed25519` was unavailable. Structured `FAIL` retained in `.llm/tmp/desktop-native-e2e/evidence.json`. |
| 2026-07-18            | 3         | platform honesty  | Windows MSI/manual and macOS best-effort legs are `NOT_RUN`; host-applicable pending legs fail closed and README records native owner invocations. No green claim was made.                               |
| 2026-07-18            | CI follow-up | policy + scaffold fix | Made only the Linux CI job non-blocking pending the recorded upstream op gap, added a loud structured-evidence summary/flip-back link, and fixed the fixture's standalone oRPC import that broke generated scaffold checks. |

## Decisions

| Decision                           | Reason                                                                             | Source                         |
| ---------------------------------- | ---------------------------------------------------------------------------------- | ------------------------------ |
| Option A governs                   | Latest owner-ratified amendment supersedes earlier graph/apply-on-Windows framing. | live #457                      |
| Unavailable platform = `NOT_RUN`   | Prevents exit-zero placeholders and false e2e claims.                              | #393/#394 pattern + user brief |
| Bad native runtime, not JS throw   | Deno confirms an update during desktop initialization before user code.            | upstream `desktop.rs`          |
| Local TLS with `DENO_CERT`         | Native updater rejects HTTP; no insecure bypass.                                   | Deno docs/source               |
| No direct updater calls in fixture | #841 is the sole consumer seam.                                                    | G2 plan/eval                   |

## Drift

| Drift                                                                                  | Severity    | Logged in drift.md |
| -------------------------------------------------------------------------------------- | ----------- | ------------------ |
| Older graph/snapshot authority superseded by Option A for window-only beta.11          | significant | yes                |
| Agentic runtime controller exposes no managed session identity for this current thread | minor       | yes                |

## Gate Results

### Static Gates

| Gate                    | Command or check                                         | Result  | Notes                                                                                   |
| ----------------------- | -------------------------------------------------------- | ------- | --------------------------------------------------------------------------------------- |
| Branch baseline         | raw git SHA/merge-base/status                            | PASS    | HEAD = integration = merge-base `1709dcba`; clean.                                      |
| Full baseline E2E tests | `deno test --allow-all packages/cli/e2e/tests/`          | PASS    | 45 passed, 0 failed.                                                                    |
| Plan-Gate               | separate-session evaluator                               | NOT_RUN | Hard stop; supervisor must dispatch.                                                    |
| Plan-Gate               | Tier-A group evaluator                                   | PASS    | D1–D19 approved as locked; implementation authorized in slice order.                    |
| Full CLI-E2E unit tests | `deno test --allow-all packages/cli/e2e/tests/`          | PASS    | 47 passed, 0 failed.                                                                    |
| Scoped check            | `run-deno-check.ts --root packages/cli/e2e --ext ts,tsx` | PASS    | 93 files; 0 findings.                                                                   |
| Scoped lint             | `run-deno-lint.ts --root packages/cli/e2e --ext ts,tsx`  | PASS    | 93 files; 0 findings.                                                                   |
| Scoped format           | `run-deno-fmt.ts --root packages/cli/e2e --ext ts,tsx`   | PASS    | 93 files; 0 findings.                                                                   |
| S2 full CLI-E2E tests   | `deno test --allow-all packages/cli/e2e/tests/`          | PASS    | 47 passed, 0 failed.                                                                    |
| S2 fixture tests        | fixture `deno task test`                                 | PASS    | 4 passed, 0 failed; remote RPC, production signing, browser bundle, package forwarding. |
| S2 scoped check         | `run-deno-check.ts --root packages/cli/e2e --ext ts,tsx` | PASS    | 100 files; 0 findings.                                                                  |
| S2 scoped lint          | `run-deno-lint.ts --root packages/cli/e2e --ext ts,tsx`  | PASS    | 100 files; 0 findings.                                                                  |
| S2 scoped format        | `run-deno-fmt.ts --root packages/cli/e2e --ext ts,tsx`   | PASS    | 100 files; 0 findings.                                                                  |
| S3 full CLI-E2E tests   | `deno test --allow-all packages/cli/e2e/tests/`          | PASS    | 47 passed, 0 failed.                                                                    |
| S3 fixture tests        | fixture `deno task test`                                 | PASS    | 4 passed, 0 failed.                                                                     |
| S3 scoped check/lint/fmt| scoped wrappers                                           | PASS    | 104 files; 0 findings after reconciliation.                                              |

### Fitness Gates

| Gate                    | Result             | Evidence                                                | Notes                                                                                                                                        |
| ----------------------- | ------------------ | ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| JSR rubric              | N/A                | `publish:false`, `deno doc` scan                        | Rescope if published surface changes.                                                                                                        |
| quality/architecture    | NOT_RUN            | planned commands in `plan.md`                           | Implementation gates, not plan-generation evidence.                                                                                          |
| Repository quality gate | BASELINE_FAIL      | `deno task quality:gate`                                | `quality:scan` passed; `arch:check` stopped at pre-existing `@netscript/sdk` range divergence between CLI and Fresh. No slice-owned finding. |
| Focused doctrine        | PASS_WITH_WARNINGS | `check-doctrine.ts --root packages/cli/e2e`             | FAIL=0, WARN=8, INFO=1; all warnings are pre-existing paths/README debt.                                                                     |
| Doc lint                | BASELINE_FAIL      | `deno task doc:lint --root packages/cli/e2e --pretty`   | 83 existing surface errors. Added `PlatformPort.current()` JSDoc; no new missing-doc error remains.                                          |
| S2 quality scan         | PASS               | root `quality:scan` + focused `--root packages/cli/e2e` | No findings; focused allow count 0.                                                                                                          |
| S2 architecture         | BASELINE_FAIL      | `deno task arch:check`                                  | Stops at pre-existing CLI/Fresh `@netscript/sdk` range divergence; focused doctrine is FAIL=0, WARN=8, INFO=1 with pre-existing findings.    |
| S3 quality scan         | PASS               | root + focused scan                                     | No findings; focused allow count 0.                                                                                                          |
| S3 architecture         | BASELINE_FAIL      | `deno task arch:check`                                  | Same pre-existing CLI/Fresh `@netscript/sdk` range divergence. Focused doctrine: FAIL=0.                                                       |

### Runtime Gates

| Gate                        | Result        | Evidence                                                                | Notes                                                                                                               |
| --------------------------- | ------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Linux native apply/rollback | NOT_RUN       | no implementation before Plan-Gate                                      | Expected to run on this native WSL host after PASS.                                                                 |
| S1 suite preflight          | EXPECTED_FAIL | `deno task e2e:cli run deploy.desktop-native --cleanup --format pretty` | Exit 1 at `deploy.desktop.preflight`: S2 fixture is intentionally absent; the skeleton cannot report a false green. |
| S2 fixture suite            | PASS          | same one-pass suite command                                             | Exit 0; preflight and portable fixture contract passed 2/2. Native Linux gates do not exist until S3.               |
| Windows MSI staged/manual   | NOT_RUN       | owner-hosted                                                            | Code/docs only in this environment.                                                                                 |
| macOS native apply/rollback | NOT_RUN       | no macOS host                                                           | Best effort.                                                                                                        |
| S3 Linux native suite       | FAIL          | exact one-pass suite; structured evidence                               | Package/dpkg/TLS fetch succeeded; missing `op_desktop_verify_ed25519` stopped staging, so apply/rollback did not run.                         |

### Consumer Gates

| Consumer                                   | Result  | Evidence                  | Notes                                                                                                          |
| ------------------------------------------ | ------- | ------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Portable renderer remote-services contract | PASS    | fixture test + suite gate | Real HTTP response crossed #842 Fresh/SDK RPC using `services__remote__http__0` and was renderer-acknowledged. |
| Native window remote-services path         | NOT_RUN | S3 real host run          | Do not upgrade the portable contract result into a native-window claim.                                        |

## Handoff Notes

- Tier-A should verify the fixture uses only the #841 updater seam and #842 public RPC surfaces, the
  exact discovery key, a renderer acknowledgement rather than a server-only fetch, and the
  production #456 PKCS8/signing functions.
- S3 must replace the remaining native-window/Linux `NOT_RUN` with the actual host result, whether
  PASS or FAIL; S2 evidence cannot satisfy that gate.
