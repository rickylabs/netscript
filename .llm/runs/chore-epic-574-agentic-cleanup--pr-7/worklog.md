# Worklog: PR 7 — production-grade cleanup of `.llm/tools/agentic/`

| Field       | Value                                                                    |
| ----------- | ------------------------------------------------------------------------ |
| Run ID      | `chore-epic-574-agentic-cleanup--pr-7`                                   |
| Branch      | `chore/epic-574-agentic-cleanup`                                         |
| Base        | `34b818d0` (PR-7 run open) atop the merged #574 integration (`45b6eb6d`) |
| Implementer | Fable 5 (high) — single owner-authorized exceptional cleanup subagent    |
| Coordinator | Claude Opus 4.8 (WSL supervisor)                                         |

This worklog records what **actually** happened, phase by phase, with each phase's real gate
results. It is reconstructed honestly after the fact; see `drift.md` for the process deviation (no
external PLAN-EVAL was run — this was an owner-authorized exceptional cleanup, not a standard
harness slice).

Baseline before any change: `deno test --no-lock -A .llm/tools/agentic/` = **201 passed, 0 failed**.

## Phase 1 — Inventory + reference analysis (commit `35cd4a2f`)

- Built the internal import graph and the external reference set for every file across imports,
  `deno.json` tasks, `.agents`/`.claude` skills, `.llm/harness` docs, `.claude/settings.json` hooks,
  CLAUDE.md/AGENTS.md, and `.github/workflows`.
- Verdict: **zero provably-dead files**; every `.ts` has a live reference. Disposition table (keep/
  move) written to `inventory.md` with the justifying references.
- Gate: none beyond the baseline (doc-only slice).

## Phase 2 — Restructure into concern folders (commit `af93e680`)

- `git mv` every top-level tool into concern folders: `lib/`, `runtime/cli/`, `codex/`,
  `openhands/`, `github/`, `wsl/`, `claude/` (names preserved; `runtime/` internals left in place).
- Updated every reference: 16 `deno.json` task paths, 2 `.claude/settings.json` hook commands, all
  cross-boundary imports, the `foundation-adapter` child-script URL, `validate-claude-surface` spawn
  paths, in-file usage strings, and the skill/harness/workflow/CLAUDE/AGENTS docs; regenerated
  `.claude` mirrors via `agentic:sync-claude`. Updated `compatibility-wrappers_test.ts` to the new
  paths (assertions unchanged).
- Gates: **201 passed / 0 failed**; scoped check/lint/fmt **0 findings**; `agentic:check-claude` OK;
  `agentic:sync-claude:check` clean; `git diff --check` clean; `deno.lock` unchanged.

## Phase 3 — Navigation-first README pass (commit `29ad56b6`)

- First README rewrite (folder map + per-file roles) and validation-section refresh. Superseded by
  the house-voice rewrite in Phase 6.
- Gates: **201 passed / 0 failed**; scoped fmt 0 findings.

## Phase 4 — Central config + de-hardcode (commit `f59ccb8b`)

- Created `config/` (`models.ts`, `versions.ts`, `endpoints.ts`, `mod.ts`) as the single source for
  volatile values. Re-pointed every hardcoded literal: routing-policy model ids, provider-profiles
  presets + base URLs, wsl-foundation node target/dist-host/installer, routing-signal-classifier
  compat versions, test-fixtures, agentic-lib GitHub base, rollout-canary matrix.
- Added the first enforcement test `config/no-hardcoded-volatile_test.ts`; it caught two real leaks
  (`rollout-canary-runner` minimax/glm) during implementation, fixed same slice.
- Resolved `isolatedDeclarations` constraints (drop `Object.freeze` where unannotated; inline
  cross-const literals; annotate re-export shims). Preserved the frozen-fixture invariant.
- Gates: **202 passed / 0 failed** (201 + guard); scoped check/lint/fmt 0 findings;
  `agentic:check-claude` OK; `sync-claude:check` clean; `deno.lock` unchanged.

## Phase 5 — README rewrite in house voice + maintenance map (commit `cce7158e`)

- Rewrote the suite README from scratch in the NetScript docs voice (studied
  `docs/site/cli-reference.md`): brain-vs-hands model, folder map, everyday-flow narratives with
  real captured output, safety model, and a **Maintenance map** table. Added central-config pointers
  to the `netscript-tools` skill source and `lane-policy.md`; regenerated mirrors.
- Gates: **202 passed / 0 failed**; scoped check/lint/fmt 0 findings; `check-claude` + `sync-check`
  green.

## Phase 6 — @std / Deno-native-first pass (commit `b3fa113c`)

- Added minimal pinned import-map entries `@std/assert@1`, `@std/path@1`. Replaced the duplicated
  per-test-file `assert`/`assertEquals`/`equal`/`assertThrows` helpers across 30 test files with
  `@std/assert` (kept the custom `assertUnique`); replaced 2 hand-rolled `dirname()` with
  `@std/path`.
- Behavior-preservation fixes for `@std`'s stricter deep-equality: spread 3 readonly-const-tuple
  compares; normalize one JSON round-trip compare through `JSON.parse(JSON.stringify(...))`.
- CLI arg-parsers deliberately NOT swapped (their exit-code contracts are pinned by tests).
- Gates: **202 passed / 0 failed**; scoped check/lint/fmt 0 findings. `deno.lock` delta: +2
  workspace deps (the resolved pins already existed transitively).

