# Worklog: fresh-ui registry SDK subpath dependencies (#953 / #956)

## Run Metadata

| Field          | Value                               |
| -------------- | ----------------------------------- |
| Run ID         | `fix-freshui-registry-sdk-pin--953` |
| Branch         | `fix/freshui-registry-sdk-pin`      |
| Archetype      | `6 - CLI / Tooling`                 |
| Scope overlays | `frontend`                          |

## Design

### Public Surface

- `importEntryForDependency(specifier: string): ImportMapEntry | undefined` — exported from
  `packages/cli/src/kernel/application/ui/registry-deno-json.ts`. The single definition of the
  import-map entry a registry dependency contributes. Internal to the CLI kernel; not part of the
  published CLI surface.
- `mergeDenoJsonImports(...)` — unchanged signature.
- `scanNetscriptJsrSpecifiers(roots, cwd)` — unchanged signature; the result gains `staleVersions`,
  `unknownExports`, and `ranges`.

### Domain Vocabulary

- `ImportMapEntry` — `{ key: string; value: string }`, the bare-specifier alias plus the JSR/npm
  specifier it maps to. Named because "the key" and "the value" were previously derived in two
  places from two different rules; that split is the defect.
- `NetscriptWorkspacePackage` — `{ name, version, exports }` read from a workspace member's
  `deno.json`; the authority the guard checks a pin against.
- `StaleVersionFinding` — an exact `@netscript/*` pin whose version ≠ the workspace member's.
- `UnknownExportFinding` — a specifier whose subpath is not an export of that member.
- `RangeSpecifierNote` — a range-pinned `@netscript/*` specifier; reported, never failed (D4).

### Ports

None. The CLI change is inside an existing module that already consumes `FileSystemPort`; the guard
reads the filesystem directly, as its siblings under `.llm/tools/validation` do. Adding a port here
would be AP-9.

### Constants

- `PREACT_IMPORTS` — existing; unchanged.
- `NETSCRIPT_JSR_PREFIX`, `ALLOW_MARKER`, `MCP_PUBLISH_ASSETS`, `DEFAULT_ROOTS` — existing guard
  constants; unchanged.
- `WORKSPACE_MANIFEST` — `'deno.json'`, the member manifest filename the guard resolves versions
  and exports from.

### Commit Slices

| # | Slice | Gate | Files |
| - | ----- | ---- | ----- |
| 1 | Run-dir bootstrap: research, plan, design, drift, context pack. | — (artifact commit) | `.llm/runs/fix-freshui-registry-sdk-pin--953/**` |
| 2 | `ui:add`/`ui:remove` emit a resolvable import-map entry for subpath dependencies. | `deno test packages/cli/src/kernel/application/ui/` | `registry-deno-json.ts`, `registry.ts`, `registry-deno-json_test.ts` |
| 3 | fresh-ui manifest pins the current SDK release. | `cd packages/fresh-ui && deno task check` | `registry.manifest.ts` |
| 4 | The specifier guard proves version currency and export existence, not just shape. | `deno task check:netscript-jsr-specifiers`, `deno test .llm/tools/validation/` | `check-netscript-jsr-specifiers.ts`, `check-netscript-jsr-specifiers_test.ts` |
| 5 | Full gate set + PR finalisation. | see Gate Results | run dir |

### Deferred Scope

- Range-pinned `@netscript/*` specifiers — reported by the guard, refactor carried by a follow-up
  issue (plan § Non-Scope, D4).
- Auto-rewriting stale pins during `version:bump` — `replaceVersionFiles` is a blind whole-file
  `replaceAll` and is unsafe over arbitrary `.ts`.

### Contributor Path

To add a registry item that depends on a new JSR subpath: add the dependency to
`packages/fresh-ui/registry.manifest.ts` using the **current** release version and a real export
subpath. `deno task check:netscript-jsr-specifiers` will tell you if either is wrong — it names the
file, line, the version it found, and the version or export list it expected. No CLI change is
needed: `importEntryForDependency` already normalises any subpath to the package root.

