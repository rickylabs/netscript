# PLAN-EVAL — fix-opencode-mcp-resume-boundaries--w1-c

- Plan evaluator session: Minimax M3 high (this local `formal_plan_evaluation` route on `claude-openrouter` / `claude-print`)
- Run: `fix-opencode-mcp-resume-boundaries--w1-c`
- Surface / archetype: N/A — internal agentic OpenCode tooling under `.llm/tools/agentic/`, not a published `packages/**` or `plugins/**` surface
- Scope overlays: none
- Date: 2026-08-07
- Verdict target: `PASS` or `FAIL_PLAN` (exactly one)

## Spot-checks at exact HEAD

| Claim | Verified evidence | Result |
| --- | --- | --- |
| HEAD is the locked S0 commit `c9a152277` on `fix/opencode-mcp-resume-boundaries`; worktree clean; `origin/main` at `1455231b0` | `git rev-parse HEAD`, `git status`, `git log --oneline -5` | confirms |
| `deno.lock` SHA-256 is `d32ef0c1f2b9256e05cf7339c452bd8cf6addeb9a4b433d38abcee992651b529` | `sha256sum deno.lock` | matches research |
| OpenCode pinned version `1.17.20` (single source) | `.llm/tools/agentic/config/versions.ts:68` | confirms |
| Exactly one OpenCode lane in `CANONICAL_ROUTE_POLICY` — `adversarial_design_eval` (agent=opencode, provider=openrouter, model=`OPENCODE_MODEL_IDS.visionEval`, effort=high) | `.llm/tools/agentic/runtime/routing-policy.ts:193-200`; grep yields 1 match | confirms |
| `OPENCODE_MODEL_IDS.visionEval === 'openrouter/moonshotai/kimi-k2.6'` | `.llm/tools/agentic/config/models.ts:81` | confirms |
| `init-agent.ts` writes Claude-style `mcpServers` entries with `{command, args}` for `netscript` and `aspire` (not OpenCode `mcp.<name>`) | `packages/cli/src/public/features/agent/init/init-agent.ts:114-122, 226-272` | confirms |
| `opencode-run.ts` does NOT translate or overlay `.mcp.json`; no `--session`, no MCP preflight; `openCodeChildEnvironment` only injects OpenRouter auth | `.llm/tools/agentic/opencode/opencode-run.ts:33-78` | confirms |
| `hybrid-opencode-adapter.ts` uses `clearEnv: true` and allow-lists `OPENCODE_CONFIG` in `HYBRID_WORKER_ENVIRONMENT_NAMES`; therefore the plan must reuse the shared preparation contract without broadening credential inheritance | `.llm/tools/agentic/claude/hybrid-opencode-adapter.ts:32-66, 128-139` | confirms |
| `no-hardcoded-volatile_test.ts` derives the forbidden set from `config/models.ts` + `config/versions.ts` + `config/endpoints.ts` (Layer A) plus structural shapes (Layer B); the plan's D8 keeps the live route matrix derived, not duplicated | `.llm/tools/agentic/config/no-hardcoded-volatile_test.ts:34-56` | confirms |
| No fixture for malformed/colliding configs, interrupted text, tool-only turns, empty deltas, reasoning-only events, provider switch, repeated resume, or unsafe normalization | grep across `opencode-run_test.ts` (6 tests), `opencode-web_test.ts` (4 tests), `hybrid-opencode-adapter_test.ts` (9 tests) shows argv/port/worker-failure coverage only | confirms |

Every load-bearing claim in the plan verifies at exact HEAD. Nothing was paraphrased from
carried-in preparation material that has since drifted.

## Checklist results

| Plan-Gate item | Result | Evidence / location |
| --- | --- | --- |
| Research present and current | PASS | `research.md` exists; carried-in artifacts explicitly re-baselined against `origin/main@1455231b0` on 2026-08-07; drift recorded in `research.md` § "Re-baseline" and `drift.md` 2026-08-07 entry. Spot-checks above confirm exact HEAD. |
| Decisions locked | PASS | `plan.md` "Locked Decisions" table D1–D8 each cites rationale; D3 (config precedence), D4 (pre-dispatch hook), D5 (signed reasoning/tool semantics), D6 (telemetry privacy), D7 (preflight), D8 (derived route matrix) are the material decisions and all are locked. |
| Open-decision sweep | PASS | `plan.md` "Open-Decision Sweep" table closes empty-fragment rule, MCP collision precedence, and preflight transport now; OpenCode V2 API migration is marked "safe to defer" with a binding trigger (pinned version must change). The evaluator-run sweep below finds no further deferred-open decision. |
| Commit slices (< 30, gate + files each) | PASS | S0–S3 = 4 slices; each lists proving gate and files in `plan.md` "Commit Slices" and `worklog.md` "Commit Slices" tables. |
| Risk register | PASS | `plan.md` "Risk Register" lists 7 risks with concrete mitigations (hook shape → fixture/type tests; JSONC reparse → never parse external `OPENCODE_CONFIG`; secret leakage → closed receipt schema; tool semantics → preserve parts/order; resource leak → loopback + bounded timeout + `finally` cleanup; preflight passing on names → connected status + prefixed tool ids + real docs lookup; provider route drift → query canonical policy at exact head). |
| Gate set selected | PASS | `plan.md` "Fitness and Validation Gates" selects 12 gates from the imperative matrix (focused tests, agentic exact-head suite, scoped check/lint/fmt, volatile-config guard, docs, live MCP, live resume route matrix, exact-head/lock, independent IMPL-EVAL, review threads/CI). Archetype is N/A — internal `.llm/tools/agentic` infrastructure; package/Archetype 6 gates do not apply (research § "jsr-audit surface scan"). |
| Deferred scope explicit | PASS | `plan.md` "Non-Scope" + "Hidden Scope" + `worklog.md` "Deferred Scope" enumerate: no `agent init` change, no model/route literals outside config, no upstream OpenCode mutation, no package/plugin surface, no scaffold/publish/Billing Run/canary; OpenCode V2 plugin migration, generic host-neutral `.mcp.json` translation, and Release/Billing Run are explicitly deferred. |
| jsr-audit (package/plugin waves) | N/A | `research.md` § "jsr-audit surface scan": "N/A: no published package/plugin export, dependency, version, or JSR surface is changed." Confirmed by path enumeration — the run touches only `.llm/tools/agentic/**` and the run directory. |

