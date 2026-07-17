# Research — G4 #452 desktop Aspire generator

## Re-baseline

- Carried-in sources: live issues [#452](https://github.com/rickylabs/netscript/issues/452),
  [#375](https://github.com/rickylabs/netscript/issues/375),
  [#456](https://github.com/rickylabs/netscript/issues/456), the owner-ratified RFC #820 amendment,
  and `.llm/runs/plan-roadmap-expansion--seed/design/E-desktop/`.
- Re-derived against `origin/feat/desktop-frontend` @
  `ca72db14fbbfd42aa60e37c7aea730ed9a81585c` on 2026-07-17. The integration branch and
  `origin/main` currently point at the same commit; this branch is a clean descendant.
- What changed from the original #375 / beta.8 proposal:
  - RFC #820 adds a stable single-artifact packaging hook for downstream #456.
  - Option A makes #456 native-format-first; snapshot/bootstrap graph packaging moved to #834/#825.
  - `@netscript/aspire` now exposes `AppType` and `AppEntry` through the published `./types`
    subpath, so this is a public-surface change with JSR and consumer gates.

## Findings

| # | Finding | How to verify |
| - | ------- | ------------- |
| 1 | `generateRegisterApps()` has exactly three paths: `app`, `tauri`, and a catch-all `task`; Tauri is the nearest executable-task pattern. | `packages/cli/src/kernel/templates/aspire/helpers/register/generate-register-apps.ts:45-62,199-235` |
| 2 | Endpoint emission is currently common to every app type whenever `Port` is present, so desktop must be explicitly excluded. | same file, lines 77-82 |
| 3 | Only `app` receives service/plugin discovery; it emits Vite aliases plus server-side `services__<name>__http__0`. Desktop needs only the server-side form for both reference kinds. | same file, lines 91-127 |
| 4 | Existing config defaults `BaseEntry.Enabled` to `true`; that contradicts desktop opt-in unless the desktop schema and emitted guard both specialize the default. | `packages/aspire/config.ts:378-383,412-430` |
| 5 | `AppType` is the closed union `'app' | 'tauri' | 'task'`; `AppEntry` already owns `TaskName`, `Prebuild`, references, and optional `Port`. | `packages/aspire/config.ts:72-73,139-159` |
| 6 | `@netscript/aspire` publishes `./config` and `./types`; `types.ts` aliases the canonical config contracts instead of duplicating them. | `packages/aspire/deno.json:6-15`; `packages/aspire/types.ts:18-89` |
| 7 | Generator tests are semantically asserted string fragments in split `generators-*_test.ts` files; the app suite lives in `generators-background-app_test.ts`. | `packages/cli/src/kernel/templates/aspire/helpers/tests/generators-background-app_test.ts:200-313` |
| 8 | The POC established four load-bearing facts: Fresh `_fresh/` must exist first; only the CLI `--backend cef` flag works on the tested Windows host; desktop binds random loopback through `DENO_SERVE_ADDRESS`; and `PORT` is not its real listener. | issue #375; `.llm/runs/plan-roadmap-expansion--seed/research/E-desktop/deno-desktop-full-surface.md` |
| 9 | The RFC/Option-A boundary assigns #452 the dev resource plus hook, and assigns #456 native packaging formats, release manifests, patches, signing envelope, and auto-update integration. | live #452 amendment and live #456 `Option-A re-scope` |
| 10 | Current Aspire TypeScript hosting lacks a dedicated Deno app/task API, so `builder.addExecutable()` is an accepted, recorded workaround rather than new debt. | `.llm/harness/debt/arch-debt.md`, “CommunityToolkit Deno/SQLite TypeScript AppHost re-enable deferred” |
| 11 | The default scaffold generates only an `app` dashboard; adding desktop support must not add a desktop entry to non-desktop scaffolds. | `packages/cli/src/kernel/templates/aspire/generate-appsettings.ts:264-334` |

## Planned contract shape

- Add `'desktop'` to the canonical `AppType`/`AppTypeSchema` contract.
- Preserve one `AppEntry` output type and make omitted `Enabled` resolve conditionally:
  `false` for `Type: 'desktop'`, `true` for all existing variants.
- Add optional `PackageTaskName` to `AppEntry`, preserved by `AppEntrySchema`. The convention
  defaults downstream to `desktop:package`; #452 does not implement the package/release pipeline.
- Desktop dev registration uses `TaskName ?? 'desktop:predev'` and forwards `--backend cef` as
  task arguments. The predev task is the one-step build-order seam proven by the POC.
- Desktop discovery emits only `services__<name>__http__0`; it never emits Vite aliases or an
  Aspire HTTP endpoint.

## jsr-audit surface scan

| Rubric item | Baseline | Planned risk / response |
| --- | --- | --- |
| Metadata / scoped name / description | Present in `packages/aspire/deno.json`; description is under 250 chars. | No metadata change. |
| Export map | `./types` and `./config` are published entrypoints. | Both entrypoints must type-check and doc-lint after the union/property change. |
| Slow types | Public schema constants use explicit `AspireSchema<T>` annotations. | Keep the annotation; no inferred public transform type and no cast/`any`. |
| Module / symbol docs | `config.ts` and `types.ts` have module docs; touched public symbols have summaries. | Update `AppType`, `AppEntry`, and `PackageTaskName` prose; run full package doc-lint. |
| File list | Publish allowlist is `**/*.ts`, config, README; tests excluded. | Dry-run must show no new artifact outside existing files. |
| ESM / portability | Existing ESM-only package. | No imports, asset reads, `import.meta` filesystem access, or self-referential bare subpath import will be added. |
| Consumer compatibility | CLI consumes `@netscript/aspire/types`. | Compile the CLI helper/test consumer with a literal desktop entry. |
| Published-graph proof | This is not a release run. | `e2e-cli-prod` remains post-publish authority; no publish may occur in G4. |

## Open questions resolved for planning

| Question | Resolution |
| --- | --- |
| What is the #452 → #456 packaging hook? | `AppEntry.PackageTaskName?: string`, with downstream convention `desktop:package`; #456 owns invocation/output formats. |
| How is build order encoded without depending on an unavailable dedicated Deno Aspire API? | Desktop launches a predev task (`TaskName ?? 'desktop:predev'`) and forwards `--backend cef`; tests assert both. No generated shell chain is invented. |
| How is opt-in guaranteed despite the existing common default? | Conditional schema output default plus a desktop-specific generated `Enabled === true` guard. |
| Should desktop accept `Port`? | The shared contract remains backward compatible, but generator ignores `Port` for desktop and tests prove no `withHttpEndpoint`/`PORT` emission. |
| Does G4 implement native installers, signing, manifests, patches, or updates? | No. Those are #456/#841/#457 scope. |

