# Plan-gate stop and continuation

The dispatcher leaf specifically stops after two FAIL_PLAN verdicts. Read-only reviewers cannot apply the feature policy's second-cycle in-place correction. Here the second reviewer proposed a precise fix and offered confirmation, but still emitted FAIL_PLAN; the supervisor must not relabel that PASS or start a third cycle autonomously. Preserve both verdicts, apply the concrete proposed fix only to make the plan reviewable, keep the PR draft and request owner/coordinator direction via the decision record.

Native repo launcher used: `deno run --allow-all .llm/tools/agentic/claude/claude-print.ts --model claude-opus-5-5 --effort high --prompt <repo-relative-brief>`; same evaluator via --resume. Raw streams retain private session state outside Git; only verdict text is committed.

Continuation: after the escalation was surfaced, the user explicitly instructed continuation. That grant was recorded in worklog.md; the same reviewer then confirmed PASS before code. The historical FAIL_PLAN verdicts were preserved.