## Progress Log

| Time | Slice | Step | Notes |
| ---- | ----- | ---- | ----- |
| 2026-07-31 | — | reproduce | `/tmp/sdkprobe`: map `@netscript/sdk` → `jsr:@netscript/sdk@0.0.1-beta.10/desktop`, import `@netscript/sdk/desktop` → `error: Unknown export './desktop/desktop' for '@netscript/sdk@0.0.1-beta.10'`; exports list contains neither `./desktop` nor `./auto-update`. |
| 2026-07-31 | — | reproduce | Same probe at `@0.0.1-beta.11/desktop` → `error: Unknown export './desktop/desktop' for '@netscript/sdk@0.0.1-beta.11'` (exports list *does* contain `./desktop`). Version fix alone is insufficient. |
| 2026-07-31 | — | reproduce | Same probe with value `jsr:@netscript/sdk@0.0.1-beta.11` (package root) → `Check main.ts`, clean. D1 confirmed. |
| 2026-07-31 | 1 | commit | `447b9ff35` run-dir bootstrap; draft PR #957 opened, labels applied. |
| 2026-07-31 | 2 | commit | `cf73024ef` `importEntryForDependency` + merge/prune symmetry. Gate: 12 passed / 0 failed. New test failed before the fix (`has no exported member 'importEntryForDependency'`). |
| 2026-07-31 | 3 | commit | `ec7166488` manifest pins → beta.11 + two manifest-coupled lifecycle tests. Reverted the pins to prove the tests fail (`3 passed, 2 failed`), then restored (`14 passed, 0 failed`). |
| 2026-07-31 | 4 | commit | `2fe7c4a14` guard rules. Reverting one pin makes the guard emit `FAIL JSR-NETSCRIPT-CURRENT … pinned 0.0.1-beta.10, this workspace ships 0.0.1-beta.11`, exit 1. |
| 2026-07-31 | 4 | reconcile | The first draft added the guard as a separate `prepareRelease` gate. `deno task test` surfaced that `publish-readiness.ts` already consumes `scanNetscriptJsrSpecifiers` — the release gate has a home. Moved the strengthening there and dropped the duplicate. |
| 2026-07-31 | 4 | commit | `a34f4db50` `publish:readiness` fails on stale pins and unexported subpaths; range pins land in the check's evidence details. |
| 2026-07-31 | 5 | gate | Full gate set run — see Gate Results. |

### Reconcile notes

- **S1** — #953 and #956 confirmed open and unmilestoned; PR #957 carries `Closes` for both, which is
  correct: this run resolves the whole of #953 and the fresh-ui/scaffold half of #956, and #956's
  third observation (MCP at beta.9) does not reproduce on `main`, so nothing of it is left open.
- **S2** — no new issue/PR comments. Discovered that `removeUiRegistryItem` matches imports by raw
  specifier; folded pruning symmetry into the same slice rather than deferring it (plan § Hidden
  Scope anticipated this).
- **S3** — no new comments. No plan change.
- **S4** — plan amended in place: the release-side gate moved from `prepare-release.ts` to
  `publish-readiness.ts` (see the reconcile row above). Range-pin skew logged in `drift.md` and
  carried to a follow-up issue rather than fixed here.
- **S5** — no new comments. Gate results recorded below.

## Decisions

| Decision | Reason | Source |
| -------- | ------ | ------ |
| Normalise the import-map value to the package root | One entry serves root + every subpath; matches Deno import-map behaviour | plan D1, executed probe |
| Extend the existing specifier guard | Already scans the right roots and already runs in `ci:quality` | plan D2 |
| Compare against the workspace member's own version | Names the disagreeing package precisely | plan D3 |
| Report range pins, never fail them | They resolve correctly today; converting them is a policy change | plan D4 |

