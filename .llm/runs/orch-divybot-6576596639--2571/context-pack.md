# Resume Northwind showcase

Issue #2571; draft PR #2595; branch `orch/divybot-6576596639`. S1 and S2 source
slices are approved by the same independent read-only Sol supervisor. Astra
visual subgate PASS: all60combinations >=8/10. Read source-review-s2.md,
visual-evaluation.md and s2-local-evidence.json. Full source/CI leaf acceptance
is still pending; do not infer READY from source slice approvals.

Implemented `init --from showcase`, persisted commerce and background workflow,
private durable Assistant/MCP and canonical sign-in. Default init includes the
agent bundle and matches all220files at an identical output path. Source21
scenarios and mounted browser pass; baseline first-send deadlock was RED.

Main59e6202 is integrated with both histories; all carriers and the Aspire
manifest are reconciled. CLI quality passes. Next: run all root checks under
Deno2.9.7, fresh documented
showcase and packed build, full scaffold.runtime in CI, formal independent
IMPL-EVAL, then final handoff. Earlier proof AppHosts are stopped. The next fresh final recipe will own its
own generated root and resources.
Docker daemon is unavailable locally; supported Garnet executable works.

No labels/session IDs; milestone0.0.9; Refs-only draft PR. Never rebase/force
push or merge the PR. Stop at READY; Cockpit reviews/merges. The canonical final
report uses `.divybot-final-report.tmp` -> `.divybot-final-report.md`; do not post
that final issue comment manually or commit dispatcher files.
