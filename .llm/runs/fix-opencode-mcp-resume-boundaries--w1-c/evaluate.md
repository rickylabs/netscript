# Evaluation: OpenCode MCP attachment and provider-valid resume

IMPL-EVAL (final pass, separate DeepSeek V4 Flash 0731 / max lane on `claude-openrouter` transport).
Evaluated implementation commit `219814909a23f9af56c4c392d6ef88c5c5133490` based exactly on
`1455231b0b7700c515e6226538cb12ec251f943c`. Assessed at exact HEAD `c0bbb0863` after the eval brief
commit. Worktree clean; remote branch tip == local HEAD.

## Metadata

| Field          | Value                                                        |
| -------------- | ------------------------------------------------------------ |
| Run ID         | `fix-opencode-mcp-resume-boundaries--w1-c`                    |
| Target         | internal agentic OpenCode tooling under `.llm/tools/agentic/opencode` + hybrid adapter |
| Archetype      | N/A — internal harness infrastructure, not a published `packages/**`/`plugins/**` surface |
| Scope overlays | none                                                         |
| Evaluator      | deepseek/deepseek-v4-flash-0731 (max) / 2026-08-07           |

## Process Verification

| Check                                  | Result | Evidence                                                    |
| -------------------------------------- | ------ | ----------------------------------------------------------- |
| Plan-Gate passed before implementation | PASS   | `plan-eval.md` verdict `PASS` (Minimax M3 high, session `f7af5fb2-…`); PR `[PHASE: PLAN-EVAL] — PASS` comment; recorded before source work in `worklog.md` time log |
| Design section exists in worklog       | PASS   | `worklog.md` `## Design`: Public Surface / Domain Vocabulary / Ports / Constants / Commit Slices / Deferred Scope / Contributor Path |
| Commit slices match design plan        | PASS   | S0 `c9a152277`, PLAN-EVAL `bf36fc75b`, S1/S2 impl `219814909`, S3 evidence in same commit + run dir; 4 slices match plan S0–S3 |
| Each slice has a passing gate          | PASS   | S0: PLAN-EVAL PASS. S1/S2: focused 40 (re-run: 40 pass), suite 455 (re-run: 455 pass), scoped check/lint/fmt 161 files 0 findings. S3: live receipts + exact-head/lock |
| No speculative seams (unused files)    | PASS   | New files all reachable: `opencode-project-config.ts` ← run/preflight/hybrid-adapter; `opencode-preflight.ts` ← run; `opencode-boundary-plugin.ts` ← runtime plugin via overlay `plugin` file-URL + tested; each has a dedicated test |
| Constants used for finite vocabularies | PASS   | `DiscoverySource` union, reason codes, server/source constants; server names `netscript`/`aspire` are acceptance constants (plan), not provider policy |

## Static Gates

| Gate             | Command or check | Result | Evidence |
| ---------------- | ---------------- | ------ | -------- |
| Narrow typecheck | `deno run .llm/tools/run-deno-check.ts --root .llm/tools/agentic --ext ts,tsx` | PASS | 161 files, 2 batches, 0 failed, 0 findings |
| Slice typecheck  | `deno check --unstable-kv` (new files) | PASS | covered by scoped check; 0 findings |
| Format           | `deno run .llm/tools/run-deno-fmt.ts --root .llm/tools/agentic --ext ts,tsx` | PASS | 161 files, 0 findings |
| Lint             | `deno run .llm/tools/run-deno-lint.ts --root .llm/tools/agentic --ext ts,tsx` | PASS | 161 files, 0 rules hit, 0 findings |
| Doc lint         | N/A | N/A  | no package/public export surface changed (internal tooling) |
| Publish dry-run  | N/A | N/A  | no package/plugin surface; only `.llm/tools/**` and run dir |
| Link/path check  | docs link gate (recorded) | PASS | `worklog.md`: 102 docs, 0 broken links/anchors/orphans |

## Fitness Gates

Applicability note: this run owns no `packages/**`/`plugins/**` source, so doctrine/package fitness
gates (F-6 JSR publishability, F-7 doc-score, F-8 lib override, F-19 package scoped runners, publish)
are N/A. Code-quality anti-pattern scan replaced the package gates.

