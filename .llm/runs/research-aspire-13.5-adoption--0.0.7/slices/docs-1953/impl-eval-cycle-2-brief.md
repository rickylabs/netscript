# IMPL-EVAL cycle 2 — PR #1953, repair head 07c4a0b93 (bounded re-check only)

You are the separate-session evaluator (NetScript harness, `.llm/harness/evaluator/protocol.md`,
`verdict-definitions.md`). Route: OpenRouter z-ai/glm-5.3-flash, effort xhigh. Fresh detached
worktree at exactly `07c4a0b93`. Read-only against git; do not modify tracked files; write only the
two output files below. You MUST write both files and end with exactly one verdict line.

## Scope
Cycle 1 (head c231fbe5e) returned FAIL_FIX with four findings. The repair commit is
`07c4a0b93` (`git show --stat HEAD` must show ONLY `.agents/skills/aspire-upgrade/SKILL.md`; the PR
diff `git diff --stat 88fc6d69d..HEAD` must still be exactly SKILL.md + `.agents/skills/README.md`).
Judge ONLY whether each finding is resolved. Do not re-audit the rest of the skill.

1. F1 (MEDIUM): carrier chain must read `skills/` -> `gen:assets-barrel` -> `gen:publish-assets` ->
   `check:publish-assets`, with `gen:mcp-export-corpus` excluded. Verify against
   `.llm/tools/generate-cli-assets-barrel.ts` (reads `skills/manifest.json`) and
   `.llm/tools/docs/generate-export-surface-corpus.ts` (`GENERATOR_READ_SET`).
2. F2 (LOW): MCP fixture row says 14 tools **including** `refresh_tools`; cross-check the fixture's
   `tools` array length in `packages/cli/e2e/tests/fixtures/aspire-13.5.3-mcp-recorded.json`.
3. F3 (LOW): the three `.llm/runs/research-aspire-13.5-adoption--0.0.7/{research,plan,drift}.md`
   rows are labelled as branch-scoped run evidence not on `main` (`git ls-files` still empty).
4. F4 (LOW): pin map contains rows for `.github/toolchain.env` and
   `.github/scripts/aspire-nuget-cache-policy.test.ts` (both exist and carry `13.5.3`); the heading
   no longer claims "every place".

Run only: `deno fmt --check .agents/skills/aspire-upgrade/SKILL.md .agents/skills/README.md` and
`deno run --allow-read --allow-env --allow-run .llm/tools/agentic/claude/validate-claude-surface.ts`.
Nothing broader.

## Output
- `.llm/runs/research-aspire-13.5-adoption--0.0.7/slices/docs-1953/evaluate-cycle-2.md` (create dir)
  per `.llm/harness/templates/evaluate.md`: per-finding resolved/unresolved with evidence, one line
  `VERDICT: PASS|FAIL_FIX|FAIL_RESCOPE|FAIL_DEBT`.
- `.llm/tmp/impl-eval-1953-c2-comment.md`: ≤ 30 lines, first line
  `IMPL-EVAL cycle 2 (separate session, OpenRouter z-ai/glm-5.3-flash xhigh) — repair head 07c4a0b93`,
  same verdict line last.
Finish your final message with the single verdict line.
