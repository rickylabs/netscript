# Worklog: Aspire CLI adapter production hardening

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `feat-openapi-mcp-manifest-cli--1133` |
| Branch | `feat/openapi-mcp-manifest-cli` |
| Archetype | `2 - Integration` |
| Scope overlays | `none` |

## Design

### Public Surface

- Existing `AspireCliEndpointSource` and `AspireCliEndpointSourceOptions`; no new entrypoint.
- Existing `SourceOutcome` exposes every failure as data.

### Domain Vocabulary

- `appHostPath` — exact real path selecting one AppHost.
- `appHostPid` — CLI-visible run identity, stable across one describe snapshot.
- `projectRoot` — real-path ownership boundary for AppHost and resource working directories.

### Ports

- `EndpointSourcePort` — unchanged consumed contract.
- `AspireCliCommand` — existing injected spawn boundary, reused for `ps` and `describe`.

### Constants

- Existing `SOURCE_FAILURE_CODES`; extend only for a finite, machine-readable CLI identity failure.

### Commit Slices

| # | Slice | Gate | Files |
| --- | --- | --- | --- |
| 1 | Harness bootstrap and locked design | artifact review | run dir |
| 2 | Identity-bound drift-tolerant CLI adapter + fixtures | focused MCP tests + static/fitness gates | adapter, port, tests, docs, run dir |
| 3 | Serialized scaffold runtime proof and handoff | `scaffold.runtime` plus separate composed evaluation | E2E evidence, run dir, PR surface |

### Deferred Scope

- `list_api_services` tool wiring remains S6 unless it merges before the runtime gate.
- Manifest emission is rejected by qualified F1(b).

### Contributor Path

Add a future Aspire output variant by extending the adapter's named field readers and adding one
fixture that proves both accepted drift and rejection of an adjacent torn/ambiguous shape.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-08-04 | 1 | bootstrap | Read brief, five named skills, tooling/JSR guidance, #1133, RFC §F1, P1 verdict, doctrine, matrix, and real CLI output. |
| 2026-08-04 | 1 | serialization | `aspire ps` showed baseline-owned AppHosts; runtime gate queued. |
| 2026-08-04 | 2 | implementation | Added pre/post AppHost process binding, real project ownership checks, balanced/case-tolerant JSON parsing, and explicit identity failures. |
| 2026-08-04 | 2 | review | Split spawn and output parsing from the 370-line draft; final files are 36/282/64 lines. |
| 2026-08-04 | 2 | live fault proof | A removed baseline AppHost returned `run_id_mismatch` with zero candidates; a current baseline AppHost returned `used`. |
| 2026-08-04 | 2 | reconcile | S6 still open; no E2E tool-path dependency absorbed. AppHost gate remains serialized. |
| 2026-08-04 | 3 | interrupted gate | First canonical pass was killed by the Codex daemon update during AppHost start. Ownership reporter found and teardown removed two run-owned containers; no foreign resources touched. |
| 2026-08-04 | 3 | serialization | A retry was refused by the suite lease held by `ns005-ports`; queued until its PID exited. |
| 2026-08-04 | 3 | negative E2E | Named MCP gate rejected fixed proxy port 3001 because it identified as foreign service `products`; no false live row escaped. |
| 2026-08-04 | 3 | hardening | Adapter now prefers the real CLI-described executable target `PORT`, retaining declared URL host/protocol normalization. |
| 2026-08-04 | 3 | baseline failures | Full one-pass attempts later stopped at existing `behavior.service-health` DB health and `runtime.wait.workers-api` gates before S7. Cleanup passed and leak checks found no survivors. |
| 2026-08-04 | 3 | serialized CI proof | After the baseline holder released the global slot, e2e-cli attempt 2 passed the named MCP gate in 4.896s and the canonical suite completed 71/71 with cleanup. |
| 2026-08-04 | 3 | S6 reconcile | Main gained S6/#1204 before handoff, so the named gate was upgraded from the permitted directory fallback to `createListApiServicesFlow`; current-head CI must repeat the live proof. |
| 2026-08-04 | 3 | D15 live capture | On the #1211-rebased head, a fresh `s7-box43-live` scaffold ran beside foreign AppHosts. Exact-path `aspire describe` exposed `users` proxy `45889` and allocated target `PORT=45253`; the public MCP `list_api_services` tool returned `users` running from `aspire-cli` at `http://127.0.0.1:45253` with 3 operations. |
| 2026-08-04 | 3 | cleanup | Stopped only the exact S7 AppHost. A foreign sagas AppHost remained live before, during, and after the capture; no foreign AppHost/container was touched. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| Qualified F1(b), no template emission | P1 locked verdict | #1123 §F1 / P1 verdict / owner brief |
| CLI run binding is exact AppHost path + stable PID | Facts exposed by real Aspire 13.4.6 `ps` | research D1-D3 |
| PLAN-EVAL is composed/not-local | Milestone evaluator rule | owner brief / milestone-run D6 |
| Adapter capture may coexist with foreign AppHosts | Exact-path/run/service identity is the subject under test; full suite remains serialized | orchestrator ruling D15 |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| Issue title/body still describe manifest emission; authoritative F1(b) re-scopes to CLI hardening. | significant | yes |