## Open-decision sweep (evaluator-run)

The plan's sweep is complete. I independently re-ran it and surfaced only one substantive question,
and the plan resolves it: how the live acceptance feeds the route matrix in `gate 9` interacts with
the fact that `CANONICAL_ROUTE_POLICY` currently contains exactly **one** OpenCode lane. The plan
correctly binds the matrix to "every current OpenCode policy row" (D8), not a fixed N — so as long
as the matrix is queried at exact head immediately before live reuse, the gate is well-defined even
at N=1 today. No further decision is open and deferred.

No unchecked Plan-Gate box. No decision the plan leaves open that would force rework when deferred.

## Configuration / boundary observations

- **Config precedence/collision isolation (D3).** The plan overlays a narrow `OPENCODE_CONFIG_CONTENT`
  segment that narrows to MCP entries and the boundary plugin. OpenCode 1.17.20's merge order
  (`OPENCODE_CONFIG` → project config → `OPENCODE_CONFIG_CONTENT`) means project/server names win
  per-name collisions and unrelated inherited settings (provider, model, permission, credentials)
  survive. The decision correctly avoids parsing or rewriting any external `OPENCODE_CONFIG`,
  which removes the JSONC reparse risk. The hybrid workers reuse `openCodeChildEnvironment` /
  `hybridWorkerEnvironment` and add nothing to the credential surface — `OPENCODE_CONFIG` and
  `OPENROUTER_API_KEY` are explicit allow-list members; nothing new enters the environment.
- **Signed reasoning / tool-order safety (D5).** The seam is the experimental transform hook,
  *before* `MessageV2.toModelMessagesEffect`. The plan preserves every tool part/object and array
  position, drops only empty unsigned text/reasoning, and treats empty fragments adjacent to signed
  reasoning as unsafe — failing closed with **local event id only**. This is the narrowest fix that
  preserves provider signatures and tool-call semantics, and never mutates stored session history.
- **Fail-closed preflight (D7).** The preflight uses a loopback OpenCode server, requires connected
  status plus exact prefixed tool ids, and executes one harmless NetScript docs lookup through the
  `opencode debug agent <agent> --tool <id> --params <json>` seam. Available-tool count and
  MCP call count are tracked as separate facts. This proves attachment and use independently of
  model compliance, with cleanup in `finally` and no foreign-resource cleanup.
- **Privacy-safe telemetry (D6).** Receipt schema records ids, counts, category, and reason codes
  only. The plan explicitly forbids prompts, message bodies, tool input/output, secrets, config, or
  paths. The history seam (`OpenCodeStoredMessage`, `OpenCodeStoredPart`) and the preflight receipt
  (`OpenCodePreflightReceipt`) are modelled as the only outbound shapes — bounded and structural.
- **Live route matrix is derived (D8).** Acceptance queries `CANONICAL_ROUTE_POLICY` at exact head
  immediately before the live matrix run and records requested/observed identity. No route or model
  id is restated in launcher-local code, which keeps the `no-hardcoded-volatile_test.ts` Layer A
  guard valid and avoids the duplication trap. This is the right design.

## Slice and gate soundness

- **S0** is gated by this PLAN-EVAL. No source code is touched. ✓
- **S1** writes only `.llm/tools/agentic/opencode/**`, hybrid adapter/tests, `deno.json`, agentic
  README, and run artifacts. All gates are present (focused matrix, scoped wrappers, agentic suite,
  format). ✓
- **S2** writes the OpenCode boundary plugin/run/tests + README + run artifacts. The same gates
  apply, plus the volatile-config guard. ✓
- **S3** is purely live acceptance + evaluator evidence unless a current-head failure requires a
  reviewed source fix. ✓

## Verdict

`PASS`

## Notes

- This is the conditional Minimax PLAN-EVAL per the live owner decision (2026-08-06). The plan is
  decision-heavy (config precedence, signed-reasoning safety, telemetry privacy, preflight fail-closed)
  and adversarial sweep is genuinely useful here, so the conditional invocation is justified.
- The carried-in run was re-baselined against `origin/main@1455231b0` (lock hash `d32ef0c1…`) and the
  live owner prompt; the `drift.md` entry is consistent with `research.md` § "Re-baseline."
- Live-eval invitations: implementation may begin against `fix/opencode-mcp-resume-boundaries` at
  `c9a152277`; the live `origin/main` and `deno.lock` baselines are now the responsibility of
  IMPL-EVAL and S3's exact-head/lock gate (#10).
