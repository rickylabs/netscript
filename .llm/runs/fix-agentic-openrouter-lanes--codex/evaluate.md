# Evaluation: durable OpenRouter agentic lane repair

## Metadata

| Field          | Value                                                        |
| -------------- | ------------------------------------------------------------ |
| Run ID         | `fix-agentic-openrouter-lanes--codex`                        |
| Target         | `.llm/tools/agentic` internal CLI/runtime tooling            |
| Archetype      | `6 - CLI / Tooling`                                          |
| Scope overlays | none                                                         |
| Evaluator      | Claude Opus 4.8 — separate opposite-family IMPL-EVAL session, 2026-07-12 |
| Baseline → HEAD | `ec61dc78` → `5dc620b4` (impl head before handoff `1596c32f`) |
| PR             | #696 → `main` (OPEN, ready-for-review, `status:impl-eval`)   |

Generator was GPT-5 Codex (`supervisor.md`); this evaluator is a distinct Claude Opus 4.8 session —
generator ≠ evaluator invariant satisfied. Evaluation covered the full committed diff `ec61dc78..HEAD`
(45 files, +1925/-131). No source, test, plan, worklog, PR, or non-`evaluate.md` file was modified.

## Process Verification

| Check                                  | Result | Evidence                                                                                          |
| -------------------------------------- | ------ | ------------------------------------------------------------------------------------------------- |
| Plan-Gate passed before implementation | PASS   | `plan-eval.md` verdict `PASS` (Claude Opus 4.8 opposite-family). First impl slice `8761d043` follows plan-gate `2333ddab`. |
| Design section exists in worklog       | PASS   | `worklog.md` §Design (public surface, domain vocab, ports, constants, 3 commit slices, deferred scope, contributor path). |
| Commit slices match design plan        | PASS   | 3 planned slices ↔ commits `8761d043` (S1 launcher route identity), `7dd3b03a` (S2 Claude GLM lane), `1596c32f` (S3 preset gate). Order matches Design. |
| Each slice has a passing gate          | PASS   | `worklog.md` §Gate Results per slice (S1 89 tests; S2 235 + provider canaries; S3 239 + scoped wrappers), re-verified independently below. |
| No speculative seams (unused files)    | PASS   | New modules (`launcher-route.ts`, `preset-canary.ts`, `claude-print.ts`) each reachable from launcher/CLI/adapter; verified by import graph + green typecheck. |
| Constants used for finite vocabularies | PASS   | `OPENROUTER_PRESET_IDS`, `OPENROUTER_AGENTIC_TURN_STATUSES`, `OPENROUTER_TRANSPORTS`, `OPENROUTER_INCOMPATIBILITIES`, `EFFORTS` derive union types; no bare string switches. |

## Acceptance-Boundary Verification (mission-specific)

