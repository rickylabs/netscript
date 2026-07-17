use harness

# Umbrella IMPL-EVAL — NetScript agentic combo (epic #721, PR #715)

## SKILL

Read: `.agents/skills/netscript-doctrine/SKILL.md`, `.agents/skills/netscript-tools/SKILL.md`,
`.agents/skills/jsr-audit/SKILL.md`, `.agents/skills/rtk/SKILL.md`.

## Identity — YOU ARE AN EVALUATOR (separate session)

- WSL Codex EVALUATOR session. Worktree (ABSOLUTE): `/home/codex/repos/ns-combo-eval`. Branch
  `eval/netscript-mcp-skills-umbrella` at the umbrella tip.
- **You EVALUATE ONLY. Do NOT modify source, do NOT fix, do NOT commit to any packages/ or
  plugins/ file.** You may only WRITE your verdict artifact at
  `/home/codex/repos/ns-combo-eval/.llm/runs/mcp-skills--orchestrator/umbrella-eval/verdict.md`
  and commit + push THAT file only on branch `eval/netscript-mcp-skills-umbrella`.
- #306 invariant: you are a different session from every slice generator. Preserve it — no
  generation.
- **Preflight**: `git -C /home/codex/repos/ns-combo-eval log --oneline -1` should show
  `0f280378` (or a descendant); `packages/mcp/mod.ts` and
  `packages/cli/src/public/features/agent/agent-group.ts` must exist. If not, STOP and report.

## What this PR delivers (context)

`@netscript/mcp` (new Archetype-6 package, 13 MCP tools: get_app_status, list_runs, get_run,
get_recent_errors, get_last_job_result, analyze_service_performance, analyze_db_bottlenecks,
doctor, search_docs, list_docs, get_doc, list_commands, execute_command), the `netscript agent
mcp|init` CLI group, the public `skills/` bundle, and `docs/site/capabilities/agent-tooling.md`.
Design + per-slice evidence: `.llm/runs/mcp-skills--orchestrator/` (design.md, s1–s9,
quality-gate-745.md).

## Evaluate (run the commands; record real output in verdict.md)

1. **Doctrine fit** — `@netscript/mcp` Archetype-6 layering: `src/presentation/` contains NO fs,
   process spawn, or network calls (parse-only); no `utils/helpers/common/lib` folders; layering
   domain→application→infrastructure respected. Run `deno task arch:check` and record FAIL count
   (must be 0 for packages/mcp). Run `deno task doc:lint --root packages/mcp --pretty` (0 errors).
2. **Wrap-not-reimplement** — read the flow files: MCP read tools call `TelemetryQueryPort` +
   injected ports (`ProjectDoctorPort`, command catalog) rather than scraping stdout;
   `execute_command` uses the deny-wins allowlist policy; `list_commands` enumerates the registry.
   Confirm no reimplementation of CLI logic inside packages/mcp.
3. **`netscript.*` correctness** — `telemetry-aggregation.ts` imports attribute constants from
   `@netscript/telemetry/attributes` for value reads; domain classification uses a
   namespace-prefix table; grep for hardcoded `'netscript.` attribute string literals in
   non-test src (should be limited to the prefix table / documented).
4. **#745 code-quality gate** — run `deno task quality:gate`; confirm `quality:scan` 0 findings
   and `arch:check` exit 0. Independently grep the diff-owned files for `Command<any`,
   `as unknown as`, `as any`, and host-side plugin-name branching (`.name === '`, `kind === '`)
   in packages/mcp + packages/cli/src/public/features/agent — must be none.
5. **Public-docs law** — `grep -rInE "eis|VIF|CSB|PR #|dogfood|harness|OpenHands|Codex|Tier-"
   skills/ docs/site/capabilities/agent-tooling.md` → must be empty.
6. **Runtime proof** — run and record:
   - `deno test --no-lock --allow-all packages/cli/e2e/tests/agent/agent-mcp-stdio_test.ts`
   - `deno test --no-lock --allow-env --allow-net --allow-run --allow-read packages/mcp/tests/`
   - `deno test --no-lock --allow-env --allow-net --allow-run --allow-read --allow-write
     packages/cli/src/public/features/agent/`

## Verdict artifact

Write `verdict.md` with: a per-criterion table (1–6) with PASS/FAIL + pasted evidence, a findings
list (each `file:line` + required fix) if any, and a final line
`[PHASE: IMPL-EVAL] [VERDICT: PASS|CHANGES_REQUESTED]`. PASS only if all six hold. Commit + push
ONLY that file:
`git -C /home/codex/repos/ns-combo-eval add .llm/runs/mcp-skills--orchestrator/umbrella-eval/verdict.md && git -C /home/codex/repos/ns-combo-eval commit -m "eval(mcp): umbrella IMPL-EVAL verdict" && git -C /home/codex/repos/ns-combo-eval push origin HEAD:refs/heads/eval/netscript-mcp-skills-umbrella`.
Final message: the verdict + one-line rationale.
