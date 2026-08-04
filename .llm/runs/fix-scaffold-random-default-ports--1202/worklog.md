# Worklog: randomized scaffold default ports

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-scaffold-random-default-ports--1202` |
| Branch | `fix/scaffold-random-default-ports` |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | service |

## Design

### Public Surface

- Existing `netscript init`, `netscript service add`, and `netscript plugin install` options.
- Existing generated service/app source and `appsettings.json` resource entries.
- No exported API or command-vocabulary change.

### Domain Vocabulary

- Scaffold listener range: inclusive high-range floor and ceiling.
- Project/resource seed: stable identity for a generated listener fallback.
- Port allocation: numeric port plus `user` or `auto` provenance.
- Host pin: an explicit user choice; absent for automatic allocation.

### Ports

- Existing filesystem ports discover configured allocations.
- Existing Aspire endpoint directory and `PORT` environment injection discover dynamic endpoints.
- No new external port/interface is introduced.

### Constants

- `SCAFFOLD_PORT_RANGE`: 49152–65535.
- Existing `USER_PORT_RANGE`: explicit override validation remains 1024–65535.
- Protocol target constants remain unchanged and outside this default-listener contract.

### Archetype-6 Structural Inventory

- Five spine abstracts: unchanged (`CliCommand<Input, Result>`, `CliCommandGroup`, `CliRoot`,
  `UseCase<Input, Result>`, `Registry<TKey, TValue>`).
- Layer-2 abstracts: none introduced or changed.
- Vertical features: existing init, service-add, plugin-install, and E2E scaffold gates only.
- Extension registries and composition roots: unchanged.
- Effects remain in existing filesystem/process adapters; the allocator is pure domain policy.

### Commit Slices

| # | Slice | Proving gate | Files |
| --- | --- | --- | --- |
| 1 | Lock evidence/design and open the draft review surface. | composed milestone Plan-Gate recorded | run artifacts; PR body |
| 2 | Add RED-first generated-output contract and route every automatic listener through the high-range/dynamic policy. | focused RED/GREEN tests; scoped wrappers; substantive diff review | CLI allocator, init/app/service/plugin emitters, E2E command, tests, run artifacts |
| 3 | Prove framework quality, clean runtime one-pass, cloud verdict, and close-gate truth. | quality/arch/JSR gates; serialized `scaffold.runtime`; CI/evaluator | run artifacts; PR/issue evidence |

### Deferred Scope

- Windows service identification is owner-owned.
- Upstream protocol ports and endpoint-directory redesign are not part of this slice.

### Contributor Path

To add a listener-bearing scaffold resource, derive its automatic fallback from the shared
project/resource allocation contract, record already configured listener ports, omit a host pin by
default, and extend the semantic generated-output table.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-08-04 | 1 | bootstrap | Issue body and all live comments read; branch equals current origin/main. |
| 2026-08-04 | 1 | interruption recovery | Daemon restarted before any commit; resumed with zero commits/source edits. |
| 2026-08-04 | 1 | plan-gate | `composed per milestone-run.md (orchestrator waiver)`; plan locked before implementation. |
| 2026-08-04 | 2 | contract RED | Focused tests exited 1: generated service `3000` and Vite `5173` fallbacks violated the `49152` floor; 9 tests passed and only the two new contract assertions failed. |
| 2026-08-04 | 2 | implementation GREEN | Shared seeded allocator covers init/app/service/plugin emission; app/services are dynamic under Aspire, plugin APIs use stable high-range pins; runtime commands no longer pin `3001`. |
| 2026-08-04 | 2 | focused gates | Generator/service/plugin/E2E gate suites green; related E2E set green (45 tests plus 26 nested steps). Scoped check selected 776 files with zero diagnostics; lint/fmt selected 776 with zero findings. |
| 2026-08-04 | 2 | framework gates | `quality:gate` exit 0 with no quality findings/new allowances; CLI `publish:dry-run` exit 0. |
| 2026-08-04 | 3 | runtime queue | Read-only leak check found the serialized slot owned by active `ns005-s7` AppHosts/containers; left untouched and queued behind. |
| 2026-08-04 | 3 | runtime one-pass | `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` exited 0: 70 passed, 0 failed. Prisma init/generate/seed, `behavior.service-health`, project-seeded plugin endpoints, app, Flow-B, and OTEL all passed. |
| 2026-08-04 | 3 | cleanup audit | Post-run leak check reports zero survivors. Inherited `deno.lock` diff remains exactly one excluded line. |
| 2026-08-04 | 3 | impl-eval | Separate Claude Code + OpenRouter Qwen 3.7 Max session inspected commit `2046e2af2`; verdict PASS with no blocking findings. The open-model guard rejected an attempted default closed-model child before execution; evaluation resumed in the same Qwen session without delegation. |
| 2026-08-04 | 3 | cloud dispatch | PR marked ready to trigger hosted gates. Cloud scaffold-static, surface-diff, code-quality, classification, and packaging passed. `scaffold-runtime` was cancelled twice after roughly two minutes without a runner (`runner_id: 0`, empty runner name, zero steps/logs), including one explicit failed-job retry; no test executed, so the cloud runtime verdict remains unavailable. |
| 2026-08-04 | 3 | review threads | Read-only review-thread gate passed: 0 threads, 0 unanswered. |
| 2026-08-04 | 4 | repo-wide regression RED | Reproduced the current-head failures: companion plugin API entries omitted `Port`, and the durable CLI parity fixture lacked the project seed required by allocator-backed endpoints. Focused result: 23 passed, 3 failed. |
| 2026-08-04 | 4 | correction GREEN | Restored `Port: servicePort` while retaining optional seeded `HostPort`; durable parity now asserts allocator-derived worker/saga endpoints from an explicit project seed. Focused CLI plus Redis files: 28 passed, 0 failed, 3 Redis integration tests ignored because no local endpoint was configured. |
| 2026-08-04 | 4 | Redis diagnosis | No `packages/kv` or `packages/plugin-sagas-core` diff exists in this PR. Both integration tests already use UUID namespaces, and Redis list matches `<namespace>:<prefix>:*`; the executing b334 repo-wide log ended with only the three CLI failures. The reported 12-entry Redis observations are not causally connected to port seeding on available evidence. |
| 2026-08-04 | 4 | correction gates | Scoped CLI check: 787 files, 7 batches, zero diagnostics. Scoped fmt: 787 files, zero findings. `quality:scan` and `arch:check` exited 0 with no new findings/allowances. Orchestrator owns the fresh runtime/cloud proof and DoD box. |

## Gate Results

| Gate | Status | Evidence |
| --- | --- | --- |
| Plan-Gate | composed | `plan-eval.md`; owner/orchestrator waiver |
| Generated-output RED/GREEN | pass | Baseline exit 1 on service/Vite low defaults; implementation focused suites green |
| Scoped wrappers | pass | check/lint/fmt: 776 selected, zero findings |
| Quality/architecture | pass | `deno task quality:gate`, exit 0; no new allowances |
| JSR static audit | pass | CLI `publish:dry-run`, exit 0 |
| `scaffold.runtime` | pass | One clean local pass: 70 passed, 0 failed; cleanup pass and zero survivors |
| IMPL-EVAL | pass | `evaluate.md`; Qwen 3.7 Max separate session, no blocking findings |
| Cloud static/supporting lanes | pass | scaffold-static, surface-diff, code-quality, classification, packaging |
| Cloud `scaffold-runtime` | infrastructure-blocked | Two pre-run cancellations; `runner_id: 0`, zero steps/logs |
| Review threads | pass | 0 threads, 0 unanswered |
| Correction focused tests | pass | 28 passed, 0 failed, 3 Redis integrations ignored without endpoint |
| Correction scoped check/fmt | pass | 787 selected; zero diagnostics/findings |
| Correction quality/architecture | pass | `quality:scan` and `arch:check`, exit 0 |
