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

S3 allowed documentation addition: docs/site/services-sdk/how-to/index.md, one recipe link.

S3 original branch: fix/native-host-policy, PR #2421. Integrates main and the independently
reviewed service/header prerequisite source. This is the final bounded startup-options leaf.

S3 measured scope expansion before repair: plugins/workers/tests/public/type-refs_test.ts
contains the pre-existing exact export-target list. The complete plugin suite returned230 pass,
1 fail because the new ./service is absent from that list. Add the singular entrypoint while
retaining every legacy target and all precision/doc-lint controls. No acceptance reduction.

S3 measured layout correction before editing: adopted factory tests plus new host controls
raise workers/streams services/src to17/19 immediate entries (generic audit counts17/18
after its test-directory exclusion), above cap12. Move only service*_test.ts owners and the
workers service-test-fixture.ts into services/src/tests/. Streams already has that directory.
Update parent-relative module URLs, plugin-root resolution and fixture imports only. Preserve
all assertions, test names, budgets, permissions, fixture content and public source. This exact
path relocation is allowed scope; no new F16 exception or scan exclusion is introduced.
Historical records retain their original source paths; final evidence will use current paths.

2026-10-31 continuation: previous goal turn made implementation progress and published the
READY handoff. Current-state audit found one newly completed CI failure at exacta4dc7053:
quality job124412622901 fails only Aspire manifest freshness (phase1, expected13.5.3).
Current main4aa734e2 quality job124403708041 passes that same parity step. CI's durable
quality receipt confirms no pin violation; inventory freshness is the sole failure. The
remaining test shard has now succeeded. No source/milestone/label change is inferred.

Exact scope addition before regeneration: .llm/tools/validation/fixtures/aspire-surface-manifest.tsv,
through its existing aspire-surface-manifest.ts generator only, plus this run's evidence.
No checker, scan scope, classification, toolchain pin, fixture compatibility rule or runtime
gate may be weakened. Apply aspire-upgrade's canonical inventory procedure without a version
bump. Reproduce native parity, inspect the exact diff, then run all remaining quality steps
that CI skipped after parity so the final fifth evaluator round is not spent prematurely.
The fourth implementation verdict is MERGE at a4dc70531c3e3a8c3139ecfa16419126c9551463;
only one owner-authorized feature evaluation round remains. Reuse the same independent session.
