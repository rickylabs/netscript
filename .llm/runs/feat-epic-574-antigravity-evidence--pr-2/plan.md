# Plan: Antigravity evidence-acquisition lane (#578)

## Run Metadata

| Field | Value |
| ----- | ----- |
| Run ID | `feat-epic-574-antigravity-evidence--pr-2` |
| Issue / PR | #578 / draft #587 |
| Branch | `feat/epic-574-antigravity-evidence` |
| Base | `rickylabs-epic-574-wsl-agentic-runtime` @ `800848ae` |
| Phase | `plan` — hard stop before implementation |
| Target | `.llm/tools/agentic/runtime` internal tooling |
| Archetype | 6 — CLI / Tooling, scoped internal-tool variant |
| Scope overlays | none |

## Goal

Add a bounded, read-only Antigravity evidence contract and adapter that classifies capability facts
for downstream synthesis/decision agents without making source, architecture, routing, fallback, or
rollout decisions. Integration stays deferred until owner-confirmed live canaries prove the required
headless, sandbox, acquisition, and citation behavior.

## Current Doctrine Verdict

The published `@netscript/cli` doctrine verdict is `Restructure`; this issue changes internal
`.llm/tools/agentic/runtime` only and does not claim package remediation. The design applies the
Archetype 6 effect boundary: process/filesystem access in `runtime/adapters/**`, pure finite evidence
contracts/classification above it, and no adapter import from planning/application code.

## Axioms in Play

| Axiom | Application |
| ----- | ----------- |
| A1/A2 | Define the finite evidence and capability contracts before process behavior. |
| A7 | Wrap `Deno.Command` and existing controller primitives; add no dependency. |
| A8 | Keep acquisition, classification, and aggregation as named responsibilities. |
| A10/A11 | Inject the process seam; name capability and outcome axes before abstraction. |
| A13/A14 | Timeouts/auth/server failures are explicit, fail closed, and test-covered. |

## Scope

- Finite Antigravity capability/evidence types for headless execution, flags, sandbox, structured
  output, web acquisition/citations, instruction files, legacy state, and explicit failure signals.
- A bounded adapter request builder and secret-safe output classifier using `agy -p`, short timeout,
  fixed capture ceiling, native worktree, and sandbox by default.
- Synthetic tests for success, timeout, authentication, provider/server, quota-signal, malformed/
  unsupported output, citation persistence, instruction markers, redaction, and raw-output absence.
- Replacement of only the #578 live-evidence deferral after the mandatory live gate passes.
- Run-local resource aggregation of citation metadata only after acquisition/citation canaries pass.

## Non-Scope

- #579 quota fallback state machine, fallback choice/history, reset probes, or restoration.
- #580 sender ownership, daemon repair, or lifecycle reliability.
- #581 routing policy or global defaults; #582 rollout/promotion/fan-out.
- Source-code or architecture decisions by the evidence agent.
- Interactive login, invented `agy login`, credential storage, raw output persistence, account PII,
  changes to `~/.gemini`, `/root/.local/bin/agy`, or a `gemini` executable alias.
- Dependency/lock changes, package exports, root formatting, or broad web/search fan-out.

## Locked Decisions

| ID | Decision | Rationale |
| -- | -------- | --------- |
| L1 | Extend the existing Antigravity adapter/controller contract; do not create a parallel runtime or infer Gemini semantics. | Reuses #576 ownership and preserves legacy-state compatibility boundary. |
| L2 | Evidence is a versioned plain-data value with finite capability statuses `supported`, `unsupported`, `unknown`, and `deferred`. | Downstream agents can synthesize facts without receiving raw provider text. |
| L3 | Every result includes process exit/timed-out metadata and bounded diagnostic codes, but never stdout/stderr, prompt content, citations' fetched bodies, credentials, or account identifiers. | Secret/PII safety and stable machine behavior. |
| L4 | The adapter uses injected process execution, `agy -p`, explicit `--print-timeout`, explicit `--project`, sandbox by default, and a strict capture limit. | Keeps effects at the adapter edge and probes bounded/read-only. |
| L5 | JSON/JSONL is `unsupported` unless a future advertised flag and canary prove it; text is classified into the finite contract. | Current help surface proves no structured-output switch. |
| L6 | Capability support is observed, never inferred from exit 0 alone. Citation support requires both a bounded acquisition marker and persisted URL metadata; instruction support requires synthetic markers. | Prevents false-positive capabilities. |
| L7 | Auth/service timeout, missing session, malformed output, or unknown behavior blocks integration and fan-out with owner-actionable diagnostics. | Current live evidence is negative and must fail closed. |
| L8 | Quota/rate-limit strings may be classified as evidence, but this issue never selects or executes fallback. It attaches owner issue `579`. | Preserves locked issue boundary. |
| L9 | Resource aggregation receives only normalized citation metadata after the web/citation live gate passes. Before then it receives nothing and the planner retains #578 deferral. | Matches harness aggregation order and acceptance wording. |
| L10 | Unambiguous persisted legacy `gemini` state continues to normalize to `antigravity`; mixed state rejects. No CLI alias or capability inference is added. | Compatibility without semantic conflation. |
| L11 | No implementation integration begins from this plan's negative live result. Coordinator Plan-Gate may approve contract/test work, but enabling live runtime integration additionally requires owner-confirmed auth and passing bounded canaries. | Separates design approval from external readiness. |

