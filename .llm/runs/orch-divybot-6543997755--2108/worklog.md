# Worklog

## Design

1. Public surface: supported `init --db none`, `plugin install --no-db`, generate/doctor, and an opt-in maintainer consumer acceptance command. Existing saga selectors remain authoritative.
2. Vocabulary: KV-only means no DB requirement, env, bootstrap or Prisma model; canonical saga state, query projection and replay are distinct.
3. Ports: existing CLI process boundary, filesystem, Aspire CLI and HTTP endpoints; no new framework port.
4. Constants: installed plugin list and exact logical resource names; existing CLI/runtime constants where accessible.
5. Commit slices: S0 run bootstrap/PLAN-EVAL; S1 consumer fixture/test and scoped defects; S2 runtime evidence/docs/evaluation. File/gate map is in plan.md.
6. Deferred: new CI matrix tier and release/merge; full scaffold.runtime delegated to CI as owner requires.
7. Contributor path: `packages/cli/e2e/fixtures/kv-only/README.md` explains rerunning and extending acceptance.

## Routing override

Owner grant verbatim: “Run PLAN-EVAL before implementing and IMPL-EVAL after, both in a separate session with claude -p --model claude-opus-5-5 --effort high, read-only, stdin closed, blockers only.”

## Intake

Main baseline verified; earlier PRs deliver partial contracts, not remaining clean-consumer proof. No profiles/ files read. No code implementation begun.

PLAN-EVAL round 1: FAIL_PLAN (proof entrypoint/method, generated-project check/lint, explicit negative controls unspecified). Expanded plan with exact files/commands/workflow reads/detached method and acceptance evidence table. No implementation begun.

## S1 implementation findings

PLAN-EVAL round 2 PASS before implementation (plan-eval-round2.md). Draft PR #2535 opened at bootstrap.
Consumer install/generate/doctor succeeds once the declared streams dependency is included. A DB-free generated project exposes lint failures in empty services/tools helpers and unused database-target parameters; fix those generator paths without suppressions. Workers registry emits unused variant factories; emit only factories actually called. Browser BFF uses an inline std cookie specifier rejected by consumer lint; move that dependency into the consumer import map while preserving authored aliases. These are demonstrated scaffold defects within the capstone acceptance path. Consumer regression authors actual definitions before generated quality; initial empty registry generation/doctor is separately asserted.

Main integrated by merge at c5c3ef3cbd0a534ddc245f9703b5ef527368fe7f (origin/main da815164373a4cf7c24ea2097573440f34e4f98b). The generated asset conflict was resolved by canonical regeneration, preserving main's source changes. No pushed history rewritten.
Additional consumer defect: local service exports were ignored by appsettings; doctor fetched JSR and runtime launched the published release. Local install now selects the real ./services export, and runtime manifest discovery derives its package identity from the local deno metadata. Public versioned JSR behavior is preserved. The consumer asserts every API entrypoint is a real absolute source file.
Local gates: consumer + service/infrastructure generator regressions 65 PASS; local install/runtime registry generation tests 35 PASS; prior focused helpers/browser-auth/workers/saga regressions 98 PASS. Negative source copies: store env ignored, projection selector ignored and duplicate protection removed each pristine exit 0 / mutation exit 1 with one semantic failure; original source never mutated.

S1 independent supervisor review PASS: slice-review.md. The clean consumer proof also completed (runtime-proof.json): 11 runnable resources Running/Healthy, background readiness PASS, 2 completed proof jobs, exact trigger event completed, saga count/version 3 after duplicate/barrier replay and a separately started direct runner; final health rechecked and scoped cleanup PASS. No database env/resources/models. BrowserLogs is an on-demand diagnostic session, excluded from runnable application health. Auth receives the same public test key used by existing auth probes through process environment; no credential literals in generated metadata. External OAuth login is not claimed.
The detached runner initially omitted the optional streams endpoint and logged the existing nonfatal stream-projection warning; KV canonical state and instance projection remained proven. No streams hydration/replay claim is made for that process.
S1 reconcile: main merge retained; only scope-owned changes staged; no deno.lock delta. PR remains draft for documentation and final exact-head evaluation. The full scaffold.runtime CI verdict is still required and not run locally.

## S2 documentation / acceptance

