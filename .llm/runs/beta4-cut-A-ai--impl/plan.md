# Plan: AI Flagship Parity #388

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `beta4-cut-A-ai--impl` |
| Branch | `feat/ai-flagship-parity-388` |
| Phase | `plan` |
| Target | `plugins/ai`, `packages/plugin-ai-core`, CLI E2E scaffold runtime |
| Archetype | `5 - Plugin Package` |
| Scope overlays | `service`, `docs` |

## Archetype

`plugins/ai` is a first-party plugin package, so `ARCHETYPE-5-plugin` governs. The service overlay
applies because the slice binds generated in-process `/v1/ai` route handlers and runtime smoke
gates. The docs overlay applies for run artifacts, parity review, and PR evidence.

## Current Doctrine Verdict

Doctrine file 10 predates `plugins/ai`, but sibling plugin verdicts establish the reference bar:
workers/triggers are `Refactor` with required `verify-plugin.ts`; sagas/streams are `Keep`.
`plugins/ai` must meet the same plugin-archetype bar without moving convention-bearing logic out of
`packages/plugin-ai-core`.

## Axioms In Play

| Axiom | Why it matters |
| --- | --- |
| A1 | The public AI route contract (`aiContractV1`/`AiRouter`) is the spine before generated handlers. |
| A7 | Generated route code should rely on Web Platform `Request`, `Response`, streams, and existing package APIs. |
| A8 | New router/binder code must be in role-named package paths and kept focused. |
| A10 | In-repo router binding is a composition root, not hidden global state. |
| A14 | Contract tests, golden tests, doctor tests, JSR audit, and scaffold.runtime are the acceptance surface. |

## Goal

Close #388 by landing FAI-0 through FAI-3: contract-bound in-repo `/v1/ai` implementation, plugin
verification/golden/doctor parity, scaffold.runtime AI variants, and publishable `plugins/ai`.

## Scope

- Add a core-owned AI router binder/implementation path that implements `aiContractV1`/`AiRouter`.
- Rewrite generated `stream-proxy` and `chat-route` output to bind the contract instead of raw POST.
- Add contract soundness tests mirroring the accepted oRPC cast law.
- Add `plugins/ai/verify-plugin.ts`, scaffolder golden tests for the six real emitters, and plugin
  doctor coverage for `ANTHROPIC_API_KEY`.
- Add `ai` to scaffold.runtime default, `--persist-threads`, and stubbed `--mcp` variants.
- Flip `plugins/ai` publishable and pass full export-map JSR audit.
- Record `.llm/runs/beta4-cut-A-ai--impl/parity-review.md`.

## Non-Scope

- MCP transport pooling internals; beta.6 owns the full implementation.
- Generative UI renderer depth, reasoning/BYOK, memory/retriever, and OTel adapter work from later
  FAI slices.
- Broad CLI E2E refactors unrelated to adding the AI gate.

## Hidden Scope

- Suite/gate registry expectations must be updated wherever tests enumerate scaffold suites/gates.
- PR body must include `Closes #388` and `Refs #238, #260`.
- User prompt requires `.llm/runs/beta4-cut-A-ai--impl/commits.md` even though current harness docs
  say the PR comment trail is canonical; create it and record both.

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| LD-1 | Convention-bearing router binding belongs in `packages/plugin-ai-core`; `plugins/ai` only wires/generates. | ARCHETYPE-5 thinness law. |
| LD-2 | The true golden-test emitter count is six, not seven. | `aiStarterResources` is authoritative for the current plugin. |
| LD-3 | `--mcp` E2E variant is a declared stub for beta.4. | Owner prompt permits stubbed-then-filled because pooling deps are beta.6. |
| LD-4 | Publishability uses exact export keys and full-map doc lint. | JSR audit and beta.3 lesson. |

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| MCP pooling implementation | Safe to defer | Stub variant plus drift/PR note prevents false completion. |
| Seven vs six emitters | Resolved now | Six current emitters; parity review will state the reconciliation. |
| PLAN-EVAL launch path | Resolved now | Use separate local evaluator session if OpenHands is not callable here. |

