# Worklog: GitHub Copilot cloud lane for the NetScript harness

## Run Metadata

| Field          | Value                                            |
| -------------- | ------------------------------------------------ |
| Run ID         | `feat-copilot-cloud-harness--copilot-cloud-lane` |
| Branch         | `feat/copilot-cloud-harness`                     |
| Archetype      | `6 - CLI / Tooling`                              |
| Scope overlays | docs, GitHub workflow                            |

## Design

Design checkpoint recorded 2026-09-04 by the separate Fable 5.1 (low) plan generator on the
`github-copilot/claude-fable-5.1` same-model fallback transport. Full decisions in `plan.md` §2.

- **Surface**: repo-internal agentic suite `.llm/tools/agentic/` (Archetype 6 shape by concern
  group, not a published package). New concern group `copilot/`; edits to `config/`, `runtime/`,
  `opencode/`, `lib/`, `github/` consumers only.
- **Transport model**: one new `ModelTransport` `github_copilot` inserted after `agy` and before
  `opencode_go` in the global priority; agent `opencode`, provider `github_copilot`, profile
  `opencode-copilot`. Capabilities added only for attested IDs (Gemini 3.8 Flash, Kimi K3, Grok 4.6,
  Fable 5.1). Deep research admits `github_copilot` only for the `google` family.
- **Extension axes touched**: `MODEL_TRANSPORTS`/`MODEL_TRANSPORT_PRIORITY`, `MODEL_CATALOG`
  capabilities, `ROUTING_MODEL_IDS`, `TRANSPORT_AGENT`/`TRANSPORT_PROVIDER`/`TRANSPORT_PROFILE`,
  `ProviderKind`, provider profiles, expense guard provider branch, `agentic:*` task list.
- **Ports/adapters**: OpenCode process launch (existing `opencode-run`), catalog attestation
  (preflight), GitHub REST (`GITHUB_API_BASE_URL` + `gh-token` resolver), local credit ledger under
  the user agentic config dir (operational state, never committed).
- **Constants**: Copilot Pro+ envelope (7000/3900/3100 credits, $0.01/credit, reset UTC day 1),
  per-tier default caps (40/60/100/150/200), Agent Tasks endpoint path, the eight documented task
  states, exit codes mirroring `openhands/` tools.
- **Commands**: `agentic:copilot-preflight` (attestation, read-only) and
  `agentic:copilot-task
  dispatch|status|watch` (dispatch dry-run by default; live requires
  `--live --authorized-by owner
  --rationale`). No cancel/steer command.
- **Slice ordering**: config → matrix → resolver+parity → profiles/credentials → attestation →
  expense → launch receipts → Agent Tasks contract/dispatch → status/watch → wiring/docs → Copilot
  instructions + canary protocol → run close (12 slices, `plan.md` §4).
- **Test strategy**: co-located `_test.ts` per touched module; fixtures for connector catalog and
  Agent Tasks responses; redaction assertions on argv/receipts; guard and parity tests as the
  single-source gates.
- **Consumer impact**: none on scaffold/generated output; `lane-policy.md` prose regenerated for
  provider order and paid-route section.
- **PLAN-EVAL**: selected (owner). Evaluator `glm_5_3@provider_default`; skip same-family Fable
  fallback. No implementation before `PASS`.

## Progress Log

| Time              | Slice     | Step      | Notes                                                                                                                                    |
| ----------------- | --------- | --------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-09-04T17:45Z | bootstrap | activated | Clean worktree from merged matrix head; feature row selected; deep research and PLAN-EVAL required.                                      |
| 2026-09-04T18:24Z | research  | generated | Gemini 3.8 Flash high completed the bounded research-only pass; no implementation files changed.                                         |
| 2026-09-04T18:25Z | research  | verified  | Primary-source sweep corrected unsupported quota, policy, API, and status claims.                                                        |
| 2026-09-04T18:28Z | plan      | blocked   | Fable limit, Go rate limit, then OpenRouter paid-training guardrail exhausted the declared plan route before inference.                  |
| 2026-09-04T18:45Z | research  | ruling    | Owner made OpenCode Copilot the default for supported non-native families; device authorization started.                                 |
| 2026-09-04T19:15Z | preflight | verified  | OpenCode Copilot OAuth succeeded; live catalog attested exact Fable 5.1, Kimi K3, and Grok 4.6 identifiers.                              |
| 2026-09-04T19:42Z | plan-eval | pass      | GLM 5.3 separate session passed all eight Plan-Gate items at `c12796b85`; Go was rate-limited, so OpenRouter transported the same model. |

## Research receipts

- GitHub GraphQL `suggestedActors(CAN_BE_ASSIGNED)` returned `copilot-swe-agent` for this
  repository.
- Agent Tasks REST documents typed dispatch plus eight terminal/non-terminal states without UI
  scraping.
- Copilot CLI documents programmatic JSONL, model/effort selection, permissions, autopilot, and a
  soft per-session AI-credit cap.
- OpenCode documents a native GitHub Copilot device-login provider; Claude Code documents no such
  provider.
- No billable Copilot task, repository policy mutation, or tool installation occurred in research.
- Plan attempts consumed no useful model tokens. The OpenCode expense watcher and OpenRouter
  guardrail both failed closed before plan generation.
- GitHub's current catalog confirms Gemini 3.8 Flash, Kimi K3, and Grok 4.6 are Copilot models. Kimi
  and Grok are the immediate high-cost routes displaced by the Copilot entitlement.
- Owner correction at 2026-09-04T19:07Z: Gemini remains on the native Google subscription through
  `agy` for every role, including deep research. Copilot-first routing applies to supported
  non-native families such as Kimi K3 and Grok 4.6; the prior broader wording is superseded.
- Owner clarification at 2026-09-04T19:17Z: a catalog-attested Copilot Gemini route is allowed as a
  same-model fallback after native `agy`. For deep research it precedes the native Luna fallback;
  the default remains native `agy`.
- OpenCode credential inventory reports GitHub Copilot OAuth without exposing secret material. The
  live connector catalog contains `github-copilot/claude-fable-5.1`,
  `github-copilot/gemini-3.8-flash`, `github-copilot/kimi-k3`, and `github-copilot/grok-4.6`; no
  model slug was inferred.

## Gate Results

### S1 — centralized Copilot configuration

- Implementation identity: `/root/copilot_harness_impl`, Codex `gpt-6-astra`, effort `low`, exact
  start `ea31286ab`; scoped worktree recorded in `supervisor.md`.
- Added four attested connector IDs, included-credit envelope, per-tier reservation caps, and
  Agent Tasks collection path in `config/`; guard explicitly verifies inclusion of new strings.
- Structured test wrapper over `.llm/tools/agentic/config`: PASS, 5 tests, exit 0;
  report `.llm/tmp/copilot-s1-test.json`.
- Reconcile: approved decisions unchanged; coordinator substantive review PASS (four config diffs
  and structured receipt verified, no findings). No live
  dispatch, installation, repository policy change, or OpenHands edit.
- Host continuity: NAS project worktree only; runtimes via `mise exec`; Docker, if needed, is the
  project DinD sandbox only. Secrets stay outside git and run artifacts.

PLAN-EVAL: `PASS` at exact plan head `c12796b85`, session `ses_f9213f890ffelYPJ3h8zaNa8O4`. All
eight Plan-Gate boxes passed; six bounded implementation notes are recorded in `plan-eval.md`.
Implementation is authorized.
