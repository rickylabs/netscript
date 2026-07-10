# Drift Log: native + OpenRouter provider profiles (#577)

## 2026-07-10 — stale origin fetch refspec

- **What:** The required broad `git fetch origin` failed before fetching current refs.
- **Source:** `remote.origin.fetch` and fetch stderr.
- **Expected:** Origin fetch updates the integration and feature tracking refs.
- **Actual:** The only configured fetch refspec names nonexistent
  `feat/fresh-ui-pixel-polish`. A scoped fetch of the authorized integration and feature refs then
  succeeded.
- **Severity:** minor
- **Action:** accept for this issue; do not mutate coordinator Git configuration.
- **Evidence:** pre-flight output recorded in `research.md`.

## 2026-07-10 — S1 matched locked profile design

- **What:** No implementation drift in S1; all three OpenRouter slugs matched current provider docs.
- **Source:** OpenRouter model pages and focused profile tests.
- **Expected:** Typed profiles/presets remove only #577 route deferral.
- **Actual:** Expected design landed; #578 Antigravity and #580 apply blocks remain.
- **Severity:** minor
- **Action:** accept as a no-divergence checkpoint.
- **Evidence:** `provider-profiles.ts`; focused tests 30 passed / 0 failed.

## 2026-07-10 — S2 matched child-only injection design

- **What:** No S2 design drift; environment values remain unrepresentable above the adapter edge.
- **Source:** child environment adapter and focused tests.
- **Expected:** Late-bind one selected credential, clear all rivals, never mutate the parent.
- **Actual:** Fresh child environment passed directly to `Deno.Command`; parent map unchanged;
  missing credentials return `auth_required` without spawn.
- **Severity:** minor
- **Action:** accept as a no-divergence checkpoint.
- **Evidence:** focused tests 10 passed / 0 failed; effect scan clean.

## 2026-07-10 — Claude OpenRouter requires explicit empty native key

- **What:** Current OpenRouter Claude Code docs require `ANTHROPIC_API_KEY` to be explicitly empty,
  not merely removed, while `ANTHROPIC_AUTH_TOKEN` carries the selected child credential.
- **Source:** https://openrouter.ai/docs/guides/coding-agents/claude-code-integration
- **Expected:** S2 explicit conflict clearing would delete every rival key.
- **Actual:** S3 refined the value-free child policy with an `emptyKeys` concept. The parent remains
  unchanged; only the child receives an empty native key.
- **Severity:** minor
- **Action:** fix within the locked L6/L7 safety design.
- **Evidence:** child-environment and runner-profile tests; no credential values in artifacts.
