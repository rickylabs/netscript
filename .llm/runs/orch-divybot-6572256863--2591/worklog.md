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

## S2 candidate

Added behavior.documented-scaffold before the main suite's init and repair fixtures. It reads the
actual documented block, executes three pristine Postgres setups, observes the resident worker
before seed, and requires real seed-correlated work plus the committed event in both stream and
Activity HTML. Independent negative controls disable only the handoff wire or service selection;
the final setup restores the exact documented steps. Cleanup uses scoped repo teardown and reports
foreign/unknown resources without changing them. SQLite keeps its existing provider-neutral gates.

76 builder, registry, runner and new acceptance-contract tests PASS. Seven changed TypeScript
files pass scoped check/lint/fmt. quality:gate PASS. S2 independent review and final-head full
scaffold.runtime CI remain pending; this is a candidate commit, not a runtime sign-off.
Reconcile: declared scope maintained, no hand-written carriers and no accepted product debt.

## S2 repair and first live feedback

First CI attempt: run 41418574351, head f82ef33dac6c915d320b0ffd99be24dcc4559263. The new gate
ran two pristine variants in 189693ms. Disabling the seed handoff produced the expected job RED
while real stream/HTML Activity passed. Drop-link observed a completed job, but the stronger job
assertion incorrectly expected correlationId in the public DTO. Fixed by using the public
correlation-filtered endpoint and a fixture parsed through the actual public response schema.
This failed run is not final acceptance.

The independent S2 review requested bounded projection convergence and explicit Aspire startup
budgeting; both are implemented with regression tests. Replaced general teardown enumeration with
the canonical runtime cleanup helper after CI enumerated no detached AppHosts. Main static init
now precedes this isolated gate so its cleanup path exists; all link/restart fixtures still follow.
The generated Aspire scan inventory was refreshed through its generator and parity passes.
All 191 focused results and 21 owned-source scoped wrappers pass; final CI and S2 repair review
are pending. No product runtime behavior changed in this repair, and no product debt was accepted.

## S2 repaired candidate

The API regression fixture now parses ExecutionRecordResponseSchema, confirming that correlationId
is absent. The runner queries executions by the seed's correlation key through the existing
public route and checks actual workspace work plus database-seed payload, progress and completion.
Canonical stopAndProbe cleanup targets the known AppHost directly and asserts no owned survivors;
successful disposable workspaces are removed. Main static init precedes the isolated scenario,
which still precedes all plugin/link/runtime repair fixtures. Nested control failures retain causes.
191 focused results and all 21 owned-source check/lint/fmt gates pass. Same-session repair review
and the new exact-head runtime CI are pending. Final quality/check evidence will bind the next head.
