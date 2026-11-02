# Research

Baseline #2586 implements chart/color/health/control polish. GitHub issue comments and
PR body independently confirm only attributed record events and post-seed execution
remain, plus the two named review notes. No other PR covers #2587.

- Database and memory service scaffolds isolate repository/application/router layers.
  Mutation handlers currently write records without publishing events.
- `createServiceStreamProducer` is the existing service-facing producer. Discovery and
  auth must resolve only when a stream is linked. The app currently reads bounded worker
  execution history; record events need their own topic and safe projection.
- Request context exposes an authenticated Principal. Record owner is not an actor.
- DB CLI mode returns before plugin/worker registration. The worker process loads its
  generated registry before listening, and `JobMessage.idempotencyKey` already flows
  into the worker's durable duplicate suppression. The sample handoff will use that seam.
- The generated sample health-check already reports actual progress. No UI snapshots or
  fake executions are necessary.
- Sample dates currently choose later hours on the current seed day. Weekly chart copy
  embeds 2 days independently of the bucket construction.

Doctrine: CLI archetype 6, existing package verdict Keep; workers plugin archetype 5
with runtime concerns. Frontend/service overlays apply. No new dependency versions.