## Risk Register

| Risk | Mitigation |
| --- | --- |
| oRPC handler types are difficult and tempt erasure casts. | Mirror existing contract tests and limit casts to the two accepted soundness casts. |
| Full scaffold.runtime is expensive. | Run targeted tests during implementation; run full suite once at the end. |
| Publish flip exposes undocumented/private exports. | Run full-map doc lint and dry-run before final. |
| E2E registry tests fail from stale enumerations. | Search/update suite constants and run `suite-registry_test.ts`. |

## Anti-Patterns To Resolve Or Avoid

| AP | Status | Plan |
| --- | --- | --- |
| AP-11 | Risk | No hidden env/global reads in core router; config stays caller/plugin doctor owned. |
| AP-14 | Risk | Re-export sibling/core contracts; do not redefine AI route vocabulary in plugin. |
| AP-23 | Risk | Generated route body references a named binder instead of burying contract logic in plugin adapter. |
| AP-25 | Risk | Keep Deno/env/filesystem side effects out of publishable non-edge code. |

## Fitness Gates

| Gate | Required | Expected evidence |
| --- | --- | --- |
| F-1 File-size lint | yes | `deno task arch:check` plus manual LOC review for new/touched files; no new >500 LOC file. |
| F-3 Layering check | yes | `deno task arch:check` where covered; manual import review for core → plugin boundaries and generated-userland paths. |
| F-5 Public surface audit | yes | Full export-map `deno doc --lint` / `deno task doc:lint --root packages/plugin-ai-core --pretty` and `--root plugins/ai --pretty`. |
| F-6 JSR publishability gate | yes | `deno publish --dry-run --allow-dirty` from `plugins/ai`; root `deno task publish:dry-run` after the publish flip. |
| F-7 Doc-score gate | yes | `deno doc --lint` clean for every exported `plugins/ai` subpath and changed `plugin-ai-core` entrypoint. |
| F-8 Workspace `lib` override check | yes | `deno task arch:check` / manual `deno.json` review; no new lib override without `deno.unstable`. |
| F-9 Permission declaration check | yes | Plugin doctor test for `ANTHROPIC_API_KEY`; README/metadata review for any added Deno/env/network assumptions. |
| F-10 Test-shape audit | yes | Targeted Deno tests for contract/golden/doctor/e2e registry; no new god test file. |
| F-11 Forbidden-folder lint | yes | `deno task arch:check`; manual review of new paths under `packages/plugin-ai-core/src` and `plugins/ai/src`. |
| F-12 Naming-convention lint | yes | `deno task arch:check` / lint; no `I*`, `*_T`, or misleading abstract names. |
| F-13 Saga/runtime invariants | subtype | Required for generated runtime route cancellation/stop behavior; evidence from stream-route tests and scaffold.runtime chat smoke. |
| F-14 Console-log lint | yes | Scoped lint plus manual review; any console use stays in generated edge/e2e scripts, not published core logic. |
| F-15 Re-export-of-upstream lint | yes | `deno task arch:check` / export-map review; plugin re-exports `@netscript/*` contracts only, not upstream vendors. |
| F-16 Folder-cardinality lint | yes | `deno task arch:check`; no new folder exceeds cardinality/depth limits. |
| F-17 Abstract-derived co-location lint | yes | `deno task arch:check`; expected N/A by inspection because no new abstract class family is planned. |
| F-18 Sub-barrel lint | yes | `deno task arch:check`; new export entrypoints are package-root/subpath files, not ad hoc `src/**/mod.ts` barrels. |
| F-19 Scoped source gate runners | yes | Scoped check/lint/fmt wrappers over `packages/plugin-ai-core`, `plugins/ai`, and `packages/cli/e2e`. |

