# Plan: native + OpenRouter provider profiles (#577)

## Run Metadata

| Field | Value |
| ----- | ----- |
| Run ID | `feat-epic-574-provider-profiles--pr-1` |
| Issue / PR | #577 / draft #586 |
| Branch | `feat/epic-574-provider-profiles` |
| Base | `rickylabs-epic-574-wsl-agentic-runtime` @ `93eb4f02` |
| Phase | `plan` — hard stop before implementation |
| Target | `.llm/tools/agentic/runtime` internal tooling |
| Archetype | 6 — CLI / Tooling, scoped internal-tool variant |
| Scope overlays | none |

## Goal

Extend the merged desired-state controller with explicit native Anthropic/Claude and OpenAI/Codex
profiles plus a caller-selected OpenRouter escape hatch for both runners. Resolve credentials only
at the child-process spawn edge, clear conflicting provider keys, and gate fan-out on structured
read-only compatibility canaries without claiming success when credentials or capabilities are
absent.

## Scope

- Native Anthropic Claude and native OpenAI Codex profile definitions.
- OpenRouter profiles for Claude and Codex, with caller-selected presets:
  `minimax/minimax-m3` for Claude workflow fan-out, `z-ai/glm-5.2` for Codex creative design, and
  `x-ai/grok-4.5` for long-running medium-complexity Codex work.
- A value-free child environment policy that explicitly clears rival credential/base-route keys
  and late-binds the selected source credential only inside the process adapter.
- Explicit custom-Claude behavior: custom `ANTHROPIC_BASE_URL` disables Remote Control and marks
  non-Anthropic models through Claude Code experimental.
- Read-only, bounded static/live canaries with structured provider/model/effort/tool/reasoning/
  streaming compatibility evidence.
- Replacement of only the #577 `capability_deferred` blocks in the provider validator/planner;
  #578–#582 blocks remain intact.

## Non-Scope

- #578 Antigravity evidence acquisition or citations.
- #579 quota detection, automatic fallback history, reset, or restoration policy.
- #580 sender lock, daemon repair, launch ownership, or general lifecycle apply.
- #581 canonical routing-policy/default migration.
- #582 rollout canaries, promotion, or large fan-out orchestration.
- Provider login, credential creation/storage, global provider defaults, parent-environment mutation,
  dependency changes, root formatting, or live credential use.

## Current Doctrine Verdict

The doctrine labels the published CLI `Restructure`; this slice is an internal `.llm/tools` adapter
extension and does not claim to remediate that package-wide verdict. It follows Archetype 6's
ports/adapters edge rule: pure contracts and selection above, environment/process effects only in
`runtime/adapters/**`.

## Axioms in Play

| Axiom | Application |
| ----- | ----------- |
| A1/A2 | Lock the finite profile/canary/result contracts before process behavior. |
| A7 | Use supported Claude/Codex/OpenRouter mechanisms, `Deno.Command`, and plain data; no new dependency. |
| A8 | Separate profile registry, environment edge, and canary behavior; keep files within A6 budgets. |
| A10/A11 | Constructor/port seams; the named extension axes are runner, provider route, and preset. |
| A13/A14 | Compatibility and credential absence fail explicitly and are preserved by focused tests/gates. |

## Locked Decisions

