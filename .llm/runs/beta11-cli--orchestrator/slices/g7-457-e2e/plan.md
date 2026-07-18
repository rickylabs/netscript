# Plan: issue #457 native-first thin-client deploy E2E

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `beta11-cli--orchestrator/slices/g7-457-e2e` |
| Branch | `feat/desktop-frontend-457-e2e` |
| Phase | `plan` |
| Target | `packages/cli/e2e` deploy harness + native desktop fixture + CI invocation |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | `none` (the fixture opens a window, but this slice does not design user-facing UI) |

## Archetype

Archetype 6 is the smallest applicable profile: this is a user-run E2E CLI suite and external
process/install/runtime orchestration. It does not create a deployment adapter or new product
target, so composite Archetype 7 is reviewed as a consumed contract, not selected as the package
shape. All platform/process/TLS effects stay in E2E adapters; the suite definition stays
declarative.

## Current Doctrine Verdict

`@netscript/cli` is **Restructure** (“apply Archetype-6 layout”), but the owned
`@netscript/cli-e2e` package already declares Archetype 6 and has a layered domain/application/
ports/adapters shape. This slice must not deepen CLI debt, add inline effectful scripts to suite
composition, or change published CLI surfaces.

Relevant debt:

- `cli-deploy-linux-integration-untested` remains open unless the gate actually exercises the
  systemd lifecycle named by that entry. This desktop package gate does not claim to close it.
- `cli-deploy-artifacts-missing` and `DEPLOY-S7-APPHOST-COMPOSE-GEN` are unrelated container/
  orchestrator debt and remain untouched.
- `cli-maintainer-sync-isolated-declarations` is unrelated and must not change.

## Axioms in Play

| Axiom | Why it matters |
| --- | --- |
| A1 | Platform/result vocabulary and suite IDs are locked before implementation. |
| A6 | Reuse `dpkg`, `msiexec`, `hdiutil`, WebCrypto/OpenSSL certificate generation, external `bsdiff`, #456 release preparation, and Deno’s updater; do not reimplement them. |
| A7 | Use `fetch`, `URL`, `Deno.Command`, `Deno.serve`, and `@std/path` at adapters/edges. |
| A8 | Separate declarative suite, platform runner, fixture application, and tests by concern. |
| A10 | Construct platform/command/http dependencies in `createDefaultRunner`; no global service locator. |
| A11 | The extension axes are named: execution platform and native install mode. |
| A13 | Native launch, timeout, cleanup, and rollback failure boundaries emit classified evidence. |
| A14 | The real Linux suite and explicit `NOT_RUN` platform legs are the acceptance fitness function. |

## Goal

Extend the deploy E2E harness with a native-first `deploy.desktop-native` suite that installs a
real native desktop package, proves signed native update apply and failed-launch rollback on Linux,
proves a renderer-visible remote-services round trip, supplies honest owner-runnable Windows
staging/manual-update proof, supplies best-effort macOS code, and never converts an unavailable leg
into a green claim.

## Scope

- Add runner-level platform applicability with structured skip reasons.
- Add stable suite/gate/platform/install-mode vocabulary for native desktop E2E.
- Add a minimal versioned desktop fixture that consumes:
  - #452’s `desktop:package` / enabled desktop config and `services__*` convention;
  - #841’s `startAutoUpdate` public seam;
  - #842’s Fresh runtime binding plus typed SDK desktop client;
  - #456’s package, signed release preparation, and release handler/server.
- Add common native orchestration for certificates, signed releases, process evidence, timeouts,
  cleanup, and versioned fixture state.
- Linux: build `.deb`, install with real `dpkg`, launch installed app, prove remote window RPC,
  stage/apply v2, stage a non-loadable v3 runtime, prove failed launch and v2 rollback.
- Windows: build/install MSI, prove signed staging, `applyMode: manual`, trusted manual URL, and
  staged file; document elevated owner-host invocation; do not claim execution here.
- macOS: build/mount/install `.dmg` or `.app`, reuse automatic apply/rollback proof where host
  prerequisites exist; non-blocking best-effort CI; do not claim execution here.
- Add blocking Linux CI invocation and best-effort macOS invocation with uploaded reports.
- Document exact local/CI/Windows/macOS commands and status semantics.

