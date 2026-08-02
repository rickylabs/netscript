# Production report formatting evidence

## Fixture provenance

Downloaded the artifacts from the actual failed production run:

```sh
gh run download 30743141553 --repo rickylabs/netscript \
  --dir .llm/tmp/run-30743141553
```

Fixture:

```text
.llm/tmp/run-30743141553/e2e-cli-prod-0.0.3-canary.3/cli-e2e-prod-report.json
```

## New output against the real report

```text
FAILED GATE: database.init
DECISIVE ERROR:
  Command exited 1; expected 0.
  [prisma-init-postgres] Error: Prisma schema validation - (validate wasm)
  [prisma-init-postgres] Error code: P1012
  [prisma-init-postgres] error: The model "User" cannot be defined because a model with that name already exists.
  db init failed with exit code 1.
  Error: Database operation failed with exit code 1
FILTERED TAILS (download noise omitted; raw tails remain in the report artifact):
evidence: database.init
  stdout:
  [prisma-init-postgres] Loaded Prisma config from prisma.config.ts.
  [prisma-init-postgres] Prisma schema loaded from schema.
  [prisma-init-postgres] Error: Prisma schema validation - (validate wasm)
  [prisma-init-postgres] Error code: P1012
  [prisma-init-postgres] error: The model "User" cannot be defined because a model with that name already exists.
  [prisma-init-postgres]   -->  schema/schema.prisma:17
  [prisma-init-postgres] 17 | model User {
  [prisma-init-postgres] Validation Error Count: 1
  [prisma-init-postgres] Prisma CLI Version : 7.9.1
  stderr: db init failed with exit code 1.
  Error: Database operation failed with exit code 1
```

The 44 leading npm registry download lines are absent from the rendered tail. The source JSON and
NDJSON remain unchanged and are still uploaded by the workflow. Formatter tests also prove the
GitHub `::error::` command and step-summary text carry `database.init`, `P1012`, and the concrete
duplicate-model error.
