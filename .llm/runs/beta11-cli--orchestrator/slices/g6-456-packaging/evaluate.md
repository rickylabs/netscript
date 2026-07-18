# Evaluation: G6 #456 — native desktop packaging and release server

- **Evaluator session:** IMPL-EVAL (separate from generator), 2026-07-18
- **Evaluator identity:** OpenRouter `qwen/qwen3.7-max` on the `formal_evaluation` lane (the
  opposite-family open-model pass — adversarial to both the Codex Sol-high generator thread
  `019f7240-95fd…` and the Fable 5 supervisor).
- **Run:** `beta11-cli--orchestrator/slices/g6-456-packaging`
- **Surface / archetype:** Archetype 6 (CLI / Tooling) with service overlay for the bounded HTTP
  release handler.
- **Branch:** `feat/desktop-frontend-456-packaging` → `feat/desktop-frontend`
- **Baseline:** `e6e1be087722746b83b1835e29f265adc40db991` (integration SHA before group work).
- **Draft PR:** #854. Body uses `Refs #456` (by design — no closing keyword on a sub-PR whose
  umbrella epic #840 owns the close-gate).

## Process Verification

| Check                                  | Result | Evidence                                                                                    |
| -------------------------------------- | ------ | ------------------------------------------------------------------------------------------- |
| Plan-Gate passed before implementation | PASS   | `plan-eval.md` verbatim: `PASS`, delivered by the Tier-A Fable 5 supervisor before slice 1. |
| Design section exists in worklog       | PASS   | `worklog.md` `## Design` with Public Surface, Domain Vocabulary, Ports, Constants, Slices.   |
| Commit slices match design plan        | PASS   | Four commits `ffb7e896`/`cc52e487`/`ef0c585b`/`aec91eb8` map 1:1 to S1–S4 in `worklog.md`. |
| Each slice has a passing gate          | PASS   | Gate Results tables in `worklog.md` show per-slice focused+full CLI+static+quality gates.   |
| No speculative seams (unused files)    | PASS   | 23 production sources + 10 tests; every file is referenced by at least one focused test.    |
| Constants used for finite vocabularies | PASS   | `NATIVE_PACKAGE_FORMATS`, `DESKTOP_PACKAGE_COMPRESSION`, `DENO_DESKTOP_TARGETS`, `RELEASE_MANIFEST_VERSION`, `PUBLIC_ARTIFACT_EXTENSIONS`, `RELEASE_CONTENT_TYPES` — no runtime-read embedded text/JSON assets. |

## Scope Re-verification (independent of the generator's claims)

### Option-A scope honored (Option A supersedes the older snapshot-updater design)

| Forbidden concept                      | Grep command / pattern                                                                                                  | Result   |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | -------- |
| journal                                | `rg -i 'journal'` on the desktop feature tree                                                                           | 0 hits   |
| bootstrap                              | `rg -i 'bootstrap'`                                                                                                     | 0 hits   |
| release-dir-swap / `current` link swap | `rg 'release[- ]dir[- ]swap\|current.*link.*switch'`                                                                    | 0 hits   |
| recovery unit                          | `rg 'recovery.unit'`                                                                                                    | 0 hits   |
| combined artifact / sidecar            | `rg 'combined.artifact\|sidecar'`                                                                                       | 0 hits   |
| graph manifest                         | `rg 'graph.manifest'`                                                                                                   | 1 comment hit in `native-release-contract.ts:14` — forward-reference JSDoc noting beta.14 will extend the payload; no machinery. |
| `Deno.autoUpdate` invocation           | `rg 'Deno\.autoUpdate' packages/cli/src/public/features/deploy/target/desktop/`                                         | 0 hits   |

Windows fake auto-apply check: `rg 'auto.*apply\|auto-apply'` on the desktop feature tree returned **0 hits**. The README explicitly states: *"Windows native apply remains unsupported upstream. Applications must handle the public SDK seam's `applyMode: 'manual'` update-ready event and present its trusted `manualUpdateUrl`; this server may host the installer, but it does not claim or emulate automatic Windows replacement."* — D20 truthful.

### Snapshot-updater code absence is not a documentation claim

The Option-A re-scope explicitly **excludes** bootstrap, journal, release-dir transaction, current-link switching, recovery units, combined artifacts, sidecars, graph manifests — all beta.14 scope. The implementation never invokes `Deno.autoUpdate`. NetScript's signed server, sequence policy, and SDK seam remain authoritative; Deno is mechanism only. The graph-superset comment in `native-release-contract.ts:14` ("Native trusted payload; later graph manifests extend this object") is a JSDoc note that matches plan D14 (preserve one lineage without inventing beta.14 fields).