## Non-Scope

- Graph-mode/snapshot/bootstrap/current-link update machinery (SD-8 / beta.14).
- Product changes to Deno, `@netscript/sdk/auto-update`, Fresh desktop bindings, generator output,
  packaging commands, signing policy, or the release handler unless an independently proven defect
  forces a rescope.
- Production release infrastructure, CDN, real signing identities, notarization, Authenticode,
  public keys outside ephemeral fixtures, release publication, tags, canaries, or JSR publishing.
- Windows automatic apply/rollback; upstream explicitly does not support it.
- Checking the issue’s `gate:e2e` box, changing `Refs #457` to a closing keyword, merging, or closing
  milestone 13 before evidence and owner/supervisor gates permit it.
- Claiming closure of `cli-deploy-linux-integration-untested` unless its exact systemd gate is run.

## Hidden Scope

- Local HTTPS and a fixture CA are mandatory because Deno refuses plaintext update URLs.
- Update proof needs two transitions: healthy v1→v2 apply, then v2→bad-v3 failed launch→v2 rollback.
- User-code failure is too late to prove launcher rollback; failure must precede Deno’s confirmation
  op.
- Alternate-root `dpkg` needs its own admin database/status file, installed-file verification, and
  launcher resolution without pretending to mutate `/usr`.
- Native processes/windows need deterministic evidence files, timeouts, and cleanup even when the
  assertion fails.
- The runner requires an injected platform port so domain/application code does not call
  `Deno.build` directly.
