# Worklog: service OpenAPI Scalar asset embed

## Run Metadata

| Field | Value |
| ----- | ----- |
| Run ID | `fix-service-openapi-asset-embed--asset-read` |
| Branch | `fix/service-openapi-asset-embed` |
| Archetype | `4 - Public DSL / Builder` |
| Scope overlays | `service` |

## Design

### Public Surface

- `createScalarJs(): ServiceHandler` — unchanged public primitive exported by `@netscript/service`.

### Domain Vocabulary

- `ServiceHandler` — existing Hono-compatible service handler type.
- `SCALAR_MIN_JS` — generated bundled Scalar API-reference JavaScript content.

### Ports

- None. This slice removes runtime filesystem IO from the handler.

### Constants

- `SCALAR_JS_CACHE_CONTROL` — unchanged response cache policy.
- `SCALAR_MIN_JS` — generated plain string constant.

### Commit Slices

| # | Slice | Gate | Files |
| - | ----- | ---- | ----- |
| 1 | Embed Scalar JS through the existing generated asset barrel mechanism and serve the constant from `createScalarJs()`. | service check, assets determinism, publish dry-run, release preflight, doc check, service tests, forbidden-pattern scan | `.llm/tools/generate-cli-assets-barrel.ts`, `packages/service/src/primitives/scalar.generated.ts`, `packages/service/src/primitives/openapi.ts`, `packages/service/deno.json`, `deno.json` |

### Deferred Scope

- Scalar asset size strategy remains accepted debt; this slice changes delivery safety, not bundled content.

### Contributor Path

To update the bundled Scalar asset, replace `packages/service/assets/scalar.min.js`, run
`deno task gen:assets-barrel`, and verify `deno task check:assets-barrel`.

## Progress Log

| Time | Slice | Step | Notes |
| ---- | ----- | ---- | ----- |
| 2026-06-28 | setup | branch | Created `fix/service-openapi-asset-embed` from `main` @ `057e27654e75d8ba782bff0bdc0624f3e29f828c`. |
| 2026-06-28 | research | confirm bug | Confirmed `openapi.ts` uses `Deno.readTextFile(scalarJsUrl)` from `import.meta.url` and `createScalarJs(): ServiceHandler` is public. |
| 2026-06-28 | 1 | implement | Added service generated asset target, generated `scalar.generated.ts`, and switched `createScalarJs()` to serve `SCALAR_MIN_JS`. |
| 2026-06-28 | 1 | gates | Requested wrapper command with explicit `--unstable-kv` exited 1 because the wrapper defaults to `--unstable-kv` and accepts `--deno-arg`/`--no-unstable-kv`; reran supported form successfully. |
| 2026-06-28 | follow-up lint | implement | CI quality lint flagged `require-await` in `createScalarJs()` because the handler no longer awaits. Confirmed `ServiceHandler = Handler`; changed only the returned handler from `async (c): Promise<Response>` to sync `(c): Response`. |
| 2026-06-28 | follow-up lint | gates | Reran lint, service check, service tests, doc signature, and lock diff check; all passed. |

## Decisions

| Decision | Reason | Source |
| -------- | ------ | ------ |
| Use plain generated string const | Locked JSR-safe asset mechanism; text imports are forbidden. | user task, jsr-audit, `.llm/tools/generate-cli-assets-barrel.ts` |
| Keep public function signature | Compatibility requirement. | `deno doc --filter createScalarJs packages/service/mod.ts` |

## Drift

| Drift | Severity | Logged in drift.md |
| ----- | -------- | ------------------ |
| Wrapper CLI does not accept explicit `--unstable-kv`; it passes `--unstable-kv` by default. | minor | yes |

## Gate Results

### Static Gates

| Gate | Command or check | Result | Notes |
| ---- | ---------------- | ------ | ----- |
| requested service check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/service --ext ts --unstable-kv` | FAIL | exit 1; wrapper reported `Unknown argument: --unstable-kv`. |
| service check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/service --ext ts` | PASS | exit 0; wrapper ran `deno check --quiet --unstable-kv <files>`, 35 files, 0 occurrences. |
| assets determinism | `deno task check:assets-barrel` | PASS | exit 0; regenerated and `git diff --exit-code` covered `packages/service/src/primitives/scalar.generated.ts`. |
| publish dry-run | `cd packages/service && deno task publish:dry-run` | PASS | exit 0; dry-run includes `src/primitives/scalar.generated.ts` (3.31MB), excludes raw `assets/scalar.min.js`; existing slow-types warning remains accepted debt. |
| release preflight | `deno task release:preflight` | PASS | exit 0; `release:preflight text-imports — PASS`, zero `openapi.ts` flags. |
| service tests | `cd packages/service && deno task test` | PASS | exit 0; 57 passed, 0 failed. |
| forbidden read | `git grep -nF "Deno.readTextFile" packages/service/src/primitives/openapi.ts` | PASS | zero matches; command exits 1 for no matches. |
| forbidden text import/new casts | `git diff -- '*.ts' | rg -n "^\\+.*\\bas\\b|with \\{ type: ['\\\"]text['\\\"] \\}"` | PASS | zero added casts and zero added text import attributes. |
| follow-up lint | `deno task lint` | PASS | exit 0; wrapper selected 1215 files in 7 batches, 0 total occurrences, 0 rules, 0 paths. |
| follow-up service check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/service --ext ts` | PASS | exit 0; `deno check --quiet --unstable-kv <files>`, 35 files, 0 occurrences. |
| follow-up service tests | `cd packages/service && deno task test` | PASS | exit 0; 57 passed, 0 failed. |
| follow-up public surface | `deno doc --filter createScalarJs packages/service/mod.ts` | PASS | exit 0; signature remains `function createScalarJs(): ServiceHandler`. |
| follow-up lock hygiene | `git diff --name-only origin/main -- deno.lock` | PASS | no output; `deno.lock` unchanged vs `origin/main`. |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| ---- | ------ | -------- | ----- |
| F-5 | PASS | `deno doc --filter createScalarJs packages/service/mod.ts` | exit 0; signature remains `function createScalarJs(): ServiceHandler`. |
| F-6 | PASS | `cd packages/service && deno task publish:dry-run` | exit 0 with existing accepted slow-types warning. |
| F-8 | PASS | service check wrapper | exit 0; 35 files checked with `--unstable-kv`. |
| F-14/F-15 | PASS | manual diff scan | No new `console.*`, upstream re-export, text import, or cast. |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| ---- | ------ | -------- | ----- |
| Handler behavior | PASS | `cd packages/service && deno task test` | 57 passed; static handler change only, no Aspire topology change. |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| -------- | ------ | -------- | ----- |
| service builder | PASS | service package check/tests | Builder uses `createScalarJs()` internally; package check and tests passed. |

## Handoff Notes

- Inspect `packages/service/src/primitives/openapi.ts` first: public signature should be unchanged,
  with no runtime asset read.
- Inspect `.llm/tools/generate-cli-assets-barrel.ts` and `deno.json` for determinism coverage.
- IMPL-EVAL should independently rerun release preflight and publish dry-run; do not treat this
  worklog as self-certification.