| Gate | Function | Result | Evidence |
| ---- | -------- | ------ | -------- |
| F-1  | File-size lint | N/A | internal tooling; no package gate required |
| F-2  | Helper-reinvention scan | CLEAR | uses `@std/assert`/`@std/path`/`node:path`/`node:url`/fetch/AbortSignal; no reinvented helpers |
| F-3  | Layering check | N/A | internal tooling not in package layering scope |
| F-4  | Inheritance audit | N/A | no class-inheritance surface introduced |
| F-5  | Public surface audit | CLEAR | no public API added; internal-only modules + `_test.ts` |
| F-6  | JSR publishability gate | N/A | no JSR/npm surface changed (truthful classification) |
| F-7  | Doc-score gate | N/A | not a published doc surface |
| F-8  | Workspace `lib` override check | N/A | no package `deno.json` member changed |
| F-9  | Permission declaration check | CLEAR | `deno.json` `agentic:opencode` task: +`--allow-write`, +`--allow-net=127.0.0.1` only (loopback `LOOPBACK_HOST`); write needed for receipt/`mkdir`; net scoped to loopback |
| F-10 | Test-shape audit | PASS | every production concern has a test (project-config 7, preflight 3, boundary 10, run +1, hybrid adapter +1) |
| F-11 | Forbidden-folder lint | N/A | internal tooling |
| F-12 | Naming-convention lint | PASS | scoped lint 0 findings |
| F-13 | Saga and runtime invariants | N/A | no saga runtime |
| F-14 | Console-log lint | PASS | scoped lint 0 findings; `console.error` only on main error path |
| F-15 | Re-export-of-upstream lint | N/A | no upstream re-export added |
| F-16 | Folder-cardinality lint | N/A | one folder, one concern |
| F-17 | Abstract-derived co-location lint | N/A | no abstract base |
| F-18 | Sub-barrel lint | N/A | no barrel added |
| F-19 | Scoped source gate runners | N/A | package scoped runners not applicable |

## Runtime Gates

| Gate     | Validation | Result | Evidence |
| -------- | ---------- | ------ | -------- |
| Focused matrix | `deno test --no-lock -A .llm/tools/agentic/opencode .llm/tools/agentic/claude/hybrid-opencode-adapter_test.ts` | PASS (re-run) | 40 passed / 0 failed |
| Agentic exact-head suite | `deno test --no-lock -A .llm/tools/agentic/` | PASS (re-run) | 455 passed / 0 failed |
| Volatile-config guard | `deno test --no-lock -A .llm/tools/agentic/config/no-hardcoded-volatile_test.ts` | PASS (re-run) | 4 passed / 0 failed (Layer A + B) |
| Live MCP preflight + product | recorded + `live-receipt.jsonl` lines 1–3 | PASS | 2/2 servers connected; preflight call 1 + product call 1; launcher exit 0; session `ses_023871aaeffehRNSqFc3I43Fvc` |
| Live OpenRouter/OpenCode resume | recorded + `live-receipt.jsonl` line 4 | PASS | 1/1 current policy row (`adversarial_design_eval`, `openrouter/moonshotai/kimi-k2.6`) → `RESUME_OK`, exit 0, event `msg_fdc79062…` `provider_valid` |
| Resource hygiene | `leak-report.md`, `run-resources.json` | PASS | no run-owned container/appHost survivor; all listed foreign/unproven and untouched; run-owned root `.llm/tmp/w1-c-live` only |

## Consumer Gates

| Consumer               | Validation | Result | Evidence |
| ---------------------- | ---------- | ------ | -------- |
| Hybrid isolated worker | `hybrid-opencode-adapter_test.ts` + test | PASS | worker receives project MCP overlay; `ANTHROPIC_API_KEY` does not cross; `OPENROUTER_API_KEY` retained; `projectBoundary=cwd` bounds discovery |
| Canonical launcher CLI | `opencode-run_test.ts`, README | PASS | `--session`, `--require-mcp`/`--receipt` fail-closed pair; argv order session-before-format |
| Generated `.mcp.json` consumer | `opencode-project-config_test.ts` | PASS | nearest-project deterministic discovery, malformed fail-closed, isolation preserved |
| `deno.json` task | scoped task diff | PASS | only additive permissions (`--allow-write`, loopback `--allow-net=127.0.0.1`) on `agentic:opencode` |