- CI path filters must actually schedule the Linux job for every file the suite depends on.

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| D1 | Add sibling suite ID `deploy.desktop-native`; keep `deploy.targets` unchanged. | Heavy native acceptance must not make the cheap credential-free router smoke platform-dependent. |
| D2 | Gate applicability is `platforms?: readonly ExecutionPlatform[]` on gate metadata, evaluated by an injected `PlatformPort`. | Reuses the existing `skipped` verdict honestly and keeps `Deno.build` at an adapter edge. |
| D3 | Every skipped platform gate includes evidence `{status:'NOT_RUN', platform, supportedPlatforms, reason}`. | A zero exit or empty step is false green; report consumers need a machine-readable reason. |
| D4 | The public command is `deno task e2e:cli run deploy.desktop-native --cleanup --format pretty`. | Fits the existing suite registry and one-pass command contract. |
| D5 | The fixture is minimal, versioned, and owned by `packages/cli/e2e/fixtures/desktop-native`; runtime drivers live under `src/adapters/native-desktop/`. | Fixture data and platform effects remain distinct and predictable. |
| D6 | Fixture packaging is invoked through `netscript deploy desktop package`, with `PackageTaskName: desktop:package`; no direct production bypass. | Consumes #452 and #456 at their public CLI boundary. |
| D7 | Fixture auto-update uses only `@netscript/sdk/auto-update`; no direct `Deno.autoUpdate`, manifest fetch, signature check, or patch application in fixture code. | Preserves #841 as sole consumer seam and Deno as native effect authority. |
| D8 | The window data-plane uses `bindDesktopRpcWindow` and `createDesktopServiceClient` over a small oRPC contract. | Consumes both #842 public layers and proves a real renderer/window round trip. |
| D9 | Remote discovery input is the exact `services__remote__http__0` environment key; its value points to a suite-owned HTTP service on a non-loopback-configured URL string where the host permits it. | Tests the generator’s server-side convention, not Vite aliases or a hand-named env var. |
| D10 | The renderer writes the terminal remote-response marker through an RPC procedure/binding acknowledgement, and the driver validates response body + window ID + version. | Deno-side fetch alone would not prove the window consumed the result. |
| D11 | Use a generated ephemeral CA and TLS server that delegates requests to the #456 release handler; pass `DENO_CERT` to the installed app. | Keeps HTTPS and signature verification intact without production infrastructure. |
| D12 | Use ephemeral Ed25519 keys and the #456 release prepare path with external `bsdiff`; the suite only preflights tools and never auto-installs them. | Wraps upstream tooling and avoids hidden network/package-manager mutations. |
| D13 | Linux install uses `dpkg --install`; local no-root mode uses suite-owned `--root/--admindir/--instdir --force-not-root`, while privileged CI may use a suite-owned system install name and always uninstalls in cleanup. | Both are real package-manager transactions, with evidence clearly naming the mode. |
| D14 | Healthy v1 and v2 packages use the same app identity and distinct baked versions. | Deno’s updater compares baked versions and the launcher must update one installed identity. |
| D15 | v1 stages v2; relaunch must report v2 before any rollback scenario starts. | Separates apply proof from rollback proof. |
| D16 | The bad v3 patch target is a checked suite fixture derived from a valid native executable but unusable as the runtime shared library. | It passes the native-file shape boundary yet fails before `op_desktop_confirm_update`; a JS throw cannot. |
| D17 | After the bad update: one launch must fail/nonzero without a success sentinel; the following launch must run v2 and emit `onRollback` evidence. | Mirrors Deno’s documented launcher state machine exactly. |
| D18 | Windows verifies MSI install, update-ready `manual`, exact manual URL, and `.update` staging; it does not relaunch expecting v2. | Matches upstream platform support and the Option-A owner lock. |
| D19 | macOS reuses automatic apply/rollback logic but is non-blocking best effort until a host run is green; unavailable legs remain `NOT_RUN`. | Preserves runnable coverage without inventing evidence from WSL. |
| D20 | Linux CI is blocking and uploads the structured report/logs; macOS CI is explicit `continue-on-error`; Windows is documented owner-host execution, not CI-owned by this agent. | Matches the requested ownership and honesty split. |
| D21 | Cleanup is idempotent and suite-scoped: stop only recorded PIDs/units, unmount only the fixture DMG, uninstall only the fixture package/product code, and delete only the smoke root. | Native E2E failures must not damage unrelated host state. |
| D22 | No `gate:e2e` checkbox, closing keyword, or green platform claim changes until the corresponding command ran green and evidence is linked. | Enforces the false-closed-checkbox discipline. |

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| Exact fixture package/app identifier | resolved | `netscript-desktop-e2e`; stable across v1/v2/bad-v3. |
| Linux install mode on this host | resolved | Alternate-root real `dpkg`; evidence labels `isolated-root`. |
| Blocking Linux CI install mode | resolved | Native `.deb` install; prefer isolated-root for determinism, additionally use privileged install only when runner system integration is required and cleanup is proven. |
| Local TLS trust | resolved | Ephemeral CA + `DENO_CERT`; no insecure TLS flags. |
| Failed-launch trigger | resolved | Valid native executable with invalid shared-library role, not a JavaScript failure. |
| Whether to add a new gate kind | resolved | No; platform metadata wraps existing command/http gates and produces skipped results before execution. |
| Whether macOS must be green to complete the Linux slice | safe to defer | It remains best effort and `NOT_RUN` here, but runnable code and invocation are required. |
| Windows owner-host result | safe to defer | Code/docs required; actual result is owner-owned and remains `NOT_RUN` in this environment. |
| Whether Linux result closes existing systemd debt | safe to defer | Default is no claim; only exact debt gate evidence could change it. |
| Release publication/signing identities | safe to defer | Explicitly outside #457 Option A E2E. |

No unresolved “must resolve now” decision remains.

## Risk Register

