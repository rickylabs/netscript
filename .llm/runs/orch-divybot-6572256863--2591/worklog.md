# Worklog

## Design

1. Public surface: documented scaffold produces a completed sample after seed; stream install
   accepts `--service` and links that service using persisted manifest consumer metadata.
2. Domain vocabulary: seed handoff, acceptance receipt, service consumer, documented scaffold gate.
3. Ports: existing SeedSamplePorts; filesystem watcher at the runtime edge; FileSystemPort and
   existing Aspire command/gate boundaries. No new service or request-path work.
4. Constants: retain SAMPLE_JOB_ID and SEED_KEY_PREFIX; name the new documented runtime gate
   in the existing GATE domain catalog. Reuse existing scaffold file constants.
5. Commit slices: S0 run bootstrap (these artifacts; reviewed assignment/baseline); S1 lifecycle
   and install wiring plus focused regressions (workers runtime, CLI install and docs; structured
   focused gates and independent review); S2 documented runtime acceptance/negative controls and
   generated carriers (CLI E2E, carrier tasks; all check tasks and runtime CI); S3 review repairs
   and final evidence if needed. Each slice updates this file and context-pack.md.
6. Deferred scope: visual styling, unrelated plugins and runtime redesign; not necessary to wire
   the existing sample lifecycle and stream producer.
7. Contributor path: `plugins/workers/src/runtime/seed-sample.ts` for seed semantics;
   `docs/site/orchestration-runtime/how-to/add-a-plugin.md` for the complete consumer walkthrough.

## S0

Baseline clean; assignment file ignored. Prior memory and issue history read. Routing resolved
from the matrix JSON. Local clean setup demonstrates missing service edge; DB runtime commands
are unproven because Docker is unavailable. See research.md and memory-masked-runtime.md.
Reconcile: no implementation yet. Specific operator Refs/draft/no-merge policy controls delivery.