| # | Boundary | Result | Evidence |
| - | -------- | ------ | -------- |
| 1 | App-server never gets top-level `--profile`; launcher materializes supported named Responses-only profile + isolated `config.toml` | PASS | `app-server-message.ts:98-105` `appServerArguments` emits only `-c model_reasoning_effort=… app-server` — no `--profile`. `launcher-route.ts:64-72` materializes `netscript-openrouter.config.toml` **and** copies it to `<home>/config.toml` (isolated `CODEX_HOME`), with comment noting app-server rejects top-level `--profile`. `codex-profile-adapter.ts:53-55` emits `wire_api = "responses"` — no legacy `[profiles.*]` / `wire_api="chat"`. |
| 2 | Requested effort applied in authoritative app-server requests, compared with observed v0.144 identity; success without thread id = exit 0; real mismatch fails closed | PASS | Effort applied at three authoritative points: app-server startup `-c model_reasoning_effort` (`app-server-message.ts:101-103`), `thread/start.config.model_reasoning_effort` (`threadStartRequest`, L38-43), and `turn/start.effort` (L164). `parseThreadStart` reads observed model/provider/effort from the thread/start result. `launcherExitCode` (`launcher-route.ts:92-100`): `processCode!=0→1`, `mismatch && !allow→1`, else `0`. `!recorded` branch (`launch-codex-slice.ts:469-478`) exits `launcherExitCode(...)` — status 0 + pending identity ⇒ exit 0; observed mismatch ⇒ exit 1 (fail closed). |
| 3 | Claude/OpenRouter route is real isolated launch/resume (not stub); redacted evidence proves non-empty GLM 5.2 agentic turn via checked-in wrapper | PASS | `claude-adapter.ts:126-143` plans a real `printRequest` for custom/openrouter routes invoking checked-in `claude-print.ts` with `--model/--effort/--prompt` and `--resume <session>` for resume (`claude-print.ts:18-33` builds `claude -p … [--resume …]`). Isolation via `childEnvironmentPolicyForProfile` (`provider-profiles.ts:203-218`): sets `ANTHROPIC_BASE_URL`, empties `ANTHROPIC_API_KEY`, binds `CLAUDE_CONFIG_DIR` per profile. `glm-live-evidence.md`: `GLM_RUNTIME_ADAPTER_OK`, exit 0, 2 turns, Bash `pwd` tool result, non-empty, key-redacted. |
| 4 | Codex GLM native-namespace rejection is observed, structured, test-covered incompatibility (not fabricated support) | PASS | `provider-profiles.ts:168-177` preset `codex-design-glm-5-2` → `agenticTurn:'unsupported'`, `incompatibility:'codex-native-namespace-tool'`, `transport:'responses'`. `provider-canary_test.ts:155-192` injects observed stderr "No endpoints found that support the native namespace tool type" and asserts `incompatibility='codex-native-namespace-tool'`, `incompatibilitySource='observed'`. Reproduced live: `glm-live-evidence.md` §Codex GLM exit 1. |
| 5 | Every preset has a cheap structured static canary; default reads no credential / spawns no provider; provider needs `--live`; CI + rollout consume correct modes | PASS | `preset-canary.ts:172-193` iterates all `OPENROUTER_PRESET_IDS` (coverage-mismatch guard) + coherence + real launch-plan composition, pure (no `Deno.env`/spawn). CLI default = static (`provider-canary.ts:98-104`); `--live` required for `ProviderCanaryAdapter().run` (L128-138). Independent run with all 4 provider creds unset → `status:"passed"`, exit 0, all 4 rows validated, no process. CI runs default static (`ci.yml` +`agentic:provider-canary`); rollout runner now passes `--live` on every provider request (`rollout-canary-runner.ts` diff). |
| 6 | Model ids/endpoints centralized; no credential committed; `deno.lock` unchanged; changed TS meets CLI/tooling structure gates | PASS | `provider-profiles.ts:5-8` imports base URLs from `config/endpoints.ts` and model ids from `config/models.ts`; `codex-profile-adapter.ts` re-imports the central Responses base URL. Volatile-config guard 4/4 green in suite. Secret-shape scan over full diff → `NO-SECRET-SHAPED-VALUES`; `git diff --check` exit 0. `deno.lock` delta empty. Scoped check/lint/fmt 105 files 0 findings. (See LOC note under Findings.) |
| 7 | PLAN-EVAL non-blocking asks satisfied: explicit F-2/F-4 evidence; F-6..F-9 N/A internal tooling | PASS | `worklog.md` §S1 Fitness Ledger + §Final Fitness Ledger: F-2 (PASS manual — reused command planners/profile renderer/route-identity/WSL helper), F-4 (PASS manual — no class/inheritance introduced), F-6/F-7/F-8/F-9 each `N/A (internal tooling)`. |

## Static Gates

| Gate             | Command or check                                                        | Result | Evidence | Notes |
| ---------------- | ---------------------------------------------------------------------- | ------ | -------- | ----- |
| Narrow/slice typecheck | `run-deno-check.ts --root .llm/tools/agentic --ext ts`           | PASS   | 105 files, `totalOccurrences:0` | independent run |
| Format           | `run-deno-fmt.ts --root .llm/tools/agentic --ext ts`                   | PASS   | 105 files, `findings:0` | independent run |
| Lint             | `run-deno-lint.ts --root .llm/tools/agentic --ext ts`                  | PASS   | 105 files, `totalOccurrences:0` | independent run |
| Doc lint         | n/a                                                                     | N/A    | internal tooling, no JSR public surface | |
| Publish dry-run  | n/a                                                                     | N/A    | `.llm/tools/agentic` is not a published package | |
| Whitespace/link  | `git diff --check ec61dc78..HEAD`                                       | PASS   | exit 0 | |
| Lock hygiene     | `git diff --stat -- deno.lock`                                          | PASS   | empty (unchanged) | |
| Secret scan      | full-diff key-shape grep                                                | PASS   | `NO-SECRET-SHAPED-VALUES` | no key value committed |

