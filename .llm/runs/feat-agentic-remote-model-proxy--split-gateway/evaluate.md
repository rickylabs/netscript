# Evaluation: feat-agentic-remote-model-proxy--split-gateway

## Metadata

| Field          | Value                                            |
| -------------- | ------------------------------------------------ |
| Run ID         | `feat-agentic-remote-model-proxy--split-gateway` |
| Target         | PR #1314 — inference-only Claude OpenRouter launcher |
| Archetype      | `6 - CLI / tooling` (internal, non-publishable)  |
| Scope overlays | `docs`                                           |
| Evaluator      | OpenCode / `qwen/qwen3.7-max`, 2026-08-05       |

## Process Verification

| Check                                  | Result | Evidence |
| -------------------------------------- | ------ | -------- |
| Plan-Gate passed before implementation | PASS   | `plan-eval.md` = PASS (session `0443e94a`); revised `plan-eval-rescope.md` = PASS (OpenCode/Qwen) |
| Design section exists in worklog       | PASS   | `## Design` with Public Surface, Domain Vocabulary, Ports, Constants, Commit Slices, Contributor Path |
| Commit slices match design plan        | PASS   | S1 `4012964ee` (gateway+launcher+tests), S2 `bf5be5501` (rescope+docs+canary); S3 is this eval |
| Each slice has a passing gate          | PASS   | S1: 25 tests + scoped check/lint/fmt; S2: Grok findings addressed, revised Plan-Gate PASS, live canary |
| No speculative seams (unused files)    | PASS   | Every new file is consumed by tests or the root task; no dead code |
| Constants used for finite vocabularies | PASS   | Volatile-value guard 4/4; model IDs, endpoints, and loopback in `config/` |

## Static Gates

| Gate             | Command or check | Result | Evidence | Notes |
| ---------------- | ---------------- | ------ | -------- | ----- |
| Narrow typecheck | `run-deno-check.ts --root .llm/tools/agentic/{claude,lib,config}` | PASS | 22 files, 0 findings | |
| Format           | `run-deno-fmt.ts --root .llm/tools/agentic/{claude,lib}` | PASS | 16 files, 0 findings | |
| Lint             | `run-deno-lint.ts --root .llm/tools/agentic/{claude,lib}` | PASS | 16 files, 0 findings | |
| deno.lock        | `git diff 015ddef6d -- deno.lock` | PASS | empty diff | lock unchanged |
| Skill mirrors    | `diff .agents/skills/claude-manager/SKILL.md .claude/skills/claude-manager/SKILL.md` | PASS | identical | |
| Stale task names | `grep -r "agentic:remote-model"` across deno.json, README, skills, tooling.md | PASS | no matches | |
| Link/path check  | README, skill, tooling.md all reference `agentic:claude-openrouter` | PASS | consistent naming | |

## Fitness Gates

| Gate | Function                     | Result | Evidence | Violations |
| ---- | ---------------------------- | ------ | -------- | ---------- |
| F-1  | File-size lint               | PASS   | largest file 191 lines | none |
| F-2  | Helper-reinvention scan      | PASS   | wraps Deno.serve, Deno.Command, Web APIs | none |
| F-3  | Layering check               | PASS   | policy → adapters → entrypoint; no surface↔surface | none |
| F-4  | Inheritance audit            | N/A    | no classes | — |
| F-5  | Public surface audit         | PASS   | typed exports only: interfaces + 6 functions | none |
| F-6  | JSR publishability gate      | N/A    | internal non-publishable tool | — |
| F-7  | Doc-score gate               | N/A    | internal tool | — |
| F-8  | Workspace `lib` override check | N/A  | no workspace override | — |
| F-9  | Permission declaration check | PASS   | `deno.json` task: `--allow-read --allow-run --allow-env --allow-sys --allow-net=127.0.0.1,api.anthropic.com,openrouter.ai` | none |
| F-10 | Test-shape audit             | PASS   | `*_test.ts` co-located with source | none |
| F-11 | Forbidden-folder lint        | PASS   | no forbidden folders | none |
| F-12 | Naming-convention lint       | PASS   | kebab-case files, camelCase functions | none |
| F-13 | Saga and runtime invariants  | N/A    | — | — |
| F-14 | Console-log lint             | N/A    | Archetype 6 excludes per gate matrix | — |
| F-15 | Re-export-of-upstream lint   | PASS   | `opencode-run.ts` re-exports `parseOpenRouterApiKey` from shared `lib/` (intentional shared primitive) | none |
| F-16 | Folder-cardinality lint      | PASS   | 3 files in `claude/` new, 2 in `lib/` new | none |
| F-17 | Abstract-derived co-location | PASS   | no abstracts | none |
| F-18 | Sub-barrel lint              | PASS   | no sub-barrels | none |
| F-19 | Scoped source gate runners   | PASS   | independently verified above | none |

## Runtime Gates

