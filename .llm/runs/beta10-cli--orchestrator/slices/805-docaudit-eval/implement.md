use harness

## SKILL
- netscript-harness — supervisor-dispatched IMPL-EVAL for Claude-authored work (route review_claude: Codex · GPT-5.6 Sol · xhigh). EVALUATE ONLY — no fixes, pushes, merges, labels.
- netscript-tools; rtk

## IMPL-EVAL: PR #805 — doc-audit profile as routing data (Claude Opus 4.8-authored)

Read `.llm/harness/evaluator/protocol.md` + `verdict-definitions.md`. Subject: worktree `/home/codex/repos/b10-docaudit`, branch `harness/doc-audit-profile` @ a7caf172, base main. Diff: `git diff origin/main...HEAD`.

Owner-ratified spec to verify against (four in-session revisions, final state): `docs_audit` = Codex·Sol·medium (high for large changesets), opposite-family, single pass per CHANGESET, NO cross-family fallback; `docs_polish` = Claude·Fable 5·MEDIUM, edit-only, fallback chain depth 2: Opus 4.8·xhigh (token-limit) → GLM 5.2·xhigh over claude-openrouter (no-Claude-surface last resort, scoped as last-resort only); fixes by the SAME resumed generator session (fresh fixer = justified exception); Gate-log requirement with pattern-mining lifecycle into .llm/tools/docs/; 2-fail escalation.

Probe: (1) routing-policy.ts bindings match that spec exactly (lanes, efforts, fallback order + conditions, model-id constants only — re-run the no-hardcoded-volatile guard); (2) prose↔TS zero drift across doc-audit.md, lane-policy.md, SKILL.md source+mirror (the #794-class defect); (3) the new tests actually assert the fallback ORDER and the no-cross-family property (would they fail if the order flipped? — reason from the assertions, revert-test if cheap); (4) no contradiction with existing lanes (review_codex*, major_ui_ux GLM scope note); (5) re-run the full runtime+config suites + sync-claude:check + docs:links yourself.

Verdict + numbered findings → `/home/codex/repos/netscript-beta10-cli/.llm/runs/beta10-cli--orchestrator/slices/805-docaudit-eval/evaluate.md`. Final output: verdict + rationale + findings. Do not modify the worktree.