## Fitness Gates

| Gate | Function                     | Result | Evidence | Violations |
| ---- | ---------------------------- | ------ | -------- | ---------- |
| F-1  | File-size lint               | PASS   | run-authored entrypoint `launch-codex-slice.ts` 499 LOC; new modules ≤ 193 | see LOC note |
| F-2  | Helper-reinvention scan      | PASS (manual) | reused profile renderer, route-identity, WSL/`sq`, command planners, rollout runner | none |
| F-3  | Layering check               | PASS   | planning modules pure; Deno/process confined to adapters/bin edges (scan `NONE`) | none |
| F-4  | Inheritance audit            | PASS (manual) | no classes/inheritance added; typed data + pure functions | none |
| F-5  | Public surface audit         | PASS   | no new package export surface; internal edges only | none |
| F-6  | JSR publishability           | N/A    | internal tooling | |
| F-7  | Doc-score                    | N/A    | internal tooling | |
| F-8  | Workspace `lib` override     | N/A    | no package workspace import map | |
| F-9  | Permission declaration       | N/A    | task perms in root task defs; no package manifest | |
| F-10 | Test-shape audit             | PASS   | semantic argv/config/event assertions (e.g. `preset-canary_test.ts`, `provider-canary_test.ts`); no giant snapshots | none |
| F-11..F-19 | folder/naming/barrel/console | PASS / reviewed | no new `src/` CLI package layer; console.* only at CLI/client edges (allowed) | none |
| F-CLI-1..31 | Archetype-6 CLI gates      | PENDING_SCRIPT / reviewed | no dedicated script (deleted S9); no new CLI package surface, composition, barrels, registries; changed flat internal edges reviewed | none |

## Runtime Gates

| Gate                        | Validation                                              | Result | Evidence |
| --------------------------- | ------------------------------------------------------ | ------ | -------- |
| Full agentic suite          | `deno test --no-lock --allow-all .llm/tools/agentic` (creds unset) | PASS | 239 passed / 0 failed (independent run) |
| Default static preset canary | `deno task agentic:provider-canary` (4 creds unset)   | PASS   | `status:"passed"`, exit 0, 4 rows validated, no provider process |
| Volatile-config guard       | in-suite                                                | PASS   | 4/4, no hardcoded model/endpoint/version |
| GLM 5.2 live agentic turn   | committed redacted evidence (not re-run)                | PASS   | `glm-live-evidence.md` `GLM_AGENTIC_OK` + `GLM_RUNTIME_ADAPTER_OK`, exit 0, non-empty, Bash `pwd` |
| Codex GLM incompatibility   | structured canary + test                                | PASS   | `provider-canary_test.ts:155` observed→`codex-native-namespace-tool`; live exit 1 |

No provider credit was spent by this evaluator; the live turn was assessed from committed redacted evidence per brief.

## Consumer Gates

| Consumer                    | Validation                                              | Result | Evidence |
| --------------------------- | ------------------------------------------------------ | ------ | -------- |
| CI pipeline                 | `ci.yml` step `agentic:provider-canary` (default static) | PASS | credential-free static mode wired into CI |
| Rollout canary runner       | `--live` on every provider request                      | PASS   | `rollout-canary-runner.ts` diff adds `--live`; covered by `rollout-canary-runner_test.ts` |
| Launcher/client/profile     | focused launcher + app-server + parser tests            | PASS   | part of 239-test suite |

## Anti-Pattern Check

