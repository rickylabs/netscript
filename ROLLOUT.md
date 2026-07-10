# Agentic runtime rollout outcome

Generated from schema `1.0` at 2026-07-10T20:27:32.113Z. Baseline: `b438f16d`.

## Executive outcome

Overall status: **conditional_pass**. Promotion recommendation: **promote_with_conditions**.

Recommendation only. Owner approval and coordinator action are required.

| Canary | Status | Classification | Evidence mode | Actual outcome |
| --- | --- | --- | --- | --- |
| `native_wsl_health` | pass | `none` | live | Version probes succeeded; runtime doctor reported no_change. |
| `claude_mobile_reconnect` | conditional_pass | `owner_accepted_working` | owner_accepted | Owner accepted reconnect behavior as working; no raw mobile session evidence is fabricated. |
| `claude_isolated_sessions` | conditional_pass | `owner_accepted_working` | owner_accepted | Owner accepted isolated-session behavior as working; automation does not invent UI evidence. |
| `codex_remote_lifecycle` | conditional_pass | `owner_accepted_working` | owner_accepted | Status and repair dry-run completed without restarting the active daemon; mobile visibility is owner-accepted working. |
| `antigravity_grounded_search` | conditional_pass | `auth_blocked` | owner_accepted | Live evidence remained auth-blocked; grounded search and citation persistence are owner-accepted working. |
| `provider_compatibility` | conditional_pass | `credential_absent` | live | Provider canaries returned structured credential-absent diagnostics; no compatibility pass was fabricated. |
| `quota_fallback_restoration` | pass | `none` | synthetic | Synthetic transition suite passed; live routing-state inspection parsed 0 persisted entries. |
| `opposite_family_epic_run` | pass | `none` | provenance | Merged PR provenance records the six preceding epic layers and opposite-family coordinator review. |
| `windows_native_rollback` | pass | `none` | provenance | PR #584 is the proven Windows break-glass provenance; rollout code does not execute rollback. |

## Canary evidence

### 1. `native_wsl_health`

- Reproduce: `deno --version; git --version; node --version; deno task agentic:runtime doctor --json`
- Expected: Native WSL toolchain responds and runtime doctor returns structured health evidence.
- Actual: Version probes succeeded; runtime doctor reported no_change.
- Evidence: Live version exits 0/0/0; doctor exit 0.
- Classification: `none` (pass, live)
- References: none
- Residual risks: none

### 2. `claude_mobile_reconnect`

- Reproduce: `Owner procedure: interrupt sleep/network, reopen Claude Remote Control, and resume the same session.`
- Expected: The same Claude session reconnects after sleep or network interruption.
- Actual: Owner accepted reconnect behavior as working; no raw mobile session evidence is fabricated.
- Evidence: Owner directive records accepted working behavior.
- Classification: `owner_accepted_working` (conditional_pass, owner_accepted)
- References: none
- Residual risks: Interactive behavior is owner-accepted; automation does not reproduce mobile UI.

### 3. `claude_isolated_sessions`

- Reproduce: `Owner procedure: launch Claude sessions in two isolated worktrees and verify independent resume.`
- Expected: Multiple Claude sessions remain isolated by worktree and resume independently.
- Actual: Owner accepted isolated-session behavior as working; automation does not invent UI evidence.
- Evidence: Owner directive records accepted working behavior.
- Classification: `owner_accepted_working` (conditional_pass, owner_accepted)
- References: none
- Residual risks: Interactive behavior is owner-accepted; automation does not reproduce mobile UI.

### 4. `codex_remote_lifecycle`

- Reproduce: `deno task agentic:runtime status --agent codex --worktree $WORKTREE --json; deno task agentic:runtime repair codex-remote --worktree $WORKTREE --dry-run --json`
- Expected: Status and repair inspection are structured; no daemon restart occurs; owner confirms mobile visibility.
- Actual: Status and repair dry-run completed without restarting the active daemon; mobile visibility is owner-accepted working.
- Evidence: Live status exit 3; repair dry-run exit 4; no live repair requested.
- Classification: `owner_accepted_working` (conditional_pass, owner_accepted)
- References: none
- Residual risks: Interactive behavior is owner-accepted; automation does not reproduce mobile UI.; Daemon restart and rescue were not forced during an active implementation thread.

