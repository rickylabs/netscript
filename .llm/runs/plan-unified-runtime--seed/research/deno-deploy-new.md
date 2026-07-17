# New Deno Deploy and the C2 runtime cell

Research date: 2026-07-18. The committed evidence snapshot is
`../evidence/deno-deploy-new-live-2026-07-18.md`; original URLs remain authoritative. This responds
to Stage-F adversarial finding 1 and disposition 1. (`../adversarial-findings.md:3-8`,
`../adversarial-triage.md:9-9`)

## The platform identity changed

The Nitro `deno_deploy` provider page validates Deno Deploy Classic, not the surviving platform. It
directs users to `dash.deno.com`, obtains a Classic token, runs `deployctl`, and offers the
`denoland/deployctl@v1` action.
([Nitro Deno Deploy provider](https://nitro.build/deploy/providers/deno-deploy)) Official Deno
documentation says Classic shuts down on **2026-07-20**, Classic projects are not transferred, and
`deployctl` is sunset in favor of `deno deploy` on the new `console.deno.com` platform.
([migration guide](https://docs.deno.com/deploy/migration_guide/))

The new Deno Deploy is a new Deno 2.0 execution environment and application/build model, not a
renamed Classic dashboard. Its unit is one deployed web service with one build configuration, and
its build pipeline runs install/build, prepares an artifact, warms the dynamic entrypoint, and then
routes the revision. ([platform overview](https://docs.deno.com/deploy/),
[getting started](https://docs.deno.com/deploy/getting_started/),
[build reference](https://docs.deno.com/deploy/reference/builds/))

## What a Nitro v3 output would need

No official page currently demonstrates Nitro's `deno_deploy` output on the new platform. The
minimum candidate configuration below is therefore a **probe specification**, not a validated
deployment recipe. The new platform documents custom install/build commands and a dynamic
JavaScript/TypeScript entrypoint; Nitro documents a Node-driven build that emits
`.output/server/index.ts`.
([Deno Deploy getting started](https://docs.deno.com/deploy/getting_started/),
[Nitro Deno Deploy provider](https://nitro.build/deploy/providers/deno-deploy))

| Requirement         | Candidate new-platform realization                                                                                                                                                                                                                                                                                            | Proof still required                                                                                                                                                                                                                                                      |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| App/build mode      | Create a dynamic app with no assumed first-class Nitro preset; configure an install command and `NITRO_PRESET=deno_deploy` build command. The platform supports custom install/build configuration. ([getting started](https://docs.deno.com/deploy/getting_started/))                                                        | Prove the integrated builder has the exact Node/package-manager/toolchain versions required by Nitro v3 and that the monorepo can be staged. GitHub monorepos are currently documented as unsupported. ([getting started](https://docs.deno.com/deploy/getting_started/)) |
| Entrypoint          | Point the dynamic entrypoint at Nitro's emitted `.output/server/index.ts`. Nitro names that output; Deno Deploy accepts a relative JS/TS dynamic entrypoint. ([Nitro provider](https://nitro.build/deploy/providers/deno-deploy), [getting started](https://docs.deno.com/deploy/getting_started/))                           | Prove the emitted entrypoint uses the built-in `Deno.serve()` path and survives the platform warmup. The migration guide says legacy std `serve()` times out during warmup. ([migration guide](https://docs.deno.com/deploy/migration_guide/))                            |
| Artifact and assets | Preserve `.output/server` plus Nitro public assets in the prepared deployment artifact; Deno Deploy's build stage prepares an artifact and its app config has a static-directory field. ([build reference](https://docs.deno.com/deploy/reference/builds/), [getting started](https://docs.deno.com/deploy/getting_started/)) | Prove Nitro's routing/static behavior from the dynamic entrypoint rather than assuming the platform static directory can replace Nitro's asset pipeline.                                                                                                                  |
| CLI/CI              | Replace every `deployctl`/Classic action instruction with `deno deploy` or a linked new-platform build. Deno documents both triggers. ([migration guide](https://docs.deno.com/deploy/migration_guide/), [build reference](https://docs.deno.com/deploy/reference/builds/))                                                   | Prove a repeatable create/configure/deploy command sequence, preview/production timeline selection, rollback, and read-after-deploy health check.                                                                                                                         |
| Runtime surface     | Exercise HTTP, streaming, errors, shutdown/lifecycle expectations, WebSocket upgrades if retained, scheduled tasks, and telemetry in the new Deno 2.0 environment. The platform advertises Deno/Node apps, cron, logs, traces, and metrics. ([platform overview](https://docs.deno.com/deploy/))                              | Nitro's provider page contains no new-platform conformance result, and Nitro task docs do not name a native Deno Deploy scheduler integration. ([Nitro provider](https://nitro.build/deploy/providers/deno-deploy), [Nitro tasks](https://nitro.build/docs/tasks))        |

The repository is a monorepo, while the current GitHub onboarding docs say monorepos are not yet
supported. (`deno.json:1-40`,
[Deno Deploy getting started](https://docs.deno.com/deploy/getting_started/)) A probe must therefore
test a supported local-source/CLI staging flow or a deliberately extracted artifact repository; it
cannot claim the documented GitHub path works for this checkout.
([`deno deploy` CLI](https://docs.deno.com/runtime/reference/cli/deploy/))

## Queue verdict: native C2 is lossy

The new platform explicitly marks queues unsupported, and the migration guide states that both
`Deno.Kv.enqueue()` and `Deno.Kv.listenQueue()` are unavailable. It directs queue users to an
external message service or database-backed job queue.
([platform comparison](https://docs.deno.com/deploy/),
[migration guide](https://docs.deno.com/deploy/migration_guide/))

That cannot satisfy the shipped `MessageQueue` contract natively: NetScript requires enqueue,
delayed options, long-running consumption, acknowledgements/negative acknowledgements, retry
capability, and graceful stop. (`packages/queue/ports/message-queue.ts:39-133`) C2 can only recover
that surface by selecting and proving an external adapter such as the shipped Redis, AMQP, or
PostgreSQL exports; no such binding has been deployed or conformance-tested on the new platform.
(`packages/queue/deno.json:5-19`)

**Finding:** any matrix row that marks C2 queue enqueue/consume “lossless” from Deno KV is false for
the new platform. The database-backed alternative is a new architecture choice and test burden, not
a rename of the removed queue API.
([migration guide](https://docs.deno.com/deploy/migration_guide/),
`packages/queue/ports/message-queue.ts:39-133`)

## Database and KV availability

The new platform does support databases. It documents assigned Deno KV, managed Prisma Postgres, and
linked external databases; its CLI can provision/assign KV and link/assign PostgreSQL.
([database reference](https://docs.deno.com/deploy/reference/databases/),
[`deno deploy` database commands](https://docs.deno.com/runtime/reference/cli/deploy/#database-management-1))
Deno KV connects through `Deno.openKv()` and receives per-timeline isolation after assignment.
([Deno KV reference](https://docs.deno.com/deploy/reference/deno_kv/))

These are viable inputs to future NetScript database/KV adapter probes, but they do not validate
Nitro db0 configuration or NetScript's complete database/KV contracts automatically. Nitro's
database layer is experimental, while NetScript requires database lifecycle/health/raw-query
semantics and KV atomic/list/disposal semantics.
([Nitro database](https://nitro.build/docs/database),
`packages/database/ports/database-client.ts:80-127`, `packages/kv/types/kv-store.ts:19-194`)

| Capability               | Current platform evidence                                                                                                                                                         | C2 status                                                                                                                                           |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Deno KV CRUD/atomic/list | Deno KV is assignable per app/timeline and opened with `Deno.openKv()`. ([Deno KV reference](https://docs.deno.com/deploy/reference/deno_kv/))                                    | **Candidate, unproved:** run the NetScript KV conformance suite against an assigned new-platform database.                                          |
| SQL/Postgres             | Managed Prisma Postgres and linked external databases are documented, with injected connection details. ([database reference](https://docs.deno.com/deploy/reference/databases/)) | **Candidate, unproved:** select an adapter/driver, migration path, pooling assumptions, and run database conformance.                               |
| Queue over Deno KV       | Enqueue/listenQueue are explicitly unsupported. ([migration guide](https://docs.deno.com/deploy/migration_guide/))                                                                | **Rejected.** It cannot be a native C2 queue cell.                                                                                                  |
| External queue           | Deno recommends an external message queue or database-backed job queue when migrating. ([migration guide](https://docs.deno.com/deploy/migration_guide/))                         | **Research required:** select a shipped NetScript adapter and prove connectivity, delivery, retry/DLQ, lifecycle, and preview/production isolation. |

## C2 verdict

**C2 is not provable for v1 from current evidence and must leave the validated v1 cell set.** The
only Nitro deployment instructions target a platform and CLI that sunset on 2026-07-20; the new
platform has no official Nitro recipe, currently blocks the documented GitHub-monorepo path, and
does not support queues. ([Nitro provider](https://nitro.build/deploy/providers/deno-deploy),
[migration guide](https://docs.deno.com/deploy/migration_guide/),
[getting started](https://docs.deno.com/deploy/getting_started/))

Replace C2 with a planning research card: **“Prove Nitro v3 on new Deno Deploy.”** It must produce a
real new-platform deployment and record:

1. supported source/staging path for this monorepo, exact app/build/entrypoint configuration, and
   `deno deploy`/GitHub lifecycle;
2. warmup plus HTTP/static/stream/error/lifecycle/telemetry conformance;
3. explicit KV and SQL selections with NetScript conformance results;
4. an external queue selection with enqueue/consume/retry/DLQ/drain proof, because native queues are
   unavailable;
5. cron/task behavior and preview/production isolation; and
6. artifact/rollback/health evidence with exact tool and platform versions.

Those requirements follow from the new platform's build, database, queue, and migration contracts.
([build reference](https://docs.deno.com/deploy/reference/builds/),
[database reference](https://docs.deno.com/deploy/reference/databases/),
[platform overview](https://docs.deno.com/deploy/),
[migration guide](https://docs.deno.com/deploy/migration_guide/)) Until that card passes, the owner
fork is the triaged one: ship a three-cell v1 matrix, or re-admit C2 only after this proof—not by
assuming the Classic preset survived. (`../adversarial-triage.md:9-9`)
