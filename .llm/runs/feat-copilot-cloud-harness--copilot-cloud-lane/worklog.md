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

### S7 — guarded launch and truthful identity

- S6 pushed `a7e6b7e78`, PR comment `5545840442` posted.
- Copilot launch requires receipt, Git branch/head, exact catalog, and atomic credit reservation
  before inference. Missing catalog blocks without reservation/spawn. Child `clearEnv` enforces
  credential deletion. Untested inference-based MCP preflight is refused for this route.
- Effort must explicitly be `provider_default`; no unproven variant flag is passed. Identity
  retains catalog evidence but leaves actual runtime model/effort unknown (`pending`), rather than
  claiming catalog listing proves inference identity. Native identity typing remains unchanged.
- Structured tests PASS 26/26 (`.llm/tmp/copilot-s7-test.json`), check PASS 2 production files.
- Reconcile: owner requests efficient closeout; coordinator authorizes combined S8/S9 and S10/S11/S12
  if coherent and under 30 files. No new research or optional expansion. S7 Tier-A review PASS.

### S6 — fail-closed local credit reservations

- S5 pushed `52338f416`, PR comment `5545806096` posted.
- Pure Copilot decision rejects missing/malformed/future/stale ledger, invalid integer caps, and
  included-envelope overflow. A valid prior UTC month re-zeros; malformed chronology never does
  (PLAN-EVAL note 2). Same-month freshness uses the existing snapshot max-age configuration.
- Operational ledger resolves outside the repository. Exclusive create-new lock plus atomic
  replacement reserves the entire cap, mode 0600; concurrent/unknown locks fail closed. Missing
  ledger is not silently initialized. No observed-usage refund or overage assumption.
- Structured tests PASS 20/20 (`.llm/tmp/copilot-s6-test.json`), check/lint PASS 2 production files.
- Reconcile: no new paid call, scope unchanged; Tier-A review PASS. Coordinator explicitly accepts
  same-month 15-minute freshness; after longer idle, owner reconciliation must update accounting
  from GitHub billing. S10/S11 docs must state this operational boundary.

### S5 — exact connector catalog attestation

- S3/S4 pushed `45f553bc1`, PR comment `5545785827` posted.
- Non-inference `opencode models github-copilot` probe validates exact full IDs, isolates child
  environment, bounds catalog command lifetime, and retains only model/presence/timestamp.
- Missing capability feeds `RouteAvailability.unavailableTransports`; test proves Gemini proceeds
  to native Luna after unavailable agy/Copilot without guessing a model.
- Structured preflight/config tests PASS 10/10, `.llm/tmp/copilot-s5-test.json`, exit 0.
- Reconcile: fresh Agent Tasks docs contradict Pro+ create entitlement; coordinator ruling and
  corrected response shape recorded in drift. OpenCode routing is unaffected. Tier-A review PASS.

### S3 + S4 — resolver, prose, credential-free profile

- S2 pushed as `38f213c8f`, PR comment `5545720902` posted.
- Combined with coordinator approval for the exhaustive profile/type compile dependency (drift).
- Resolver binds Copilot to OpenCode and propagates model family to the deep-research guard.
- Profile has null credential keys and no child bindings. OpenCode Copilot environment clears rival
  API keys and GitHub token overrides without reading any credential store.
- Lane-policy provider order, paid allowance, and deep-research prose updated (PLAN-EVAL note 3).
- Structured resolver/parity/profile/environment/credential/launcher/config wrapper: PASS 53/53,
  exit 0 (`.llm/tmp/copilot-s34-test.json`); coordinator independently reran 53/53 and reviewed PASS.
- Scoped structured check and fmt PASS (4 production files). Lint initially refused all-excluded
  root config; explicit empty scratch config `.llm/tmp/copilot-lint.json` restored complete
  selection coverage and passed (4/4 files). No raw output was substituted for a gate.
- Reconcile: no change to native family defaults, existing OpenHands, or approved live-task boundary.

### S2 — typed Copilot matrix

- S1 pushed as `f4afe80c0`; PR IMPL comment `5545703862` posted.
- Added exactly four attested capabilities and priority after native `agy`, before Go.
- Deep research permits Copilot only for Google; absent family fails closed. Existing matrix
  routes and evaluator-family rules are unchanged.
- Structured matrix tests PASS: 12/12, exit 0, `.llm/tmp/copilot-s2-test.json`.
- Tier-A substantive review PASS, no findings. Reconcile: no scope or owner-routing changes;
  resolver exhaustive bindings and family propagation remain S3.

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
