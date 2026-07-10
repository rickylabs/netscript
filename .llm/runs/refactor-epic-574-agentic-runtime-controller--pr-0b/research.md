# Research: PR 0B desired-state agentic runtime controller

## Re-baseline

- Issue: #576; draft PR: #585; parent epic: #574.
- Stacked base: PR #584 sign-off `9b75470f0fbef7c5ceb31d8d7bd8c7bb88a965fd`.
- The remote PR 0A branch still resolves exactly to `9b75470`.
- Remote `main` was read at `f7898dbad3a431e686c2c9ebdc1c75cb214d6080`; `9b75470` descends directly
  from that commit. The only relevant `main...9b75470` changes are `deno.json`, the agentic README,
  and the three `wsl-foundation*.ts` files.
- `git diff 9b75470..HEAD -- .llm/tools/agentic deno.json` is empty. The PR 0B bootstrap has not
  changed implementation source, so the PR 0A contract is still the exact implementation baseline.
- Native worktree and branch were independently confirmed as
  `/home/codex/repos/netscript-epic-574-pr0b-controller` and
  `refactor/epic-574-agentic-runtime-controller`.

## Inputs Reviewed

- `AGENTS.md`, `CLAUDE.md`, and the applicable harness/tooling rules.
- Issue #576, draft PR #585, their existing PLAN comments, labels, milestone/closing-keyword state,
  and child issues #577 through #582.
- Harness activation, run-loop, lane policy, Archetype 6 v2, archetype gate matrix, Plan-Gate, and
  PLAN-EVAL protocol.
- Every PR 0A run artifact at baseline `9b75470`, including its final Design, drift, coordinator
  finding, sign-off, and owner-only canary boundaries.
- The `.llm/tools/agentic` README, all `agentic:*` task entries, Deno-generated documentation for
  `wsl-foundation-lib.ts` and `agentic-lib.ts`, and focused source for the foundation, Codex,
  Claude, GitHub, and OpenHands command edges.
- No credential values were read or copied into this run.

## PR 0A Foundation Contract

PR 0A is load-bearing prior art, not a temporary prototype to bypass:

| Contract | Baseline behavior that PR 0B must preserve |
| --- | --- |
| Schema | `FOUNDATION_SCHEMA_VERSION = "1.0"`; doctor, bootstrap plan, and rollback plan expose typed JSON. |
| Observation | Fixed component probes are bounded and classified as `ready`, `missing`, `outdated`, `version_skew`, `auth_required`, `auth_conflict`, or `unavailable`. |
| Desired state | `DesiredCliVersions` plus `planBootstrap()` creates an ordered, value-free `BootstrapPlan`. A converged machine returns `actions: []`, `changed: false`. |
| Auth | Claude/Gemini checks expose key names and route conflicts only. Gemini is locked to `oauth-personal`; existing settings are never overwritten. |
| Mobile | `classifyMobileControl()` reports Codex managed state and version skew without repairing it. |
| Mutation | Bootstrap owns only user-local installation roots, symlinks, an ownership manifest, and a newly-created Gemini policy file. |
| Rollback | `buildRollbackPlan()` is non-executing and non-destructive; it preserves Codex home, provider sessions, and Windows Claude. |
| Exit compatibility | `0` ready, `2` degraded/auth-required, `3` invalid auth configuration, `4` usage/execution failure. |
| Review lesson | Exit-zero with unparseable version text must never be success-shaped; it is `unavailable` with a bounded diagnostic. |

The foundation manifest at `~/.config/netscript-agentic/foundation-state.json` is machine-local,
mode `0600`, value-free, and ownership-scoped. PR 0B may migrate/extend its schema only through an
explicit compatibility reader; it must not copy it into the repository or treat provider session
directories as owned state.

## Existing Agentic Suite Inventory

### Runtime/controller compatibility candidates

| Existing surface | Current responsibility | PR 0B disposition |
| --- | --- | --- |
| `wsl-foundation-lib.ts` | Pure component/auth/mobile classifiers plus bootstrap/rollback planning | Reuse behind the foundation adapter; preserve schema `1.0` exports during migration. |
| `wsl-foundation.ts` | `doctor`, `bootstrap`, `rollback-plan`; probes plus user-local mutation edge | Convert to a thin argument/output/legacy-exit wrapper over `agentic:runtime`. |
| `launch-codex-slice.ts` | Brief contract, git safety, staging, one launch, thread record | Convert to a Codex-launch compatibility wrapper after the controller owns the typed request. |
| `codex-resume.ts` | Same-thread resume and dry-run | Convert to a Codex-resume wrapper; retain `--message` temporarily but prefer file input in the new surface. |
| `codex-status.ts` | Read-only daemon/worktree/session snapshot | Convert to a typed status wrapper. No repair behavior belongs here. |
| `codex-watch.ts` | Event-driven git/turn completion waiter | Keep independent. It is a wait primitive, not desired-state reconciliation. |
| `claude-remote-smoke.ts` | Claude static/live smoke with timeout | Convert to a Claude-smoke wrapper; keep prompt-file input and legacy report/exit. |
| `agentic-lib.ts` | Process/WSL/git/GitHub primitives and parsers | Reuse as low-level adapters; do not turn raw stdout/stderr into the public controller result. |

### Outside the controller migration

`dispatch-openhands.ts`, `openhands-status.ts`, `watch-openhands-verdict.ts`, `gh-pr.ts`,
`gh-watch.ts`, `gh-token.ts`, `claude-hook-log.ts`, `sync-claude-skills.ts`, and
`validate-claude-surface.ts` are orchestration/GitHub/configuration utilities rather than agent
runtime lifecycle commands. They remain independent. `codex-watch.ts` also remains independent as
noted above. This boundary prevents #576 from becoming a rewrite of the entire suite.