## Open-Decision Sweep

| Decision | Status | Notes |
| -------- | ------ | ----- |
| Exact available `--model`/`--agent` values | safe to defer | Subscription-specific; never hard-code from guesswork. |
| `AGENTS.md` versus `GEMINI.md` precedence | safe to defer | Synthetic live canary after session readiness. |
| Stable success/server/quota exit-code table | safe to defer | Record per-observation raw exit only; do not generalize. |
| Quota fallback route/history/reset/restoration | safe to defer | Entirely #579. |
| Whether the current plan is implementation-approved | must resolve now | Coordinator Plan-Gate; this thread stops after S0. |
| Whether live adapter integration may be enabled | must resolve before integration | Requires owner-ready session and passing headless/sandbox/web/citation canaries. |

## Design

### Public/Internal Surface

- Preserve `RuntimeCommand`, `RuntimeResult`, `AgentCommandPlan`, and
  `planAntigravityCommand()`.
- Add internal `ANTIGRAVITY_EVIDENCE_SCHEMA_VERSION`, `ANTIGRAVITY_CAPABILITIES`,
  `AntigravityCapabilityStatus`, `AntigravityEvidenceRequest`, `AntigravityEvidence`, and
  `AntigravityEvidenceResult`.
- Add `classifyAntigravityEvidence(observation)` as a pure function and an injected
  `AntigravityEvidenceAdapter.run(request)` effect edge.
- Add an optional normalized citation-metadata handoff to the existing run-local aggregation path
  only when required capability gates are supported.

### Domain Vocabulary

- Capability: `headless`, `model_flag`, `agent_flag`, `project_flag`, `conversation_flag`,
  `sandbox`, `structured_output`, `web_search_fetch`, `citation_persistence`,
  `agents_instructions`, `gemini_instructions`, `legacy_state`.
- Capability status: `supported | unsupported | unknown | deferred`.
- Evidence status: `passed | blocked | failed | deferred`.
- Failure signal: `authentication | provider_unavailable | timeout | quota | rate_limited |
  malformed | unsupported`.
- Citation metadata: normalized URL plus acquisition/citation marker counts; never fetched body.

### Ports and Effect Boundary

- Reuse/inject a bounded child-process seam at the Antigravity adapter. The process implementation
  owns `Deno.Command`; pure classification receives only bounded strings transiently and returns no
  raw fields.
- Planning/application code sees only `AntigravityEvidenceResult` and finite diagnostics.
- Resource aggregation is downstream of a `passed` acquisition/citation gate, never part of the
  provider process adapter and never invoked on blocked/failed evidence.

### Constants

- `ANTIGRAVITY_CAPABILITIES` — finite capability keys above.
- `ANTIGRAVITY_EVIDENCE_STATUSES` and `ANTIGRAVITY_FAILURE_SIGNALS` — exhaustive result axes.
- `ANTIGRAVITY_CANARY_TIMEOUT_MS` — at most 60 seconds; live acceptance uses the smallest useful
  bound.
- `ANTIGRAVITY_MAX_CAPTURE_BYTES` — strict small ceiling inherited from controller safety policy.

### Commit Slices

| # | Slice proves | Gate | Planned files |
| - | ------------ | ---- | ------------- |
| S0 | Research, negative evidence, locked design, boundaries, and live gate are reviewable. | Coordinator Plan-Gate; `git diff --check`; secret/PII/raw-output scan. | run-dir `research.md`, machine evidence JSON, `plan.md`, `worklog.md`, `context-pack.md`, `drift.md` |
| S1 | Finite evidence contracts and pure classification fail closed without raw output. | Focused synthetic `deno test --no-lock`; scoped check/lint/fmt. | `runtime/antigravity-evidence.ts`, focused test, run artifacts |
| S2 | Adapter builds bounded read-only `agy -p` requests and classifies success/auth/server/timeout/quota safely through an injected process seam. | Synthetic adapter matrix; argv/capture/redaction assertions; scoped wrappers. | `runtime/adapters/antigravity-adapter.ts`, focused adapter tests, run artifacts |
| S3 | Citation/instruction/legacy-state classifications and conditional resource handoff work without crossing #579–#582. | Synthetic citation/instruction fixtures; legacy mixed-state rejection; deferred-boundary tests; scoped wrappers. | evidence/adapter/local-state focused deltas, aggregation seam if already present, tests, README, run artifacts |
| S4 | Owner-ready bounded live canaries prove or reject required capabilities; only a full pass removes #578 planner deferral. | Minimal live matrix with raw exits/classified evidence; complete runtime tests; scoped check/lint/fmt; `arch:check`; secret scan. | machine evidence JSON, `planner.ts`/deferred tests only on pass, README, run artifacts |