| ID | Decision | Rationale |
| -- | -------- | --------- |
| L1 | Extend `RouteIdentity` with an optional finite `profileId`; do not introduce a second route/controller contract. | #576 already owns canonical route identity. |
| L2 | Add a pure `provider-profiles.ts` registry keyed by profile id. Each entry names agent, provider, model, effort, endpoint kind, credential source key, child target key, conflict clears, and required canary capabilities. | Typed registry avoids AP-24 switches and makes presets inspectable without secrets. |
| L3 | Native profiles are `claude-anthropic-native` and `codex-openai-native`. OpenRouter presets are runner-qualified so the caller must select both runner and preset; no implicit default/fallback exists. | Prevents silent routing and keeps #581 policy deferred. |
| L4 | Lock model slugs to `minimax/minimax-m3`, `z-ai/glm-5.2`, and `x-ai/grok-4.5`. MiniMax is Claude fan-out; GLM is Codex creative design; Grok is Codex medium-effort long-running. | Matches issue scope and current OpenRouter primary model pages. |
| L5 | `AgentProcessRequest` gains a value-free `environment` policy containing only inherited/cleared key names and source→target bindings. No environment value is representable in the request/result contract. | Makes secret leakage structurally harder and preserves data-only planning. |
| L6 | A child-process adapter resolves a provided environment reader at the last responsible moment, starts from an explicit child environment, clears all known rival credential/base-route keys, injects only the selected credential into the selected target key, and passes the resulting map directly to `Deno.Command`. It never calls `Deno.env.set/delete`. | Child-only injection; parent remains unchanged. Injection is independently testable with synthetic non-secret markers that are never emitted. |
| L7 | Claude native selection uses `--model`; OpenRouter/custom Claude selection uses child-only `ANTHROPIC_BASE_URL` plus the selected auth target. Any non-native base URL produces `remoteControl: unavailable` and `experimentalNonAnthropicModel: true`. | Aligns with supported Claude CLI/gateway mechanisms and makes the acceptance caveat explicit. |
| L8 | Codex native uses the built-in OpenAI provider. OpenRouter Codex uses a named sibling profile layer selected with `--profile`; provider config is credential-free and points at OpenRouter's Responses endpoint using `env_key`. No project `.codex/config.toml` or global default is changed. | Current Codex docs reserve provider selection for user/profile layers and support only Responses wire for custom providers. |
| L9 | Profile config materialization, if required by the existing launcher, is ephemeral and credential-free under an isolated child `CODEX_HOME`; cleanup is ownership-scoped. It is never repository state and never contains a secret value. | Supported profile mechanism without altering the operator's global provider defaults. |
| L10 | A canary has two phases: pure static validation and an optional bounded read-only child probe. Its structured result records profile/provider/model/effort plus `credential`, `tools`, `reasoning`, `streaming`, and aggregate fan-out status. | Lets no-credential environments fail honestly and makes unsupported features block fan-out. |
| L11 | `credential: absent`, process failure, timeout, malformed output, or any unsupported required capability yields `blocked`/`failed` with a finite diagnostic and `fanOutEligible: false`; only observed support may pass. | No fabricated pass or silent degradation. |
| L12 | Planner/validator remove only issue-577 blanket deferral after profile validation. Apply-mode lifecycle ownership remains issue #580 blocked; Antigravity live evidence remains #578 blocked. | Honors locked issue boundaries. |
| L13 | No diagnostic, argv, result, fixture, run artifact, or repository file may contain a credential value. Tests assert key-name policy and redaction using opaque in-memory markers without printing them. | Acceptance and safety requirement. |

## Open-Decision Sweep

