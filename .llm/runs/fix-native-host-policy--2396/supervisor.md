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


## 2026-10-31 reconciliation relaunch mc009d-r2-2396

Implementer: Codex (OpenAI family), feature tier, owner-requested high effort.
Baseline PR head: c875e3893458f92a701239ff10461df2c56c2c9f.
Incoming main: 7ee9c3ed04607eb0967f9ef0ef4cd874652817aa.
Existing branch fix/native-host-policy and existing PR2421 only.
Write scope: this run directory; merge incoming main verbatim; retain both debt-registry
sides; canonical generators may update packages/mcp/src/infrastructure/export-surfaces/export-surface-corpus.generated.ts,
packages/mcp/src/publish-assets.generated.ts and packages/cli/src/kernel/assets/*generated.ts,
plus their canonical generated inputs. No authored feature source or tests will be rewritten.
A generated prerequisite outside this set must be recorded before writing.

The feature matrix was queried with --json. Owner evaluator override (verbatim):
"Run PLAN-EVAL before implementing and IMPL-EVAL after, both in a separate session with claude -p --model claude-opus-5-5 --effort high, read-only, stdin closed, blockers only."
Owner additionally authorizes "one exact-head IMPL-EVAL on the merge delta only" in this
relaunch after the earlier feature review loop ended. This is a newly authorized merge
reconciliation review, not a sixth source-feature evaluation. The source review history remains.
Both evaluator phases use independent Anthropic sessions and read-only tools; private
execution metadata stays outside Git. No labels/milestones, local scaffold.runtime, rebase,
force-push, main merge, tag, release or new PR.

Follow-up merge scope: integrate1d274c16bd3163eb72a40ea3f2e3f0523861159f verbatim, including KV source and Aspire manifest. Only canonical prose/publish conflicts require regeneration. No factory source or debt bounds may change.

## 2026-10-31 finishing relaunch mc009e-r3-2396

Implementer: Codex, OpenAI family; feature tier, high effort. Existing PR #2421 only.
Baseline: d3a52cb1bf09e9baf0faf857a76e5102fa3c60a4. Incoming fetched main:
f6839463668c5dae4ca7234d26909e74e10b89c0. Branch: fix/native-host-policy.
Write surface: this run directory; plugins/workers/services/mod.ts;
plugins/streams/services/mod.ts; the two existing F-5 entries in
.llm/harness/debt/arch-debt.md; canonical generated carriers and their generated inputs
only through their existing generators. Incoming main may update other tracked paths
verbatim. No authored runtime implementation or existing acceptance assertion changes.

First seek a complete native identity closure at 22/21 names. Only if impossible, the
coordinator explicitly authorizes ProcedureErrorCode identity type re-exports and exactly
23/22-name debt bounds, preserving 2026-11-10, no extension and no further growth.
Authority: issue #2474 comment 6541271527 and this relaunch's assignment.

The feature matrix was queried with --json. The owner override remains verbatim:
"Run PLAN-EVAL before implementing and IMPL-EVAL after, both in a separate session with
claude -p --model claude-opus-5-5 --effort high, read-only, stdin closed, blockers only."
This relaunch expressly authorizes the bounded finishing-delta evaluation since d3a52cb1b,
and a separate F-5 debt re-review, preserving all historical reviews. Re-steer each phase's
same evaluator across repairs. No self-certification; evaluator performs substantive review.
No local scaffold.runtime, labels/milestones, force push, rebase, merge to main, tag or release.
Execution metadata and raw logs stay outside Git; sanitized evidence stays in this run.
Canonical final issue report uses the excluded .divybot-final-report.md handoff.

## Authorized native-source repair continuation — 2026-10-31

Coordinator authority: https://github.com/rickylabs/netscript/issues/2474#issuecomment-6541660112.
Verbatim decision: "fix it at the source. In @netscript/service/auth, ProcedureErrorCode
becomes an explicit string-literal union with the same two members. The const is checked
against it, and a test asserts the two are exactly equal." It also requires a public-surface
diff and retains23/22;24/23 is fallback ONLY if source repair changes the published API.
This supersedes the previous finishing STOP branch and authorizes a fresh native repair
phase. Its plan evaluation and implementation review reuse the existing independent sessions;
prior stop-branch verdicts remain historical and are not relabeled as new source acceptance.

Write scope addition BEFORE edits: packages/service/src/auth/types.ts;
packages/service/tests/auth/procedure-availability_test.ts. Existing two plugin facades and
their exact F-5 debt entries, canonical carriers and this run remain in scope. No new public
service symbol, runtime value, service export-map change, behavior, dependency or lock churn.
One coherent repair slice, under30 authored files. PLAN-EVAL before source implementation;
separate F-5 review and substantive source review before commit; exact pushed-head evaluation
on the complete finishing delta remains required. Coordinator alone merges and arms runtime.

Native-source preliminary review found two stale documentation words after the canonical
alias representation change. Before editing, extend scope to packages/service/README.md
and docs/site/reference/service/index.md only to change "derived ProcedureErrorCode type"
to "ProcedureErrorCode union". Regenerate affected prose/carriers canonically and rerun
freshness; no adoption policy or behavior changes. This is a source-consistency correction.

Current-main reconciliation continuation: incoming4e018ad0bab9b9b90daf4764a035fd3ff879b9fa
is authorized by the original normal-merge instruction. Keep every main-owned runtime/doc
change verbatim; only canonical carriers may need regeneration. No new authored runtime
source scope. Add the incoming producer-session_test.ts to the final combined validation;
all original scope remains. Evidence stays in this run; logs remain outside Git.

Landing audit found PR32264fc11 CONFLICTING after main advanced to
abe9d3e4303411544502ceb519f39a09d3723fcd (#2512 test-only saga compensation, #2514 command
guides/docs-tool tests and image pre-pull helper). No production framework/runtime source
changed. Original normal-current-main instruction authorizes this final mechanical refresh;
preserve incoming source exactly, retain native union word in its reference paragraph,
regenerate conflicted carriers only through canonical generators. Evidence stays in this
run. Reuse same evaluator for the new exact head; old32264fc11 MERGE remains historical.

Additional current-main reconciliation aec75e4d947dcf7c83b9f7dd4b6444abe430f18b is authorized
by the original normal-merge instruction. Preserve #2511 worker logging code/manifest and
all FOUR main-owned lock updates exactly. No leaf dependency/version change or lock
regeneration is authorized. Runtime inputs change, so run a fresh complete suite, not reuse.
