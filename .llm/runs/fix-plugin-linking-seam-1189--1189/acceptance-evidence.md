# Acceptance evidence: #1189

## Fresh fixture third-party install

- Scaffold: `.llm/tmp/issue-1189-third-party`, created with the real local-source `netscript init`.
- Producer: `@acme/plugin-fixture`; its persisted manifest contains `linking` and no `officialSource`.
- Install result: `Installed fixture plugin "fixture" on port 59276`, four plugin files and thirteen
  Aspire helpers generated.
- Config artefact after install:
  - `NetScript.Plugins.fixture-api` uses `plugins/fixture/services/src/main.ts`.
  - `NetScript.BackgroundProcessors.fixture` uses `plugins/fixture/bin/combined.ts`.
  - `NetScript.Services.catalog.PluginReferences = ["fixture-api"]`.
  - `NetScript.Apps.dashboard.PluginReferences = ["fixture-api"]`.
- Generated helper artefact wires `services__fixture-api__http__0` into both catalog and dashboard.

## Lifecycle symmetry

- Consumer-first is the fresh-scaffold CLI artefact above.
- Producer-first/consumer-later is enforced by
  `third-party linking converges when consumers arrive later and cleans up after uninstall`.
- Real `plugin remove fixture --skip-dispatch` removed both appsettings producers, deleted the
  fixture directory, regenerated helpers, and left both consumer `PluginReferences` absent.

## Live runtime and telemetry

- Fresh run-owned consumer: `.llm/tmp/fix-plugin-linking-seam-1189-live/consumer/live-linking-proof`.
- RED before install: catalog returned HTTP 500 because
  `services__fixture-api__http__0` was absent; see `live-proof/red-before-install.md`.
- The public local-source install generated `fixture-api`, catalog/dashboard references, and Aspire
  helpers without a manual `appsettings.json` edit.
- `deno task check` in the generated consumer checked dashboard, service, shared plugin context,
  and contracts with zero diagnostics.
- Final resource artefact showed `catalog`, `dashboard`, `fixture-api`, `fixture`, and `redis` all
  `Running` / `Healthy`; catalog had a Reference relationship to `fixture-api` and the generated
  endpoint environment variable.
- Live request `GET /api/v1/catalog/health/check` returned HTTP 200 only after catalog fetched and
  validated the third-party fixture's `GET /ping` response.
- Trace `00766def76331c34a3df9fd525bfe3e0` correlates catalog server span
  `819231b2d77516fb`, catalog client span `9c22af7526ff564a`, and fixture-api server span
  `c7935b1b03518da5`; the plugin span's parent is the catalog client span. Exact evidence is in
  `live-proof/trace-00766def76331c34a3df9fd525bfe3e0.json`.

## Cleanup and merge-readiness gate

- The live AppHost stopped cleanly; the post-run leak report contains no run-owned AppHost or
  container. Foreign and unknown-owner survivors were not mutated.
- The mandatory one-pass `scaffold.runtime --cleanup --format pretty` gate completed with
  `passed=73 failed=0`, raw exit `0`, including its own OTEL trace chain and cleanup gates.