| Risk | Mitigation |
| --- | --- |
| Deno Desktop API/launcher behavior changes in 2.9.x | Pin preflight output and expected namespace/version; fail with actionable evidence, never downgrade to mocks. |
| `DENO_CERT` is not honored by packaged fetch | Add a focused packaged HTTPS trust probe before update; failing it blocks the native leg. |
| `bsdiff` missing locally | Explicit failed preflight; operator supplies tool on PATH. CI installs it. No suite download fallback. |
| Alternate-root dpkg creates broken absolute launcher symlink | Verify dpkg database and installed file list, resolve the installed runtime path from package contents, and execute the installed launcher/runtime path explicitly. |
| GUI backend cannot open under WSL/CI | Preflight display/backend; CI provisions Xvfb/required libraries. A missing display is FAIL on the owned Linux leg, not NOT_RUN. |
| Update callback races process shutdown | Fixture writes/fsyncs evidence and closes only after renderer acknowledgement; driver polls bounded markers and records timeouts. |
| Bad runtime target is rejected before staging | Treat as a failing rollback gate; do not weaken Deno sanity/hash/signature checks. Adjust only with primary-source evidence and Plan-Gate-approved drift. |
| Cleanup removes unrelated resources | Record exact package identity, mount, unit, and PID before mutation; cleanup acts only on those explicit values. |
| CI becomes prohibitively slow | Cache Deno Desktop downloads by Deno version/target; keep one Linux architecture. Never skip the blocking gate for speed. |
| New platform skip contract leaks into published CLI | Changes remain in `publish:false` CLI-E2E export; JSR rescope if a published export becomes necessary. |
| Workflow `continue-on-error` hides Linux failure | Apply it only to macOS job; Linux native job is blocking and the summary prints each status. |

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
| --- | --- | --- |
| AP-1 | risk | Keep each driver/fixture file bounded; no native E2E monolith. |
| AP-2/AP-6 | risk | Use platform/process/TLS ports and adapters only where real test seams exist. |
| AP-3 | risk | Platform conditionals dispatch to adapters; no multi-platform god function. |
| AP-7 | risk | Use Web APIs, `@std`, OS package tools, and #456/#841 APIs; no home-grown crypto/updater/installer. |
| AP-8 | risk | JSDoc any exported suite/result/platform symbol. |
| AP-9 | risk | Full E2E test directory plus real Linux gate; no curated mock-only acceptance. |
| AP-11 | risk | Platform vocabulary is constant-derived, not scattered strings. |
| AP-13 | risk | Every process has timeout, classified error, and `finally` cleanup. |
| AP-18/AP-19 | risk | README documents required permissions/tools/network/TLS behavior and platform ownership. |
| AP-23 | risk | Suite definition contains declarative gates only; orchestration lives in adapters. |
| AP-25 | risk | `Deno.Command`, filesystem, environment, TLS, and process effects stay under adapters/bin/fixture edges. |

## Fitness Gates

| Gate | Required | Expected evidence |
| --- | --- | --- |
| F-1/F-CLI-1/2 | yes | `quality:scan` + doctrine file-size classification on owned roots. |
| F-3/F-CLI-3/4 | yes | `arch:check` and manual dependency direction review. |
| F-5/F-7 | yes | `deno task doc:lint --root packages/cli/e2e --pretty`; public additions documented. |
| F-6 | N/A publish | `publish:false`; record JSR rubric N/A and ensure no published surface changed. |
| F-9 | yes | README permissions/tool prerequisites match actual fixture operations. |
| F-10 | yes | Full `packages/cli/e2e/tests/`; test files remain below size gate. |
| F-11/12/15/16/18 | yes | `arch:check` + scoped quality scan; no forbidden folder/name/re-export/barrel. |
| F-19 | yes | Scoped check/lint/fmt wrappers over `packages/cli/e2e` only. |
| F-CLI-5/16 | yes | Direct effects only in adapters/fixture edges. |
| F-CLI-19/21/25 | yes | Composition/adapter placement and folder cardinality pass doctrine review. |
| F-DEPLOY-1/2 | reviewed | Existing deploy product contracts are consumed without target logic in command presentation. |

## Arch-Debt Implications

| Entry | Action | Notes |
| --- | --- | --- |
| `cli-deploy-linux-integration-untested` | none by default | Desktop package/update proof is not automatically the bare-metal systemd lifecycle closing gate. |
| `cli-deploy-artifacts-missing` | none | Native desktop packaging already exists; container artifact debt is unrelated. |
| `DEPLOY-S7-APPHOST-COMPOSE-GEN` | none | Compose generation is outside scope. |
| New G7 debt | none expected | Platform legs are explicit `NOT_RUN`, not hidden debt or false pass. |

## Validation Plan

