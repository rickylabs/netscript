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

## S1 evidence in progress

- 108 focused install, reference reconciliation and worker runtime tests pass on Deno 2.9.7.
- Scoped check passes on 173 files. Scoped lint passes with 27/27 coverage. The format gate
  selected two unchanged legacy test files; narrow final formatting to owned source files.
- Actual stream reinstall with --service orders persists orders->streams; subsequent reinstall
  without the flag preserves it. No hardcoded stream-name branch was added to the CLI host.
- quality:gate passes with existing warnings. Independent review launched through the agentic
  Claude print tool. Matrix primary muse_spark_1_3 launch failed before inference with
  launcher-catalog-unavailable; declared fallback opus_5 requested at xhigh, observed claude-opus-5.
- Owned reproduction AppHost stopped through maint:teardown. Foreign/unknown AppHosts and
  processes were reported and left untouched. Docker remains unavailable; no runtime pass claimed.

## S1 independent repair

The independent Opus review returned FAIL_FIX. Repaired late optional sample failure isolation,
startup readiness versus observer lifetime, bounded shutdown, symlink normalization, directory
rearming and explicit service reselection. Preserve manual appsettings links by retaining the
earlier installed service consumer set during planning. Tests now total 112 passing results.
The walkthrough adds restore and states that its noninteractive start detaches. Same evaluator
re-steered; S2 runtime proof remains unproven. No accepted product debt.

## S1 terminal

Independent same-session Opus repair review: PASS, all prior findings closed. See s1-review.md.
112 focused test/step results pass, changed-source wrappers pass, broader quality and doctrine pass.
The reviewer independently reran the focused tests and quality scans. Final runtime is not certified.
The review's lint/fmt caveat concerns raw root config; our scoped invocations explicitly use an
ignored config containing root rules without root selection exclusions. CLI coverage is verified
with that config; do not cite raw root fmt/lint as CLI evidence. The reviewed cosmetic constant
placement was corrected. No product behavior changed after the review.
Reconcile: S1 matches the declared surface. Next slice is the pristine documented runtime gate.