## Drift

| Drift | Severity | Logged in drift.md |
| ----- | -------- | ------------------ |
| Filed root cause (stale pin) is necessary but not sufficient; a second version-independent defect in the import-map merge is the actual blocker | significant | yes |
| #956's "MCP advertises beta.9" does not reproduce on `main` | minor | yes |
| Single-session run cannot produce PLAN-EVAL / IMPL-EVAL verdicts | significant | yes |

## Gate Results

### Static Gates

| Gate | Command or check | Result | Notes |
| ---- | ---------------- | ------ | ----- |
| format | `deno task fmt:check` | `PASS` | `filesSelected=1869 findings=0` |
| lint | `deno task lint` | `PASS` | `filesSelected=1724 occurrences=0`. The root `lint.exclude` covers `packages/cli/` and `.llm/`, so this task lints neither of the two roots this run changed — a repo-wide policy, not a gap introduced here. |
| type-check | `deno task check` | `PASS` | uncached wrapper run: `filesSelected=2458 batches=21 failedBatches=0 occurrences=0` |
| type-check (fresh-ui) | `cd packages/fresh-ui && deno task check` | `PASS` | root `check` excludes fresh-ui |
| test | `deno task test` | `PASS` | `2243 passed (507 steps) / 0 failed / 12 ignored` in 3m15s |
| specifier guard | `deno task check:netscript-jsr-specifiers` | `PASS` | `scanned=2206 allowances=1 ranges=18 failures=0` |
| scaffold pins | `deno task check:scaffold-versions` | `PASS` | `E-12 OK — 11 scaffold pin(s) are stable` |
| code quality | `deno task quality:scan` | `PASS` | `ok:true findings:[] allowCount:7` (all pre-existing) |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| ---- | ------ | -------- | ----- |
| `deno task arch:check` | `PASS` | exit 0; every package reports `FAIL=0` | Pre-existing WARN/INFO rows only (e.g. `ai` README fences, `src/ports` cardinality); none introduced by this run. |
| F-5 Public surface audit | `PASS` | `importEntryForDependency` is exported from a `kernel/application` module, reachable from `registry.ts` and its test; no published-surface change. |
| F-6 JSR publishability | `PASS` | `deno task publish:dry-run` → `Success Dry run complete`, exit 0 |
| F-10 Test-shape audit | `PASS` | 14 new behavioural assertions; no snapshots of generated strings. |
| F-19 Scoped source gate runners | `PASS` | `run-deno-check` / `run-deno-fmt` / `run-deno-lint` over `packages/cli/src/kernel/application/ui` — 8 files, 0 findings each. |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| ---- | ------ | -------- | ----- |
| release-gate class | `N/A` | — | Not a release cut; no scaffold-output / DB wiring / Aspire helper change. `ui:add` is outside the `scaffold.runtime` suite. |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| -------- | ------ | -------- | ----- |
| emitted import map vs published JSR | `PASS` | `/tmp/sdkprobe` | `{"@netscript/sdk": "jsr:@netscript/sdk@0.0.1-beta.11"}` + `import … from '@netscript/sdk/desktop'` → `Check main.ts`. The two pre-fix shapes both error. |

### Evaluator Gates

| Gate | Result | Notes |
| ---- | ------ | ----- |
| PLAN-EVAL (`plan-eval.md`) | `NOT_RUN` | Requires a separate session (`run-loop.md` §4). Not self-certified. |
| IMPL-EVAL (`evaluate.md`) | `NOT_RUN` | Requires a separate session (`run-loop.md` §7). PR stays at `status:impl`. |

## Handoff Notes

- Inspect `registry-deno-json.ts` first: the `{key, value}` split is the defect and the fix.
- The version pin correction alone does **not** fix #953 — see the three probe rows in the progress
  log.
- PLAN-EVAL and IMPL-EVAL are `NOT_RUN`; both require a separate evaluator session.