## Scope Overlay Gates

| Overlay | Gate | Required | Expected evidence |
| --- | --- | --- | --- |
| service | Contract check | yes | `deno test --unstable-kv` contract soundness tests and full-map doc lint for route IO exports. |
| service | Service check | yes | Scoped check wrapper over generated route sources and `packages/cli/e2e`; generated workspace type-check in scaffold.runtime. |
| service | Runtime health | yes | Full `scaffold.runtime` once at the end, including AI chat-route smoke. |
| service | Trace/log review | yes | `scaffold.runtime` output summary and Aspire start/describe output; record any startup/runtime errors in worklog. |
| service | Consumer check | yes | Golden emitted scaffold imports plus generated workspace type-check in scaffold.runtime. |
| docs | Source alignment | yes | Parity review cites current code paths and the FAI-0..3 design source. |
| docs | Scope separation | yes | Parity review distinguishes beta.4 parity from deferred beta.6 MCP pooling and later AI slices. |
| docs | Link integrity | yes | Local path check by direct file existence and PR body links to committed run artifacts. |
| docs | Terminology | yes | Use doctrine terms: ARCHETYPE-5 thin plugin, core-owned conventions, scaffold.runtime, plugin doctor. |
| docs | Drift log | yes | `drift.md` records MCP stub and any validation/plan divergence. |

## Arch-Debt Implications

| Entry | Action | Notes |
| --- | --- | --- |
| `.llm/harness/debt/arch-debt.md` | none expected | Add only if MCP stub is considered debt beyond explicit deferred scope. |

## Commit Slices

| # | Slice | Gate | Files |
| - | ----- | ---- | ----- |
| 1 | Harness plan artifacts and PLAN-EVAL | Plan-gate evaluator PASS | `.llm/runs/beta4-cut-A-ai--impl/*` |
| 2 | Core AI router binder + generated stream/chat contract binding | targeted contract/golden tests | `packages/plugin-ai-core/**`, `plugins/ai/src/adapter/resources/**`, tests |
| 3 | Plugin parity: verify script, golden tests, doctor test, parity review | targeted plugin tests + verify script | `plugins/ai/**`, CLI doctor tests, `parity-review.md` |
| 4 | Scaffold.runtime AI gate variants and registry expectations | targeted e2e tests + `suite-registry_test.ts` | `packages/cli/e2e/**` |
| 5 | Publishability and full validation | scoped wrappers, doc lint, publish dry-run, full scaffold.runtime once | `plugins/ai/deno.json`, export entrypoints, PR/update artifacts |

## Validation Plan

| Order | Gate | Command or check | Expected result |
| --- | --- | --- | --- |
| 1 | Check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/plugin-ai-core --root plugins/ai --root packages/cli/e2e --ext ts,tsx` | PASS |
| 2 | Lint | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/plugin-ai-core --root plugins/ai --root packages/cli/e2e --ext ts,tsx` | PASS |
| 3 | Fmt | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/plugin-ai-core --root plugins/ai --root packages/cli/e2e --ext ts,tsx` | PASS |
| 4 | Tests | targeted `deno test --unstable-kv` for contract/golden/doctor/e2e registry tests | PASS |
| 5 | JSR | full-map `deno doc --lint` / `deno task doc:lint --root plugins/ai --pretty` and dry-run | PASS |
| 6 | Architecture | `deno task arch:check` | PASS or PENDING_SCRIPT rows with manual evidence and no new unrecorded debt |
| 7 | E2E | `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` | PASS once implementation is complete |

## Dependencies

- `@netscript/ai` contracts and agent APIs.
- `@netscript/plugin-ai-core` contract surface.
- CLI E2E scaffold runtime harness.

## Drift Watch

- Any `--mcp` behavior beyond a stub, any additional emitters beyond six, any lockfile churn, any
  inability to run full scaffold.runtime, and any JSR export-map compromise.
