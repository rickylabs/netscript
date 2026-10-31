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

## PLAN-EVAL round 1

FAIL_PLAN: generated-project proof needed a named CI gate, explicit configuration lifecycle, and a
negative-control mechanism despite the local full-E2E prohibition. Plan now names fixture and
behavior gates in both runtime tiers, provisions both modes before AppHost start, defines focused
Aspire execution and reverted-emission controls, and leaves any unrun acceptance unchecked.

## Implementation and runtime evidence

PLAN-EVAL round 2 passed before code edits. Implemented core-owned directory declarations and
schema, streams contribution option, generic generated AppHost provisioning and explicit docs.
A cloned ephemeral control is configured before startup; both CI runtime tiers include stable
fixture/restart gates. No plugin-name dispatch was added to the generator.

Focused local generated-project Aspire proof passed, failed when the emitted storage binding was
removed, then passed again when restored. See runtime-proof.md and negative-controls.md. The
current-main file-backed producer write-loss finding did not reproduce. Exact owned AppHost stopped.

Local structured wrappers: 60 streams/new acceptance tests and 197 related regression cases passed;
73 selected files type-checked; scoped lint/format passed with complete selection coverage. Source
readiness addition subsequently requires final focused rerun. quality:scan and arch:check exit 0,
verify-plugin and JSR audit exit 0, docs:links exit 0. Full export-map doc lint has inherited reds;
changed streams Aspire export and Aspire config/types exports pass with zero diagnostics. No
lock-file edits. Full scaffold.runtime is unproven locally by instruction; CI verdict required.

Post-slice reconcile: PR #2520 remains draft; no review threads/comments yet; source scope matches
supervisor declaration. Labels/milestones untouched. No duplicate remaining PR discovered.

## Slice review and signoff

Independent IMPL-EVAL round 1: PASS, no implementation blockers. Reviewer independently ran the
four focused test files (12 pass), checked public docs, inspected complete diff and scope. See
evaluate.md. Final combined durable test receipt: 258 passed / 0 failed / 0 ignored; quality-gate
receipt PASS. Final scoped lint/fmt: 15 selected, 15 processed, no findings. All mutation controls
restored and focused owned runtime stopped. No open review threads.

Commit this cohesive implementation slice and push; mark ready so CI starts. Required full
scaffold.runtime stays pending coordinator e2e-cli-gate. Final exact-head review follows in the same
independent session. No merge authorization is asserted by local PASS.
