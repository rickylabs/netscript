# Plan: fix plugin install ai JSR alias

## Run Metadata

| Field | Value |
| ----- | ----- |
| Run ID | `fix-480-plugin-ai-jsr-alias--impl` |
| Branch | `fix/480-plugin-ai-jsr-alias` |
| Phase | `implement` |
| Target | `packages/cli` |
| Archetype | `6 - CLI / Tooling` |
| Scope overlays | `none` |

## Archetype

Archetype 6 applies because this changes a user-run CLI command flow: `netscript plugin install <kind>`.

## Current Doctrine Verdict

`@netscript/cli` is currently `Restructure` in doctrine file 10. This slice does not restructure the package; it avoids deepening known debt by changing only the existing resolver table and its focused unit test.

## Axioms in Play

| Axiom | Why it matters |
| ----- | -------------- |
| A2 | The published CLI boundary should make `plugin install ai` behave like the other official aliases. |
| A6 | No new helper is justified; the existing alias resolver is the correct policy location. |
| A14 | Resolver behavior and prod-path installation need explicit tests/gates. |

## Goal

Make `plugin install ai` resolve to `jsr:@netscript/plugin-ai` before kind-registry planning so the published CLI can install the published AI plugin.

## Scope

- Add `ai: '@netscript/plugin-ai'` to `BARE_PLUGIN_PACKAGE_ALIASES`.
- Add a resolver unit test for the AI alias.
- Sweep official-plugin enumerations and document which sites are already correct or intentionally skipped.
- Run targeted unit/static gates and prod-path install probes for AI and Auth.

## Non-Scope

- No plugin package changes; `@netscript/plugin-ai` is already published.
- No generated asset changes unless validation proves they are required.
- No repo-wide formatting or lock churn.

## Hidden Scope

- The prod-path probe must avoid `--local-path` so it exercises JSR validation and plugin-owned scaffolder dispatch.

## Locked Decisions

| ID | Decision | Rationale |
| -- | -------- | --------- |
| D1 | Add AI only to `BARE_PLUGIN_PACKAGE_ALIASES`. | That is the missing JSR-path dispatch table. |
| D2 | Leave `plugin-trust-tier.ts` unchanged. | Trust is based on the `netscript` scope and already covers `@netscript/plugin-ai`. |
| D3 | Leave `OFFICIAL_PLUGIN_DIRS` unchanged. | It rewrites local copied plugin path imports and already omits `auth`; AI is JSR/plugin-owned in this flow. |

## Open-Decision Sweep

| Decision | Status | Notes |
| -------- | ------ | ----- |
| Whether to add AI to e2e plugin suite lists | safe to defer | Already present in the runtime/plugin capability suites. |
| Whether to add AI to JSR specifier constants | safe to defer | Not used by bare alias resolution; the published descriptor supplies the versioned JSR source. |

## Risk Register

| Risk | Mitigation |
| ---- | ---------- |
| Alias resolves but plugin scaffolder fails from JSR | Run scratch prod-path `plugin install ai` without `--local-path`. |
| Regression in existing official aliases | Run `plugin install auth` in the same JSR mode. |
| Accidental lock churn | Inspect git status/diff and revert `deno.lock` if changed. |

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
| -- | ------ | ---- |
| AP-9 | risk | Avoid a new parallel official-plugin resolver; use the existing alias table. |
| AP-24 | existing | Do not introduce a new switch; the existing table is the closed alias map. |

## Fitness Gates

| Gate | Required | Expected evidence |
| ---- | -------- | ----------------- |
| Static | yes | Targeted unit test plus scoped check/lint/fmt wrappers. |
| Runtime/consumer | yes | Scratch project prod-path installs for `ai` and `auth`. |
| F-CLI-* | reviewed | Manual scope review; no new files or side-effect locations. |

## Arch-Debt Implications

| Entry | Action | Notes |
| ----- | ------ | ----- |
| CLI restructure debt | none | Existing debt not deepened. |

## Validation Plan

| Order | Gate | Command or check | Expected result |
| ----- | ---- | ---------------- | --------------- |
| 1 | unit | `deno test --allow-read packages/cli/src/public/features/plugins/install/plugin-package-resolver_test.ts` | pass |
| 2 | scoped check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/cli --ext ts,tsx` | pass |
| 3 | scoped lint | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/cli --ext ts,tsx` | pass |
| 4 | scoped fmt | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/cli --ext ts,tsx` | pass |
| 5 | prod path | local CLI init scratch project; local CLI `plugin install ai` and `plugin install auth` without `--local-path` | pass |

## Dependencies

- Published `@netscript/plugin-ai@0.0.1-beta.4` and `@netscript/plugin-auth@0.0.1-beta.4` on JSR.

## Drift Watch

- If prod-path validation reveals missing generated import constants or package metadata, record and rescope before touching plugin packages.
