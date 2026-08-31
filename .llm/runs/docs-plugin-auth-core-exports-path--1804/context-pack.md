# Context Pack

- Goal: resolve #1804 by adding real module paths to the plugin-auth-core export table and adopting it into exports-drift.
- Baseline: `origin/main` `5197e70b716eafb82fbb12ddb9a910c248ddb86a`.
- Run phase: implementation and assigned gates complete at `08c22c07b`; final evidence commit pending.
- PLAN-EVAL: N/A, justified in plan/worklog.
- Symbol result: 139 unique exports, 42 documented, 97 missing; use `entrypoints-only`.
- Final evaluator: separate supervisor session after pushed implementation evidence.
- PR: #1806, draft, `status:impl`; all required gates passed at the implementation head.
- Generated provenance source commit: `1d8f32c22`, verified as an ancestor.
