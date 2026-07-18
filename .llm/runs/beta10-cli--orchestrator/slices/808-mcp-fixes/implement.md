use harness

## SKILL
- netscript-harness; netscript-doctrine (packages/mcp is Archetype 6 — thin router; adapters live in infrastructure); netscript-cli; netscript-tools; aspire; netscript-deno-toolchain; netscript-pr; rtk

## Slice: fix #808 — the three @netscript/mcp live-validation release blockers

Worktree `/home/codex/repos/b10-808`, branch `fix/808-mcp-live-defects`, base = current main. PR base: main.

READ FIRST: issue #808 (GitHub API; resolveGithubToken in `.llm/tools/agentic/lib/agentic-lib.ts`, fallback ~/.config/gh/hosts.yml oauth_token) and the full validation report at `/home/codex/repos/netscript-beta10-cli/.llm/runs/beta10-cli--orchestrator/slices/mcp-live-validation/report.md` — it contains the exact live request/response evidence, including the raw Dashboard response shape (`{data:{resourceSpans:[…]},totalCount,returnedCount}`) the adapter fails to parse.

Fix at the owning layers:
1. **Telemetry adapter** (packages/mcp infrastructure): parse the live Aspire Dashboard (13.4.6) response shape. Root-cause WHY the current normalization drops everything (envelope key? nesting? casing?) and state it in the PR. Regenerate the test fixtures FROM a live capture (stand up the scaffold like the validator did: `deno task e2e:cli run scaffold.runtime --format pretty` without cleanup, restart the AppHost via aspire if needed, curl the real endpoints, save as fixtures) — the durable fix is fixtures that cannot silently diverge from reality; add a comment in the fixture file naming its capture provenance (date, aspire version, endpoint).
2. **doctor output contract**: the live check count exceeds `$.checks` max 20. Decide deliberately: aggregate related checks, paginate, or raise the cap with rationale — the tool must NEVER emit output its own schema rejects; add a regression that runs the real doctor flow output through the schema.
3. **Docs default composition**: make list_docs/search_docs/get_doc usable in a scaffolded project — recommended shape: default the corpus to the docs shipped with the installed package (or an embedded index) with `--docs-root` as override; whatever you choose, an empty corpus must be an EXPLICIT, non-silent state in tool responses ("docs corpus not found at <path>; pass --docs-root"), never bare zeros. Keep Archetype-6 layering (arch:check).
4. Regression-guard the paths that passed: execute_command allowlist both directions, list_commands, initialize/tools-list 13 names.

Gates: `deno task quality:scan` + `deno task arch:check` + scoped wrappers over packages/mcp (+ any touched cli composition); focused mcp suites; then **your own live re-validation**: rerun the validator's flow (scaffold up, trigger a job, drive all 13 tools over stdio) and paste per-tool PASS evidence into the PR body — the acceptance is all 13 PASS live, not fixtures-green. Full `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` at the end (cleanup ON).

Constraints: no new suppressions; commit by defect; push explicit refspec `git push origin HEAD:refs/heads/fix/808-mcp-live-defects`; DRAFT PR to main with `Closes #808`, labels `type:fix, area:tooling, priority:p0, status:impl-eval`, milestone 12. Do NOT dispatch evals; do not merge.
