# Plan: PR 0A canonical WSL agentic foundation

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `chore-epic-574-wsl-agentic-runtime-foundation--pr-0a` |
| Branch | `chore/epic-574-wsl-agentic-runtime-foundation` |
| Phase | `plan` |
| Target | Internal agentic tooling and WSL runtime environment |
| Archetype | 6 — CLI / Tooling, scoped internal-tool variant |
| Scope overlays | none |

## Archetype

Archetype 6 applies because PR 0A adds user-run bootstrap/doctor automation. The tool is internal
under `.llm/tools/agentic`, not a publishable CLI package, so package-shape, JSR, and generated-project
gates are N/A. Static, permission, process-edge, semantic test, runtime, and consumer smoke rules
remain required. Runtime lifecycle gates are added because the work proves launch/reconnect/rollback
behavior across long-lived mobile-control processes.

## Current Doctrine Verdict

The repository doctrine applies by behavior rather than package layout: keep orchestration thin,
put filesystem/network/process side effects at command edges, use typed result contracts, and avoid
success-shaped fallbacks. No package/plugin doctrine debt is introduced.

## Axioms in Play

| Axiom | Why it matters |
| ----- | -------------- |
| A1 | The doctor/bootstrap contract is defined before implementation. |
| A2 | Existing Web/Deno APIs and provider installers are wrapped rather than reimplemented. |
| A5 | Installation, inspection, auth, reconnect, and rollback are separate concerns. |
| A9 | Failures and auth-required states are explicit structured results. |
| A14 | The checked-in seam is sized for replacement by #576's desired-state controller. |

## Goal

Establish an idempotent, version-aware, secret-safe native WSL environment for Claude Code, Codex,
Gemini CLI, Node, Deno, Git, and the NetScript toolchain, with mobile-control and Windows rollback
evidence.

## Scope

- Add a narrow checked-in `agentic:wsl-foundation` bootstrap/doctor tool and unit tests.
- Install Node `v26.5.0` user-locally from the official distribution with checksum verification.
- Install stable native WSL Claude Code and Gemini CLI through npm under the user's local prefix.
- Create Linux-local state directories under `~/.claude`, `~/.codex`, `~/.gemini`, and
  `~/.config/netscript-agentic`.
- Preserve existing Deno/Codex/.NET/Aspire/Docker operation.
- Classify Claude/Gemini auth readiness without logging credentials; Gemini allows Google
  subscription sign-in only.
- Prove Codex managed state, native worktree execution, same-thread steering, Claude mobile worktree
  spawning/reconnect, and Windows Claude rollback.

## Non-Scope