### deno.lock delta

```
+  "jsr:@netscript/sdk@^0.0.1-beta.10",
```

**Exactly one line added** — the CLI's new SDK dependency. `packages/cli/deno.json` gained the matching `"@netscript/sdk": "jsr:@netscript/sdk@^0.0.1-beta.10"` workspace import. Total lock diff: +1 / −0 lines. No unrelated churn.

## Static Gates (run independently by this evaluator)

| Gate                          | Command                                                                                       | Result             | Evidence                                                                                                       | Notes                                                                                                         |
| ----------------------------- | --------------------------------------------------------------------------------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Scoped typecheck              | `.llm/tools/run-deno-check.ts --root packages/cli --ext ts,tsx`                               | PASS               | `{"filesSelected":712,"batches":6,"failedBatches":0}` — 0 diagnostics.                                         | Wrapper includes `--unstable-kv`.                                                                             |
| Scoped lint                   | `.llm/tools/run-deno-lint.ts --root packages/cli --ext ts,tsx`                                | PASS               | `{"filesSelected":712,"batches":4}` — 0 total/unique/rules/paths.                                              |                                                                                                               |
| Scoped format                 | `.llm/tools/run-deno-fmt.ts --root packages/cli --ext ts,tsx`                                 | PASS               | `{"filesSelected":712,"batches":4,"failedBatches":0,"findings":0}`.                                            |                                                                                                               |
| Full CLI test directory       | `deno task test` inside `packages/cli`                                                        | PASS               | `411 passed (424 steps) \| 0 failed` in 16s.                                                                   | Supersedes generator's last S3 count of 411/424 — stable.                                                     |
| Focused desktop tests         | `deno test --allow-all packages/cli/src/public/features/deploy/target/desktop/`               | PASS               | `33 passed (12 steps) \| 0 failed` in <1s — incl. sign, store, handler, parity, traversal, parser fixtures.   | Every plan-required adversarial test present.                                                                 |
| `quality:scan`                | `deno task quality:scan --root packages/cli`                                                  | PASS_WITH_BASELINE | `{"ok":true,"findings":[],"allowCount":6}` — six pre-existing allowances in `public-api.ts` + `root/`.         | No findings introduced by G6.                                                                                 |
| Root `arch:check`             | `deno task arch:check`                                                                        | PASS               | Exit 0. Baseline warnings in plugin-worker/triggers/ai-core and the three `export default` findings in `ai/`. | G6's CLI package carries only documented baseline findings — none attributable to touched paths.               |
| `doc:lint`                    | `deno task doc:lint --root packages/cli --pretty`                                             | PASS               | `totalErrors=0, totalPrivateTypeRef=0, totalMissingJSDoc=0` across 3 entrypoints (`mod.ts`, `scaffolding.ts`, `testing.ts`). |                                                                                                               |
| JSR raw publish simulation    | `cd packages/cli && deno publish --dry-run --allow-dirty --no-check=remote`                   | PASS_WITH_BASELINE | `Success Dry run complete` — exit 0, three documented pre-existing dynamic-import warnings. No publication.    |                                                                                                               |
| No-text-import scan           | `grep -rE ... with \{.*type:\s*['"]text\|json['"]' desktop/...`                               | PASS               | 0 matched import statements; only string-literal matches of the word `latest.json` inside file-path logic.     | Plan D21 honored; no text/JSON import attributes, no runtime-read embedded assets.                             |
| Dependency direction          | `deno.json` diff vs baseline                                                                  | PASS               | Exactly one new `"@netscript/sdk"` workspace import on the CLI side; no new public CLI export was introduced. | Plan D21: "No new `@netscript/cli` export is added" honored.                                                  |

## Fitness Gates

| Gate                          | Result             | Evidence                                                                                        | Violations |
| ----------------------------- | ------------------ | ----------------------------------------------------------------------------------------------- | ---------- |
| F-1 / F-10 (file/test size)   | PASS               | Source files stay within doctrine cap (largest `package-desktop.ts` 197 LOC; tests ≤ 275 LOC).  | none       |
| F-2 / F-3 / F-4 (layering)    | PASS               | Feature stays inside `src/public/features/deploy/target/desktop/`; uses only existing ports and SDK surface. | none       |
| F-5 / F-6 / F-7 (JSR/docs)    | PASS               | Doc lint zero; publish dry-run zero errors; three pre-existing dynamic-import warnings only.    | none       |
| F-9 (permissions/docs)        | PASS               | README documents net/read/write/run permissions, `zstd`/`bsdiff`, external `signtool`/notarization, HTTPS-only public URLs. | none       |
| F-11/F-12 (input validation)  | PASS               | Planner rejects unknown target/format/compression, conflicting selectors, non-macOS `.dmg` host, non-desktop / disabled apps, escaped `--channel`/segment chars. | none       |
| F-13 (service/runtime)        | PASS               | Abortable `serve` lifecycle via `AbortSignal`; handler is GET/HEAD only; no indefinite test loops; store uses exclusive `tryLock(true)`. | none       |
| F-14/15/17/18/19              | PASS               | No cycles, no deep cross-package paths, no new `export default` in G6, no sub-barrel created, scoped source runners green. | none       |

