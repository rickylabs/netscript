# Research — persisted quota fallback and restoration (#579)

## Baseline

- Branch `feat/epic-574-quota-fallback` is at `783e505e` and descends from the locked integration
  baseline `c90bc938` (`git merge-base --is-ancestor` exit 0).
- An explicit fetch refreshed `origin/rickylabs-epic-574-wsl-agentic-runtime` to `c90bc938` and the
  feature ref. The configured broad fetch is stale and names deleted branch
  `feat/fresh-ui-pixel-polish`; this run does not change git configuration.
- The tree contains #577 `runtime/provider-profiles.ts` and #578
  `runtime/adapters/antigravity-adapter.ts` plus their focused tests.
- Pre-plan status contained only the coordinator-created `codex-thread-ids.md`; it is part of this
  run identity and is preserved.

## Current Surface Findings

| ID | Finding | Evidence / consequence |
| --- | --- | --- |
| R1 | `RuntimeCommand` already owns explicit `fallback` and `restore`; `RouteIdentity`, `SessionIdentity`, diagnostics, actions, and results are canonical contracts. | Extend `contract.ts`; do not create a parallel command/result contract. |
| R2 | Planner already refuses fallback/restore for an `active` session and restores the configured desired route. | Retain the boundary invariant and add automatic decisions around it, never route within a critical slice. |
| R3 | `PersistedRuntimeState` and checkpoint state are value-free schema-1.0 JSON; state adapters write machine-local mode-0600 files atomically. | Add routing state/history to the existing machine-local state seam; no credentials, raw provider output, prompts, or PII. |
| R4 | `ClockPort.now()` is already injected and process probes are bounded ports. | Reset/backoff/probe decisions remain deterministic and testable; no direct `Date.now`, timers, or provider login. |
| R5 | #577 profiles describe explicit native/OpenRouter/custom routes and credential key names without values. Presets are suggestions, not defaults. | Fallback matrix references explicit profile IDs/routes and never mutates global/default configuration. |
| R6 | #578 normalizes structured diagnostics including quota, rate limit, provider unavailable, timeout, auth, and process failure. | Structured diagnostics drive routing first. Text matching is compatibility-only, version pinned, finite, and tested. |
| R7 | Existing apply lifecycle work remains blocked on #580. | #579 may persist decisions and plan route actions, but does not repair daemons, create senders, or bypass #580 lifecycle blocks. |
| R8 | Parent supervisor assigns #579 Archetype 3; local bootstrap says Archetype 6. | Primary plan classification is Archetype 6 tooling with mandatory Archetype 3 runtime/state gates; supervisor identity is not rewritten by the worker. |

## Policy Facts Locked by Issue

- Fallback follows an explicit lane matrix and preserves evaluator independence by requiring an
  opposite model family. If no opposite-family evaluation route is eligible, evaluation blocks.
- Paid/on-demand Fable is a policy-guarded route requiring explicit approval while outside the
  subscription. No code triggers paid use. When plan membership changes, Fable 5 low may become the
  preferred orchestration datum; higher effort still requires escalation.
- Mobile visibility changes are represented as transition notification data. This slice does not
  send notifications or repair remote control.
- Detection, reset eligibility, canary result, and restoration are durable transitions. Concise
  run-level transition records contain identifiers/categories/timestamps only.

## Planned Public Surface / JSR Scan

This is repo-internal `.llm/tools` automation, not a JSR package or plugin export. JSR publish,
doc-score, permissions-block, and package dry-run gates are N/A. Public-surface risks still apply to
the TypeScript contract: exported values need finite constants/derived unions and explicit return
types under `isolatedDeclarations`; focused `deno doc` and scoped check/lint/fmt remain required.

## Open Questions Resolved

| Question | Resolution |
| --- | --- |
| Where is routing state stored? | In the existing machine-local controller state through the state ports/adapters, with a bounded run-transition projection. |
| What triggers fallback? | A structured routing signal first; only an exact version-pinned compatibility classifier may translate known legacy text. |
| When may a route change? | Only an idle/new turn or session boundary; active/critical slices block. |
| When may restoration occur? | Reset time reached, minimal canary passed, and a fresh boundary is present. Probe failure remains degraded and schedules/records backoff. |
| Does #579 choose global defaults? | No. Desired route remains caller/configuration data; active route changes are local, explicit, and auditable. |
| Does #579 execute paid Fable? | No. Policy data marks approval requirements and planners block without explicit approval evidence. |

