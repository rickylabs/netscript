# Research — G7 #457 native-first thin-client deploy E2E

## Re-baseline

- Carried-in source: live issue #457, including the RFC #820 amendment and the later owner-ratified
  Option-A amendment; foundation issues #393/#394; landed G2/G3/G4/G6 nested-run artifacts.
- Re-derived against `origin/feat/desktop-frontend` @
  `1709dcbabb689edd8e5c659ca91774600272597c` on 2026-07-18.
- `HEAD`, `origin/feat/desktop-frontend`, and their merge-base are the same SHA. The branch is clean.
- What changed versus the older issue title/amendment:
  - The operative Option-A amendment replaces the earlier graph/single-artifact framing for this
    beta.11 slice with a native-first window-only thin client.
  - Windows is no longer an apply/rollback authority: it proves staged detection plus the trusted
    manual installer path. Automatic apply/rollback is Linux/macOS only.
  - The current brief narrows executable responsibility further: Linux runs here/CI; Windows is
    runnable owner-host code and `NOT_RUN` here; macOS is best-effort and `NOT_RUN` here.

## Findings

| # | Finding | How to verify |
| --- | --- | --- |
| 1 | Live #457 has two amendments; the later “Option-A re-scope” is operative and requires native formats, Linux/macOS native apply + failed-launch rollback, Windows staged/manual behavior, and remote `services__*` discovery. | [Issue #457](https://github.com/rickylabs/netscript/issues/457) |
| 2 | #393/#394 establish the false-green failure pattern: deploy target existence or mock-only checks are insufficient; `gate:e2e` is checked only after a real green run. #394’s owner comment selected bare-metal/systemd as the earlier production path. | [Issue #393](https://github.com/rickylabs/netscript/issues/393), [issue #394](https://github.com/rickylabs/netscript/issues/394) and its owner comment |
| 3 | The existing deploy harness is the built-in `deploy.targets` suite. It scaffolds a project, checks Deno Deploy planning, and resolves Docker/Compose routers, but does not install or launch a desktop artifact. | `packages/cli/e2e/suites/deploy/deploy-targets-suite.ts` |
| 4 | The E2E domain already has `GateVerdict = 'passed' | 'failed' | 'skipped'`, but the runner has no platform-applicability contract and currently never emits `skipped`. Shell scripts exiting zero would therefore create a false green rather than `NOT_RUN`. | `packages/cli/e2e/src/domain/gate-definition.ts`; `src/application/runner/gate-runner.ts` |
| 5 | `@netscript/cli-e2e` is doctrine Archetype 6 and `publish:false`. Its public programmatic surface is real, but this slice does not create or alter a JSR-published package surface. | `packages/cli/e2e/deno.json`; `deno doc packages/cli/e2e/mod.ts` |
| 6 | Baseline full E2E unit directory is green: 45 passed, 0 failed. | `deno test --allow-all packages/cli/e2e/tests/` on 2026-07-18 |
| 7 | G4/#452 landed the desktop generator/config seam: explicitly enabled desktop apps, `PackageTaskName`, default `desktop:package`, build-before-launch, and server-only `services__<name>__http__0` injection without Vite aliases or a desktop HTTP endpoint. | `packages/cli/src/kernel/templates/aspire/helpers/register/generate-register-apps.ts`; G4 research/evaluation |
| 8 | G6/#456 landed `netscript deploy desktop package`, signed `latest.json` preparation, bsdiff patching, private route high-water, and `release serve`. The URL route is `<base>/<channel>/<os>-<arch>`; Deno appends `/latest.json`. | `packages/cli/src/public/features/deploy/target/desktop/`; G6 plan D11–D18 |
| 9 | G2/#841 landed the sole consumer update seam, `@netscript/sdk/auto-update`. It resolves old and proposed Deno namespaces, uses signed HTTPS release URLs, reports automatic vs manual readiness, and reports rollback telemetry before the consumer callback. | `packages/sdk/src/auto-update/mod.ts`; G2 plan/evaluation |
| 10 | G3/#842 landed `@netscript/fresh/desktop` and `@netscript/sdk/desktop`: one isolated oRPC MessagePort-backed binding per native window and a typed webview client. This can prove the window/data-plane leg without handwritten binding types. | `deno doc packages/fresh/src/runtime/desktop/mod.ts`; `deno doc packages/sdk/src/desktop/mod.ts` |
| 11 | Deno Desktop 2.9 supports native `.deb`, `.rpm`, `.AppImage`, `.msi`, `.app`, and `.dmg` output. Linux packages install under `/usr/lib/<pkg>` with a `/usr/bin` launcher; MSI installs per-machine under Program Files. | [Deno Desktop distribution](https://docs.deno.com/runtime/desktop/distribution/) |
| 12 | Deno native update is HTTPS-only, stages `<dylib>.update`, swaps it at next launch on Linux/macOS, maintains backup/success-sentinel files, and rolls back when a launch never confirms. Windows downloads/stages but does not swap. | [Deno Desktop auto-update](https://docs.deno.com/runtime/desktop/auto_update/) |
| 13 | Current upstream initialization calls `op_desktop_confirm_update()` before user application code when the launcher reports no rollback. A JavaScript throw is therefore not a reliable failed-launch trigger; the test must make the updated native runtime fail before initialization. | `denoland/deno` `cli/rt/desktop.rs` @ `0dd78745...`, `desktop_auto_update_js` |
| 14 | A patch target based on a valid ELF executable that cannot load as the runtime shared library (for example a copied fixture ELF with wrong library shape) reaches the native-binary sanity boundary yet fails before the confirmation op. The third launch can then prove restoration and the `onRollback` callback. | Deno updater source + launcher state contract; to be proven by the Linux gate, not assumed green |
| 15 | Local HTTPS is feasible without weakening transport: the fixture generates a local CA/server certificate, the #456 handler is served through TLS, and the packaged process receives `DENO_CERT` (the environment form of `--cert`) so `fetch()` trusts only the fixture CA. | [Deno environment variables](https://docs.deno.com/runtime/reference/env_variables/) |
| 16 | This host is native WSL/ext4 with Deno 2.9.3, `DISPLAY=:0`, D-Bus, system `dpkg`, and systemd. The user manager is running. Passwordless `sudo` and `bsdiff` are absent. | environment probes recorded 2026-07-18 |
| 17 | A truthful local Linux install can still use a real `dpkg --install` transaction inside a suite-owned alternate root/admin database with `--force-not-root`; it must be described as isolated-root install, not system-wide install. Blocking CI should use the same `.deb` and a privileged/native install mode when available. | local `dpkg --help`; planned gate evidence must print mode and installed file list |
| 18 | The #456 prepare path deliberately requires external `bsdiff`. The suite must preflight it and fail, not download or silently replace it. For this WSL host, an operator-provided extracted package/tool path may satisfy the preflight without root; CI installs the tool explicitly. | `prepare-native-release.ts`; G6 plan D7 |
| 19 | Remote discovery is not a string-generation-only proof: the packaged fixture can read an injected `services__remote__http__0`, bind an oRPC handler to a real `BrowserWindow`, fetch the remote fixture service, return the response to a typed renderer client, and persist a renderer-confirmed evidence marker. | G4 discovery generator + G3 public desktop binding surfaces |
| 20 | No draft PR currently exists for `feat/desktop-frontend-457-e2e`. Live #457 is open at milestone `0.0.1-beta.11`; its current status is `status:research`. The requested sub-PR lifecycle begins at `status:plan` and uses `Refs #457`. | GitHub live reads on 2026-07-18 |

## jsr-audit surface scan

- Surface scanned: `packages/cli/e2e/deno.json`, its sole `./mod.ts` export, and `deno doc` output.
- Planned surface risk: the suite/gate constants and platform result semantics may extend this
  internal workspace API, so exported names still require explicit types and JSDoc.
- Publishability status: **N/A for publication** because `@netscript/cli-e2e` has `publish:false`
  and is excluded from the repository’s 26-unit publish denominator. No `@netscript/cli` or other
  published export map is planned to change.
- Slow-type/documentation guard: scoped check plus `deno task doc:lint --root packages/cli/e2e
  --pretty`; if implementation unexpectedly touches a published entrypoint, stop and rescope the
  JSR gate rather than carrying this N/A forward.

## Open questions resolved for the plan

| Question | Resolution |
| --- | --- |
| Add heavyweight behavior to `deploy.targets`? | No. Preserve its credential-free smoke and add sibling built-in suite `deploy.desktop-native` under the same deploy harness. |
| How are unavailable platforms reported? | Runner-level platform applicability emits `skipped` with structured evidence; worklog/PR evidence renders that as `NOT_RUN`. Never exit-zero placeholders. |
| What counts as Linux install here? | Real alternate-root `dpkg` install plus execution from installed paths; evidence names `isolated-root`. CI also exercises native privileged install mode. |
| How is failed launch induced? | Patch the known-good v2 runtime to a valid native fixture that cannot load as the desktop runtime, so failure occurs before update confirmation; then verify rollback to v2 and callback evidence. |
| Does Windows claim auto-apply? | No. It verifies MSI install, signed patch staging, `applyMode: manual`, trusted manual URL, and staged file presence only. |
| Does macOS block merge? | No. Runnable `.dmg`/`.app` apply+rollback code is delivered; CI is explicitly best-effort/non-blocking and is `NOT_RUN` here. |
| Is release publication involved? | No. All artifacts and signatures are ephemeral suite fixtures. Release cut, publish, tags, canaries, and stable publication remain hard stops. |
