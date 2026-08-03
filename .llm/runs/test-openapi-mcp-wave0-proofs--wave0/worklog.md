# Worklog: OMB wave-0 proofs

## Run Metadata

| Field          | Value                                  |
| -------------- | -------------------------------------- |
| Run ID         | `test-openapi-mcp-wave0-proofs--wave0` |
| Branch         | `test/openapi-mcp-wave0-proofs`        |
| Archetype      | N/A — proof/measurement slice          |
| Scope overlays | service                                |

## Design

### Public Surface

- `proofs/P1-verdict.md` — empirical Aspire lifecycle verdict and F1(a)/(b) arbitration.
- `proofs/P2-verdict.md` — empirical DB/no-DB spec fidelity and truncation-budget verdict.
- `proofs/P3-verdict.md` — empirical auth-guarded spec verdict and ratified wording.
- RFC #1123 §9 and epic #1126 — decision records updated only from the committed P1 outcome.
- No package, plugin, template, service, or CLI export changes.

### Domain Vocabulary

- `ProofStatus` — exactly `PASS` or `FAIL`; incomplete and skipped executions are FAIL.
- `F1Outcome` — exactly `(a)` post-allocation callback or `(b)` Aspire CLI discovery.
- `EndpointManifest` — schema version, real project root, run UUID, timestamp, and sorted service
  identity/allocated-URL entries.
- `P2Measurement` — compact-JSON byte counts, operationId observations, schema views, errors, refs,
  and keyword subset for one live scaffold spec.
- `SpecUnavailableEnvelope` — ratified MCP-facing text for an OpenAPI document blocked by auth or
  otherwise unreachable.

### Ports

- Aspire `onResourceEndpointsAllocated` event — existing lifecycle boundary tested by P1.
- `EndpointReference.getValueAsync()` — existing allocated-value boundary tested by P1.
- Live `/api/openapi.json` HTTP route — runtime evidence boundary for P1/P2/P3.
- Existing auth fixture in `packages/service/tests/auth/define-service-auth_test.ts` — P3 behavior
  boundary; it is executed, not edited.
- GitHub RFC/epic issue bodies — external decision record updated after local P1 evidence commits.

### Constants

- Verdict files: `P1-verdict.md`, `P2-verdict.md`, `P3-verdict.md`.
- Experiment roots: `<run>/proofs/{experiments,evidence}` and `.llm/tmp/openapi-mcp-wave0-proofs/`.
- Current MCP limits: `maxItems=50`, `maxStringLength=2000`; whole-result bytes are unbounded.
- Default spec route: `/api/openapi.json`.
- Manifest path under the scratch app: `.netscript/run/endpoints.json`.

### Commit Slices

| #  | Slice                                                           | Gate                                                                                                                                                    | Files                                                                                                                        |
| -- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| S0 | Lock plan/design and formal PLAN-EVAL                           | Separate Qwen `plan-eval.md=PASS`; format run Markdown                                                                                                  | `plan.md`, `research.md`, `worklog.md`, `context-pack.md`, `drift.md`, `implement.md`, `briefs/plan-eval.md`, `plan-eval.md` |
| S1 | Prove/refute post-allocation endpoint manifest and arbitrate F1 | Owned Aspire status + manifest/describe/live-request agreement + log review + verified teardown; separate Fable review                                  | `proofs/P1-verdict.md`, `proofs/experiments/p1-*`, `proofs/evidence/P1-*`, seed `rfc.md` §9, run logs/context                |
| S2 | Measure DB and no-DB live spec fidelity/size                    | Measurement script check/lint/fmt + two normalized evidence files + schema/error/keyword completeness review + verified teardown; separate Fable review | `proofs/P2-verdict.md`, `proofs/experiments/p2-*`, `proofs/evidence/P2-*`, run logs/context                                  |
| S3 | Prove auth-guarded spec behavior and ratify wording             | Targeted existing auth test + response evidence + wording review; separate Fable review                                                                 | `proofs/P3-verdict.md`, `proofs/evidence/P3-*`, run logs/context                                                             |
| S4 | Final hygiene and evaluation                                    | Scoped wrappers, no lint ignores, lock/scope audit, leak check, review-thread gate, separate Qwen IMPL-EVAL                                             | `worklog.md`, `context-pack.md`, `drift.md`, `evaluate.md`, PR metadata/comments                                             |

### Deferred Scope

