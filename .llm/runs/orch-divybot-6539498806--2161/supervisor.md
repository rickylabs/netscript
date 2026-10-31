# Supervisor

- Assignment: #2161, milestone 0.0.9 group A3; coordinator #2474.
- Baseline: f89260ac93e7045fbf87e028b3e3e00b65dd68dd (current main at intake).
- Branch: orch/divybot-6539498806; implementation: assigned OpenAI Codex session, feature tier, xhigh.
- Independent evaluator: native Claude, claude-opus-5-5, high, separate read-only session; resume the same evaluator across rounds. Owner override recorded verbatim in worklog.
- Write surface: this run directory; packages/plugin/src/cli/{mod.ts,application/registry-source-selection.ts}; packages/plugin/tests/cli/registry-source-selection_test.ts; plugins/{triggers,workers,sagas}/src/cli/*registry*.ts and workers command-types.ts; plugins/{triggers,workers,sagas}/README.md; packages/cli/src/kernel/domain/plugin-generated-surface.ts; packages/cli/src/public/features/generate/plugins/{plugin-registry-renderer.ts,installed-runtime-registry-generator.ts,generate-installed-plugin-registries.ts,*registry*test.ts}; packages/cli/src/public/features/plugins/doctor/{runtime-registry-drift.ts,*registry*test.ts}; docs/site/orchestration-runtime/how-to/author-a-plugin.md.
- Local evidence and launcher output: project runs directory (outside Git); temporary fixture files in the environment temporary directory. Never commit assignment or private operational details.
- Permissions: edit, commit, push, draft and ready PR, phase comments, final report handoff. No merge, labels, milestones, local scaffold.runtime, lock/cache deletion or reload.

- Research scope extension before implementation: plugins/ai/src/cli/ai-registry-compiler.ts, plugins/ai/src/cli/ai-registry-compiler.test.ts, plugins/ai/README.md; workers registry-compiler.ts and its existing tests. Correct documentation path is docs/site/orchestration-runtime/how-to/author-a-plugin.md.
