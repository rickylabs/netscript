# Research — G6 #456 native packaging and release server

## Re-baseline

- Carried-in sources:
  - live issue [#456](https://github.com/rickylabs/netscript/issues/456), including its RFC
    amendment, correction, and owner-ratified Option-A re-scope;
  - ratified [PR #822](https://github.com/rickylabs/netscript/pull/822), especially F2/F4 and the
    beta.11 → beta.14 sequence;
  - G4 #452's `AppEntry.PackageTaskName?: string` generator/config seam;
  - G2 #841's `@netscript/sdk/auto-update` release client and Windows manual-event seam.
- Re-derived against `feat/desktop-frontend` @ `e6e1be087722746b83b1835e29f265adc40db991` on
  2026-07-18. The worktree branch and `origin/feat/desktop-frontend` were identical and the tree was
  clean at nested-run start.
- What changed versus the older snapshot/RFC-L0 design:
  - Option A moves bootstrap/journal/release-directory graph transactions to beta.14 (#834/#825).
    Beta.11 uses the native Deno Desktop mechanism for window-only artifacts, behind #841's seam.
  - The release server and signed payload remain NetScript's policy/trust/replay authority.
    `Deno.autoUpdate` is only the native fetch/verify/stage/apply effect and does not define
    channel, target URL, key, sequence, or Windows UX policy.
  - Current Deno 2.9.3 and the current upstream source support the requested thin-client native
    installers. Older prose about no Deno-native combined MSI remains true for beta.14 graph
    installers but must not be applied to this window-only slice.

## Findings

| #  | Finding                                                                                                                                                                                                                                                                                                           | How to verify                                                                                                                    |
| -- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| 1  | The live issue has three amendment sections; the final owner-ratified Option-A section is operative and explicitly scopes this slice to native formats, native `latest.json` + bsdiff, #841 URL wiring, and Windows manual fallback.                                                                              | [Issue #456](https://github.com/rickylabs/netscript/issues/456)                                                                  |
| 2  | The integration base already contains `AppEntry.PackageTaskName?: string`, preserved by `AppEntrySchema`; G4 locks `desktop:package` as the downstream default convention and leaves invocation/output ownership to #456.                                                                                         | `packages/aspire/config.ts`; G4 `plan.md` D6                                                                                     |
| 3  | `deno doc packages/sdk/src/auto-update/mod.ts` and `deno doc --filter createReleaseClient` show the public seam exports `createReleaseClient`, `DEFAULT_RELEASE_CHANNEL`, `AUTO_UPDATE_OPERATING_SYSTEMS`, and `AUTO_UPDATE_ARCHITECTURES`. The client composes `<base>/<channel>/<os>-<arch>`.                   | `packages/sdk/src/auto-update/application/release-client.ts`; G2 release-client tests                                            |
| 4  | The SDK's manual update event already contains the trusted configured `manualUpdateUrl`; Windows is classified manual while macOS/Linux are automatic. #456 must document and host/configure the installer link, not add another application update API.                                                          | `packages/sdk/src/auto-update/domain/types.ts`; `start-auto-update.ts`; denoland/deno#35269                                      |
| 5  | Local Deno 2.9.3 accepts six explicit target triples: x86_64/aarch64 for Linux, macOS, and Windows. Output extensions select `.app`, `.dmg`, `.AppImage`, `.deb`, `.rpm`, and `.msi`; `-o`, `--target`, `--all-targets`, and `--compress` are present.                                                            | `deno desktop --help`; [Deno Desktop distribution docs](https://docs.deno.com/runtime/desktop/distribution/)                     |
| 6  | Upstream `--all-targets` currently expands only five triples and omits `aarch64-pc-windows-msvc`. It also clones one output option across targets, which is unsuitable for a matrix whose extensions select OS-specific formats.                                                                                  | `denoland/deno` `cli/tools/desktop.rs` on `main`, lines 52–84                                                                    |
| 7  | Therefore NetScript's `--all-targets` must be a deterministic planner selector that expands all SDK OS/arch values into explicit per-format `--target ... -o ...` task invocations. This preserves all six targets, unique artifact paths, and Deno's native format selection.                                    | Planned packaging matrix unit test; upstream source finding 6                                                                    |
| 8  | `.dmg` is the only requested format constrained to a macOS host (`hdiutil`). MSI/deb/rpm are assembled in Rust for their target OS; Deno downloads verified cross-target runtime inputs.                                                                                                                          | Current `cli/tools/desktop.rs`; [distribution docs](https://docs.deno.com/runtime/desktop/distribution/)                         |
| 9  | `xz` is Deno's portable default compression algorithm; `zstd` requires an external tool. Defaulting the pipeline to explicit `--compress=xz`, with an opt-out/override, is deterministic and avoids a hidden CI prerequisite.                                                                                     | `deno desktop --help`; distribution docs                                                                                         |
| 10 | Native `latest.json` has a signed envelope `{signed, signature}`. The signature is Ed25519 over the exact UTF-8 bytes of the `signed` string. The trusted payload requires `version` and `patches[fromVersion] = {name, sha256}`; the patch digest is lowercase SHA-256.                                          | [Deno Desktop auto-update docs](https://docs.deno.com/runtime/desktop/auto_update/); current `cli/rt/desktop.rs` lines 1020–1090 |
| 11 | Current Deno parses the trusted signed payload dynamically and reads only `version` and `patches`, so additional trusted fields are ignored. Adding `manifestVersion` and `sequence` now is compatible; beta.14 can add named graph fields to the same payload/envelope.                                          | Current `cli/rt/desktop.rs` lines 1027–1071                                                                                      |
| 12 | Deno requires bsdiff 4.x/qbsdiff-compatible patches of the desktop runtime library. The CLI should invoke the external `bsdiff` tool through a narrow process port, then hash the produced bytes; it must not implement a delta codec.                                                                            | [auto-update docs](https://docs.deno.com/runtime/desktop/auto_update/)                                                           |
| 13 | A high-water cannot be only the currently served manifest because deletion/replacement would permit replay. A private per-channel/per-target state file must reject every `sequence <= highWater`; immutable patch writes happen before high-water advance and atomic `latest.json` replacement happens last.     | Threat analysis in plan D15–D17; sequence unit tests                                                                             |
| 14 | Crash ordering can remain safe without importing beta.14 updater machinery: stage immutable patches, atomically advance the private high-water, then atomically replace `latest.json`. A crash may burn a sequence but cannot serve a lower accepted sequence.                                                    | Plan D16; no bootstrap/journal/current-link code                                                                                 |
| 15 | The release handler must serve exactly `/<channel>/<os>-<arch>/latest.json` and relative patch/installer files, reject traversal/dot/private paths, emit `no-store` for the manifest, and immutable caching for content-addressed files. TLS may terminate at a reverse proxy, but app config remains HTTPS-only. | SDK client source; service overlay gate plan                                                                                     |
| 16 | Windows native apply remains unsupported upstream: the patch can stage and emit #841's manual event but does not swap on relaunch. The truthful v1 path is a hosted native installer link and staged-detection UX; automatic Windows apply is not emulated.                                                       | [denoland/deno#35269](https://github.com/denoland/deno/issues/35269); G2 plan D8/D9                                              |
| 17 | `@netscript/cli` is doctrine Archetype 6 and retains a **Restructure** verdict. Existing vocabulary/cardinality warnings are baseline debt; this feature must stay in one cohesive `deploy/target/desktop` feature on the existing target axis and must not add a new package export or general-purpose framework. | doctrine file 10; JSR helper baseline |
| 18 | Baseline package docs and publish simulation are green: doc lint reports zero diagnostics; dry-run exits 0 with three pre-existing unanalyzable dynamic-import warnings. The audit helper reports existing vocabulary/cardinality warnings plus its known slow-type banner false positive.                        | Commands recorded under Gate Results in `worklog.md`                                                                             |

## jsr-audit surface scan (package wave)

- Surface scanned: current `@netscript/cli` export map (`.`, `./scaffolding`, `./testing`) and the
  proposed command-only `netscript deploy desktop ...` feature.
- Planned public-surface decision: no new JSR export. Domain/application/adapter types stay internal
  to the CLI feature; the user-facing contract is the Cliffy command tree plus documented file and
  HTTP formats.
- Baseline:
  - `deno task doc:lint --root packages/cli --pretty` — exit 0, zero diagnostics across all three
    exports.
  - raw `deno publish --dry-run --allow-dirty --no-check=remote` from `packages/cli` — exit 0; three
    pre-existing dynamic-import warnings, no slow-type diagnostic.
  - `audit-jsr-package.ts --root packages/cli --text` — exit 0; existing doctrine warnings and the
    helper's literal “Checking for slow types” false positive recorded, not attributed to #456.
- Mandatory controls if Plan-Gate requests any new export: stop that slice, specify the public
  contract first, add complete JSDoc/explicit return types/consumer fixture, and rerun full-export
  doc lint plus raw dry-run. No `any`, text/JSON import attributes, runtime-read embedded assets, or
  generated string imports are permitted.
- Package dependency on `@netscript/sdk/auto-update` must be added with the Deno toolchain rather
  than a hand-edited registry probe; `deno why` and lock diff inspection will prove the edge.

## Open questions resolved by the plan

- **What exactly does `--all-targets` mean?** It expands the SDK OS/architecture cartesian product
  to six explicit Deno triples and then emits one invocation per requested native format. It is not
  forwarded as upstream `--all-targets` because that path currently loses Windows ARM64 and cannot
  provide unique OS-format `-o` values.
- **Where does the package command come from?** The selected enabled desktop app's
  `PackageTaskName`, defaulting to `desktop:package`; the pipeline appends native Deno flags to that
  task rather than reconstructing its entrypoint.
- **Is the release manifest a NetScript replacement?** No. `latest.json` is the native signed
  envelope and trusted native payload. `manifestVersion` and `sequence` are compatible extra fields;
  beta.14 adds graph fields as a strict TypeScript/schema superset and reuses the signer/server.
- **How is sequence persisted?** Private state under the release root's non-served metadata area,
  keyed by SDK channel and target. Equal sequences are rejected, including byte-identical retries; a
  burned sequence is recovered by issuing the next value.
- **Does the server terminate TLS?** The reusable request handler is transport-neutral; the CLI
  server may bind HTTP behind a production HTTPS reverse proxy. SDK config and manual installer URLs
  remain HTTPS-only.
- **Who applies updates?** The signed server policy + #841 client seam define authority. Native Deno
  performs the window-only mechanism on supported OSes; Windows remains manual. Graph-wide apply,
  bootstrap, journals, release dirs, and `current` switching remain #834/#825.
