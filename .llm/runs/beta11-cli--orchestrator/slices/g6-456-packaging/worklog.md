# Worklog: G6 #456 native packaging and release server

## Run Metadata

| Field          | Value                                                                             |
| -------------- | --------------------------------------------------------------------------------- |
| Run ID         | `beta11-cli--orchestrator/slices/g6-456-packaging`                                |
| Branch         | `feat/desktop-frontend-456-packaging`                                             |
| Draft PR       | [#854](https://github.com/rickylabs/netscript/pull/854) → `feat/desktop-frontend` |
| Archetype      | `6 — CLI / Tooling`                                                               |
| Scope overlays | `service` for the release HTTP handler                                            |

## Design

### Public Surface

- `netscript deploy desktop package` — select an enabled desktop app and build a deterministic
  native artifact matrix through its `PackageTaskName`.
- `netscript deploy desktop release prepare` — generate bsdiff patches, compose/sign native
  `latest.json`, enforce route high-water, and stage optional native installers.
- `netscript deploy desktop release serve` — serve the prepared filesystem release root with native
  cache/content/security semantics.
- No new `@netscript/cli` JSR export. The file/HTTP contract is the public non-TypeScript surface.
- Intended 80% path:

  ```sh
  netscript deploy desktop package --app storefront --all-targets
  netscript deploy desktop release prepare \
    --channel stable --target linux-x86_64 \
    --version 1.2.0 --sequence 42 \
    --current-runtime dist/1.2.0/libdenort.so \
    --from 1.1.0=dist/1.1.0/libdenort.so \
    --private-key-file .secrets/update-ed25519.pem
  netscript deploy desktop release serve --release-dir .deploy/desktop/releases
  ```

### Domain Vocabulary

- `DesktopPackageTarget` — exhaustive Deno target triple plus SDK OS/architecture identity.
- `NativePackageFormat` — `app`, `dmg`, `appimage`, `deb`, `rpm`, or `msi`.
- `DesktopPackageRequest` — selected app/target/format/output/compression intent.
- `DesktopPackageInvocation` — pure planned task, cwd, native argv, and unique output artifact.
- `NativeReleasePatch` — prior version, relative patch name, and lowercase SHA-256.
- `NativeReleasePayload` — `manifestVersion`, monotonic `sequence`, target version, and Deno-native
  patches map.
- `SignedReleaseEnvelope` — exact signed JSON string plus base64 Ed25519 signature.
- `ReleaseRoute` — channel plus SDK-derived `<os>-<arch>` target.
- `ReleaseHighWater` — last accepted sequence for one route.
- `PreparedRelease` — immutable artifacts plus the envelope promoted to a route.

### Ports

- Existing `ProcessPort` — runs the configured desktop task and external bsdiff/zstd preflights.
- Existing filesystem composition seam, extended only if atomic replace/exclusive create cannot be
  expressed narrowly — reads config/runtime files, writes immutable artifacts, locks routes, and
  atomically replaces state/manifest.
- `ReleaseSigner` (internal behavior) — signs exact bytes; WebCrypto adapter imports PKCS#8 Ed25519.
- `ReleaseStore` (internal behavior) — high-water/immutable-write/atomic-manifest semantics; memory
  fake proves rules without disk races.
- `createReleaseRequestHandler` internal function — Request → Response over a read-only store; the
  CLI edge owns `Deno.serve` and AbortSignal lifecycle.

No public port, adapter, upstream type, or signing-key type is exported.

### Constants

- `NATIVE_PACKAGE_FORMATS` — six format identifiers, with extension/OS/host policy metadata.
- `DESKTOP_PACKAGE_COMPRESSION` — `none`, `xz`, `lzma`, `zstd`; default `xz`.
- `DENO_DESKTOP_TARGETS` — exhaustive mapping derived against SDK OS/architecture constants.
- `NATIVE_RELEASE_MANIFEST_VERSION` — numeric `1`.
- `RELEASE_CONTENT_TYPES` / cache directives — manifest, bsdiff, and installer behavior.
- `RELEASE_METADATA_DIRECTORY` — private non-served high-water/lock/temp area.

All finite values are TypeScript constants with derived unions. No text/JSON import attributes or
runtime-read embedded string assets are used.

### Commit Slices

| # | Slice                                                                                                                                                                                                              | Gate                                                                                                                                                                                | Files                                                                                                                                                                                                     |
| - | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 | Contract-first native package planner and CLI command: SDK-derived six-target matrix, format compatibility, task-hook config selection, explicit argv/output, compression/host preflight, parser tests, docs stub. | Focused planner/config/parser tests; full CLI tests; scoped check/lint/fmt; `quality:scan`; focused + root `arch:check`; dependency/lock inspection. | `packages/cli/deno.json` (+ lock only if Deno requires it), `src/public/features/deploy/target/desktop/package/**`, desktop group/deploy registration/dependencies, focused tests, README stub, nested artifacts |
| 2 | Native release contract: bsdiff adapter, SHA-256 composition, exact Ed25519 signed envelope, strict sequence high-water and safe filesystem promotion ordering. | Manifest/signature verification tests with generated keys; bsdiff fake; reject lower/equal/concurrent sequence tests; full CLI tests; scoped static; `quality:scan`; `arch:check`. | `src/public/features/deploy/target/desktop/release/{domain,signing,prepare,store}*`, focused tests, command wiring, nested artifacts |
| 3 | Release serving and SDK parity: hardened GET/HEAD handler, CLI lifecycle, release-root layout, URL-layout parity against `createReleaseClient`, installer hosting/manual event docs. | Handler traversal/cache/method/lifecycle tests; URL parity test; full CLI tests; scoped static; `quality:scan`; `arch:check`. | `src/public/features/deploy/target/desktop/release/{handler,server-command}*`, tests, dependencies/group wiring, docs, nested artifacts |
| 4 | Package/publication and handoff proof: complete CLI docs, external signing/notarization and Windows posture, full JSR rubric, no-text-import scan, full package gates, merge-readiness handoff.                    | Full CLI test dir; consumer/parser docs checks; doc lint; audit helper; raw publish dry-run; scoped wrappers; `quality:scan`; `arch:check`; `e2e:cli` left to supervisor/evaluator. | `packages/cli/README.md`, applicable CLI/how-to reference docs, doc refinements, nested `worklog.md` + `context-pack.md`                                                                                  |

Each implementation slice is contract-first and bounded. The mandatory cadence is commit →
`git push origin HEAD:refs/heads/feat/desktop-frontend-456-packaging` → PR gate-evidence comment →
pause for Tier-A review. No slice begins until the group Plan-Gate PASS is delivered by the
supervisor.

### Deferred Scope

- Native installed apply/rollback/manual-link E2E — #457.
- Combined graph payload fields, updater transaction, bootstrap, journal, releases/current layout,
  sidecars, and recovery — #834/#825 in beta.14.
- Automatic Windows swap — denoland/deno#35269.
- Native executable/installer signing and macOS notarization automation — external CI D4 posture.
- CDN/object storage, rollout rings, HSM/KMS, and production hosting — later deployment/release
  work.
- Release cuts, publication, tags, merges, issue/milestone closure — hard stop-lines.

### Contributor Path

Start at `src/public/features/deploy/target/desktop/desktop-group.ts` for the command boundary. Package
behavior flows through the pure target/format planner before the existing process port invokes the
app's configured task. Release preparation flows from the typed native payload composer through the
exact-string WebCrypto signer and high-water store. Serving is read-only through the request
handler. To add a future beta.14 graph release, define a typed payload that extends
`NativeReleasePayload` with named graph fields and reuse the signer/store/handler; do not add an
envelope or route family.

## Progress Log

| Time                  | Slice | Step                 | Notes                                                                                                                                           |
| --------------------- | ----- | -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-07-18 00:43 CEST | plan  | nested run activated | Named skills, run-loop, lane policy, archetype/service gates, doctrine, and templates read; branch confirmed at integration SHA.                |
| 2026-07-18 00:48 CEST | plan  | live re-baseline     | Read all three #456 amendments, PR #822, G2/G4 seams, current SDK docs/source, Deno docs/help/source, and Windows upstream issue.               |
| 2026-07-18 00:56 CEST | plan  | JSR baseline         | CLI doc lint and raw publish dry-run pass; pre-existing audit/dynamic-import baselines recorded.                                                |
| 2026-07-18 01:00 CEST | plan  | Design checkpoint    | Public commands, vocabulary, ports, constants, four commit slices, gates, and deferred beta.14 scope locked. No product implementation created. |
| 2026-07-18 01:03 CEST | plan  | draft PR bootstrap   | Plan commit `f1a0d6c3` pushed; draft PR #854 opened against integration with `Refs #456`, required labels, `status:plan`, and milestone 13.     |
| 2026-07-18 01:15 CEST | 1     | Plan-Gate PASS       | Tier-A supervisor approved D1–D21; public SDK-subpath parity and encoded traversal cases are mandatory later gates. Slice 1 begins.             |
| 2026-07-18 02:05 CEST | 1 | implementation | Added SDK-derived target/format contracts, pure invocation planner, #452 task-hook orchestration, CLI parser/group registration, docs, and 19 focused tests. |
| 2026-07-18 02:15 CEST | 1 | gate set complete | Full CLI 397/416; 698-file static gates, quality, root arch, doc/JSR/publish and import scans pass. Focused doctrine is baseline-only at deploy count 14. |
| 2026-07-18 02:18 CEST | 1 | reconciliation | Live #456/PR #854 swept; draft/base/body/labels/milestone correct, no new direction, status remains `status:impl`. |

## Decisions

| Decision                                                                  | Reason                                                                                                  | Source                                    |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| Option A governs thin-client packaging; L0 graph updater remains deferred | Latest owner-ratified issue/RFC amendment supersedes earlier sequencing while retaining one lineage.    | live #456, PR #822 F4                     |
| Deno is mechanism, not policy authority                                   | SDK client + signed release server own URL/trust/sequence/manual UX; Deno performs native effects only. | user stop condition, G2 D11, plan D10–D20 |
| Expand all targets into explicit invocations                              | Upstream omits Windows ARM64 and one output cannot encode the OS-format matrix.                         | current `cli/tools/desktop.rs`, plan D4   |
| Reuse native envelope and payload core                                    | Current Deno accepts trusted extra fields and ignores them; beta.14 can extend the same signed string.  | current `cli/rt/desktop.rs`, plan D12–D14 |
| Strict sequence, safe burn on crash                                       | Removes replay/idempotence ambiguity without importing an updater journal.                              | plan D16–D17                              |
| No new JSR export                                                         | CLI/file/HTTP contracts suffice and avoid growing the large root package surface.                       | doctrine, jsr-audit baseline, plan D21    |

## Drift

| Drift                                                                           | Severity    | Logged in drift.md |
| ------------------------------------------------------------------------------- | ----------- | ------------------ |
| Owner Option A supersedes old snapshot-first sequencing for window-only beta.11 | significant | yes                |
| Current native installer support is broader than older combined-MSI prose       | significant | yes                |
| Upstream `--all-targets` omits Windows ARM64 despite explicit target support    | significant | yes                |
| Feature nested under the existing deploy target axis                            | minor       | yes                |
| Dependency entry applied mechanically after Deno minimum-age guard              | minor       | yes                |

## Gate Results

### Static Gates

| Gate                     | Command or check                                                                            | Result             | Notes                                                                                  |
| ------------------------ | ------------------------------------------------------------------------------------------- | ------------------ | -------------------------------------------------------------------------------------- |
| Branch/base/tree         | raw/RTK git inspection                                                                      | PASS               | Branch already exists; HEAD exactly equals `origin/feat/desktop-frontend`; tree clean. |
| Required SDK inspection  | `deno doc packages/sdk/src/auto-update/mod.ts`; `deno doc --filter createReleaseClient ...` | PASS               | Completed before server URL design.                                                    |
| CLI export doc baseline  | `rtk proxy deno task doc:lint --root packages/cli --pretty`                                 | PASS               | 3 entrypoints; zero errors/private refs/missing JSDoc.                                 |
| CLI raw publish baseline | `deno publish --dry-run --allow-dirty --no-check=remote` in `packages/cli`                  | PASS_WITH_BASELINE | Exit 0; three existing unanalyzable dynamic-import warnings. No publication.           |
| Plan checkpoint push     | `git push origin HEAD:refs/heads/feat/desktop-frontend-456-packaging`                       | PASS               | Commit `f1a0d6c3`; draft PR #854 targets `feat/desktop-frontend`.                      |
| Slice-1 focused tests | `deno test --allow-all packages/cli/src/public/features/deploy/target/desktop/` | PASS | 19 passed, 4 steps, 0 failed. |
| Full CLI test directory | `deno task test` in `packages/cli` | PASS | 397 passed, 416 steps, 0 failed. |
| Scoped check/lint/fmt | repo wrappers, `--root packages/cli --ext ts,tsx` | PASS | 698 selected; zero findings. |
| Import attributes | targeted `rg` scan | PASS | No text/JSON import attributes. |

### Fitness Gates

| Gate                         | Result             | Evidence                                                 | Notes                                                                            |
| ---------------------------- | ------------------ | -------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Archetype/doctrine selection | PASS               | A6 + service overlay and doctrine verdict in plan        | No new export/package/service.                                                   |
| JSR helper baseline          | PASS_WITH_BASELINE | `audit-jsr-package.ts --root packages/cli --text` exit 0 | Existing vocabulary/cardinality warnings; known slow-type-banner false positive. |
| Plan/design completeness     | READY_FOR_REVIEW   | `research.md`, `plan.md`, this `## Design`               | Awaiting group Plan-Gate; no implementation allowed.                             |
| Quality scan | PASS | `deno task quality:scan --root packages/cli` | No findings; six existing allowances. |
| Focused doctrine | PASS_WITH_BASELINE | `check-doctrine.ts --root packages/cli` | Existing 46 FAIL/42 WARN; no touched-path finding; deploy remains baseline 14. |
| Root architecture | PASS | `deno task arch:check` | Exit 0. |
| JSR/doc/publish | PASS_WITH_BASELINE | doc runner, audit helper, raw dry-run | Doc lint zero; audit exit 0; three existing dynamic-import warnings. |

### Runtime Gates

| Gate                                | Result                 | Evidence                             | Notes                                                             |
| ----------------------------------- | ---------------------- | ------------------------------------ | ----------------------------------------------------------------- |
| Local Deno surface                  | PASS                   | Deno 2.9.3 `desktop --help`          | Six explicit targets and requested formats/options confirmed.     |
| Native signed payload compatibility | PASS (source research) | current upstream `cli/rt/desktop.rs` | Dynamic trusted payload parsing confirms compatible extra fields. |
| Product runtime tests               | PASS | focused + full CLI suites | 19 focused; full CLI 397/416. |

### Consumer Gates

| Consumer                 | Result              | Evidence                          | Notes                                 |
| ------------------------ | ------------------- | --------------------------------- | ------------------------------------- |
| #452 task-hook consumer  | PASS | focused config/orchestration tests | Configured and default task names generate exact native argv. |
| #841 URL/manual consumer | PASS (design proof) | SDK docs/source + G2 artifacts    | Parity/manual behavior belongs to S3. |

## Handoff Notes

- Review D4/D6 first: all-target expansion deliberately differs from upstream pass-through so every
  native artifact has an explicit unique output and Windows ARM64 is not lost.
- Review D12–D17 next: the signed payload is native-first, the graph lineage is a strict future
  superset, and high-water ordering is security-safe without beta.14 journal machinery.
- Confirm the four slices remain inside #456 and that real installed E2E stays #457.
- No implementation, evaluator dispatch, merge, release action, or milestone action has occurred.
