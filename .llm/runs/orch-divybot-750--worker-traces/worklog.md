# Worklog

## Design

1. Public surface: existing incoming context functions return message-derived context or ROOT_CONTEXT;
   queue.dequeue and trigger.ingress start fresh roots when no valid parent is carried.
2. Vocabulary: carrier = message W3C traceparent/tracestate; ambient = worker async context;
   delivery = one consumed message or trigger event; no new domain terms or states.
3. Ports: OTel Context/Tracer/propagator and existing MessageQueue/TriggerProcessorPort;
   SDK exporter + AsyncLocalStorage provide observable test seams.
4. Constants: upstream ROOT_CONTEXT, existing SpanNames, SpanKind and status conventions.
5. Commit slices: bootstrap, S1 ingress isolation + regression tests + docs + run evidence;
   S2 independent evaluator/review + final evidence. Gates and files in plan.md.
6. Deferred: links for intentional fan-out, span retention/query tuning; not required for isolation.
7. Contributor path: `packages/telemetry/src/context/w3c.ts` documents incoming parenting policy.

## Bootstrap

- Resolved feature matrix through JSON; inspected inbox and upstream issue; consulted saved memory.
- Current-main baseline recorded in supervisor.md. Assignment branch retained per operator instruction.
- PLAN-EVAL selection recorded in plan.md before implementation. IMPL-EVAL mandatory.
- RTK unavailable; direct commands and structured wrapper verdicts used.
- S1 implemented; independent slice review requested from the observed Opus evaluator.

## S1 implementation and evidence

`extractContext` now seeds incoming propagation from ROOT_CONTEXT and uses that extracted context
for the manual W3C fallback. Headerless message resolution returns ROOT_CONTEXT. Trigger ingress
uses that same resolver for every event. Message normalization keeps all tracestate list members.
Local nested span creation still inherits the active delivery span.

The new incoming-carrier regression was run against original source and failed with the worker's
span instead of undefined; after the fix it passes with/without a W3C propagator. Real SDK tests
cover sequential/concurrent queue deliveries, failure/recovery, queue → job → handler ancestry,
direct dispatcher fallback/subprocess propagation, and repeated trigger deliveries.

| Gate | Result | Evidence |
| --- | --- | --- |
| Complete telemetry, workers-core, triggers-core, workers plugin and triggers plugin test suites | 400 passed, 13 existing ignored, 0 failed | receipts/suites.json |
| Additional saga telemetry, stream command/telemetry, Fresh MCP app handler consumers | 46 passed, 0 failed | receipts/consumer-tests.json |
| Scoped structured type check | PASS, 0 errors | receipts/check.json |
| Scoped structured lint | PASS, 0 findings | receipts/lint.json |
| Scoped structured format | PASS, 122 selected/processed files | receipts/fmt.json |
| Repo quality:gate (quality:scan + arch:check + deps:check) | PASS, exit 0 | receipts/quality-receipt.json |
| Repo-native publish:dry-run --member packages/telemetry | PASS, exit 0 | operational publish-telemetry.log |
| Repo-native publish:dry-run --member plugins/triggers | PASS, exit 0 | operational publish-triggers.log |
| JSR package audits | Dry runs pass; existing cardinality warnings, banner overcount documented | operational jsr-*.log |
| Full-export-map doc lint | Existing baseline errors: telemetry 7, triggers 27. Exact package findings identical after normalizing worktree paths | receipts/doc-lint-baseline.json |
| Full scaffold.runtime --cleanup | In progress after tool-selection repairs; no PASS claimed yet | operational e2e-selected.log |

Operational evidence is under `/home/agent/projects/orchid/runs/2026-10-18-worker-traces/`.
All source checks/tests used the declared structured wrappers. `git diff --check` passes.
No signatures, dependency pins or lockfiles changed. Existing doc-lint debt is not introduced or
expanded by this slice; no new architecture debt accepted. The full gate remains recorded honestly.

## Resource hygiene and reconciliation

Read-only leak checker reported no proven run-owned survivors. It listed an existing deployment
AppHost, two Postgres containers and other unknown-owner processes; all were left alone. The
runtime smoke's own cleanup has passed on the SDK-selected retry. Final cleanup evidence pending.
The read-only baseline worktree was removed after comparison with no changes or resources created.
Current diff stays inside the declared source/run surface. Assignment files remain excluded.

## S1 independent review and sign-off — COMPLETE

Independent supervisor/reviewer: Claude Opus 5 (`claude-opus-5`, Anthropic), xhigh, session
`0faa9365-3561-462c-96f1-45c3216cd292` — different vendor and different session from the Codex
(OpenAI) implementation, so no author self-certification is involved. Declared feature-tier
fallback per supervisor.md routing; primary Muse route was unavailable without a fresh paid
allowance snapshot and no spend was attempted.

Round 1 returned PASS_SLICE_REVIEW with six findings, none blocking: F1 README format drift,
F2 published-behaviour release note, F3 unrecorded consumer consequences, F4 absent-carrier
expression, F5 duplicate test span end, F6 hardcoded parent span id. Round 2 verified the repair
delta. F4, F5 and F6 are fixed; F2 and F3 are satisfied by `release-note.md` and `drift.md`.
**F1 was withdrawn by the reviewer as incorrect**: `deno.json` limits the formatter include set to
`packages/**` and `plugins/**` `.ts`/`.tsx`, so Markdown is outside the repository's formatter
scope and the reported drift was an artefact of naming the file explicitly on the command line.
`receipts/fmt.json` is accurate for its ts/tsx scope.

`receipts/source-manifest.json` was verified by recomputing SHA-256 over each path: it lists
exactly the eight reviewed files and every digest matches the signed tree.

| Reviewer-run gate (independent, not author-reported) | Result | Evidence |
| --- | --- | --- |
| Targeted structured suite, pre-repair | 34 passed, 0 failed, 0 ignored, exit 0 | reviewer-tests.json |
| Blast-radius suite (workers-core streams, telemetry w3c, saga-core) | 144 passed, 0 failed, 4 existing ignored, exit 0 | reviewer-tests-streams.json |
| Structured lint, packages/telemetry and plugins/triggers | 0 occurrences, exit 0 | reviewer session log |
| Targeted structured suite, post-repair | 34 passed, 0 failed, 0 ignored, exit 0 | reviewer-tests-repair.json |

Substantively verified in production code rather than inferred from tests: ROOT_CONTEXT seeding
closes both masking and retention failure modes; valid traceparent, sampled flags and the full
tracestate list survive; `createSpan` honours a passed ROOT_CONTEXT so trigger ingress truly roots;
`processWorkerJob` reaches the real `getParentContextFromHeaders` fallback when no traced context is
supplied; queue to job to handler ancestry, subprocess continuation (#2136) and trigger #405
continuation are all preserved; the polyglot task path inherits per-delivery isolation transitively
through the consumer span and correctly needed no change.

S1 is complete and signed off by the independent supervisor, who owns this sign-off commit.

## Remaining for S2

- Full `deno task e2e:cli run scaffold.runtime --cleanup` merge-readiness smoke: still running at
  sign-off time. Not run, not interrupted and **not claimed green** by the reviewer.
- Final IMPL-EVAL in the same reviewer session once the smoke terminates, assessing the full
  evidence set — smoke outcome, quality:gate, publish dry runs, doc-lint baseline comparison and
  final cleanup evidence.
- Only after both: ready-merge, PR #2399 out of draft, close-gate handling for #2393.
