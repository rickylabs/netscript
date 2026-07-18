use harness

## SKILL
- netscript-harness — supervisor-dispatched IMPL-EVAL for Claude(Sonnet-5)-authored skill docs (route review_claude: Codex · GPT-5.6 Sol · xhigh). EVALUATE ONLY.
- netscript-release (the subject); netscript-tools; rtk

## IMPL-EVAL: PR #819 — release-skill codification (same-semver republish + min-dep-age + first-publish checklist)

Read the evaluator protocol + verdict-definitions. Subject: worktree /home/codex/repos/b10-relskill, branch docs/release-recovery-patterns, base main. Diff: git diff origin/main...HEAD.

Probe — this is DOCTRINE, so accuracy against reality is everything (verify each claim against the live evidence, not the prose):
1. Same-semver republish section: check every factual claim against the actual beta.10 record — run 29558968037 (partial), tag move a5adb706→8a8a9537, re-dispatch run 29562537123 (fetch via the GitHub API; oauth_token in ~/.config/gh/hosts.yml); the byte-identical precondition must be stated as MANDATORY with its verification method; the semver-bump fallback condition must be present.
2. Min-dependency-age section: claims must match what #813+#817 actually shipped (flag on published-JSR invocations AND single-process resolution because children don't inherit; reference to #818 for the user window).
3. First-publish checklist: consistent with what publish.yml actually automates (provisioning) vs what needed manual work in beta.10 (README standard, live validation); no contradiction with the pending #812 canary docs (read PR #812's skill edits — flag any future merge-conflict landmine textually, non-blocking).
4. Structure/voice: additive to the existing skill, mirrors in sync (run the sync check), no internal-process vocabulary leaking into what is an internal skill anyway (issue refs are FINE here — it is internal doctrine).
5. docs:links + fmt on touched files.

Verdict + numbered findings → /home/codex/repos/netscript-beta10-cli/.llm/runs/beta10-cli--orchestrator/slices/819-relskill-eval/evaluate.md. Final output: verdict + rationale + findings.