## Anti-Pattern Check

Scope note: the run is internal agentic TypeScript tooling — no `packages/**`/`plugins/**` source.
Package anti-pattern codes are N/A; where a pattern could apply to tooling it is marked accordingly.
A direct code-quality scan (replacing `quality:scan` for a non-package surface) found none of the
#745-violation classes.

| AP    | Status         | Evidence |
| ----- | -------------- | -------- |
| any / `as unknown as` / `as any` | CLEAR | grep over changed source: 0 matches |
| `// deno-lint-ignore` / `no-explicit-any` | CLEAR | grep: 0 matches; scoped lint 0 findings |
| host-side hardcoded plugin-name coupling | CLEAR | grep (`=== 'auth'`, etc.): 0 matches; only `netscript`/`aspire`/`search_docs` acceptance constants |
| launcher-local volatile model/provider/endpoint/version | CLEAR | new files import `OPENCODE_TOOL` (versions), `LOOPBACK_*` (endpoints), `OPENCODE_MODEL_IDS` (models); grep for `openrouter/…`/`kimi`/`1.17.` = 0 in changed source; only pre-existing dynamic `` `openrouter/${request.model}` `` |
| speculative seams (folder-template-only files) | CLEAR | every new file is reached from a public path or a test (see Process verification) |
| no-op / dead branches | CLEAR | plugin module exposes only `default` at runtime (asserted); all branches tested |

Remaining `AP-*` codes (package doctrine AP-1…AP-25 beyond the above) — N/A: no package/plugin surface
was touched, so package doctrine anti-patterns are out of scope.

## Arch-Debt Delta

| Metric                | Count | Evidence |
| --------------------- | ----- | -------- |
| New entries           | 0     | plan/PR `## Drift / debt`: "Architecture debt: none"; no `arch-debt.md` delta |
| Resolved entries      | 0     | none claimed |
| Deepened violations   | 0     | none |
| Unrecorded violations | 0     | independent scan found none (see anti-patterns) |

## Findings

| Severity | Finding | Evidence | Required action |
| -------- | ------- | -------- | --------------- |
| low | PLAN-EVAL phase comment posted as `## PLAN-EVAL — PASS` rather than the strict `[PHASE: PLAN-EVAL] [VERDICT: APPROVED]` token line; the verdict is nevertheless durably recorded in `plan-eval.md` and the PR | PR #1344 comment; `plan-eval.md` | none — cosmetic; informational |

No high or medium findings. No `FAIL_FIX` / `FAIL_RESCOPE` / `FAIL_DEBT` trigger was found.

## Independent verification of load-bearing contracts

- **Deterministic nearest-project MCP discovery, malformed/collision fail-closed, isolation
  preservation.** Verified in `opencode-project-config.ts`: nearest-`.mcp.json` walk stops at
  project/git boundary or explicit `projectBoundary`; malformed JSON throws; strict translation
  rejects unsafe names / non-stdio / empty command / bad args/env/disabled; `mergeOpenCodeInlineConfig`
  preserves `provider`/`model`/`permission`/plugin and lets project MCP names win same-name
  collisions; external `OPENCODE_CONFIG` is never parsed. Tests: `opencode-project-config_test.ts`.
- **Measured-run preflight barrier, expected-server attachment, one harmless docs lookup before
  product work, fail-closed, source-class telemetry privacy.** Verified in `opencode-preflight.ts` +
  boundary plugin: loopback-only host, connected-status + host catalog + exactly-one
  `netscript_search_docs` MCP call (proved from the discovery receipt) before the product prompt;
  any failure throws before product work; `--require-mcp` requires `--receipt`. Receipts carry only
  bounded ids/counts/category/reason — no prompt, body, tool I/O, path, config, or secret.
  Available-tool count is separate from expected-tool and MCP-call counts (`live-receipt.jsonl` l.2:
  `availableToolCount:14` / `expectedToolCount:2` / `mcpCallCount:1`).