- Production lifecycle discovery/template implementation — S7 (#1133), after P1.
- MCP discovery/search/schema tools and bounded output implementation — later RFC Wave 1 slices.
- Production `spec_unavailable` emission/auth feature work — later RFC Wave 4 slices.
- Any service/CLI/Aspire doctrine remediation — separately scoped product work.

### Contributor Path

To reproduce a proof, create fresh local-source scratch scaffolds below the named `.llm/tmp/` root,
run only the matching experiment with one owned AppHost, normalize evidence into the committed JSON
shape, tear the complete owned process tree down, and update the verdict. Do not copy experiment
logic into a product template in this run.

## Progress Log

| Time       | Slice     | Step                | Notes                                                                                                                                                                                                                                         |
| ---------- | --------- | ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-08-03 | bootstrap | research            | Read #1127–#1129, epic #1126, RFC #1123 §§4/9, named skills, doctrine boundary, canonical discovery/projection designs, and current Aspire eventing docs.                                                                                     |
| 2026-08-03 | bootstrap | environment         | Verified clean current-main baseline; inventoried foreign AppHosts/containers without mutation.                                                                                                                                               |
| 2026-08-03 | bootstrap | PR                  | Committed/pushed harness bootstrap and opened draft PR #1182 with required milestone/taxonomy; closing keywords remain withheld.                                                                                                              |
| 2026-08-03 | S0        | design              | Locked D1–D12, proof schemas, serialized runtime method, gate set, commit slices, and skip-as-FAIL rule. No experiment files created.                                                                                                         |
| 2026-08-03 | S0        | evaluator preflight | First canonical live canary reported `auth_required` because the shell lacked an exported key. The documented OpenRouter env file is present; retry will use its assignment parser and isolated child environment without exposing the value. |
| 2026-08-03 | S0        | evaluator preflight | Parser-backed retry passed on Qwen 3.7 Max/high: credential available and tools/reasoning/streaming supported. No secret entered logs or files.                                                                                               |
| 2026-08-03 | S0        | PLAN-EVAL retry     | The model guard denied Qwen's attempted delegation to default child `claude-opus-5` (exit 78); no closed request reached OpenRouter and no verdict was written. Brief tightened to require single-session evaluation.                         |
| 2026-08-03 | S0        | PLAN-EVAL retry     | The generic agent adapter's 30-second bound expired before the first full evaluator turn could write an artifact. A fresh single-session retry used a 240-second orchestration bound without changing provider/model/guard policy.            |
| 2026-08-03 | S0        | PLAN-EVAL           | Separate Qwen 3.7 Max/high session wrote `plan-eval.md` with `PASS` after rechecking source, RFC §4/§9, D1–D12, the open-decision sweep, all 5 commit slices, service gates, deferred scope, and JSR N/A.                                     |

## Decisions

| Decision                           | Reason                                                            | Source                            |
| ---------------------------------- | ----------------------------------------------------------------- | --------------------------------- |
| Verdict artifacts live in this run | RFC explicitly names implementing-run `proofs/`                   | RFC #1123 §4                      |
| P1 has no presumed outcome         | FAIL is a valid proof result selecting F1(b)                      | RFC #1123 §9 / #1127              |
| Two scaffolds, serialized          | P2 requires DB and no-DB; shared host forbids concurrent AppHosts | Plan D3 / user hazard             |
| No product/template edits          | Productization is S7 and public surface is excluded               | User contract / doctrine boundary |
| Skip/incomplete means FAIL         | Prevents false-green proof status                                 | RFC #1123 §4 / user contract      |

## Drift

| Drift                                                             | Severity        | Logged in drift.md |
| ----------------------------------------------------------------- | --------------- | ------------------ |
| User-addressed Codex supervisor route                             | minor           | yes                |
| Service overlay's two additional-read files absent                | minor           | yes                |
| First evaluator canary did not inherit documented file credential | minor, resolved | yes                |

## Gate Results

### Static Gates

| Gate                      | Command or check                     | Result  | Notes                                                         |
| ------------------------- | ------------------------------------ | ------- | ------------------------------------------------------------- |
| Plan artifact format      | scoped run formatter                 | PASS    | All owned run Markdown checked after PLAN-EVAL output.        |
| Experiment check/lint/fmt | scoped wrappers under `<run>/proofs` | NOT_RUN | No experiment source exists before Plan-Gate PASS.            |
| No lint ignores           | diff scan                            | NOT_RUN | Final slice.                                                  |
| Lock/scope audit          | raw git diff vs `origin/main`        | NOT_RUN | Final slice; `deno.lock` and product paths must be untouched. |

### Fitness Gates

| Gate                   | Result  | Evidence                  | Notes            |
| ---------------------- | ------- | ------------------------- | ---------------- |
| Archetype F-*          | N/A     | No package/plugin surface | Proof-only run.  |
| Service contract check | NOT_RUN | P2 live spec evidence     | After Plan-Gate. |
| Service runtime health | NOT_RUN | P1/P2 evidence            | After Plan-Gate. |
| Trace/log review       | NOT_RUN | P1/P2 evidence            | After Plan-Gate. |
| Consumer check         | NOT_RUN | P2 projector evidence     | After Plan-Gate. |

### Runtime Gates

| Gate                    | Result  | Evidence               | Notes                                 |
| ----------------------- | ------- | ---------------------- | ------------------------------------- |
| P1 lifecycle            | NOT_RUN | `proofs/evidence/P1-*` | Hard-gated by PLAN-EVAL.              |
| P2 DB/no-DB measurement | NOT_RUN | `proofs/evidence/P2-*` | Hard-gated by PLAN-EVAL.              |
| P3 auth fixture         | NOT_RUN | `proofs/evidence/P3-*` | Hard-gated by PLAN-EVAL.              |
| Resource leak check     | NOT_RUN | final reporter output  | Foreign baseline already inventoried. |

### Consumer Gates

| Consumer                      | Result  | Evidence    | Notes                              |
| ----------------------------- | ------- | ----------- | ---------------------------------- |
| Generated DB scaffold spec    | NOT_RUN | P2 evidence | Must be live, not source-inferred. |
| Generated no-DB scaffold spec | NOT_RUN | P2 evidence | Must be live, not source-inferred. |

## Handoff Notes

- PLAN-EVAL should first verify D4–D9 against RFC §4/§9 and ensure no empirical result is presumed.
- Spot-check research finding 5 against Aspire's documented event API and finding 6 against the
  existing auth test.
- Implementation must not begin unless `plan-eval.md` contains a separate-session `PASS`.
