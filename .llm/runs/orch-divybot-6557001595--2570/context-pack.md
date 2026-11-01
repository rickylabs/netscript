# Resume scaffold redesign #2570

Draft PR #2572, branch orch/divybot-6557001595. PLAN-EVAL passed round 2.
S1 shell/empty states implemented; independent S1 review passed after config-error
containment. See s1-review-round-2.md and s1-*.json for scope and evidence.
S2 live typed services, metadata plugin discovery and record details is next.
S3 visual review and S4 full gates are not complete. Never claim READY from S1.

Read plan.md corrections B1–B6 as binding decisions; they map all acceptance.
The canonical service examples and development design links must survive runtime.
README in packages/cli/src/kernel/assets/app is the extension path.

Owner mandates Claude Opus 5.5 high read-only evaluations and separate Astra visual
review. Public artifacts are repo-relative and omit session ids. Final report uses
the untracked .divybot-final-report.md handoff. Keep PR draft, Refs-only, no labels.