Added the clean KV-only recipe to add-a-plugin.md: init --db none --cache false; required streams dependency; each --no-db --no-samples install; kv-oauth; generate/doctor; auth environment prerequisite; real child readiness and shared saga store/projection configuration. The old separate-release-acceptance note was already absent on main. Canonical docs generation updated only the add-a-plugin page in the MCP-owned compressed prose carrier after the main merge.
Docs source-format, accuracy (214 pages / 111 direct commands), links (0 broken links/anchors/orphans), and MCP export corpus freshness passed. Workers JSR audit exited 0 with dry-run OK and the existing warnings noted in jsr-audit.md. PR thread gate PASS: 0 current unanswered threads. Full scaffold.runtime remains CI-only and unproven here by owner instruction; no new CI tier was added. Smallest proposed CI follow-up: a KV/no-db variant reusing this fixture's install/readiness/workflow checks, omitting SQL provisioning gates, rather than weakening the PostgreSQL/SQLite suites.

IMPL-EVAL round 1 PASS (evaluate-round1.md), including independent S2 sign-off. Reviewer independently corroborated retained consumer configuration/receipt and complete source/doc delta. Required readiness actions: commit S2 then rerun check:assets-barrel (its prior exit1 was solely the intended uncommitted prose carrier), rewrite the PR body, and perform final exact-pushed-head evaluation after ready. The generic shared service context also separately passes the structured generated-project check with no database module present (1 selected file, 0 findings).
S2 reconcile: source implementation unchanged since S1, only requested docs/carrier and sanitized run evidence; no unanswered threads, new CI tier, root lock churn, labels/milestone mutation or merge. Full scaffold.runtime remains a required coordinator-armed CI gate, with no local or future-pass claim.

## S3 generated Aspire inventory repair

The post-ready full Aspire parity check found only manifest:freshness at 6a62a6f. Canonical aspire-surface-manifest regeneration adds six inventory rows for the new KV fixture and consumer test. The parity gate now exits 0: checked1018, fail0, missing0, manifestFresh=true; existing deferrals remain unchanged. No runtime/source/lock change. Full IMPL-EVAL round2 approved the prior pushed 6a62a6f at its snapshot, but this inventory commit will intentionally invalidate that head attestation. Reuse the same evaluator for the six-row S3 sign-off and the final exact-new-head review; no merge or gate waiver.

CI quality at 6a62a6f failed first at Publish asset freshness (job 124564252850), before Aspire parity ran. The exact diagnostic names packages/mcp/src/publish-assets.generated.ts. Canonical gen:publish-assets refreshes only that generated wrapper (4 diff lines) for the already-reviewed docs corpus; check:publish-assets exits0. Add this deterministic wrapper to S3, alongside the inventory repair. The prior inventory review PASS is retained as evaluate-round3.md; request a bounded supplemental artifact review before commit, then final exact-head review.

S3 CI failure analysis: all red shards (test-2 through test-6) reduce to stale MCP docs provenance, inherited test-map cookie resolution, and one old empty-tools assertion. Root cookie alias matches the generated consumer alias; frozen fixture processes require one workspace.dependencies metadata line in each root/private lock. Native writers changed no resolved packages or integrity fields. Structured check/lint/fmt each select1/pass0 findings; quality:gate PASS (including deps/private-lock/doctrine), publish-assets/parity receipts PASS, full publish dry-run PASS. Twelve-file regression rerun: 83 PASS, 3 browser-only host-library failures; all product assertions outside that browser file pass. Rerun the browser file with existing browser dependencies, preserving its negative controls.

Browser host follow-up: the loader-scoped launcher must live on an executable project filesystem because TMPDIR is mounted noexec. Latest same-source browser rerun uses that unchanged launcher; private evidence log basename kv2108-ci-browser-verified.log. Prior host-only failures retained. No source/test relaxation or global host installation.

S3 final local browser rerun: exit0, 3PASS, including the real signin/callback/read path and both Secure/bearer mutation controls. Together with the original batch's83 passing results, all86 affected results pass on unchanged source. Same-session round5 checkpoint1 independently reviewed all pending repairs and returned S3 SIGNOFF: PASS before commit (slice-review-ci.md). Earlier host-only failures and historical head reviews remain explicit. S3 reconcile: approved source/config/generated delta only, two reviewed one-line lock metadata additions, no package/integrity changes, no unanswered threads. Commit/push, then same invocation performs checkpoint2 on exact pushed head.