## Phase 7 — Reusable cleanup playbook (commit `08c0a6bc`)

- Wrote `.llm/tools/CLEANUP-PLAYBOOK.md` (operational spec, phases 0–9) so another agent can
  replicate this standard on any other `.llm/tools/` folder.

## Phase 8 — Doc-surface sweep (commit `98d4993e`)

- Updated `.llm/tools/README.md` (broadened the agentic subtree, fixed stale flat paths to the new
  `claude/` subfolder, documented the config single-source, linked the playbook) and
  `.llm/harness/workflow/tooling.md` (structure + config note). AGENTS.md carries no agentic-path
  references. `docs:maintenance` green (0 broken links/anchors, mirrors in sync, surface valid).

## Phase 9 — Opposite-family GPT-5.6 review remediation (commit `edd77a1e`)

Independent opposite-family (GPT-5.6) review returned CONCERNS with three findings; all remediated:

- **Finding 1 (High):** moved the last hardcoded native model ids (`claude-opus-4-8`, `gpt-5.6`)
  from `rollout-canary-runner.ts` into `config/models.ts` (`NATIVE_CANARY_MODEL_ARGS`); centralized
  the Antigravity install marker as `config/versions.ts` `ANTIGRAVITY_INSTALL_MARKER`. Strengthened
  the guard to two layers — Layer A derives the forbidden set from ALL exported config values (not a
  subset); Layer B flags model/version/endpoint-SHAPED literals to catch NEW hardcoded ids. The
  strengthened Layer A immediately caught a real leak the old closed-list guard missed
  (`official-installer` in `wsl-foundation-lib.ts`), now fixed.
- **Finding 3 (Medium):** the guard header no longer over-claims (states "production TypeScript
  sources"); test files use an explicit per-file allowlist instead of a blanket corpus exclusion;
  the README is scanned with an illustrative allowlist and its `gpt-5.6-sol` example is marked
  illustrative in prose.
- **Finding 2 (High):** reconstructed honest run artifacts (this `worklog.md`, `context-pack.md`,
  `drift.md`).

### Guard reintroduction demonstration (required evidence)

Temporarily appended to a production file `codex/codex-status.ts`:

```
const _demoKnown = "gpt-5.6-sol";        // a KNOWN config model id
const _demoNew   = "claude-sonnet-9.9";  // a NEW, never-seen model id
```

Result (`deno test -A config/no-hardcoded-volatile_test.ts`), 2 of 4 tests FAILED as intended:

```
Layer A — no config value is hardcoded outside config/ (exact, derived) ... FAILED
  codex/codex-status.ts hardcodes config value "gpt-5.6-sol" (source it from config/)
  codex/codex-status.ts hardcodes config value "gpt-5.6" (source it from config/)
Layer B — no model/version/endpoint-shaped literal in production (structural) ... FAILED
  codex/codex-status.ts: model:gpt shape in `const _demoKnown = "gpt-5.6-sol";`
  codex/codex-status.ts: model:claude-family shape in `const _demoNew = "claude-sonnet-9.9";`
```

Layer A caught the known id; Layer B caught the brand-new id no allowlist knows about. The injection
was reverted (file restored byte-identical) and the guard returned to **4 passed / 0 failed**.

- Gates after remediation: **205 passed / 0 failed** (guard 1→4 tests); scoped check/lint/fmt 0
  findings.

## Final gate state (branch tip `edd77a1e`)

| Gate                                         | Result                                                          |
| -------------------------------------------- | --------------------------------------------------------------- |
| `deno test --no-lock -A .llm/tools/agentic/` | 205 passed, 0 failed                                            |
| scoped `run-deno-check.ts`                   | 0 findings                                                      |
| scoped `run-deno-lint.ts`                    | 0 findings                                                      |
| scoped `run-deno-fmt.ts`                     | 0 findings                                                      |
| `deno task docs:maintenance`                 | links/anchors OK, `sync-claude:check` OK, `check-claude` OK     |
| `git diff --check`                           | clean                                                           |
| `deno.lock` delta vs base                    | +2 workspace deps (`jsr:@std/assert@1`, `jsr:@std/path@1`) only |

Not merged. Awaiting coordinator sign-off and integration→main promotion.

## Coordinator Tier-A Sign-off (2026-07-11, Claude Opus 4.8)

Opposite-family GPT-5.6 review (thread 019f4dea) returned CONCERNS (3 findings); all remediated in
`edd77a1e` + `aea142dd` and independently re-verified by the coordinator:
- F1 native model IDs (`claude-opus-4-8`/`gpt-5.6`) + `official-installer` marker centralized into
  `config/`; guard now derives its forbidden set from all config exports + a structural shape layer,
  and demonstrably FAILS on reintroduction (worklog evidence).
- F2 honest run artifacts reconstructed; drift records the no-external-PLAN-EVAL deviation plainly.
- F3 guard claim narrowed to production TS; tests scanned with an explicit contract-literal allowlist;
  README literal marked illustrative.
- Gates: suite 205/0; scoped check/lint/fmt 0; docs:maintenance OK; deno.lock +@std only.

Verdict: PASS. Opposite-family review honored per #581 policy (Claude-authored → GPT-5.6 review).
Merging into integration.
