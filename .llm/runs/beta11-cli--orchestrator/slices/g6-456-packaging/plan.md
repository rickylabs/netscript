# Plan: issue #456 native packaging pipeline and release server

## Run Metadata

| Field          | Value                                                                 |
| -------------- | --------------------------------------------------------------------- |
| Run ID         | `beta11-cli--orchestrator/slices/g6-456-packaging`                    |
| Branch         | `feat/desktop-frontend-456-packaging`                                 |
| Phase          | `plan`                                                                |
| Target         | `packages/cli` — `netscript deploy desktop` packaging/release feature |
| Archetype      | `6 — CLI / Tooling`                                                   |
| Scope overlays | `service` for the bounded HTTP release handler                        |

## Archetype

Archetype 6 is the larger applicable shape: the shipped surface is a CLI workflow that resolves
project config, plans deterministic process invocations, prepares signed artifacts, and exposes a
thin server command. The release HTTP handler receives the service overlay's lifecycle, error,
security, and request-contract gates, but it does not create a new service package or reclassify the
CLI. The cryptographic and filesystem boundaries are folded Archetype 2 adapter concerns.

## Current Doctrine Verdict

`@netscript/cli`: **Restructure**. The bounded A6 promotion debt is closed, but the static doctrine
verdict and existing package vocabulary/cardinality debt remain. This run keeps all new behavior in
one cohesive `src/public/features/deploy/target/desktop/` feature on the existing target axis, reuses existing
config/process/filesystem composition seams, adds no JSR export, and neither fixes nor deepens
unrelated CLI debt.

## Axioms in Play

| Axiom | Why it matters                                                                                             |
| ----- | ---------------------------------------------------------------------------------------------------------- |
| A1    | Lock native package plans, signed payload/envelope, sequence rules, and route shape before adapters.       |
| A2    | The CLI surface and release files use consumer vocabulary rather than leaking Deno internals.              |
| A6    | Wrap `deno desktop`, WebCrypto Ed25519, SHA-256, and external `bsdiff`; implement none of them locally.    |
| A7    | Consume Web Platform APIs, existing `ProcessPort`/filesystem conventions, and #841 SDK constants/client.   |
| A8    | Separate pure planning/composition from Deno process/filesystem/HTTP edges.                                |
| A9    | Archetype 6 remains governing; the service overlay is only an extra gate set.                              |
| A10   | `createDesktopCommand(dependencies)` is the composition point; no container or hidden globals.             |
| A11   | Named axes are desktop target, native format, release channel/target, signer, and release storage.         |
| A13   | Command failures, signature/sequence rejection, bsdiff failure, and HTTP misses are structured boundaries. |
| A14   | Unit, parser, service, package, docs, JSR, quality, and architecture gates protect the seams.              |

## Goal

Ship a native-first `netscript deploy desktop` workflow that packages enabled desktop apps through
#452's task hook into every requested Deno Desktop native format, prepares and serves replay-safe
Ed25519-signed native update manifests and bsdiff patches at #841's exact URL layout, and documents
the truthful manual Windows update path without importing beta.14 graph-update machinery.

## Scope

- Add `netscript deploy desktop package` with `--app`, mutually exclusive `--target` and
  `--all-targets`, repeatable native `--format`, explicit `--output-dir`, and configurable
  compression.
- Parse the canonical Aspire app config, require an enabled `Type: desktop` entry, consume its
  `PackageTaskName ?? 'desktop:package'`, and run from the app workdir.
- Build a pure matrix from SDK OS/architecture constants to Deno triples and compatible native
  formats; emit unique explicit `-o` paths and explicit `--target` per task invocation.
- Preflight the macOS-only `.dmg` host restriction and external `zstd` requirement; default to
  explicit `--compress=xz`.
- Add `netscript deploy desktop release prepare` to invoke bsdiff for prior runtime versions, hash
  patches, compose the native payload, sign the exact payload string with Ed25519 WebCrypto, enforce
  the private per-route high-water, and atomically replace `latest.json` last.
- Add `netscript deploy desktop release serve` over a reusable request handler for manifests,
  patches, and optionally copied native installers.
- Derive release route validation/catalogs from `@netscript/sdk/auto-update` constants and prove URL
  parity against public `createReleaseClient`.
- Add README/how-to/reference documentation for native formats, cross-compilation, task setup,
  release-root layout, TLS, key handling, external signing/notarization, and Windows manual UX.
- Add focused unit/parser/service tests and run the full CLI test directory plus package/publication
  gates.