## Runtime Gates (run independently by this evaluator)

| Gate                                                | Result | Evidence                                                                                                                                         |
| --------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Exact-bytes Ed25519 envelope (WebCrypto)            | PASS   | `sign-release_test.ts` generates a real WebCrypto Ed25519 keypair, signs an exact JSON string, re-verifies with `new TextEncoder().encode(envelope.signed)`. Both the raw-string and the payload-composer tests pass. |
| PKCS#8 PEM import + round-trip                      | PASS   | `importReleasePrivateKey(decodePkcs8Pem(pem))` re-imports an exported pkcs8 key; signature still verifies against the original public key.        |
| Strict monotonic high-water                         | PASS   | `release-store_test.ts` — after promoting sequence `5`, a second `promote(5)` and `promote(4)` both raise `sequence-rejected`. High-water file shows `5\n`. |
| Concurrency single-winner                           | PASS   | `Promise.allSettled([promote(8), promote(9)])` — exactly 1 fulfilled, 1 rejected. Exclusive `tryLock(true)` per route.                            |
| Crash-burn sequence                                 | PASS   | After writing immutable bsdiff and high-water atomically, a forced failure to write `latest.json` burns the sequence (12); retry with 12 is `sequence-rejected` while the on-disk patch and high-water remain. |
| Corrupt high-water fails closed                     | PASS   | Writing `12-corrupt\n` to high-water causes any subsequent `promote` to raise `store-failed`.                                                    |
| Encoded `%2e%2e`/`%2f`/`%2E%2E`/`..%2f`             | PASS   | Handler returns ≥ 400 for every encoded traversal path; also checks case-folding `%2F` vs `%2f`.                                                 |
| Private directory rejection                         | PASS   | `/stable/linux-x86_64/.release-state` → 4xx (fails `safeSegment`, starts with `.`).                                                              |
| Invalid target rejection                            | PASS   | `/stable/not-a-target/latest.json` → 4xx (fails `validTarget` against SDK OS×arch cartesian product).                                            |
| Non-allowlisted extension                           | PASS   | `/stable/linux-x86_64/secret.txt` → 4xx (`.txt` not in `PUBLIC_ARTIFACT_EXTENSIONS`).                                                            |
| Resolve-under-root                                  | PASS   | `resolveReleaseFileUnderRoot('/release', '../private', 'linux-x86_64', 'latest.json')` returns `undefined`.                                      |
| Symlink escape via `Deno.realPath`                  | PASS   | Fixture creates a symlink from `escape.bsdiff` to a file outside the root — handler returns 404.                                                 |
| URL parity against public `createReleaseClient`     | PASS   | Handler test **imports `@netscript/sdk/auto-update`** (the public subpath) and drives a **real** handler request against `client.updateUrl/latest.json` with a `basePath` option — status 200. |
| Handler cache/CSP contract                          | PASS   | `latest.json` returns `no-store`; bsdiff returns `public, max-age=31536000, immutable`; `x-content-type-options: nosniff`; HEAD returns correct `content-length` with empty body; unsupported methods return 405 with `allow: GET, HEAD`. |

## Consumer Gates

| Consumer                          | Result | Evidence                                                                                                            |
| --------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------- |
| #452 task-hook consumer           | PASS   | Focused tests: configured `PackageTaskName` and default `desktop:package` both generate exact argv, correct cwd.    |
| #841 URL + manual-event consumer  | PASS   | URL parity test imports SDK; README wires `applyMode: "manual"` and `manualUpdateUrl`; no automatic-apply claim.    |

## Anti-Pattern Check

Only `CLEAR` when this run's scope touches the pattern. Every remaining AP is `N/A`.

