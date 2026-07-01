# Plan: service OpenAPI Scalar asset embed

## Run Metadata

| Field | Value |
| ----- | ----- |
| Run ID | `fix-service-openapi-asset-embed--asset-read` |
| Branch | `fix/service-openapi-asset-embed` |
| Phase | `impl` |
| Target | `packages/service` |
| Archetype | `4 - Public DSL / Builder` |
| Scope overlays | `service` |

## Archetype

`@netscript/service` is listed in the doctrine verdict table as Archetype 4. This slice does not add
builder behavior; it preserves an existing primitive exported through the builder package and changes
only how a bundled runtime asset is served.

## Current Doctrine Verdict

`@netscript/service`: Refactor. Headline action: `presets/` named, `assets/` clarified. Existing
accepted debt tracks the large Scalar asset delivery strategy and the service package slow-type
publish carve-out.

## Axioms in Play

| Axiom | Why it matters |
| ----- | -------------- |
| A1/A2 | `createScalarJs()` is public; its signature and caller behavior stay unchanged. |
| A6/A7 | Do not invent a new asset helper; reuse the existing generated string-const mechanism. |
| A8/A9 | Generated source lives with the primitive that consumes it and follows existing package shape. |
| A14 | Publish, doc, preflight, check, and unit tests are the proof. |

## Goal

Make `@netscript/service` `createScalarJs()` JSR-safe by embedding `scalar.min.js` as a generated
plain string constant and removing the request-time `Deno.readTextFile` path read.

## Scope

- Add service output support to `.llm/tools/generate-cli-assets-barrel.ts`.
- Generate `packages/service/src/primitives/scalar.generated.ts`.
- Update `packages/service/src/primitives/openapi.ts` to serve `SCALAR_MIN_JS`.
- Drop `assets/scalar.min.js` from the service publish include.
- Extend root `check:assets-barrel` determinism coverage to the service generated file.

## Non-Scope

- No public API, export, route, content type, or cache-control change.
- No redesign of Scalar delivery size debt.
- No text imports, import attributes, or new runtime file reads.

## Hidden Scope

- Generated file determinism must be byte-stable through `deno task check:assets-barrel`.
- The raw asset remains on disk as the generator source even though it no longer publishes.

## Locked Decisions

| ID | Decision | Rationale |
| -- | -------- | --------- |
| D-1 | Embed Scalar JS as a generated plain string constant in `scalar.generated.ts`. | This mirrors the repo's locked CLI/plugin/Fresh UI mechanism and publishes cleanly to JSR. |
| D-2 | Remove `scalarJsUrl`, `scalarJsCache`, and `Deno.readTextFile` from `openapi.ts`. | JSR `https:` consumption cannot read an `import.meta.url`-derived non-file URL through `Deno.readTextFile`. |
| D-3 | Keep `createScalarJs(): ServiceHandler` identical. | Public surface compatibility is required. |
| D-4 | Drop `assets/scalar.min.js` from `publish.include`; rely on `src/**/*.ts` for the generated source. | The raw asset is no longer needed in the published tarball. |
| D-5 | Extend `check:assets-barrel` to include the service generated output. | Determinism gate must cover every generated asset barrel. |

## Open-Decision Sweep

| Decision | Status | Notes |
| -------- | ------ | ----- |
| Asset embedding form | resolved | Plain string const only. |
| Publish include shape | resolved | Minimal change: remove raw asset; `src/**/*.ts` already covers generated file. |
| Handler sync vs async | safe to defer | Either matches `ServiceHandler`; implementation may keep `async` to avoid type churn. |

## Risk Register

| Risk | Mitigation |
| ---- | ---------- |
| Generated 3.3 MB string creates formatting or determinism drift. | Write via existing `formatTypeScript()` and prove with `deno task check:assets-barrel`. |
| Publish tarball misses the embedded asset. | Generated file lives under `src/**/*.ts`; prove with `cd packages/service && deno task publish:dry-run`. |
| Release preflight still flags `openapi.ts`. | Remove all `Deno.readTextFile`/`import.meta.url` asset-read pattern from `openapi.ts`; prove with `deno task release:preflight`. |

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
| -- | ------ | ---- |
| AP-11 | existing risk | Remove runtime module-path file read/cache global from public handler implementation. |
| AP-19 | risk | Keep package publish file list explicit and JSR-safe. |
| AP-20 | avoid | Use required `--unstable-kv` for package checks. |

## Fitness Gates

| Gate | Required | Expected evidence |
| ---- | -------- | ----------------- |
| F-5 | yes | `deno doc --filter createScalarJs packages/service/mod.ts` shows unchanged signature. |
| F-6 | yes | `cd packages/service && deno task publish:dry-run` succeeds. |
| F-8 | yes | `deno run ...run-deno-check.ts --root packages/service --ext ts --unstable-kv` succeeds. |
| F-14/F-15 | yes | No new `console.*`; no upstream re-export changes. |

## Arch-Debt Implications

| Entry | Action | Notes |
| ----- | ------ | ----- |
| `packages/service — assets/scalar.min.js (3.3 MB vendored in publish)` | update/observe | This slice removes the raw asset from publish but still embeds the same large content in source; size strategy debt remains. |
| `packages/service — T4 slow-type publish carve-out` | none | Existing accepted debt unchanged. |

## Validation Plan

| Order | Gate | Command or check | Expected result |
| ----- | ---- | ---------------- | --------------- |
| 1 | service check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/service --ext ts --unstable-kv` | exit 0 |
| 2 | determinism | `deno task check:assets-barrel` | exit 0, no git diff |
| 3 | publish | `cd packages/service && deno task publish:dry-run` | exit 0 |
| 4 | release preflight | `deno task release:preflight` | exit 0, zero flags for `openapi.ts` |
| 5 | public surface | `deno doc --filter createScalarJs packages/service/mod.ts` | `function createScalarJs(): ServiceHandler` |
| 6 | tests | `cd packages/service && deno task test` | exit 0 |
| 7 | forbidden patterns | `git grep -nF "Deno.readTextFile" packages/service/src/primitives/openapi.ts`; scan text imports/casts | zero openapi readTextFile matches; no text imports or new casts |

## Dependencies

- Existing `assets/scalar.min.js` as generation input.
- Existing `.llm/tools/generate-cli-assets-barrel.ts` generator.

## Drift Watch

- If package publish requires explicitly listing `scalar.generated.ts`, record the deviation.
- If `ServiceHandler` rejects a sync handler shape, keep `async` and record no public-surface drift.