| Decision | Status | Notes |
| -------- | ------ | ----- |
| Exact native model defaults | safe to defer | Caller route model remains authoritative; no global/default model migration (#581). |
| Which OpenRouter upstream host fulfills a request | safe to defer | OpenRouter routing owns it; #577 records model slug and compatibility evidence only. |
| Automatic selection among the three presets | safe to defer | Explicitly #579/#581; caller selection is mandatory here. |
| Live credential availability | safe to defer | Absence is a defined structured canary outcome, not a Plan-Gate blocker. |
| Whether every requested model actually supports runner tools/reasoning/streaming | must resolve before fan-out, not before implementation | The canary exists to resolve this at runtime and blocks on unknown/unsupported; tests cover all failure states. |
| Remote Control through custom Claude base URLs | resolved | Always unavailable in the #577 contract; never inferred from a successful text response. |

## Design

### Public/internal surface

- Preserve `RuntimeCommand`, `RuntimeResult`, `RouteIdentity`, `AgentCommandPlan`, and existing
  `plan*Command()` entry points.
- Add `ProviderProfileId`, `ProviderProfile`, `ProviderPresetPurpose`, `ChildEnvironmentPolicy`,
  `ProviderCanaryRequest`, `ProviderCompatibilityEvidence`, and `ProviderCanaryResult` as internal
  tooling contracts.
- Add pure `getProviderProfile(id)` / `validateProviderProfileRoute(route)` registry operations.
- Add an adapter-level child spawn/canary operation; do not expose package/JSR exports.

### Domain vocabulary and constants

- Profile axis: native Claude, native Codex, Claude/OpenRouter MiniMax, and Codex/OpenRouter GLM/Grok.
- Credential state: `available | absent` (never the value).
- Capability status: `supported | unsupported | unknown | not_applicable`.
- Canary status: `passed | blocked | failed`; fan-out eligibility is a derived boolean that is true
  only when every profile-required capability is observed supported.
- Constant groups: `PROVIDER_PROFILE_IDS`, `OPENROUTER_PRESET_MODELS`,
  `PROVIDER_CREDENTIAL_KEYS`, `PROVIDER_ROUTE_KEYS`, and required canary capabilities.

### Ports and effect boundary

- Extend `AgentProcessRequest` with a value-free child environment policy.
- Add the smallest environment-reader/process-runner seam needed by the adapter; environment values
  never cross back through a return type.
- `Deno.env` and `Deno.Command` remain adapter-only. Pure profile selection, diagnostics, and canary
  classification remain free of process/environment access.

### Canary shape

Each result records: `profileId`, `agent`, `provider`, `model`, `effort`, credential presence,
Remote Control availability, experimental-route flag, per-capability tool/reasoning/streaming
status, aggregate status, `fanOutEligible`, bounded timing/process metadata, and finite diagnostics.
It records no prompt content, response body, headers, environment values, or raw logs.

### File and LOC budgets

| File | Change | Hard budget |
| ---- | ------ | ----------- |
| `runtime/provider-profiles.ts` | new pure contracts + registry | <= 280 LOC |
| `runtime/adapters/provider-adapter.ts` | profile-aware route validation/conflict names | <= 280 LOC total |
| `runtime/ports.ts` | value-free environment/canary port shapes | <= 300 LOC total |
| `runtime/adapters/child-process-environment-adapter.ts` | late-bound env + bounded child execution | <= 300 LOC |
| `runtime/adapters/provider-canary-adapter.ts` | static/live canary planning/classification | <= 320 LOC |
| `runtime/adapters/{claude,codex}-adapter.ts` | selected profile integration | <= 300 / 350 LOC total |
| `runtime/{contract,planner}.ts` | minimal profile id/planner unblock only | <= 250 / 420 LOC total |
| focused new test files | semantic matrices, split by subject | <= 450 LOC each |
| `runtime/adapters_test.ts` | only compatibility updates; avoid growth | <= 450 LOC total |
| `agentic/README.md` | internal usage and safety contract | focused delta only |

### Commit slices

| # | Slice proves | Files | Proving gate |
| - | ------------ | ----- | ------------ |
| S0 | Research and locked Design are reviewable before implementation. | run-dir `research.md`, `plan.md`, `worklog.md`, `context-pack.md`, `drift.md` | Plan-Gate by coordinator; `git diff --check`; secret-pattern scan |
| S1 | Finite profiles/presets and profile-aware route validation replace only #577 blanket deferral. | `runtime/provider-profiles.ts`, `contract.ts`, `adapters/provider-adapter.ts`, `planner.ts`, focused profile tests, run artifacts | focused `deno test --no-lock`; scoped check/lint/fmt; route/deferred-boundary matrix |
| S2 | Credential selection is child-only, conflict-clearing, value-free in plans/results, and parent-invariant. | `ports.ts`, `adapters/child-process-environment-adapter.ts`, focused environment tests, run artifacts | focused `deno test --no-lock` with parent-before/after and no-output assertions; effect/secret scans; scoped wrappers |
| S3 | Claude and Codex use supported profile mechanisms without global defaults; custom Claude reports Remote Control unavailable/experimental. | `adapters/{claude,codex}-adapter.ts`, optional credential-free profile materializer under adapters, focused runner-profile tests, run artifacts | exact argv/profile semantics, no-project/global-write test, remote-control diagnostics, scoped wrappers |
| S4 | Read-only canaries classify credential absence and tool/reasoning/streaming compatibility, and block fan-out on unknown/unsupported behavior. | `adapters/provider-canary-adapter.ts`, focused canary tests, `README.md`, run artifacts | credential-absent matrix; synthetic supported/unsupported/malformed/timeout tests; complete agentic/runtime tests; scoped wrappers; `arch:check` evidence |

### Contributor path

Add a provider variant by adding one typed sibling entry to `PROVIDER_PROFILES`, declaring its
credential binding/clears and required canary capabilities, then add the runner-specific static and
live canary fixtures. No planner switch or global config edit should be necessary.

## Risk Register

| Risk | Mitigation |
| ---- | ---------- |
| A credential leaks through argv/result/log/error serialization. | Values are unrepresentable in plans/results, resolved only at spawn, raw output is not retained, and sentinel/no-secret scans are mandatory. |
| Clearing only one native key permits silent rival inheritance. | Central exhaustive key sets cover Anthropic/OpenAI/OpenRouter auth and route keys; tests run every profile against every rival key. |
| Codex custom provider accepts text but lacks Responses/tool/stream semantics. | Read-only canary requires each capability; unknown/unsupported blocks fan-out. |
| Claude gateway success is mistaken for Remote Control support. | Remote Control availability derives from route kind, never probe success. |
| Slices accidentally implement #580 lifecycle ownership. | Apply-mode block remains unchanged and has explicit regression tests. |
| Existing large controller files exceed budgets. | New concepts get focused files; minimal deltas only to contract/planner/legacy adapter test. |
| Current model/provider docs drift. | Registry slugs are explicit and canary failure is actionable; doc URLs and verification date are recorded. |
| Root fetch refspec remains stale. | Use scoped fetches and record drift; do not rewrite coordinator Git config in this issue. |

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
| -- | ------ | ---- |
| AP-1 | risk | Focused files and hard LOC budgets. |
| AP-3 | risk | Small value-free environment/process contracts; no credential bag. |
| AP-11/AP-25 | risk | `Deno.env`/`Deno.Command` only in adapters; no parent mutation. |
| AP-18 | risk | Assert semantic request/result fields and parent invariants, not only argv snapshots. |
| AP-24 | risk | Typed profile registry, not a provider/model switch ladder. |

## Fitness and Validation Gates

| Gate | Required evidence |
| ---- | ----------------- |
| Focused behavior | `deno test --no-lock` over owned runtime tests; no live credentials/network. |
| Static | Scoped `.llm/tools/run-deno-check.ts`, `run-deno-lint.ts`, and `run-deno-fmt.ts` over `.llm/tools/agentic/runtime` with `--ext ts,tsx`; targeted check includes `--unstable-kv` if invoked raw. |
| F-1/F-CLI-1/2 | LOC budget table and checker/manual evidence. |
| F-3/F-CLI-16/28 | Import/effect scan proves environment/process effects only under adapters and no adapter import from planner/domain. |
| F-5/F-7 | `deno doc` focused inspection for new internal exports; JSR score N/A. |
| F-6 | N/A: no package/export/dependency change. |
| F-9/AP-19 | README safety/permission delta for environment/process/network behavior. |
| F-10/AP-18 | Test files <=450 LOC and semantic matrices. |
| F-11/F-12/F-16/F-18 | `deno task arch:check` scoped interpretation plus manual A6 evidence where scripts are pending. |
| Runtime safety | Parent environment unchanged, explicit conflicts cleared, credential absent actionable, unsupported capability fan-out blocked. |
| Secret hygiene | Diff/repo/run-artifact/argv/result/log scans contain key names only; no credential-shaped values or raw provider output. |
| Lock/deps | `deno.lock` blob unchanged; no dependency files changed; no reload/cache deletion. |
| Boundary | Regression matrix preserves #578–#582 `capability_deferred` behavior and #580 apply block. |

## Arch-Debt Implications

No new doctrine debt is planned. Any required deviation from adapter-only effects, the LOC budgets,
or the existing canonical controller is a rescope and must stop for coordinator approval.

## Drift Watch

- Any model slug/end-point or supported profile mechanism differing from the cited primary docs.
- Any need to persist credentials, mutate parent/global configuration, or change dependencies.
- Any canary requirement that entails live login, daemon repair, sender ownership, fallback policy,
  or rollout promotion.
- Any existing uncommitted coordinator file overlapping an owned artifact.