## Gate Results

### Static Gates

| Gate | Command or check | Result | Notes |
| --- | --- | --- | --- |
| plan gate | composed milestone ruling | PASS | `plan-eval.md` is explicitly not a local formal eval. |
| package check | `deno task --config packages/mcp/deno.json check` | PASS | all three entrypoints checked |
| scoped lint | run-deno-lint with package config | PASS | 90 files, zero findings |
| scoped fmt | run-deno-fmt with package config | PASS | 90 files, zero findings |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| focused fault/integration tests | PASS | 17/17 | source and directory suites |
| package tests | PASS | 95/95 | `packages/mcp` task |
| quality scan | PASS | repository scanner | zero findings |
| arch check | PASS with baseline warnings | root task | zero failures; unrelated existing warnings only |
| F-5/F-6 JSR | PASS | `deno doc --lint` + `deno publish --dry-run --allow-dirty` | 3 exports checked; no slow types; dry run success |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| AppHost serialization | PASS | `aspire ps --format Json` | Baseline owns slot; this run did not start resources. |
| live stale-run refusal | PASS | direct adapter read | removed AppHost produced `run_id_mismatch`, no candidates |
| live current-run query | PASS | direct adapter read | current baseline DB-operation AppHost produced `used` |
| `scaffold.runtime` infrastructure | FAIL (baseline) | canonical one-pass command | independent pre-S7 failures: users DB-health aggregate; workers-api timeout |
| `behavior.mcp-endpoint-directory` negative case | PASS | canonical one-pass named gate | contested proxy identified as `products`; adapter returned `identity_mismatch` |
| `behavior.mcp-endpoint-directory` target-port case | PASS | [e2e-cli attempt 2](https://github.com/rickylabs/netscript/actions/runs/30895255613/job/91950747988) | named live gate passed in 4.896s; canonical suite 71/71 with cleanup |
| box-43 `list_api_services` positive capture | PASS | [PR #1206 evidence](https://github.com/rickylabs/netscript/pull/1206#issuecomment-5178346127) | fresh randomized-port scaffold; describe target `45253` matched tool base URL; foreign AppHost stayed live |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| --- | --- | --- | --- |
| scaffolded app | PASS | [PR #1206 box-43 evidence](https://github.com/rickylabs/netscript/pull/1206#issuecomment-5178346127) | public `tools/call` → `list_api_services` selected this AppHost's randomized allocated target port and returned the live `users` service from `aspire-cli`. |

## Handoff Notes

- Evaluator should inspect identity rejection fixtures and the post-describe run-stability check first.
