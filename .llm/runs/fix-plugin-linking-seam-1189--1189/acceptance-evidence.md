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

## Runtime limitation

The live catalog→fixture call and OTEL capture are not claimed. The read-only leak report found
three foreign AppHosts, while the run brief permits one AppHost at a time. Database generation for
the fresh scaffold also delegates to an AppHost, so fresh `deno task check` currently stops at the
missing generated Prisma artefacts. No foreign resource was stopped or mutated.