| AP    | Status | Evidence | Notes |
| ----- | ------ | -------- | ----- |
| AP-1  | CLEAR  | run-authored files ≤ 499 LOC; launcher split into `launcher-route.ts` | pre-existing `agentic-lib.ts` note in Findings |
| AP-2  | CLEAR  | reused `wsl`/`sq`/profile renderer; no platform-primitive rewraps | |
| AP-3  | N/A    | no new ports/interfaces | |
| AP-4  | CLEAR  | no cross-package inheritance | |
| AP-5  | N/A    | no abstract lattice | |
| AP-6  | N/A    | no base classes touched | |
| AP-7  | CLEAR  | typed options objects, not positional telescoping | |
| AP-8  | N/A    | no DI container | |
| AP-9  | CLEAR  | finite typed preset/capability records, not generic flag helpers | |
| AP-10 | CLEAR  | diagnostics returned as structured data, not swallowed | |
| AP-11 | CLEAR  | env/process/network confined to adapters + bin edges (side-effect scan `NONE` in planning modules) | |
| AP-12 | N/A    | no scheduling in handlers | |
| AP-13 | CLEAR  | `console.*` only at CLI/client edges (launcher, app-server client, canary CLI) | allowed for internal tooling edges |
| AP-14 | CLEAR  | no upstream re-exports | |
| AP-15 | CLEAR  | no `interface I*` / `type *T` | |
| AP-16 | CLEAR  | no `utils/`/`helpers/`/`common/`/`lib/` folders added (`lib/` is a pre-existing agentic dir, not doctrine-forbidden package folder) | |
| AP-17 | N/A    | no interfaces folder | |
| AP-18 | CLEAR  | semantic assertions on argv/config/events; no giant snapshots | |
| AP-19 | N/A    | no package README permissions surface | |
| AP-20 | N/A    | no workspace lib override | |
| AP-21 | N/A    | no flat command-surface folder | |
| AP-22 | CLEAR  | no re-export barrels added | |
| AP-23 | N/A    | no composition root touched | |
| AP-24 | CLEAR  | typed preset registry + capability records, not switch-over-union | |
| AP-25 | CLEAR  | side effects only in edge files; new planning modules pure | |

## Arch-Debt Delta

| Metric                | Count | Evidence |
| --------------------- | ----- | -------- |
| New entries           | 0     | run introduces no doctrine violation requiring debt; incompatibility encoded as present capability fact |
| Resolved entries      | 0     | — |
| Deepened violations   | 0     | — |
| Unrecorded violations | 0     | scans found none blocking |

## Findings

| Severity | Finding | Evidence | Required action |
| -------- | ------- | -------- | --------------- |
| low | `lib/agentic-lib.ts` is 1103 LOC (a *changed* file, +7 lines for v0.144 parsing) and exceeds an abstract 500-LOC cap. It is a pre-existing shared internal-tooling library, not newly grown by this run; F-CLI-* is reviewed (not script-enforced) for this non-package surface, and the run's authored entrypoint was brought under cap (499). The worklog's "maximum 499" phrasing refers to run-authored files and is slightly imprecise about this pre-existing library. | `wc -l` on changed `.ts`; git blame predates run | none (non-blocking observation); if the file is materially extended in a future run, split it |

No high or medium findings. No gate failed.

## Lessons for Promotion

| Lesson | Pattern | Applies to | Confidence |
| ------ | ------- | ---------- | ---------- |
| Encode provider incompatibility as tested finite capability data, not a silent retry path | observed-stderr → structured `incompatibility` + `incompatibilitySource:'observed'` | Archetype 6 tooling lanes | medium |
| Static-by-default canary + explicit `--live` keeps CI credential-free while preserving real launch-plan coverage | pure launch-plan composition in default mode; provider spawn gated behind `--live` | CLI provider canaries | medium |

## Verdict

| Field     | Value |
| --------- | ----- |
| Verdict   | `PASS` |
| Rationale | All seven mission acceptance boundaries are independently verified against the committed diff, and every applicable static/fitness/runtime/consumer gate passes with concrete evidence: 239/239 agentic tests green (credentials unset), scoped check/lint/fmt 105 files 0 findings, default static preset canary passed with all four provider credentials unset and no provider process, `deno.lock` unchanged, `git diff --check` clean, no secret-shaped value committed. The Codex-vs-Claude lane resolution is real (isolated `claude-print.ts` launch/resume, not a stub) with redacted non-empty GLM 5.2 agentic evidence; the Codex GLM native-namespace rejection is an observed, structured, test-covered incompatibility. Process invariants hold: PLAN-EVAL `PASS` preceded implementation, generator (GPT-5 Codex) ≠ evaluator (Claude Opus 4.8), slices map to the Design checkpoint, and the PLAN-EVAL non-blocking asks (F-2/F-4 evidence, F-6..F-9 N/A) are recorded. Issue close-gate and release gates are correctly N/A. The single finding is a low-severity, non-blocking pre-existing LOC observation on `agentic-lib.ts`. The IMPL-EVAL Definition-of-Done box may now be checked. |
