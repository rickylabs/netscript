use harness

## SKILL
- netscript-harness — you are the supervisor-dispatched IMPL-EVAL for CLAUDE-authored docs (route review_claude: Codex · GPT-5.6 Sol · xhigh). EVALUATE ONLY — no fixes, pushes, merges, labels.
- netscript-tools; netscript-cli; rtk

## IMPL-EVAL: PR #798 — beta.10 docs-site refresh (Claude workflow authored)

Read `.llm/harness/evaluator/protocol.md` + `verdict-definitions.md` (repo root of this worktree). Subject: worktree `/home/codex/repos/b10-docs`, branch `docs/beta10-site-refresh` @ 093878e8, base feat/beta10-integration @ d962502f. Diff: `git diff origin/feat/beta10-integration...HEAD`. Issue #796 (via GitHub API, resolveGithubToken in `.llm/tools/agentic/lib/agentic-lib.ts`) is the scope.

Adversarial probes — the generator was an LLM fleet writing docs, so hunt hallucination hard:
1. **Command fidelity**: independently pick 15 command examples across `docs/site/reference/cli/commands.md` and the changed tutorials — DIFFERENT ones than the generator's spot check where possible (its 12 were: config, config override, config runtime, marketplace, generate aspire, contract add-route, deploy kubernetes, deploy azure-aca, deploy cloud-run, plugin sync, service add-handler, ui). Run each against the in-tree CLI (`deno run -A packages/cli/bin/netscript-dev.ts <group> --help`). Any invented verb/flag = blocking (the repo shipped a phantom `plugin add` once; zero tolerance).
2. **Completeness of the new command reference**: derive the top-level command-group list from `--help` yourself; every group must appear in commands.md. Missing groups = blocking.
3. **agent surface**: the `netscript agent mcp` / `agent init` docs and reference/ai/skills.md must match the shipped behavior (agent init writes versioned specifiers — check the doc's claims against `packages/cli/src/public/features/agent/`).
4. **Tutorial rewrites**: for 3 rewritten manual→CLI steps, verify the CLI verb actually does what the removed manual step did (read the verb's implementation or help text).
5. **Gates**: re-run `deno task docs:links`; re-grep changed lines for internal wording (#\d+, eis-chat, harness/evaluator/orchestrator vocabulary) and bare pinnable `jsr:@netscript/*`.
6. **No source touched**: diff must contain zero `packages/`/`plugins/` changes.

Write verdict (PASS/FAIL_FIX/FAIL_RESCOPE/FAIL_DEBT) + numbered findings to `/home/codex/repos/netscript-beta10-cli/.llm/runs/beta10-cli--orchestrator/slices/798-docs-eval/evaluate.md`. Final output: verdict + rationale + findings. Do not modify the subject worktree.