| AP    | Status | Evidence                                                                                                 | Notes                                                                                 |
| ----- | ------ | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| AP-1  | CLEAR  | 23 source files; largest is 197 LOC. Release handler grouped under `release/server/` per the drift log.   | Doctrine-cap `WARN` avoided by regrouping.                                            |
| AP-2  | CLEAR  | Adapter seams (`decodePkcs8Pem`, `writeImmutable`, `atomicWriteText`, `resolveReleaseFileUnderRoot`) all add justified crypto/fs/URL seams, not renames. |                                                                                       |
| AP-7  | CLEAR  | Cliffy options flow into readonly DTOs (`PackageDesktopInput`, `PromoteReleaseRequest`); no positional ladder. |                                                                                       |
| AP-8  | CLEAR  | `PackageDesktopDependencies` / `PrepareReleaseDependencies` / `ServeReleaseDependencies` explicit; no container. |                                                                                       |
| AP-9  | CLEAR  | Reuses existing `ProcessPort`/`FileSystemPort`; only crypto/store/handler are new.                        |                                                                                       |
| AP-11 | CLEAR  | No module-load config, server, key read, or filesystem mutation outside tested command edges.            |                                                                                       |
| AP-12 | CLEAR  | Deno process, filesystem, WebCrypto, and `Deno.serve` confined to named adapters and command edges.     |                                                                                       |
| AP-13 | CLEAR  | All errors are `NativeReleaseError`/`DesktopPackageError`/`TypeError` with typed codes; no `console.*`.   |                                                                                       |
| AP-14 | CLEAR  | SDK types/constants (e.g. `AutoUpdateArchitecture`) consumed but never re-exported from the CLI.        |                                                                                       |
| AP-15 | CLEAR  | Names are `DesktopPackage`, `NativeRelease`, `ReleaseStore`, `ReleaseSigner` — no `I*`/`Impl` vocabulary. |                                                                                       |
| AP-18 | CLEAR  | Semantic argv/payload/route/signature assertions; no giant snapshots.                                    |                                                                                       |
| AP-19 | CLEAR  | README permission and external-tool table; HTTPS-only URLs; bsdiff/zstd/signtool documented.            |                                                                                       |
| AP-22 | CLEAR  | No new `@netscript/cli` subpath, no internal convenience barrel, no JSR export.                         | Plan D21 honored.                                                                     |
| AP-25 | CLEAR  | Time, process, crypto, filesystem, platform, and server effects are injected or at adapter edges.        |                                                                                       |

## Arch-Debt Delta

| Metric               | Count | Evidence                                                                                              |
| -------------------- | ----- | ----------------------------------------------------------------------------------------------------- |
| New entries          | 0     | `drift.md` records six plan/implementation reconciliations, not debt.                                 |
| Resolved entries     | 0     | N/A.                                                                                                  |
| Deepened violations  | 0     | Focused doctrine scan (`worklog.md` final entry, slice 4) shows `baseline FAIL=46`, `WARN=42` — no touched-path new finding. |
| Unrecorded violations| 0     | None observed.                                                                                        |

## Findings

| Severity | Finding | Evidence | Required action |
| -------- | ------- | -------- | --------------- |
| —        | none    | —        | —               |

## Lessons for Promotion

| Lesson                                      | Pattern                                                                                                     | Applies to          | Confidence |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ------------------- | ---------- |
| Regroup early once doctrine cap approaches  | Moving handler/transport files under `release/server/` restored baseline WARN count in the focused scan.    | A6 (CLI/Tooling)    | high       |
| Option A is the live scope for beta.11      | Older L0 snapshot-updater prose in `#456`'s original body is superseded by the latest owner-ratified amendments; drift log entries must name the older source. | every beta.11 slice | high       |

## Hard Stop-Lines Acknowledged

1. Merge requires CI green + opposite-family eval PASS on the PR. Owner granted standing beta-11 merge authorization (2026-07-17 in-turn) once that bar is met.
2. HARD STOP before any release publish (`release:cut`, JSR publish, tag push, canary or stable) — owner sign-off in-turn only; a stale or relayed approval does not count.
3. HARD STOP before closing milestone 13 — owner sign-off only.
4. These stop-lines are repeated verbatim in EVERY sub-agent brief. A sub-brief without the stop-lines section is invalid.
5. The #824 seed run is drafts-only until owner ratification; its board filing needs the owner in-turn.

This evaluator session did not merge, publish, tag, cut a release, close a milestone, or modify files beyond writing this one evaluate record.

## Verdict

| Field     | Value                                                                                                                                         |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Verdict   | **PASS**                                                                                                                                      |
| Rationale | Plan scope is complete, the four slices map cleanly to the plan gates, and every required adversarial/cryptographic/sequence/handler/parity test exists and passes in an independent re-run. Scope discipline is tight: snapshot-updater machinery and `Deno.autoUpdate` invocation are absent. The PR uses `Refs #456` by design. deno.lock delta is exactly the one intended SDK line. No doctrine, debt, or gate exception requires rescope or debt bookkeeping. Ready for CI green + merge under the standing beta-11 merge authorization. |

PASS
