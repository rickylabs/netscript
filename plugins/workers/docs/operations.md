# Operations

The workers plugin contributes a service process and three background process entries.

## Service

`workers-api` launches `./services/src/main.ts` and defaults to port `8091`. It exposes job, run,
task, admin, and subscription routes.

## Background Processes

The manifest contributes:

- `workers-combined` at `./bin/combined.ts`
- `workers-worker` at `./bin/worker.ts`
- `workers-scheduler` at `./bin/scheduler.ts`

Use separate worker and scheduler entries when the host needs independent scaling or restart policy.
Use the combined entry for local development.

## Streams

Worker stream integration is available through `./streams` and `./streams/server`.
`emitJobToStream()` is the publication function for job events.

## Aspire

`WorkersAspireContribution` records the service and background resources for AppHost integration.
The contribution is data-only; the AppHost decides how those resources are launched.
