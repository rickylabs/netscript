# Supervisor

- Assignment: harness #636 / NetScript #2080; delivery a01c1a93b66f4519a393856c6041d7af.
- Implementation: Codex, assigned sol / high effort; feature tier; supplied leaf profile.
- Branch: orch/divybot-636. Baseline: 6f6cbdf030d7595d1730272d0a74aedd66225069 (matches fetched origin/main).
- Worktree: /ephemeral/orch-work/issue-636, explicitly supplied by the dispatcher; this overrides the generic N5 project-path convention for this assignment.
- Writable surface: plugins/streams/services/src/**, plugins/streams/README.md, plugins/streams/deno.json if needed for imports/tasks; scoped run .llm/runs/orch-divybot-636--bounded-stream-storage/**; .llm/2026-10-07-bounded-stream-storage.md; final excluded .divybot-final-report.{tmp,md}. Temporary probes use $TMPDIR. No assignment file or lock churn is committed.
- Routing: `deno task agentic:matrix -- --tier feature --json` resolved implementation sol (xhigh), fallback muse_spark_1_3 (xhigh); plan evaluation glm_5_3 (provider_default), fallback fable_5_1 (low); implementation evaluation muse_spark_1_3 (xhigh), fallback opus_5 (xhigh). Separate vendor/session evaluator required. Owner's requested implementation effort is high.
- Policy: plan max 2 rounds; implementation max 5 rounds, notify after 3; same evaluator session across rounds; supplied leaf additionally stops after two consecutive terminal failures.
- Evaluator mechanism: to be verified through repository agentic launchers; no self-certification.
