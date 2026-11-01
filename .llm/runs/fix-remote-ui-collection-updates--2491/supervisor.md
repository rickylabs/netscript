# Remote collection update supervisor

Issue #2491, part of #2412; branch `fix/remote-ui-collection-updates`.
Baseline `0af8fd9e7904ee2c848d0a4213c7853edec3ad21`; worktree `.`.
Feature tier, OpenAI implementer. Native matrix queried with --tier feature --json:
implementation sol/xhigh, fallback muse_spark_1_3/xhigh; evaluation muse_spark_1_3/xhigh,
fallback opus_5/xhigh, max5 rounds. Continuing owner evaluation override:
`claude -p --model claude-opus-5-5 --effort high`, separate Anthropic read-only session.
Two consecutive terminal failures stop the leaf; re-steer the same evaluator for repairs.
Authorized writes: registry-client.ts, registry-lifecycle.ts and tests under
packages/cli/src/kernel/application/ui/v2/; public UI command regression tests;
packages/cli/README.md; this run and generated carrier files only if canonical tools require it.
No dependency/lock or theme/component source changes. Normal pushes; no labels or public
session identifiers. Private operational evidence stays outside Git. Cockpit owns merge.
