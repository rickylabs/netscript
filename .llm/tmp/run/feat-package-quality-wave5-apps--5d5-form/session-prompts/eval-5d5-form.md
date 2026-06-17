use harness, you are the separate IMPL-EVAL evaluator for NetScript Wave 5d5 form.

Run only from this native WSL ext4 worktree:
/home/codex/repos/netscript-wave5-apps-5d5-form

Branch:
feat/package-quality-wave5-apps-5d5-form

PR:
https://github.com/rickylabs/netscript/pull/38

Critical protocol:
- You are the evaluator, not the implementation agent.
- Keep evaluation separate from implementation. Do not self-certify by trusting the worklog alone.
- Read AGENTS.md, the harness workflow/evaluator protocol, and the 5d5 run artifacts before judging.
- Do not run full CLI E2E here. Reserve `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` for supervisor merge-readiness/full CLI E2E.
- Do not delete lock files or caches. Do not run `deno cache --reload`.
- If you discover source changes are required, stop with FAIL_FIX and record the exact required fix. Do not perform implementation fixes in the evaluator session unless the supervisor explicitly steers you.
- Use GitHub MCP for PR comments when available. If MCP is unavailable, record that in the evaluation artifact.
- Commit and push your evaluator artifacts before returning. Comment PR #38 with a structured IMPL-EVAL summary.

Evaluation inputs to read:
1. AGENTS.md
2. .agents/skills/netscript-harness/SKILL.md
3. .agents/skills/netscript-cli/SKILL.md
4. .agents/skills/netscript-tools/SKILL.md
5. .agents/skills/rtk/SKILL.md
6. .llm/harness/workflow/activation.md
7. .llm/harness/workflow/run-loop.md
8. .llm/harness/evaluator/protocol.md
9. .llm/harness/evaluator/verdict-definitions.md
10. .llm/tmp/run/feat-package-quality-wave5-apps--5d5-form/plan.md
11. .llm/tmp/run/feat-package-quality-wave5-apps--5d5-form/worklog.md
12. .llm/tmp/run/feat-package-quality-wave5-apps--5d5-form/context-pack.md
13. .llm/tmp/run/feat-package-quality-wave5-apps--5d5-form/drift.md
14. .llm/tmp/run/feat-package-quality-wave5-apps--5d5-form/commits.md
15. Relevant package docs and public surface under packages/fresh/form/ and packages/fresh/docs/form/.

Commits already pushed for final closeout:
- a461644 [5d5] Final scoped closeout
- a5e0cd7 [5d5] Record final closeout commit

Required evaluator checks:
- Verify working tree starts clean and branch is current with origin.
- Inspect the final commit range enough to confirm the closeout did not hide source churn outside 5d5 scope.
- Run these gates from /home/codex/repos/netscript-wave5-apps-5d5-form:
  - deno doc --lint packages/fresh/form/mod.ts
  - deno check --unstable-kv packages/fresh/form/mod.ts
  - deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/fresh/form --ext ts,tsx
  - deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/fresh/form --ext ts,tsx
  - deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/fresh/form --ext ts,tsx
  - deno test --allow-env --config packages/fresh/deno.json --unstable-kv packages/fresh/form
  - (cd packages/fresh && deno task dry-run)
- Verify no deno.lock churn is present unless explicitly justified.
- Verify public surface is doctrine-compatible: no external upstream re-export leaks from packages/fresh/form/mod.ts, internal barrels have justification, file sizes are within accepted 5d5 drift, and Standard Schema/Zod adapter behavior has focused test coverage.
- Review open drift. D-5d5-1 and D-5d5-2 may remain open only if the rationale is still accurate and does not block the 5d5 source slice.

Artifacts to write:
- .llm/tmp/run/feat-package-quality-wave5-apps--5d5-form/evaluate.md with verdict PASS, FAIL_FIX, FAIL_RESCOPE, or FAIL_DEBT.
- Append a concise evaluator entry to .llm/tmp/run/feat-package-quality-wave5-apps--5d5-form/worklog.md.
- If PASS, state that 5d5 is ready for supervisor merge into feat/package-quality-wave5-apps-5d-fresh.

Commit and push:
- git add the evaluator artifacts you changed.
- git commit -m "eval(5d5): record form verdict"
- git push origin feat/package-quality-wave5-apps-5d5-form
- Comment PR #38 with a structured summary including verdict, commit, gates, residual risks, and whether full CLI E2E was skipped by protocol.
EOF

git add .llm/tmp/run/feat-package-quality-wave5-apps--5d5-form/session-prompts/eval-5d5-form.md
git commit -m "chore(5d5): record evaluator prompt"
git push origin feat/package-quality-wave5-apps-5d5-form
git status --short --branch
git --no-pager log --oneline -3