### Deferred Scope

- Live S4 and runtime enablement are deferred until owner confirms Google Sign-In readiness.
- Subscription/quota fallback behavior is #579 even if a quota signal is later observed.
- Sender/daemon, routing-policy, and rollout work remain #580, #581, and #582.

### Contributor Path

Add a capability by extending the finite constant, pure classifier fixture matrix, and one bounded
canary assertion. Do not add a planner branch or aggregation output until the capability has a
positive classified live observation. Add provider failure wording only as a normalized signal; raw
text never becomes a contract field.

## Risk Register

| Risk | Mitigation |
| ---- | ---------- |
| Raw provider output leaks PII/secrets. | In-memory classification, bounded capture, no raw fields/logging, sentinel and artifact scans. |
| Exit 0 is mistaken for a capability pass. | Require capability-specific markers and citation metadata; unknown blocks. |
| Auth timeout burns quota through retries. | One bounded attempt plus at most one capture retry; stop and require owner action. |
| Quota evidence grows into fallback policy. | Classify only and attach #579; no route/state mutation. |
| Legacy Gemini state is treated as Gemini CLI support. | Parser compatibility only; no alias, executable, or semantic inference. |
| Evidence agent starts deciding architecture/source changes. | Contract returns facts only; synthesis/decision remains downstream. |
| Run aggregation persists unsafe bodies. | Normalize URLs/counts only and gate handoff on proven citations. |

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
| -- | ------ | ---- |
| AP-1 | risk | Focused evidence contract, adapter, and tests with explicit LOC budgets. |
| AP-3 | risk | Small finite evidence/result types; no raw response bag. |
| AP-11/AP-25 | risk | `Deno.Command`/filesystem/network only in adapters; pure classifier above. |
| AP-18 | risk | Semantic capability fixtures, not giant raw-output snapshots. |
| AP-24 | risk | Finite capability registry/status map, not switch-over-provider policy. |

## Fitness and Validation Gates

| Gate | Required evidence |
| ---- | ----------------- |
| Focused behavior | Synthetic unit/adapter tests plus minimal live S4 only when auth ready. |
| Static | Scoped check/lint/fmt wrappers over `.llm/tools/agentic/runtime` with `--ext ts,tsx`. |
| F-1/F-CLI-1/2 | Contract/abstract <=200 LOC, adapter <=350 LOC, every touched TS <=500 LOC. |
| F-3/F-CLI-16/28 | Effects only under adapters; no planner/application import from adapters. |
| F-5/F-7 | Focused `deno doc` inspection of new internal exports; JSR N/A. |
| F-6 | N/A: internal tooling, no package/export/dependency change. |
| F-9/AP-19 | README documents process/network/sandbox/auth owner action and redaction. |
| F-10/AP-18 | Tests use semantic synthetic classifications and no raw provider snapshot. |
| F-11/F-12/F-16/F-18 | `deno task arch:check` interpreted for owned root plus manual A6 evidence. |
| Runtime safety | Short timeout, capture ceiling, sandbox/read-only prompt, native ext4, no login. |
| Secret hygiene | Diff/run/argv/result scan contains no credential values, PII, or raw output. |
| Boundary | Tests preserve #579–#582 blocks and forbid decision/fallback/repair/rollout behavior. |
| Lock/deps | `deno.lock` blob unchanged; no dependency manifests changed; no reload/cache deletion. |

## Arch-Debt Implications

No new debt is accepted. Archetype 6 fitness scripts remain an inherited `PENDING_SCRIPT` condition;
manual/structural evidence plus `arch:check` is required. Any need for raw persistence, dependency
change, global state, interactive auth, or #579–#582 behavior is a rescope stop.

## Drift Watch

- Owner session readiness or advertised CLI flags change.
- Any canary returns possible account identity/credential-shaped content.
- A stable structured-output mode appears in a future `agy` version.
- Citation metadata cannot be separated safely from response bodies.
- Implementation needs a second runtime/result contract or crosses a deferred issue boundary.