## Load-bearing Findings

1. **There is no generic desired-state controller today.** Repository search found no
   `DesiredState`, `ObservedState`, `ReconcilePlan`, or failure-class abstraction outside the PR 0A
   foundation. PR 0B should generalize the proven pure observe/plan/apply split rather than create a
   second imperative command collection.
2. **Current JSON shapes are unrelated.** Foundation, launch, status, resume, and smoke each emit
   bespoke objects and exit codes. A versioned envelope is required, while wrappers must preserve
   old contracts during migration.
3. **Several current dry-runs are not strictly read-only.** `launch-codex-slice --dry-run` stages a
   brief before stopping. The new controller may inspect/read/probe, but its dry-run path must call
   no filesystem/process mutation port. The legacy wrapper behavior stays compatible until its
   migration slice, then delegates to the stricter controller plan.
4. **Impure and pure code are already separable.** `agentic-lib.ts` exports pure parsers/safety
   checks separately from `runBin`/WSL/GitHub effects; `wsl-foundation-lib.ts` is pure while
   `wsl-foundation.ts` owns Deno/process/network/filesystem edges. This is the adapter seam to keep.
5. **Raw command output is not a stable result.** Existing `CommandResult` includes unbounded
   semantic risk (`stdout`/`stderr`). Controller adapters must normalize to finite codes and bounded,
   redacted diagnostics before returning.
6. **No new dependency is required.** Deno 2.9 discriminated unions, `Deno.Command`, Web Crypto,
   JSON, filesystem primitives, and existing helpers cover the contract. No registry/version query
   or dependency change is part of this plan.
7. **Controller state and provider credentials are different things.** State may record identifiers,
   versions, ownership fingerprints, desired/active route identities, and checkpoint metadata; it
   must never ingest credential values, provider session contents, prompt contents, or raw env.
8. **Issue boundaries intentionally overlap command names.** #576 owns the typed command/result
   surface and safe generic orchestration. Provider presets (#577), Gemini evidence acquisition
   (#578), automatic quota fallback history (#579), durable single-sender repair (#580), canonical
   policy migration (#581), and rollout canaries (#582) remain child work. Deferred live capability
   must return an explicit `capability_deferred` block, never a fake success.

## Prior-art Assessment

- `planBootstrap()` is the correct pattern: pure input plus observed state yields finite mutation
  intents, and a converged state yields an empty plan.
- The PR 0A ownership manifest is the correct rollback authority: only controller-created or
  controller-repointed resources are reversible.
- `evaluateGitSafety()`, `validateHandoffContract()`, `parseThreadInfo()`, and `parseTurnComplete()`
  remain canonical pure policy checks for Codex lifecycle adapters.
- `runBin()`/`wsl()` are useful execution primitives but need a bounded/redacting normalization
  layer before controller results.
- `codex-status.ts` and the static portion of `claude-remote-smoke.ts` prove that inspection can be
  performed without launch or mutation.
- Existing GitHub/OpenHands tools demonstrate the correct secret boundary: secret material is read
  in-process and used only at the protocol edge. The runtime controller goes further by accepting no
  credential-bearing CLI option at all.

## GitHub Scope Reconciliation

- Issue #576 is open with `type:refactor`, `area:tooling`, `priority:p1`, `wave:v1`,
  `epic:harness-v3`, exactly one `status:plan`, and milestone `0.0.1-beta.1`.
- Draft PR #585 is open against the PR 0A branch, carries `type:sub-pr`, `area:tooling`,
  `priority:p1`, `wave:v1`, `epic:harness-v3`, and exactly one `status:plan`.
- PR #585 contains `Closes #576`, `Part of #574`, and `Stacked on #584`; the closing relationship
  and umbrella relationship are correct.
- Acceptance/Definition-of-Done boxes remain unchecked. Planning does not satisfy them and the PR
  remains draft.

## 2026-07-10 Antigravity Official-Source Findings

The official Antigravity README, installer, and changelog establish `$HOME/.local/bin/agy`,
keyring/Google Sign-In with browser or SSH authorization URL, `/logout`, and headless
`--print`/`-p`. The installer has no documented uninstall command and accepts only `--dir` and
`--help`. Antigravity stores shared/private configuration below `~/.gemini`, so that directory must
survive Gemini CLI package removal.

The official surface does not establish JSON/JSONL output, a complete exit-code taxonomy, an
`agy login` command, deterministic search/citation output, subscription/quota semantics,
`AGENTS.md`/`GEMINI.md` ingestion, or Gemini state/alias migration. The controller must model these
as deferred/unknown canaries rather than map Gemini assumptions onto Antigravity.

Exact future migration surfaces are `runtime/contract.ts`, `state.ts`, `planner.ts`,
`adapters/{foundation,local-state,provider,gemini}-adapter.ts`, their tests, and the agentic README.
Historical persisted `gemini` values require explicit compatibility parsing or refusal; no silent
reinterpretation is permitted.
- Existing PLAN comments correctly identify the sole attached thread. Completion comments are due
  only after the planning commit is pushed.

## jsr-audit Surface Scan

N/A. This run changes internal `.llm/tools/agentic` automation and run artifacts, not a published
package/plugin, export map, or JSR surface. No publish/doc-score/slow-type claim is made. Deno type,
lint, format, unit, semantic runtime, permission, and compatibility gates remain required.

## Open Questions

No unresolved decision is allowed to force implementation rework. Coordinator Plan-Gate review may
reject or refine a locked decision, but implementation must not start until that review records
approval. Provider model values, automatic fallback policy, durable Codex repair, and rollout
promotion are deliberately deferred decisions with named owner issues rather than open PR 0B design
questions.