| Order | Gate | Command or check | Expected result |
| --- | --- | --- | --- |
| 1 | Full CLI-E2E tests | `deno test --allow-all packages/cli/e2e/tests/` | All tests in the touched test root pass. |
| 2 | Scoped check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/cli/e2e --ext ts,tsx` | PASS. |
| 3 | Scoped lint | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/cli/e2e --ext ts,tsx` | PASS. |
| 4 | Scoped format | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/cli/e2e --ext ts,tsx` | PASS. |
| 5 | Documentation | `deno task doc:lint --root packages/cli/e2e --pretty` | Zero new diagnostics. |
| 6 | Code-quality scan | `deno task quality:scan` | PASS with no new allowances/casts/ignores. |
| 7 | Doctrine | `deno task arch:check` | PASS. |
| 8 | Linux native suite | `deno task e2e:cli run deploy.desktop-native --cleanup --format pretty` from native WSL ext4 | Linux install/remote/apply/rollback gates PASS; Windows/macOS explicitly `NOT_RUN`. Raw exit 0 only if owned Linux gates pass. |
| 9 | CI Linux | Blocking `deploy-desktop-native-linux` job running the same one-pass suite | Green run URL/report before `gate:e2e` evidence. |
| 10 | macOS best effort | Documented/macOS CI same suite command | PASS when available or explicit non-blocking failure/`NOT_RUN`; never counted as Linux green. |
| 11 | Windows owner host | Elevated PowerShell invocation of same suite | MSI + staging/manual gates PASS only after owner execution; until then `NOT_RUN`. |
| 12 | Git hygiene | raw `git status`, `git diff`, lock diff against integration base | Only planned files; no unreviewed `deno.lock` churn. |

## Commit Slices

1. **S1 — prove truthful platform verdict semantics and register the native suite contract.**
   Gate: full CLI-E2E tests + scoped wrappers. Files: CLI-E2E domain platform/gate vocabulary,
   platform port/adapter, gate runner/default composition, suite registry/skeleton, tests, nested run
   artifacts.
2. **S2 — prove the common signed native fixture and renderer remote-services round trip.**
   Gate: full CLI-E2E tests, focused fixture contract tests, quality/doctrine. Files: versioned
   fixture, oRPC contract/runtime/renderer, certificate/release/process adapters, common driver,
   suite gates, tests, nested run artifacts.
3. **S3 — prove Linux `.deb` install, healthy apply, failed-launch rollback, and blocking CI.**
   Gate: actual one-pass Linux native suite green on native WSL, full CLI-E2E tests, workflow static
   review. Files: Linux installer/launcher adapter, bad-runtime fixture, cleanup, Linux workflow job,
   README, reports/evidence references, nested run artifacts.
4. **S4 — deliver honest Windows/manual and macOS best-effort executable legs.**
   Gate: full CLI-E2E tests with platform command construction fixtures; WSL report shows Windows
   and macOS `NOT_RUN`; documented owner/mac invocations. Files: Windows MSI and macOS DMG adapters,
   platform fixture tests, optional macOS workflow job, README, nested run artifacts.

Each implementation slice follows: implementation gate → Tier-A substantive review → supervisor
sign-off commit → explicit push → per-slice PR evidence comment → reconcile note. This agent does not
dispatch reviewers/evaluators.

## Dependencies

- Landed integration commits for #452, #841, #842, and #456 at baseline `1709dcba`.
- Deno Desktop 2.9.3, native display/backend dependencies, `dpkg`, `bsdiff`, OpenSSL (certificate
  fixture), and platform installer tools.
- Fable supervisor for group PLAN-EVAL and Tier-A review.

## Drift Watch

- Upstream Deno namespace/manifest/launcher confirmation changes.
- Local `DENO_CERT` behavior differing in a packaged desktop runtime.
- `.deb` contents/path identity differing from official docs.
- CI runner lacking a usable display/backend or package-manager mode.
- Any need to change #452/#841/#842/#456 production code or a published export.
- Any temptation to replace a failed native gate with a mock or exit-zero skip.

## Stop Lines

1. Merge requires CI green + opposite-family eval PASS on the PR. Owner granted standing beta-11
   merge authorization (2026-07-17 in-turn) once that bar is met.
2. HARD STOP before any release publish (`release:cut`, JSR publish, tag push, canary or stable)
   — owner sign-off in-turn only; a stale or relayed approval does not count.
3. HARD STOP before closing milestone 13 — owner sign-off only.
4. These stop-lines are repeated verbatim in EVERY sub-agent brief. A sub-brief without the
   stop-lines section is invalid.
5. The #824 seed run is drafts-only until owner ratification; its board filing needs the owner
   in-turn.
