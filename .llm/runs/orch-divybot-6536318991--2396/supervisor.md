# Issue 2396 adoption supervisor

Date: 2026-10-31. Tier: feature. Implementer: Codex, OpenAI family.
Baseline: main `6a71cd0599673d70cd6311de3bb20b2d6a9dde2c`.
Assignment: adopt existing PRs 2421, 2422, 2423; coordinator alone merges.

The feature matrix was resolved with `deno task agentic:matrix --tier feature --json`.
Implementation route is sol/xhigh. The owner overrides both evaluator routes:
"Run PLAN-EVAL before implementing and IMPL-EVAL after, both in a separate session with
claude -p --model claude-opus-5-5 --effort high, read-only, stdin closed, blockers only."
Different sessions and vendor families remain mandatory. No substitute evaluator is authorized.

Allowed writes: this run directory; `.llm/runs/fix-native-service-policy--2396/`,
`.llm/runs/fix-browser-stream-headers--2396/`, `.llm/runs/fix-native-host-policy--2396/`;
the existing product/test/guide files listed in each adopted PR's file manifest; new focused
tests adjacent to those owners; migration entries under the repository's existing migration
convention; `.llm/harness/debt/arch-debt.md` only for measured existing/adopted debt;
canonical generated documentation carriers required by those sources. Main integration may
update other tracked paths only to their exact existing main versions. Scope expansions are
recorded before writing. Historical run evidence is preserved unchanged.

No assignment file, credentials, machine details, operator paths or evaluator session identifiers
will be committed. Local gate output remains outside Git unless summarized without those details.
No labels, milestones, merges, releases, force pushes, lock/cache deletion or local runtime E2E.

RTK is unavailable on this worker; use focused raw commands and repository wrappers.

Additional exact S3 write scope approved by this plan's recorded expansion: streams legacy
main; workers/streams service-host-policy_test.ts; streams service-legacy_test.ts;
docs/site/services-sdk/how-to/host-plugin-services.md; docs/site/services-sdk/services.md;
plugins/streams/README.md; plugins/workers/CHANGELOG.md; plugins/streams/CHANGELOG.md.
Canonical generated carrier paths are enumerated in the plan round-1 repair. Saga/trigger
entrypoints and export maps are read-only review scope, with results recorded in the guide.
