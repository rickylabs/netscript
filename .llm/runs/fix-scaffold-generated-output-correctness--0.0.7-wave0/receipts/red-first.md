# Red-first evidence — frozen main `01e096049`

These are normalized defect probes, not passing gate receipts.

## #1262 seed probe

Inputs: `database/schema.prisma.template`, `database/seed.ts.template`.

```json
{
  "exit": 1,
  "hasModel": true,
  "writesRows": false,
  "placebo": true,
  "successBanner": true
}
```

## #1263 generated runtime probe

Inputs: current generated handler logic, `@netscript/contracts` CRUD contract, and
`@netscript/service` OpenAPI handler.

```text
exit=1
GET    /api/users/999 -> 500 {"defined":false,"code":"INTERNAL_SERVER_ERROR","status":500,"message":"User 999 not found"}
PATCH  /api/users/999 -> 500 {"defined":false,"code":"P2025","status":500,"message":"Record not found"}
DELETE /api/users/999 -> 500 {"defined":false,"code":"P2025","status":500,"message":"Record not found"}
```

## #1263 OpenAPI projection fallback probe

```text
exit=0
get    200,401,403,404,422,429,503
patch  200,401,403,404,422,429,503
delete 200,401,403,404,422,429,503
```

Reproduction of the filed projection gap is impossible at this SHA; the 404 must remain covered as a
regression assertion.

## #1588 generated-provider output probe

Inputs: generated SQLite runtime module and generated SQLite `prisma.config.ts`.

```json
{
  "exit": 1,
  "runtimeForbidden": [
    "normalizePostgresUrl",
    "normalizeMysqlUrl",
    "normalizeMssqlUrl",
    "parseConnectionParts"
  ],
  "prismaForbidden": [
    "normalizePostgresUrl",
    "normalizeMysqlUrl",
    "normalizeMssqlUrl",
    "parseConnectionParts"
  ],
  "hasPrismaLibSql": true,
  "hasTypedClient": true
}
```
