# Live RED before public plugin install

- Owned root: `/home/codex/repos/ns005-cachetiers/.llm/tmp/fix-plugin-linking-seam-1189-live`
- Consumer: `consumer/live-linking-proof` (fresh local-source scaffold, `db=none`, service
  `catalog`, app `dashboard`)
- AppHost: the only running AppHost at capture time; isolated dashboard
  `https://localhost:45229`
- Request: `GET http://localhost:45611/api/v1/catalog/health/check`
- Result: HTTP 500

```json
{"defined":false,"code":"INTERNAL_SERVER_ERROR","status":500,"message":"fixture-api endpoint was not linked into catalog"}
```

The consuming service code was already present, but no plugin had been installed and
`appsettings.json` had no `fixture-api` producer or consumer reference. This is the runtime RED
which the public plugin install must turn green without hand-editing appsettings.