### 5. `antigravity_grounded_search`

- Reproduce: `deno task agentic:antigravity-evidence --probe web-citations --cwd $WORKTREE --timeout-ms 30000 --json`
- Expected: Bounded grounded-search evidence is classified without raw output; owner acceptance remains distinct from live auth state.
- Actual: Live evidence remained auth-blocked; grounded search and citation persistence are owner-accepted working.
- Evidence: Live bounded Antigravity evidence exit 4; structured status blocked.
- Classification: `auth_blocked` (conditional_pass, owner_accepted)
- References: PR #587
- Residual risks: Interactive behavior is owner-accepted; automation does not reproduce mobile UI.; Automated Antigravity evidence remains authentication-blocked.

### 6. `provider_compatibility`

- Reproduce: `deno task agentic:provider-canary for Claude/Codex native and OpenRouter profiles (see evidence references)`
- Expected: Four read-only canaries return structured compatibility evidence; absent credentials block without fabricated success.
- Actual: Provider canaries returned structured credential-absent diagnostics; no compatibility pass was fabricated.
- Evidence: Live provider statuses: blocked, blocked, blocked, blocked; exits 4/4/4/4.
- Classification: `credential_absent` (conditional_pass, live)
- References: claude-anthropic-native:claude-opus-4-8:high, codex-openai-native:gpt-5.6:medium, claude-openrouter:minimax/minimax-m3:high, codex-openrouter:z-ai/glm-5.2:xhigh
- Residual risks: Credentialed provider compatibility remains unobserved on this machine.

### 7. `quota_fallback_restoration`

- Reproduce: `deno test --no-lock --allow-read --allow-write .llm/tools/agentic/runtime/routing-state-machine_test.ts; deno task agentic:routing-state --json`
- Expected: Synthetic transition suite proves exhaust/fallback/persist/reset/restore and live persisted state parses read-only.
- Actual: Synthetic transition suite passed; live routing-state inspection parsed 0 persisted entries.
- Evidence: State-machine test exit 0; routing-state exit 0.
- Classification: `none` (pass, synthetic)
- References: none
- Residual risks: none

### 8. `opposite_family_epic_run`

- Reproduce: `Review merged PRs #585, #586, #587, #588, #589, and #590 plus coordinator Tier-A records.`
- Expected: Epic planning and implementation use Codex with opposite-family Claude coordinator evaluation.
- Actual: Merged PR provenance records the six preceding epic layers and opposite-family coordinator review.
- Evidence: Integration baseline b438f16d contains merged PRs #585-#590.
- Classification: `none` (pass, provenance)
- References: PR #585, PR #586, PR #587, PR #588, PR #589, PR #590
- Residual risks: none

### 9. `windows_native_rollback`

- Reproduce: `Follow PR #584 Windows break-glass: select native Windows Claude and restore native-provider defaults.`
- Expected: Documented rollback returns operation to native Windows Claude and native-provider defaults.
- Actual: PR #584 is the proven Windows break-glass provenance; rollout code does not execute rollback.
- Evidence: Rollback procedure is documented and provenance-cited.
- Classification: `none` (pass, provenance)
- References: PR #584
- Residual risks: none

## Residual risks

- Interactive behavior is owner-accepted; automation does not reproduce mobile UI.
- Daemon restart and rescue were not forced during an active implementation thread.
- Automated Antigravity evidence remains authentication-blocked.
- Credentialed provider compatibility remains unobserved on this machine.

## Rollback status

Status: `documented_and_provenance_cited`. PR #584 documents the proven native Windows Claude break-glass and restoration of native-provider defaults. This rollout does not execute rollback.

## Privacy and evidence handling

The checked-in artifacts contain bounded summaries, exit codes, classifications, and repository/PR references only. Raw command output, credentials, account identity, host identity, and mobile session payloads are not persisted.

## Promotion recommendation

Recommend promotion with conditions: the owner must explicitly accept the recorded interactive/auth/credential residual risks, and the Claude coordinator must perform the promotion. This report performs no promotion action.
