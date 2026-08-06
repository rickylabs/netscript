# Fresh consumer GREEN proof

- Public install command used the local-source CLI and the fixture third-party plugin:
  `netscript-dev plugin install fixture --name fixture --local-path packages/cli/tests/fixtures/plugin-scaffolder --project-root <owned-consumer> --no-db`.
- CLI result: `Installed fixture plugin "fixture" on port 52470`, four plugin files created,
  thirteen Aspire helpers regenerated.
- No `appsettings.json` edit was made by the supervisor. The CLI generated:
  `NetScript.Plugins.fixture-api`, `NetScript.Services.catalog.PluginReferences=["fixture-api"]`,
  and `NetScript.Apps.dashboard.PluginReferences=["fixture-api"]`.
- Fresh consumer validation: `deno task check` enumerated and checked the generated dashboard,
  catalog service, shared plugin context, and contracts with zero diagnostics.
- Final live resources: `catalog`, `dashboard`, `fixture-api`, `fixture`, and `redis` were all
  `Running` / `Healthy`. Catalog had a Reference relationship to `fixture-api` and environment
  `services__fixture-api__http__0=http://localhost:46283`.
- Request: `GET http://localhost:45965/api/v1/catalog/health/check`.
- Result: HTTP 200.

```json
{"status":"healthy","service":"catalog","version":"1.0.0","timestamp":"2026-08-06T15:31:32.245Z","uptime":38}
```

The handler resolves the generated plugin endpoint and validates the fixture response from
`GET /ping`; a successful catalog response therefore requires the real cross-resource call.
