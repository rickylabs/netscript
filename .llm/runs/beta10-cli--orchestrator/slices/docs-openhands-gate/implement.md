use harness

## SKILL
- netscript-harness; netscript-tools; openhands-handoff (READ ITS SKILL — routing policy, trigger comment format, output modes); netscript-pr; rtk

## Slice: auto-trigger an OpenHands minimax-M3 docs-accuracy eval on every docs-labeled PR (skippable)

Worktree `/home/codex/repos/b10-docsgate`, branch `ci/docs-openhands-gate`, base = current main. PR base: main.

Owner-ratified (2026-07-17): every PR carrying a docs label (`type:docs` or `area:docs`) automatically gets an **OpenHands eval on `openrouter/minimax/minimax-m3`** (open-model lane — verify the exact model id string against `.llm/tools/agentic/config/models.ts` / the openhands-handoff skill; never a closed model). Rationale to encode in the workflow header + doc-audit.md pointer: minimax M3 is one of the most accurate/low-hallucination prose models AND cheap enough to afford QUICK MANUAL TESTING — its role is to actually exercise the docs (run a small scaffold, execute the documented commands, verify outputs), not to read them.

Deliverables:
1. `.github/workflows/docs-openhands-eval.yml`: triggers on pull_request (labeled/opened/synchronize) when `type:docs` OR `area:docs` label present; **skip mechanism**: label `docs-eval:skip` (add it to `.github/labels.yml` with a description) short-circuits the job to an explicit "skipped on demand" summary (never a silent skip — echo who/why into the job summary); posts the OpenHands trigger comment on the PR (the `@openhands-agent model=openrouter/minimax/minimax-m3 output=pr-comment` format from the openhands-handoff skill; dedupe: don't re-post if an identical un-answered trigger comment already exists for the head SHA).
2. The trigger prompt template (in the workflow or a checked-in `.llm/tools/agentic/openhands/docs-eval-prompt.md` it reads): instruct OpenHands to (a) read the PR's changed docs files, (b) QUICKLY hand-test the documented commands — small scaffold where needed, run the exact snippets, compare outputs to the docs' claims, (c) report per-file accuracy verdicts + any hallucinated flag/verb/path as blocking findings, in a single PR comment; keep iteration budget small (cheap-and-quick is the design).
3. One-paragraph addition to `.llm/harness/workflow/doc-audit.md` IF it exists on main by the time you branch (it may still be in PR #805 — if absent, put the paragraph in a new `.llm/harness/workflow/doc-audit-openhands-gate.md` and note the pending consolidation): this OpenHands gate is the CI-level backstop that runs regardless of the agent-level pipeline; skip label is the on-demand escape hatch.
4. Update `.github/labels.yml` (docs-eval:skip) and note the label in the netscript-pr skill source (`.agents/skills/netscript-pr/SKILL.md`) + regenerate the mirror if a sync task exists.

Constraints: OpenHands = open models ONLY (minimax M3 here) — hard-fail the workflow if the model input is ever a closed-model string (cheap guard step). Validate: YAML parse (same structural assertion style used in #787's slice if you can find it), labels.yml schema consistency, `agentic:sync-claude:check` if skill mirrors touched. No new suppressions.

Push explicit refspec `git push origin HEAD:refs/heads/ci/docs-openhands-gate`; DRAFT PR to main titled `ci(docs): auto OpenHands minimax-M3 accuracy eval for docs-labeled PRs (skippable)`, body with rationale + trigger/skip semantics + validation, labels `type:feature, area:tooling, gate:ci, priority:p1, status:impl-eval`, milestone 13. Use resolveGithubToken, fallback ~/.config/gh/hosts.yml oauth_token. Do NOT dispatch evals; do not merge.