- **Provider-facing normalization before every dispatch; tool/result ordering and identity;
  interrupted/tool-only/empty/reasoning/provider-switch/repeated-resume matrices; idempotence;
  safe local identity on unsafe transform.** Verified in `opencode-boundary-plugin.ts` +
  `opencode-boundary-plugin_test.ts`: the pinned `experimental.chat.messages.transform` hook runs
  pre-conversion; tool parts/order/object identity preserved; matrices all covered; repeated
  normalization returns `[]` (idempotent); signed-reasoning adjacency throws with only the bounded
  local event id (`evt-safe_42`) and reason code, never content.
- **Real OpenCode MCP receipt and real same-session OpenRouter resume across every OpenCode row
  derived from checked-in policy.** Verified: `live-receipt.jsonl` (2 discovery + 1 preflight + 1
  history-validation rows) + `live-acceptance.md` session `ses_023871aaeffehRNSqFc3I43Fvc`;
  `CANONICAL_ROUTE_POLICY` contains exactly one OpenCode lane (`adversarial_design_eval`,
  `openrouter/moonshotai/kimi-k2.6`) — 1/1 rows, D8 derived (not duplicating policy).
- **No launcher-local volatile policy; no speculative seams; truthful N/A package/JSR/scaffold
  classification; byte-identical `deno.lock`.** Verified: config authorities read from
  `config/{models,versions,endpoints}.ts` + `runtime/routing-policy.ts`; all new files used/tested;
  N/A classification accurate (only `.llm/tools/**` + run dir changed); `sha256sum deno.lock` =
  `d32ef0c1f2b9256e05cf7339c452bd8cf6addeb9a4b433d38abcee992651b529` (byte-identical to baseline).

## Close-gate / PR-state note

PR #1344 is **draft**, labelled `type:fix` / `area:tooling` / `area:agentic` / `priority:p0` /
`status:impl-eval`, milestone `0.0.5`. Body carries exactly the closing keywords `Closes #1324` and
`Closes #1330` and the full `## Definition of Done`. The two remaining unchecked DoD boxes
(I separate IMPL-EVAL PASS; review-thread gate + current-head CI) are legitimately pending this
IMPL-EVAL and the S4 coordination that follows — the PR is not yet `status:ready-merge`, so the
close-gate has not been triggered. Every live acceptance row for both #1324 (6 rows) and #1330
(6 rows) now maps to a committed receipt or test, so the evidence-mirroring during the ready-merge
transition has valid source material. Milestone orchestrator retains ready/merge/release authority.

## Lessons for Promotion

| Lesson | Pattern | Applies to | Confidence |
| ------ | ------- | ---------- | ---------- |
| Prefer a pre-dispatch provider-visible transform over destructive storage/database rewriting for host-boundary history normalization | provider-boundary seam | agentic host adapters | high |
| Use a loopback-only preflight that proves attachment by a real bounded tool call rather than by registry enumeration when the host appends MCP tools only at dispatch | fail-closed measured-run preflight | agentic tooling | high |
| Keep available-tool count, expected-tool count, and actual tool-call count as distinct telemetry facts | measurement hygiene | agentic tooling | high |

## Verdict

| Field     | Value |
| --------- | ----- |
| Verdict   | `PASS` |
| Rationale | The approved plan (D1–D8) is fully implemented and independently verified. PLAN-EVAL returned PASS before source work; `worklog.md` Design checkpoint exists and S0–S3 match it; the commit trail is present and each slice has a passing gate. Static gates pass (scoped check/lint/fmt 161 files, 0 findings), the focused matrix, full 455-test agentic suite, and volatile-config guard all pass (independently re-run), live MCP and real same-session OpenRouter resume are evidenced in committed receipts, the root `deno.lock` is byte-identical to baseline, no launcher-local volatile policy and no speculative seams were found, N/A package/JSR/scaffold classification is truthful, and no unrecorded architecture debt was introduced. The close-gate is not yet triggered (draft, `status:impl-eval`), and every #1324/#1330 acceptance row has committed evidence for the later ready-merge transition. One low, non-blocking observation only (PLAN-EVAL comment token-format deviation). |
