You are OpenHands running for the NetScript repository.

User task:
Trigger comment:
@openhands-agent model=openrouter/minimax/minimax-m3 output=pr-comment

PLAN-EVAL (harness, separate session). This is a **planning-only** PR. Do NOT implement anything. Evaluate the plan for PLAN-GATE readiness and emit a verdict.

## SKILL

Activate and apply these repo skills before evaluating:
- `.agents/skills/netscript-harness` — run the PLAN-EVAL protocol: read `.llm/harness/evaluator/plan-protocol.md` + `.llm/harness/gates/plan-gate.md`; emit `PASS` or `FAIL_PLAN`; you are a SEPARATE session and must not self-certify.
- `.agents/skills/netscript-doctrine` — archetype/axiom/layering/anti-pattern checks across `@netscript/plugin` (ARCHETYPE-1/4 contract+builder), the 5 `-core` engines (ARCHETYPE-3), and the 5 connectors (ARCHETYPE-5 thin presentation). Verify layering (domain→ports→application→adapters→presentation), A4 (stub-only base), A5 (composition over inheritance), A8 (one reason per file), A11 (name extension axes), the 2-cast limit, no new `any`, folder vocabulary.
- `.agents/skills/jsr-audit` — confirm the planned public surface (new `@netscript/plugin/scaffold`; trimmed `-core` role-named subpaths) is JSR-publishable (no slow types, explicit return types, `@module`/symbol docs planned).
- `.agents/skills/netscript-deno-toolchain` — for dependency/version/`deno doc` surface questions; use `deno doc` to ground-truth the live `@netscript/plugin` export surface.

## What to read

- `.llm/tmp/run/chore-plugin-rearch-v2--184/research.md` (Workflow synthesis, supervisor BASE-TRUTH correction table, per-plugin confirmed smells, #181 coordination, locked Q4-Q7).
- `.llm/tmp/run/chore-plugin-rearch-v2--184/plan.md` (ONE unified architecture, centralization set, greenfield `plugin new` output contract, per-plugin conformance, slice ordering, gates, locked decisions).

## Grade specifically (hard checks a–g)

a. **BASE DIVERGENCE — verify the corrected ground truth.** The plan asserts the synthesizer's "alpha.5 missing ./service/./contract-base/./adapter/./scaffold" alarm was a stale-worktree FALSE ALARM, and that live alpha.16 (`fc911ba1`) ALREADY exports `./contract-base` (`BASE_PLUGIN_CONTRACT_ROUTES`), `./service` (`createPluginService`), `./adapter`, `./protocol`, with ONLY `./scaffold` net-new. **Independently confirm** via `packages/plugin/deno.json` exports + `deno doc` on each subpath. If the plan's base-truth is wrong, FAIL_PLAN. If any export the plan assumes "exists" is actually absent, flag it as a missing slice.

b. **DECISION A — streams = proxy, NO served oRPC contract.** Confirm streams must NOT gain a `contracts/v1`; base-meta (`describe`/health/service-info) is factory-supplied by the `serveRpc:false` proxy in `createPluginService`. Verify the plan does not accidentally require streams to author a contract. Confirm `capabilities.hasRoutes:false` correction is right.

c. **ASPIRE base extension.** Each connector's `aspire.ts` must EXTEND `@netscript/aspire` `AspireNSPluginContribution`, not invent a `@netscript/plugin` aspire-contract. Confirm the base exists and the plan does not duplicate the surface.

d. **A11 / removal hazards.** triggers: confirm the "A11-remove 6 deferred routes" instruction is correctly VOID because #181 lands first and BACKS them (verify the #181↔#184 sequencing is safe given the 4 hot shared contract/port files). streams: confirm the DELETE set (fabricated scaffolder, dead stream-api, CLI, type pass-throughs) leaves no live consumer dangling.

e. **CAST budget.** The plan claims the per-connector `AnyRouter` cast VANISHES once `createPluginService` owns annotated router assembly, and that tightening `definePlugin().build()→PluginManifest` removes the third `as unknown as *PluginManifest` cast. Verify these are achievable with explicit return-type annotations (isolatedDeclarations-safe) and that the ONLY surviving sanctioned cast is the centralized-contract `as unknown as` in each `-core` contract. No new `any`.

f. **GREENFIELD-FIRST ordering.** Confirm `S9 plugin new` is genuinely built BEFORE any conformance slice and that its 5-gate merge bar (arch:check, scoped check/lint/fmt, publish:dry-run both tiers, scaffold.runtime E2E, byte-identical-output guard) actually proves the architecture E2E. Confirm `./scaffold` emits userland glue via typesafe AST/factory codegen — NEVER string templates (D2) — and retires the `.template` skeleton (Q5) without leaving a scaffold path that copies plugin internals.

g. **e2e-cli-prod = HARD gate.** Confirm the plan treats `e2e-cli-prod` (JSR-installed `scaffold.runtime --source jsr`) as a non-negotiable release-acceptance gate (never "expected drift"), and that the slice set cannot land a green local-only result while prod scaffold is red.

Also grade: layering correctness of the `runtime/`→`application/` rename; `-core` public-subpath trim (does any external consumer still need a subpath being made private?); whether `pluginNewSpec` dual-tier lockstep + workspace member wiring is complete; debt scoping (`AUTH-BACKEND-ENV-CENTRALIZATION` Q4 deferral); and whether the unified architecture genuinely folds Unified #164/#166/#167-task/#168 without leaving an orphaned requirement.

## Output

Post a PR comment verdict: `PASS` or `FAIL_PLAN` with specific, actionable findings keyed to slice IDs (S-core-1, S9, S-conform-*, S-verify), decision IDs (A/B/C, D1-D4), and checks (a-g). Do not commit source. Preserve lock hygiene: do not commit `deno.lock` or any source churn.


Issue/PR title: Plugin RE-ARCHITECTURE v2 — unified thin surface + greenfield-first (#184, issue #191)

Operational contract:
- Read AGENTS.md first.
- Your iteration budget is limited. Create deliverable files in the repository
  workspace EARLY and grow them incrementally as you learn; never defer all
  writing to the end of the run. Uncommitted workspace files are committed back
  to the branch automatically when the run ends, even if you run out of budget.
- If the task says "use harness", follow .agents/skills/netscript-harness/SKILL.md.
- If the work touches packages/ or plugins/, use .agents/skills/netscript-doctrine/SKILL.md.
- Use rtk for read-heavy git/grep/gh/docker commands when it is available.
- Preserve user changes and avoid destructive git commands.
- Run the smallest validation that proves the change.
- Do not post GitHub issue or PR comments directly. The workflow owns GitHub comments.
- Write /home/runner/work/_temp/openhands/28472274290-1/summary.md before exit. Include Summary, Changes, Validation,
  Responses to review comments or issue comments when relevant, and Remaining risks.
- Do not write or reuse .llm/tmp/openhands/summary.md. Write only the run-scoped path
  from OPENHANDS_SUMMARY_PATH.
- If output_mode is thread-replies, optionally write /home/runner/work/_temp/openhands/28472274290-1/replies.json as
  an array of {"comment_id": number, "body": string} objects for PR review-thread replies.
- The workflow records durable trace metadata under .llm/tmp/run/openhands/pr-193/run-28472274290-1.

Trigger metadata:
- event: issue_comment
- issue_or_pr: 193
- is_pr: true
- output_mode: pr-comment
- selected_model: openrouter/minimax/minimax-m3
- selected_provider: OPENROUTER
- action_run: https://github.com/rickylabs/netscript/actions/runs/28472274290