| Gate     | Validation | Result | Evidence |
| -------- | ---------- | ------ | -------- |
| Focused gateway tests | `deno test --no-lock` 7 gateway tests | PASS | 7 passed, 0 failed |
| Focused launcher tests | `deno test --no-lock` 5 launcher tests | PASS | 5 passed, 0 failed |
| Focused credential tests | `deno test --no-lock` 4 credential tests | PASS | 4 passed, 0 failed |
| Volatile-value guard | `deno test --allow-read` 4 guard tests | PASS | 4 passed, 0 failed |
| Provider/routing regressions | `deno test --no-lock` 37 routing+profile tests | PASS | 37 passed, 0 failed |
| Root task smoke | `deno task agentic:claude-openrouter` | PASS | task declared, rejects missing input with exit 2 |
| Live inference canary | tmux `loopback-deepseek-openrouter` | PASS | `OPENROUTER_CANARY_OK` sentinel returned by DeepSeek; bypass active |
| Remote Control truth | launcher `--remote-control` flag | PASS | throws `unsupported` error; no attachment claim in any doc |

## Consumer Gates

| Consumer     | Validation | Result | Evidence |
| ------------ | ---------- | ------ | -------- |
| Root task `agentic:claude-openrouter` | `deno.json` declaration | PASS | task present with scoped permissions |
| Agentic README | operator docs with examples | PASS | new/resume/fork examples, Remote Control rejection documented |
| Claude-manager skill | `.agents` + `.claude` mirrors | PASS | step 7 added, mirrors identical |
| Harness tooling.md | tool registry row | PASS | `agentic:claude-openrouter` row added |
| PR body | Definition of Done checklist | PASS | 6/8 boxes checked; remaining 2 are this eval + GitHub checks |

## Anti-Pattern Check

| AP    | Status | Evidence | Notes |
| ----- | ------ | -------- | ----- |
| AP-1  | CLEAR  | routing, adapters, launcher, CLI parsing are bounded and separate | |
| AP-2  | N/A    | no base classes | |
| AP-3  | N/A    | no abstracts | |
| AP-4  | N/A    | no inheritance | |
| AP-5  | N/A    | no presentation layer | |
| AP-6  | N/A    | no composition root | |
| AP-7  | N/A    | no pipeline | |
| AP-8  | N/A    | no step | |
| AP-9  | N/A    | no scaffold | |
| AP-10 | N/A    | — | |
| AP-11 | CLEAR  | Deno env/network/process isolated at adapter edges; `defaultLauncherPorts` is the single impure boundary | |
| AP-12 | N/A    | — | |
| AP-13 | N/A    | — | |
| AP-14 | N/A    | — | |
| AP-15 | N/A    | — | |
| AP-16 | N/A    | — | |
| AP-17 | N/A    | — | |
| AP-18 | N/A    | — | |
| AP-19 | CLEAR  | permissions explicitly declared: `read,run,env,sys,net=127.0.0.1,api.anthropic.com,openrouter.ai` | |
| AP-20 | N/A    | — | |
| AP-21 | N/A    | — | |
| AP-22 | N/A    | — | |
| AP-23 | N/A    | — | |
| AP-24 | CLEAR  | typed `MODEL_PATH`, `HOP_BY_HOP_HEADERS`, `OPENROUTER_MODEL_IDS` constants; no switch growth | |
| AP-25 | N/A    | — | |

## Arch-Debt Delta

| Metric                | Count | Evidence |
| --------------------- | ----- | -------- |
| New entries           | 0     | no doctrine violation introduced |
| Resolved entries      | 0     | no existing entry affected |
| Deepened violations   | 0     | — |
| Unrecorded violations | 0     | — |

## Findings

| Severity | Finding | Evidence | Required action |
| -------- | ------- | -------- | --------------- |
| low | First commit `4012964ee` message says "bridge Claude remote control to OpenRouter" (pre-rescope naming) | `git log --oneline` | No action needed — the commit trail preserves historical truth; the second commit `bf5be5501` corrects the classification; PR body and all current docs use "inference-only" |
| low | PR has no closing keyword (`Closes #N`) | PR body: "No issue is auto-closed by this PR" | No action needed — correct per harness rules when no issue is fully resolved |

## Lessons for Promotion

| Lesson    | Pattern     | Applies to     | Confidence |
| --------- | ----------- | -------------- | ---------- |
| Claude Code Remote Control rejects custom `ANTHROPIC_BASE_URL` at daemon startup | Runtime platform constraint discovered through live canary, not docs | Archetype 6 CLI tooling that wraps vendor CLIs | high |
| Split gateway credential isolation pattern (hold key in gateway process, strip from child env) | Security pattern for inference proxy | Any Archetype 6 tool that proxies authenticated API traffic | high |

## Verdict

| Field     | Value |
| --------- | ----- |
| Verdict   | `PASS` |
| Rationale | All applicable gates pass with independent evidence. The implementation satisfies the approved superseding contract: inference-only Claude/OpenRouter launcher with new/resume/fork, forced configured model, bypass permissions, credential isolation, loopback-only gateway, bounded request buffering (16 MiB), streaming response passthrough, deterministic cleanup (signal hooks + gateway close in `finally`), central volatile values, operator docs, and explicit rejection of Remote Control. No mobile attachment claim exists in any doc, skill, or code path. The rescope from Remote Control to inference-only is well-documented, truthful, and tested. `deno.lock` is unchanged. Skill mirrors are identical. No stale task name remains. The live tmux canary shows the exact `OPENROUTER_CANARY_OK` sentinel. Two low-severity findings are informational and require no action. |
