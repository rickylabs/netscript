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
| format | `deno task fmt:check` | | |
| lint | `deno task lint` | | |
| type-check | `deno task check` | | |
| type-check (fresh-ui) | `cd packages/fresh-ui && deno task check` | | root `check` excludes fresh-ui |
| test | `deno task test` | | |
| specifier guard | `deno task check:netscript-jsr-specifiers` | | |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| ---- | ------ | -------- | ----- |
| `deno task arch:check` | | | |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| ---- | ------ | -------- | ----- |
| release-gate class | `N/A` | — | Not a release cut; no scaffold-output / DB / Aspire change. |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| -------- | ------ | -------- | ----- |
| emitted import map vs published JSR | | `/tmp/sdkprobe` | |

## Handoff Notes

- Inspect `registry-deno-json.ts` first: the `{key, value}` split is the defect and the fix.
- The version pin correction alone does **not** fix #953 — see the three probe rows in the progress
  log.
- PLAN-EVAL and IMPL-EVAL are `NOT_RUN`; both require a separate evaluator session.
