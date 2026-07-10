# Context pack: PR 7 — `.llm/tools/agentic/` production-grade cleanup

Resumable summary of the final state. For the phase-by-phase log see `worklog.md`; for the process
deviation see `drift.md`; for the kept/moved/deleted disposition see `inventory.md`.

## What this PR did

Turned the flat `.llm/tools/agentic/` dump into a production-grade, concern-grouped suite with a
single source for everything volatile, an @std-first codebase, a rewritten README, and a reusable
cleanup playbook — with no live-behavior change. Branch `chore/epic-574-agentic-cleanup`, tip
`edd77a1e`, **not merged**.

## Final structure

```
.llm/tools/agentic/
  README.md                       house-voice reference + Maintenance map
  compatibility-wrappers_test.ts  guards the #576 one-cycle deprecation boundary
  config/     models.ts · versions.ts · endpoints.ts · mod.ts · no-hardcoded-volatile_test.ts
  lib/        agentic-lib.ts (+test) · __fixtures__/
  runtime/    contract · state · ports · planner · controller · output · routing/rollout policy · provider-profiles · adapters/
  runtime/cli/ agentic-runtime · routing-state · antigravity-evidence-cli · provider-canary · rollout-canary-cli · rollout-canary-runner
  codex/      launch-codex-slice · codex-status · codex-watch · codex-resume
  openhands/  dispatch-openhands · openhands-status · watch-openhands-verdict
  github/     gh-pr · gh-watch · gh-token
  wsl/        wsl-foundation · wsl-foundation-lib (+test)
  claude/     claude-hook-log · claude-remote-smoke · sync-claude-skills · validate-claude-surface
```

Also added: `.llm/tools/CLEANUP-PLAYBOOK.md` (operational spec to replicate this on other folders).

## Maintenance map — where to change what (single source)

| To change a…            | Edit                                                                                                                                                                |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Model id                | `config/models.ts` (`MODEL_IDS`, `OPENROUTER_MODEL_IDS`, `NATIVE_CANARY_MODEL_ARGS`)                                                                                |
| Routing binding         | `runtime/routing-policy.ts` (`CANONICAL_ROUTE_POLICY`, references config ids)                                                                                       |
| Tool version            | `config/versions.ts` (`NODE_TARGET_VERSION`, `ANTIGRAVITY_INSTALL_MARKER`, `COMPONENT_EXPECTED_VERSIONS`, `COMPAT_PINNED_TOOL_VERSIONS`, `TEST_COMPONENT_VERSIONS`) |
| Endpoint / host / URL   | `config/endpoints.ts` (keep the `agentic:wsl-foundation` `--allow-net=` allowlist in `deno.json` in sync)                                                           |
| Provider profile/preset | `runtime/provider-profiles.ts` (ids from `config/models.ts`)                                                                                                        |
| Fallback / lane policy  | `runtime/routing-policy.ts`                                                                                                                                         |
| Agent/provider vocab    | `runtime/contract.ts` (`AGENT_KINDS`, `PROVIDER_KINDS`, `EFFORTS`, diagnostic codes, `EXIT_CODES`)                                                                  |
| Deps                    | root `deno.json` import map + `deno.lock` (suite has no third-party deps of its own)                                                                                |

## The enforcement guard (`config/no-hardcoded-volatile_test.ts`)

- **Layer A (exact):** forbidden set DERIVED from all exported string values of
  `config/{models,versions,endpoints}.ts`; only `agy` excluded (also the CLI executable name). Scans
  production `.ts`, the README (illustrative allowlist), and test files (explicit per-file allowlist
  — not a blanket exclusion).
- **Layer B (structural):** flags model/version/endpoint-SHAPED literals in production even if the
  exact string isn't in config yet — this is what fails on a NEW hardcoded id.
- Demonstrated to FAIL on reintroduction (both a known and a never-seen model id) — see
  `worklog.md`.

## @std / Deno-native posture

- Import map: `@std/assert@1`, `@std/path@1` (the only additions; `deno.lock` delta = 2 workspace
  deps). Tests use `@std/assert`; path work uses `@std/path`.
- Deliberately kept: bespoke CLI pair-parsers (exit-code contracts pinned by tests); the custom
  `assertUnique` helper (no @std equivalent).

## Final gate state

205 passed / 0 failed · scoped check/lint/fmt 0 findings · `docs:maintenance` green ·
`git diff
--check` clean · `deno.lock` delta = +2 sanctioned `@std` workspace deps.

## Process note

Owner-authorized exceptional Fable 5 cleanup; no external PLAN-EVAL/IMPL-EVAL (consistent with epic
#574's evaluator waiver). Verification was per-phase gates + an independent opposite-family GPT-5.6
review whose three findings were remediated (commit `edd77a1e`). See `drift.md`.

## Open item for the owner

`openhands/watch-openhands-verdict.ts` vs `github/gh-watch.ts` overlap (both poll a PR for the
OpenHands verdict; distinct contracts). Kept both; watch-openhands-verdict is the only tool with no
`deno.json` task or skill reference — a candidate for future consolidation needing an owner
decision.