## Non-Scope

- Snapshot updater, bootstrap, journal, immutable graph release dirs, `current` link switching,
  recovery units, combined artifacts, sidecars, or graph manifests (#834/#825, beta.14).
- Implementing or directly calling `Deno.autoUpdate`; applications use #841 only.
- A second consumer update seam, a second signed envelope, or a NetScript-specific replacement for
  native `latest.json`.
- Automatic native apply on Windows; upstream #35269 remains open.
- `signtool`, Apple codesign/notarization, key custody/HSM integration, or signing automation. These
  remain external CI/release steps (D4 posture) and are documented only.
- Real installer/apply/rollback cross-platform E2E (#457), stable rollout rings, CDN provisioning,
  or production deployment of the release server.
- A release cut, JSR publication, tag/canary/stable push, merge, issue closure, or milestone
  closure.

## Hidden Scope

- Deno's own `--all-targets` currently omits Windows ARM64; NetScript must own deterministic
  expansion while still using native `--target` and output-extension behavior.
- `.dmg` needs a host constraint unlike the other formats; format planning and execution must make
  that failure early and actionable.
- The app task owns the desktop entrypoint and permissions; the CLI may append flags but may not
  bypass `PackageTaskName` with a direct `deno desktop` command.
- Ed25519 verifies bytes, not parsed objects. The exact signed string must be preserved verbatim in
  the envelope and unit-tested with a generated WebCrypto keypair.
- Sequence is trusted only after signature verification by clients, but replay prevention at release
  authoring requires private durable high-water state that the HTTP handler can never serve.
- Patch names are relative native manifest paths. They must be URL-safe, traversal-free, immutable,
  and accompanied by lowercase SHA-256.
- HTTP `latest.json` must be `no-store`; patches/installers can be immutable. Range support is safe
  to defer, but HEAD and correct content types must not be overlooked.
- Adding the internal SDK dependency requires Deno-native dependency/lock inspection and a full CLI
  publish simulation even though no new JSR export is planned.

## Locked Decisions

| ID  | Decision                                                                                                                                                                                                                                          | Rationale                                                                                                               |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| D1  | The user-facing tree is `netscript deploy desktop package` and `netscript deploy desktop release prepare                                                                                                                                          | serve`, registered under the existing deploy group.                                                                     |
| D2  | `package` selects exactly one enabled desktop app unless `--app` disambiguates multiple entries.                                                                                                                                                  | Avoids silently packaging the wrong window and keeps config authoritative.                                              |
| D3  | The task is `AppEntry.PackageTaskName ?? 'desktop:package'`; invocation is `deno task <task> ...native flags` from the app workdir.                                                                                                               | Directly consumes #452 and leaves app entrypoint/permission authoring in the app.                                       |
| D4  | `--target <deno-triple>` and `--all-targets` are mutually exclusive. `--all-targets` expands all SDK OS/arch values to six explicit triples; upstream `--all-targets` is not forwarded.                                                           | Preserves Windows ARM64 and permits unique OS-specific native output extensions.                                        |
| D5  | Formats are a closed constant set: macOS `app,dmg`; Linux `appimage,deb,rpm`; Windows `msi`. Omitted `--format` means every compatible format for each selected target.                                                                           | Exactly matches Option A; invalid target/format pairs fail before processes start.                                      |
| D6  | Every planned invocation contains explicit `--target`, `--compress=<algorithm>` unless disabled, and `-o <absolute unique path>`. Output names include app, version, OS, architecture, and native extension.                                      | Reproducible matrix with no implicit host/output collisions.                                                            |
| D7  | Compression defaults to `xz`; `none` omits the flag; `lzma` and `zstd` are explicit choices, with `zstd` preflighted as an external tool.                                                                                                         | Portable useful default without a hidden dependency.                                                                    |
| D8  | `.dmg` planning is allowed for either macOS architecture but execution fails early unless the build host is macOS. Other requested installer formats follow upstream target constraints.                                                          | Mirrors actual `hdiutil` physics and preserves cross-compile support elsewhere.                                         |
| D9  | Native installer code signing and notarization are documentation/CI handoff points after packaging; the CLI does not invoke `signtool`, `codesign`, or notary tools.                                                                              | Owner's D4 posture and separation of release credentials from build mechanics.                                          |
| D10 | Release targets and route validation are derived from SDK `AUTO_UPDATE_OPERATING_SYSTEMS` and `AUTO_UPDATE_ARCHITECTURES`; channel default comes from `DEFAULT_RELEASE_CHANNEL`.                                                                  | The server never restates the client catalog/default.                                                                   |
| D11 | URL layout is `<base>/<channel>/<os>-<arch>` and Deno appends `/latest.json`; a parity test compares the server route for `Deno.build` with public `createReleaseClient(config).updateUrl`.                                                       | Contract proof against the actual seam rather than duplicated expected text.                                            |
| D12 | The trusted native payload is `{manifestVersion: 1, sequence, version, patches}`. `patches` retains Deno's exact map shape.                                                                                                                       | Native-compatible today, with an explicit version/sequence foundation for beta.14.                                      |
| D13 | The outer envelope is exactly `{signed: string, signature: base64}` and Ed25519 signs the exact UTF-8 `signed` bytes via `crypto.subtle`; the private key input is PKCS#8 PEM/DER at the adapter edge.                                            | Matches upstream and wraps WebCrypto without custom cryptography/canonical JSON.                                        |
| D14 | Graph lineage extends the trusted payload with named graph fields and reuses D12/D13, signer, routes, and server. The native composer accepts only native fields; the generic signer signs an exact JSON string and does not strip future fields. | Makes beta.14 a strict superset without speculative graph types or a second manifest format.                            |
| D15 | `release prepare` accepts a current runtime library plus repeated `fromVersion=runtimePath` inputs, invokes external bsdiff, and computes each patch digest.                                                                                      | Wraps the required upstream patch tool and avoids installer extraction complexity.                                      |
| D16 | High-water is private state keyed by channel + SDK release target. Every `sequence <= highWater` is rejected; retries after a burned sequence use the next number.                                                                                | Strict monotonicity is simpler to audit and blocks replay/downgrade.                                                    |
| D17 | Promotion order is immutable patch/installer writes → atomic high-water advance → atomic `latest.json` replace. The handler never exposes temp/private metadata.                                                                                  | A crash can burn a sequence or retain the old manifest, but cannot publish an accepted downgrade; no journal is needed. |
| D18 | The request handler serves only validated channel/SDK target routes and allowlisted public files. `latest.json` is `no-store`; patch/installer content is immutable; GET and HEAD are supported; other methods/paths fail explicitly.             | Service security/cache contract with a small testable surface.                                                          |
| D19 | `serve` is abortable and transport-neutral. Production HTTPS termination can sit in front, but docs require the resulting public base/manual URLs to be HTTPS.                                                                                    | Clean lifecycle/testing seam and compatibility with typical deployment.                                                 |
| D20 | Windows remains a staged-detection/manual-installer path through #841's existing manual event and trusted `manualUpdateUrl`; this slice does not simulate a native swap.                                                                          | Truthful behavior while denoland/deno#35269 remains open.                                                               |
| D21 | No new `@netscript/cli` export is added. Internal types use explicit declarations and JSDoc where export lint reaches them; no text/JSON import attributes or runtime-read embedded assets are introduced.                                        | Meets JSR/string-constants doctrine without widening an already large public package.                                   |

## Open-Decision Sweep

| Decision                                     | Status                | Notes                                                                                                                                       |
| -------------------------------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Exact beta.14 graph fields                   | safe to defer         | D14 locks lineage mechanics but intentionally does not invent #834's graph contract.                                                        |
| CDN/object-store adapter                     | safe to defer         | This slice prepares a filesystem root and serves it; deployment-specific storage is not required by #456.                                   |
| HTTP Range support                           | safe to defer         | Native patches are fetched whole; GET/HEAD and immutable caching are sufficient for v1.                                                     |
| Channel allowlist beyond stable              | safe to defer         | #841 deliberately validates an open non-empty channel namespace; default is consumed from SDK.                                              |
| Installer discovery in `latest.json`         | resolved              | Manual URL stays trusted app config, not unsigned/extra native metadata. Installers may be hosted but are not part of the native patch map. |
| Equal-sequence idempotent retry              | resolved              | Reject equal; a crash-burned sequence advances on retry. No ambiguous replay exception.                                                     |
| Direct upstream `--all-targets` pass-through | resolved              | Do not forward; use deterministic explicit target expansion per D4.                                                                         |
| Native package signing automation            | safe to defer         | External CI D4 posture; document inputs/ordering only.                                                                                      |
| Real platform E2E                            | safe to defer to #457 | This PR proves composition/adapters with fixtures; #457 owns installed apply/rollback/manual-path proof.                                    |

No unresolved decision would force rework inside the planned implementation slices.

## Risk Register

| Risk                                                        | Mitigation                                                                                                                                    |
| ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Deno Desktop experimental flags/formats drift               | One constants/mapping module, exact argv fixture matrix, official-source links, and no consumer exposure of upstream parser types.            |
| `--all-targets` becomes inconsistent with SDK target values | Derive the OS/arch cartesian product from SDK constants and map exhaustively; compilation fails on an unmapped value.                         |
| One package output overwrites another                       | Pure planner proves uniqueness before execution and includes target/format in every explicit path.                                            |
| App task ignores appended flags                             | Document the required `desktop:package` task shape and add a fixture command that records exact forwarded argv; #457 runs real native builds. |
| Signed payload changes after signing                        | Envelope builder owns the exact string once; handler serves bytes unchanged; verify generated keypair in unit tests.                          |
| Private key leaks through errors/server                     | Key adapter returns redacted typed errors; handler blocks metadata/dot paths; no key material enters results/logs.                            |
| Concurrent release preparation races high-water             | Exclusive per-route lock plus reread-before-advance; concurrency unit test permits exactly one winner.                                        |
| Crash between high-water and manifest replacement           | Safe sequence burn documented; old signed manifest remains served until a higher sequence is prepared.                                        |
| Path traversal exposes private state                        | Decode/validate each route segment, reject dot/encoded separators, resolve-under-root check, and adversarial handler tests.                   |
| Windows users assume auto-apply                             | Docs and examples wire the #841 manual event and hosted HTTPS installer; no automatic claim or workaround.                                    |
| CLI package debt obscures regressions                       | Record baseline warnings; require no new warning category/count attributable to touched paths and focused clean reports.                      |
| Lock churn from SDK dependency                              | Use `deno add`/`deno why`, inspect raw git diff, and reject unrelated lock/source churn.                                                      |

## Anti-Patterns to Resolve or Avoid

| AP    | Status          | Plan                                                                                                                |
| ----- | --------------- | ------------------------------------------------------------------------------------------------------------------- |
| AP-1  | existing risk   | Keep planner, release composer, storage adapter, handler, and commands in focused files; enforce size gates.        |
| AP-2  | justified seams | Wrappers add matrix policy, high-water, signing, routing, and test seams—not renames.                               |
| AP-7  | avoided         | Cliffy options become readonly input objects; no positional argument ladder.                                        |
| AP-8  | avoided         | Explicit dependency objects at the command composition root; no container.                                          |
| AP-9  | bounded         | Reuse existing process/filesystem ports and add only signer/release-store behaviors that need replacement in tests. |
| AP-11 | avoided         | No module-load config, server, key read, or filesystem mutation.                                                    |
| AP-12 | bounded edge    | Deno process, filesystem, WebCrypto, and `Deno.serve` live in named adapters/command edge.                          |
| AP-13 | avoided         | Structured command/server errors; no domain `console.*`.                                                            |
| AP-14 | avoided         | SDK types/constants are consumed, not re-exported from CLI.                                                         |
| AP-15 | avoided         | Names are native package/release concepts; no `I*`, `Impl`, or generic manager vocabulary.                          |
| AP-18 | avoided         | Semantic argv/payload/route assertions; no giant snapshots.                                                         |
| AP-19 | addressed       | Docs cover read/write/run/net permissions, HTTPS, bsdiff/zstd, and external signing tools.                          |
| AP-22 | avoided         | No new internal convenience barrel or JSR subpath.                                                                  |
| AP-25 | contained       | Time, process, crypto, files, platform, and server effects are injected or isolated at edges.                       |

## Fitness Gates

| Gate                     | Required             | Expected evidence                                                                                                                        |
| ------------------------ | -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| F-1/F-10                 | yes                  | Focused file/test-size report; split any new oversized source or test.                                                                   |
| F-2/F-3/F-4              | yes                  | Focused `quality:scan`, architecture report, and manual layer/import review.                                                             |
| F-5/F-7/F-16             | yes                  | Full CLI export doc lint, raw publish dry-run, audit helper, no new public export, dependency direction check.                           |
| F-6/F-8                  | yes                  | Command/parser integration tests and complete JSDoc for any reachable export.                                                            |
| F-9                      | yes                  | README permission/network/external-tool table.                                                                                           |
| F-11/F-12                | yes                  | Release planner rejects invalid/conflicting inputs; errors stay typed and useful.                                                        |
| F-13                     | service/runtime      | Abortable server lifecycle, concurrent sequence rule, no hidden indefinite loop in tests.                                                |
| F-14/F-15/F-17/F-18/F-19 | yes where applicable | Target URL observability, no import cycles/deep cross-package paths, static string constants, full test directories, no unrelated churn. |

## Arch-Debt Implications

| Entry                                        | Action       | Notes                                                                                                                        |
| -------------------------------------------- | ------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| `@netscript/cli` static Restructure verdict  | none         | Feature remains bounded; no package restructure in #456.                                                                     |
| Existing CLI vocabulary/cardinality findings | none         | Baseline only; new `deploy/target/desktop` stays on the existing target axis and must not create forbidden `helpers/lib/interfaces` vocabulary. |
| New #456 debt                                | none planned | Any gate exception or new warning is a stop-and-record event, not an implicit allowance.                                     |

## Validation Plan

| Order | Gate               | Command or check                                                                             | Expected result                                                                        |
| ----- | ------------------ | -------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| 1     | focused unit       | `deno test --allow-all <touched desktop test files>`                                         | Packaging, manifest, signing, sequence, handler, parser tests all pass.                |
| 2     | full package tests | `rtk proxy deno task --cwd packages/cli test`                                                | Complete CLI test directory passes.                                                    |
| 3     | scoped check       | `.llm/tools/run-deno-check.ts --root packages/cli --ext ts,tsx`                              | Zero diagnostics; wrapper includes `--unstable-kv`.                                    |
| 4     | scoped lint        | `.llm/tools/run-deno-lint.ts --root packages/cli --ext ts,tsx`                               | Zero findings.                                                                         |
| 5     | scoped format      | `.llm/tools/run-deno-fmt.ts --root packages/cli --ext ts,tsx`                                | Zero findings; no repo-wide mutation.                                                  |
| 6     | quality            | `deno task quality:scan --root packages/cli` (repo-supported exact form confirmed before S1) | No new/deepened findings in touched paths.                                             |
| 7     | architecture       | focused package report plus `rtk proxy deno task arch:check`                                 | Focused clean; root exits 0 with only attributable baselines.                          |
| 8     | SDK URL parity     | focused test importing `@netscript/sdk/auto-update`                                          | Handler route equals `createReleaseClient(...).updateUrl` pathname for current target. |
| 9     | JSR docs           | `rtk proxy deno task doc:lint --root packages/cli --pretty`                                  | Zero export diagnostics.                                                               |
| 10    | JSR publish        | raw `deno publish --dry-run --allow-dirty --no-check=remote` in `packages/cli`               | Exit 0; no new warnings/slow types. No publication occurs.                             |
| 11    | JSR rubric         | `audit-jsr-package.ts --root packages/cli --text` plus no-text-import scan                   | No new touched-path findings; no text/JSON import attributes.                          |
| 12    | dependency/lock    | `deno why @netscript/sdk` plus `rtk git diff`                                                | Intended CLI → SDK edge only; no unrelated lock churn.                                 |
| 13    | merge readiness    | `rtk proxy deno task e2e:cli`                                                                | Supervisor/evaluator-owned final gate, not run per slice.                              |

Every implementation slice additionally runs `quality:scan` and `arch:check`, updates the nested
artifacts, commits, pushes with the explicit branch refspec, posts gate evidence to the draft PR,
and stops for Tier-A review.

## Risks

- Upstream Deno Desktop is experimental; the planner isolates all format/target assumptions and
  documentation links the tested Deno 2.9.3 behavior.
- Release authoring handles private signing keys. The feature accepts local files only, redacts
  failures, performs no network key lookup, and documents CI secret custody as external.
- Sequence state is security-sensitive. Strict monotonicity and safe write ordering are tested; this
  is release-authoring state, not the deferred client update journal.

## Dependencies

- #452 / G4: `AppEntry.PackageTaskName` and `desktop:package` convention.
- #841 / G2: `@netscript/sdk/auto-update` client, constants, target types, and manual event.
- Deno Desktop 2.9.3 native packaging and update contract.
- External bsdiff 4.x/qbsdiff-compatible executable; optional external zstd when requested.
- #457 for installed native E2E and #834/#825 for combined graph update/install.

## Drift Watch

- Upstream target/format list, `--all-targets` contents, compression prerequisites, or `.dmg` host
  constraint changes.
- SDK release URL/default/target constants change before implementation.
- Deno signed-envelope or patch entry shape changes.
- Windows #35269 closes and a released Deno version implements apply.
- Plan-Gate asks for a JSR export, storage backend, or beta.14 graph field; each materially changes
  the contract and must be recorded before implementation.
