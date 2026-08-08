# Plan: versioned stream SSE and telemetry envelope (#1329)

## Run Metadata

| Field          | Value                                                                                               |
| -------------- | --------------------------------------------------------------------------------------------------- |
| Run ID         | `release-0.0.5--orchestration/slices/w2-b-1329`                                                     |
| Branch         | `fix/streams-versioned-sse-envelope`                                                                |
| Phase          | `plan-eval`                                                                                         |
| Target         | `packages/plugin-streams-core`, Fresh consumer surface, streams generator/service conformance, docs |
| Archetype      | `3 — Runtime/Behavior`                                                                              |
| Scope overlays | `frontend`, `service`, `docs`                                                                       |

## Archetype

Archetype 3 is the smallest truthful profile. The package owns a long-lived idempotent producer,
consumer/replay semantics, correlation identity, and runtime telemetry. The versioned schema is an
Archetype-1 concern folded into the larger runtime package. Fresh/browser, service/Aspire, and docs
overlays apply because the acceptance contract crosses all three consumers.

## Current Doctrine Verdict

`plugin-streams-core` is not individually listed in doctrine chapter 10, but the current package
shape is the established `-core` owner under R-PLUGIN-THIN. New code follows the Archetype-3 bar.
Two named debts are relevant and remain narrowly scoped: accepted AP-13 console warnings in the
producer, and the separate `streams-connector-sound-deferred` convergence row. This PR neither
generalizes from nor silently closes either debt.

## Axioms in Play

| Axiom | Why it matters                                                                                              |
| ----- | ----------------------------------------------------------------------------------------------------------- |
| A1/A2 | One public, versioned schema precedes parser, producer, Fresh, and docs implementation.                     |
| A7    | Native `EventSource`, Web `MessageEvent`, `AbortSignal`, and Standard Schema surfaces are used directly.    |
| A8/A9 | Contract, parsing, replay state, and browser wiring remain role-named and sized for Archetype 3.            |
| A11   | Wire protocol versus consumer outcome is the named extension boundary; reconnect is reserved for W3-A.      |
| A13   | Malformed frames and transport failures are explicit normalized outcomes; offsets never advance on failure. |
| A14   | Contract drift, real service behavior, docs examples, JSR surface, and telemetry are executable gates.      |

## Goal

Ship one exported `v1` SSE authority that exactly models upstream wire frames and validated consumer
outcomes, makes correlation/W3C context mandatory on produced data changes, governs generated/Fresh
consumers, and gives W3-A a stable replay/error seam without a second contract revision.

## Scope

- Add a package-owned `./sse` export with exhaustive names, explicit types, schemas, parsing,
  replay-state reduction, and EventSource binding.
- Extend producer input/output context so every upsert/delete carries stable correlation identity
  plus injected `traceparent` and optional `tracestate`.
- Conformance-test the transparent streams service against the exported wire contract; do not
  duplicate a payload table in service code.
- Route `@netscript/fresh/streams` and generated Fresh 2.x consumers through the authority.
- Replace the broken official native EventSource example with a copy-exact, named-event,
  schema-validated example.
- Repair this package's existing full-export private-type diagnostics and slow-type warning.
- Prove behavior against a real generated service and capture one correlated Aspire OTEL trace.

## Non-Scope