## S4 full-runtime CI repair

Both runtime tiers at d92acd5 failed runtime.flow-b-fixture with the same diagnostic after49 passing gates. Compared latest main run41197676281 at15cffa2: both tiers PASS. Actual generated workers-api arguments still contain --config deno.json, now across lines beside the correct absolute local source entrypoint. Reuse the existing whitespace-independent config rewrite in both modes and preserve/validate the exact expected local service path; retain legacy JSR-to-local-alias compatibility and reject missing config/wrong source. Product generator/runtime code is unchanged.

Targeted gate:20PASS across published/local rewrite, real generator+formatter, locator and frozen-probe tests. Scoped check/lint/fmt:3 selected,0 findings/dropped. quality:gate exits0. Canonical inventory gains one row for the generator-backed regression; parity receipt PASS. No additional dependency or lock change. Coordinator explicitly requested repair, fresh exact-head IMPL-EVAL and re-posted READY, and removed e2e-cli-gate while work proceeds. Same separate Opus evaluator reviews S4 before commit and exact pushed head afterward. evaluation-ledger.md exposes historical ordinal/scope inconsistency for independent cap audit; no waiver or fresh session.

S4 precommit portability reconciliation: derive the expected local service path with @std/path resolve(sourceRoot, workersServiceSource), matching the installer's native path resolution, rather than concatenating a POSIX separator. This retains Windows escaped source support and changes no generated launch output. Include this latest one-line call plus its standard import in the sign-off diff.

Full IMPL round4 FAIL_FIX: independent reviewer confirmed the ledger accounting but found Windows sourceRoot/path separator mismatch and a regression-test gap. Corrected before commit: configureLocalWorkersBlock now resolves the shared source-relative constant using the native @std/path resolver; the fixture passes sourceRoot directly. A resolver seam accepts the upstream Windows resolver for a real cross-platform sourceRoot-to-entrypoint regression, preserving wrong-source rejection. The earlier expected-path concatenation is removed. No published-mode behavior changes. Last full round5 must independently sign off, then attest the exact pushed head; no further budget is assumed.

S4 corrected-path gates:20 tests PASS,3-file structured check/lint/fmt PASS with no dropped files, quality:gate exits0. Windows sourceRoot regression uses the upstream Windows resolver through the same helper construction invoked by the fixture. Disposable-copy negative control replacing that resolver with POSIX concatenation: pristine0/mutant1, exactly the Windows semantic test fails; original source equality verified. Native platform construction lives inside the helper, so the test covers the actual call path rather than a precomputed matching path. No full runtime executed locally.

S4 independent precommit sign-off PASS (slice-review-s4.md), last full round5 checkpoint1. Commit/push this approved fixture delta, then resolve the newly reported merge conflict by merging origin/main (7312ba4 fetched). Follow explicit owner/coordinator no-rebase/no-force policy despite the automated relay text. Final review remains in the same active invocation and must reconcile the merged head.

## Main integration after S4

S4 approved fixture repair committed/pushed at0e9d0bb. Integrated origin/main7312ba4 via merge, preserving pushed history. Only conflict: generated MCP publish provenance; canonical gen:publish-assets resolves it from the combined docs corpus. All other integration is automatic upstream content. Merged-tree gates:21 focused/consumer tests PASS; quality/deps/doctrine, docs semantic freshness, asset freshness, publish wrapper freshness and Aspire parity PASS. Fresh KV-only proof rerun after upstream child-health changes: all11 runnable resources healthy, job/trigger effects, saga count/version3 through detached runner, final health and scoped cleanup PASS (runtime-proof-merged.json). Full all-unit publish dry-run pending; final same-session merge sign-off follows its result. No local full scaffold.runtime or label mutation.

Merged all-unit publish dry-run PASS. Durable native gate receipts also confirm assets-barrel and publish-assets PASS individually. All merged-tree local gates are now proven; request same-session precommit merge sign-off, then commit/push the merge and supply the exact new head for final attestation.

Main integration independently approved before commit (merge-review.md), in the same active full round5. Reviewer recomputed the merged 209-page corpus provenance, checked the three-way inventory union, confirmed S4 source unchanged and verified the fresh merged-tree gate/proof evidence. Commit/push this merge; final exact-head attestation remains external to avoid invalidating its own SHA.