- Generic `agentic:runtime` desired-state command tree (#576).
- Provider/OpenRouter profiles (#577), Gemini evidence acquisition (#578), persisted fallback
  transitions (#579), durable single-sender repair (#580), and policy migration (#581).
- Gemini API-key or Vertex authentication.
- Fable 5 usage.
- New `/mnt/c` execution paths or removal of Windows Claude.

## Hidden Scope

- Non-login shell PATH must resolve Node, npm-installed CLIs, Deno, and Codex consistently.
- Existing Codex CLI/app-server version skew must be reported, not silently treated as healthy.
- The external Codex launch helper needs a recorded, temporary per-launch model/effort injection for
  the attach turn; #576/#581 will make route enforcement canonical.
- Auth-required browser steps must not block independent install, doctor, or rollback evidence.

## Locked Decisions

| ID | Decision | Rationale |
| -- | -------- | --------- |
| D1 | Pin PR 0A to official Node `v26.5.0` with SHA-256 verification and a user-local atomic symlink. | Satisfies "latest stable" at the approved start time without system package churn. |
| D2 | Use npm stable dist-tags to install Claude Code and Gemini CLI into a user-local prefix. | Uses upstream package mechanisms and keeps installation reversible. |
| D3 | The checked-in foundation tool emits stable JSON and concise human output with explicit exit codes. | Required for idempotent doctor evidence and #576 migration. |
| D4 | Credentials and auth tokens are never accepted as CLI arguments or written to repo/run artifacts. | Security invariant. |
| D5 | Gemini supports only owner Google subscription sign-in; `GOOGLE_API_KEY`, `GEMINI_API_KEY`, and Vertex routes are rejected/classified. | Owner requirement. |
| D6 | The initial Codex launch is attach-only; implementation begins by same-thread resume after identity is posted. | Meets exact pre-slice mobile identity and one-sender requirements. |
| D7 | Machine-local mutations are reversible and the doctor captures before/after versions. | Rollback and safety requirement. |

## Open-Decision Sweep

| Decision | Status | Notes |
| -------- | ------ | ----- |
| Owner browser completion for Claude/Gemini sign-in | safe to defer | Tool reports `AUTH_REQUIRED`; installation and other smokes continue. |
| Generic route-state schema | safe to defer | Owned by #576/#579. |
| Codex version-skew repair policy | safe to defer | PR 0A reports; #580 owns durable repair. |
| OpenRouter compatibility | safe to defer | Owned by #577. |

## Risk Register

| Risk | Mitigation |
| ---- | ---------- |
| Node upgrade shadows or breaks existing tools. | User-local install, explicit PATH probe, before/after Deno/Codex checks, reversible symlink. |
| npm lifecycle scripts or global prefix mutate system state. | User-local prefix, exact package names, captured versions, no sudo npm. |
| Auth material leaks. | Never print environment values; detect only presence/conflict; interactive provider-native login. |
| Mobile daemon repair interrupts work. | Passive status first; no repair while active work exists; anchored PID rule only. |
| Attach launch uses the wrong model/effort. | Temporary machine-local per-launch override, parsed thread-start proof, fail if model/effort differ. |
| PR 0A expands into #576. | Keep commands to `bootstrap`, `doctor`, and `rollback-plan`; defer generic routing/state transitions. |

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
| -- | ------ | ---- |
| AP-1 | risk | Keep the tool sliced into pure probes/planning and edge execution; enforce LOC limits. |
| AP-11 | risk | Confine filesystem/network/process access to command adapters/edges. |
| AP-18 | risk | Assert structured fields and state transitions, not giant output snapshots. |
| AP-19 | risk | Document permissions, external tools, auth boundary, and rollback. |
| AP-25 | risk | No import-time or non-edge side effects. |

## Fitness Gates

| Gate | Required | Expected evidence |
| ---- | -------- | ----------------- |
| F-1/F-2/F-3/F-5/F-9/F-10/F-11/F-12/F-15/F-16/F-17/F-18/F-19 | yes where applicable | Scoped wrappers, structural review, and unit tests |
| F-6/F-7/F-8 | N/A | Internal non-publishable `.llm` tool; reason recorded |
| F-CLI-1/F-CLI-2/F-CLI-5/F-CLI-16/F-CLI-23/F-CLI-28 | yes | Manual/structural evidence plus tests |
| Remaining F-CLI gates | N/A | No package binary, composition tree, generated assets, registries, or public/maintainer surfaces |
| Runtime lifecycle | yes | Native WSL bootstrap/doctor/rollback and mobile reconnect evidence |
| Consumer smoke | yes | Non-login shell resolves all installed tools; Deno/Codex remain operational |

## Arch-Debt Implications

| Entry | Action | Notes |
| ----- | ------ | ----- |
| none | none | Any newly discovered structural violation is logged before scope expands. |

## Commit Slices

| # | Slice | Proves | Gate | Files |
| - | ----- | ------ | ---- | ----- |
| S1 | Foundation contract and read-only doctor | Typed, stable, secret-safe inspection before mutation | focused tests + scoped check/lint/fmt | `deno.json`, `.llm/tools/agentic/wsl-foundation*.ts`, README, run artifacts |
| S2 | Idempotent bootstrap and rollback plan | Node/Claude/Gemini install is version-aware, user-local, reversible, and preserves Deno/Codex | tests + native WSL dry-run/live doctor | same tool/tests/docs and run artifacts |
| S3 | Mobile, auth-boundary, reconnect, and rollback evidence | Native paths and provider sessions are visible/steerable; auth conflicts are explicit; Windows Claude remains usable | Codex/Claude/Gemini canaries with raw exit codes | run artifacts and directly related tool/docs fixes only |

## Validation Plan

| Order | Gate | Command or check | Expected result |
| ----- | ---- | ---------------- | --------------- |
| 1 | Unit | `deno test --no-lock --allow-read --allow-env .llm/tools/agentic/*_test.ts` | Exit 0 |
| 2 | Check | scoped check wrapper over `.llm/tools/agentic` TS | Exit 0 |
| 3 | Lint | `deno lint --no-config` on owned agentic TS files | Exit 0 |
| 4 | Format | scoped format wrapper over owned TS files | Exit 0 |
| 5 | Doctor dry-run | foundation tool JSON mode before mutation | Explicit missing/outdated/auth-required states |
| 6 | Bootstrap | foundation tool live mode in native WSL | Idempotent success or actionable classified failure |
| 7 | Doctor live | foundation tool JSON + human modes twice | Same desired state on second run |
| 8 | Codex mobile | managed state, one attach thread, same-thread resume | Concrete thread/worktree/model/effort and completed turn |
| 9 | Claude mobile | server-mode isolated worktree spawn and reconnect | Captured session/worktree and reconnect outcome |
| 10 | Gemini | version plus subscription-login readiness/grounded no-secret smoke | Google subscription route only; API/Vertex rejected |
| 11 | Rollback | Windows Claude version and WSL rollback plan | Windows Claude remains usable; WSL changes reversible |

## Dependencies

- Managed WSL Codex daemon and native ext4 worktree.
- Official Node distribution and npm registry availability.
- Owner browser interaction for provider-native sign-in when required.

## Deferred Scope

- #576-#582 exactly as listed in Non-Scope.

## Drift Watch

- Latest stable versions change during the run.
- Provider installers require system-wide or credential-bearing arguments.
- Claude/Gemini CLI auth cannot distinguish subscription sign-in from forbidden routes.
- Any requirement to restart an active Codex daemon.