- W3-A reconnect queues, retry budgets, readiness, bounded buffering, and shutdown policy (#1326).
- Generic topic publish/subscribe transport (`streams-manifest-helpers-unsupported`).
- Streams connector migration beyond its current raw-route proxy
  (`streams-connector-sound-deferred`).
- Replacing accepted AP-13 warnings; W3-A owns structured reconnect/runtime reporting. No new
  `console.*` is permitted.
- Release merge, canary, publish, or issue closure; the milestone orchestrator owns them.

## Hidden Scope

- Existing five full-export `private-type-ref` diagnostics and one slow-type warning in the changed
  package must be cleared without a waiver.
- The browser `error` event has no data payload, while keepalive is a control frame. The public
  authority must normalize these without falsely naming them as upstream wire events.
- The documented endpoint must include `live=sse` and a committed `offset`; `EventSource` reconnect
  cannot set headers, so auth limitations must be documented honestly.

## Locked Decisions

| ID  | Decision                                                                                                                                                                                                    | Rationale                                                                                       |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| D1  | Export one `STREAM_SSE_CONTRACT_V1` authority from `@netscript/plugin-streams-core/sse`.                                                                                                                    | Versioned, discoverable, avoids parallel event/payload tables.                                  |
| D2  | Authority declares `wireEventNames = ['data','control']` and `consumerEventNames = ['data','control','heartbeat','error']`.                                                                                 | Matches real upstream while exhaustively modeling consumer behavior.                            |
| D3  | Data payload is a non-empty readonly array of validated changes; each change includes `type`, `key`, optional `value`, and headers with `operation`, `correlationId`, `traceparent`, optional `tracestate`. | Matches cardinality, deletion, correlation, and TC-7/TC-9 requirements.                         |
| D4  | Explicit per-write context wins; otherwise `key` is the correlation fallback. Trace context is injected at publish time and preserved verbatim through SSE.                                                 | Stable across durable replay/reconnect and requires no global identity.                         |
| D5  | Control payload mirrors upstream: `streamNextOffset`, optional cursor/up-to-date/closed. A valid up-to-date control with no pending data is classified as heartbeat.                                        | Keeps wire compatibility and gives callers a typed heartbeat payload.                           |
| D6  | Only control/heartbeat commits the next replay offset. Data is pending until its following control; malformed/transport error never commits.                                                                | Upstream sends control after one or more data frames; reconnect can safely replay pending data. |
| D7  | Parser returns a discriminated `StreamSseParseResultV1`, not throws for malformed browser frames. Programmer misuse still throws.                                                                           | Malformed-frame behavior is explicit and testable at the crash boundary.                        |
| D8  | `bindStreamEventSourceV1` registers named listeners and returns a disposable handle plus replay snapshot; it does not implement backoff/reconnect.                                                          | Small browser seam now; W3-A builds reconnect policy without revising the envelope.             |
| D9  | Public types are written explicitly and validators implement the existing package-owned Standard Schema shape. No public type is inferred from a private validator.                                         | `isolatedDeclarations`, doc lint, no private validator leakage, no new dependency.              |
| D10 | Server and upstream client are conformance-tested against the authority; the transparent proxy does not rewrite upstream SSE bytes.                                                                         | Preserves durable-stream compatibility and avoids owning a forked protocol.                     |
| D11 | Fresh helper re-exports/binds the core authority; generated code imports the NetScript helper and keeps interactivity in one island. Seed routes use Fresh 2.x `createDefine`.                              | One authority, smallest island, no deprecated pattern.                                          |

## Open-Decision Sweep

| Decision                        | Status        | Notes                                                          |
| ------------------------------- | ------------- | -------------------------------------------------------------- |
| Contract names and payloads     | resolved now  | Locked in D1–D5.                                               |
| Replay/malformed semantics      | resolved now  | Locked in D6–D8 for W3-A compatibility.                        |
| Correlation fallback            | resolved now  | Locked in D4.                                                  |
| Reconnect algorithm and budgets | safe to defer | Explicit W3-A scope; consumes D6–D8.                           |
| Connector convergence           | safe to defer | Existing accepted debt; unrelated raw-route architecture.      |
| AP-13 reporter replacement      | safe to defer | Existing accepted debt assigned to W3-A; must not deepen here. |

## Risk Register

| Risk                                                   | Mitigation                                                                                                  |
| ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| Exported contract drifts from upstream minor versions. | Pin conformance fixtures to real server output and fail event-name/payload/cardinality drift.               |
| “Heartbeat” falsely implies a new wire name.           | Separate wire names from consumer outcomes in types, docs, and tests.                                       |
| Data delivered twice after disconnect-before-control.  | Document at-least-once replay and require idempotent materialization by `type + key`; only control commits. |
| EventSource auth cannot send bearer headers.           | Example uses same-origin/proxy-compatible URL; docs state native EventSource header limitation.             |
| Contract leaks upstream/private validator types.       | Explicit public annotations plus full export-map doc lint and detached imports.                             |
| Runtime proof leaves resources.                        | Pre/post leak reporter, isolated AppHost, exact AppHost targeting, owned teardown verification.             |
| Scope absorbs W3-A reconnect behavior.                 | Bind helper exposes replay/error inputs only; no timers/backoff/queue policy.                               |

## Anti-Patterns to Resolve or Avoid

| AP          | Status                 | Plan                                                                                            |
| ----------- | ---------------------- | ----------------------------------------------------------------------------------------------- |
| AP-1        | risk                   | Keep domain contract, parser, and EventSource binding in focused files; no god helper/test.     |
| AP-2/AP-6   | risk                   | Use EventSource/Web APIs directly; helper adds schema/replay/correlation policy only.           |
| AP-11/AP-12 | risk                   | No global connection/replay state or reconnect timers.                                          |
| AP-13       | existing accepted debt | Cite exact producer debt, add no warning/log; replacement remains W3-A.                         |
| AP-14/AP-15 | risk                   | No upstream type re-export or private inferred validators.                                      |
| AP-19/AP-25 | risk                   | Browser/network permission and edge effects documented; EventSource construction stays at edge. |

## Fitness Gates

| Gate                | Required | Expected evidence                                                                                         |
| ------------------- | -------- | --------------------------------------------------------------------------------------------------------- |
| F-1..F-5, F-8..F-19 | yes      | `quality:gate`, `arch:check`, scoped wrappers, manual contract review; AP-13 exact debt remains accepted. |
| F-6/F-7             | yes      | full export-map `doc:lint`, JSR audit, `publish:dry-run`, detached imports, zero new slow-type waiver.    |
| F-13                | yes      | replay/cancellation/dispose semantics plus real runtime service/browser path.                             |

## Arch-Debt Implications

| Entry                                                                 | Action        | Notes                                                    |
| --------------------------------------------------------------------- | ------------- | -------------------------------------------------------- |
| `packages/plugin-streams-core — AP-13 console.warn runtime reporting` | cite/preserve | No new `console.*`; do not claim closure.                |
| `plugins/streams — connector SOUND convergence deferred`              | cite/preserve | Conformance test the proxy; do not redesign it.          |
| New debt                                                              | none planned  | Any new/deepened violation is `FAIL_DEBT`, not a waiver. |

## Commit Slices

| #  | Proves                                                                                                                                      | Decisive gate                                                                                                           | Files                                                                                                                          |
| -- | ------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| S0 | Research/design is current and adversarially approved before code.                                                                          | separate PLAN-EVAL `PASS`                                                                                               | slice `research.md`, `plan.md`, `worklog.md`, `context-pack.md`, `drift.md`                                                    |
| S1 | One v1 authority validates all wire payloads/outcomes and defines replay, deletion, malformed-frame, correlation, and W3C semantics.        | contract/schema unit tests; scoped check/lint/fmt; full `doc:lint`                                                      | `packages/plugin-streams-core/src/domain/sse-*`, `src/application/parse-*`, `src/public`, `mod.ts`, `deno.json`, focused tests |
| S2 | Producer and transparent server conform to the authority, with stable correlation and trace headers and no parallel table.                  | producer/telemetry/service conformance tests; `quality:gate`; `arch:check`                                              | producer port/runtime, telemetry explicit types, streams service tests, package README                                         |
| S3 | Fresh 2.x and generated/native consumers use named schema-validated events from the same authority.                                         | Fresh/generator/type-fixture tests; unchanged example conformance test; browser states                                  | `packages/fresh/src/runtime/streams/**`, `plugins/streams/.../consumer*`, docs example/reference tests                         |
| S4 | A real generated service proves batching, deletion, control/replay, reconnect seam, heartbeat/error/malformed handling and correlated OTEL. | pre/post leak-check; isolated Aspire; browser/consumer receipt; OTEL trace export                                       | focused runtime fixture/evidence and slice worklog/context pack                                                                |
| S5 | Published/docs surface is clean and merge-readiness evidence is complete.                                                                   | scoped wrappers, `doc:lint`, JSR audit, `publish:dry-run`, `quality:gate`, `arch:check`, links/accuracy, review threads | package/docs/run artifacts; no product expansion                                                                               |
| S6 | Serialized release smoke remains green.                                                                                                     | orchestrator grant + exact one-pass `scaffold.runtime`                                                                  | evidence-only run artifacts                                                                                                    |

## Validation Plan

| Order | Gate                           | Command or check                                                                                   | Expected result                                            |
| ----- | ------------------------------ | -------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| 1     | Targeted contract/server/Fresh | focused `deno test --no-lock --allow-all ...`                                                      | raw exit 0; drift negatives fail as expected               |
| 2     | Scoped check                   | `run-deno-check.ts --root <owned root> --ext ts,tsx --deno-arg --no-lock --deno-arg --unstable-kv` | exit 0                                                     |
| 3     | Scoped lint/fmt                | repo wrappers per owned roots                                                                      | exit 0                                                     |
| 4     | Docs/JSR                       | `doc:lint` full export map; JSR audit; `publish:dry-run`                                           | zero diagnostics/slow types; exit 0                        |
| 5     | Framework law                  | `rtk proxy deno task quality:gate`; `rtk proxy deno task arch:check`                               | exit 0 or exact pre-existing AP-13 debt only as registered |
| 6     | Consumer/docs                  | detached import/type fixture, Fresh tests, copy-exact docs example, link/accuracy checks           | exit 0                                                     |
| 7     | Runtime/OTEL                   | leak-check → isolated AppHost/browser → OTEL trace → exact owned cleanup → leak-check              | correlated trace receipt and zero owned leaks              |
| 8     | Review threads                 | `agentic:review-threads` for draft PR                                                              | exit 0 before handoff                                      |
| 9     | Serialized runtime             | request token in worklog; run exact one-pass only after grant                                      | raw exit 0; no lock/source churn; zero owned leaks         |

## Dependencies

- Verified C14 main/base supplied by the orchestrator.
- W3-A #1326 remains held until this exported contract lands.
- Upstream protocol is conformance input, not a public type dependency.
- Separate native Claude/Fable PLAN-EVAL and later IMPL-EVAL sessions are orchestrator-launched.

## Drift Watch

- Any upstream wire event beyond `data/control`, any payload field/cardinality difference, any need
  to rewrite proxy bytes, or any reconnect behavior required to make S1–S3 correct is significant
  drift and requires plan update/rescope before implementation continues.
