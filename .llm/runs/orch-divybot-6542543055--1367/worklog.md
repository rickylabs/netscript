# Worklog

## Design

1. Public surface: optional DataDirectories map on Aspire plugin resource configuration and service
   spec, optional streams Aspire contribution `dataDir` constructor option. Existing env opt-in
   retained. Generated AppHost provisions declared directories; default remains ephemeral.
2. Domain vocabulary: data directory = host-owned persistent filesystem path passed through its
   named environment key; file durability = orderly restart replay, not power-loss protection.
3. Ports: existing AspireBuilder/DenoServiceSpec; node filesystem/path at AppHost edge; real producer
   and HTTP for acceptance; existing Aspire resource follower/command seams. No new framework engine.
4. Constants: STREAMS_DATA_DIR named at streams wiring; logical streams resource and storage health
   check names in acceptance; directory declarations remain plugin-independent in CLI.
5. Commit slices: bootstrap plan; one cohesive implementation+tests+docs slice; bounded review repairs
   if necessary. See plan.md for paths/gates. All slices carry worklog/context updates and are pushed.
6. Deferred scope: durable default/migration #2114, fencing redesign, substrate replacement, fsync
   transaction guarantees, multiwriter support, retention/backup automation.
7. Contributor path: plugins/streams/src/aspire/streams-contribution.ts shows the storage option and
   points to the core declaration consumed by generated registration. Docs streams page teaches usage.

## Bootstrap

Routing queried and owner override recorded in supervisor.md. No source edits before PLAN-EVAL.
RTK absent; direct shell tools used. Memory and MCP guidance consulted first. Draft PR exposes the
plan before implementation. Coordinator owns labels/milestones and expensive CI E2E.

Owner PR instructions conflict: the scoped brief says Refs-only; later mandatory delivery wrapper
requires the exact final line `Closes rickylabs/netscript#1367`. Preserve the scoped Refs first line
and required final line; do not mark unproven acceptance complete or change issue checkboxes.
