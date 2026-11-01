# Worklog

## Design

1. Public surface: static `/create/`, generated component references, existing `find_guidance` tool. No new package exports.
2. Domain vocabulary: compact preset metadata, initial builder payload, component identity/alias, contextual disambiguation.
3. Ports: Web fetch/import/CompressionStream, native Deno bundle and filesystem, existing CLI codec, registry and docs corpus. No new abstraction layer.
4. Constants: existing preset/style IDs; shared raw/gzip payload budgets; named workspace component inventory.
5. Commit slices: plan artifacts; implementation in `tools/docs-site/fresh-ui/`, `docs/site/design-system/components.page.ts`, `tools/fresh-ui-browser/docs-tests/components.spec.ts`, `packages/mcp/src/domain/docs/component-guidance.ts`, `packages/mcp/tests/component-guidance_test.ts`, `packages/fresh-ui/tests/publish-size.test.ts`, generated carrier outputs; final evidence. Gates: site build/rendered checks, docs links/accuracy/snippets, builder browser tests, MCP routing tests, every carrier freshness task, scoped static wrappers, quality/architecture. Full CLI runtime checked at readiness or recorded unproven/policy skip.
6. Deferred scope: independently controlled unsupported pickers until S6b/resolver contracts ship; no fake choices.
7. Contributor path: `tools/docs-site/fresh-ui/README.md` explains metadata, bundles, budgets and adding anatomy. MCP component routing derives names from corpus pages.

## Bootstrap

Matrix resolved feature tier. Owner override, verbatim: **IMPL-EVAL: `claude -p --model claude-opus-5-5 --effort high`, read-only.** Implementation/evaluation remain separate sessions and vendor families. Public run has repo-relative paths and no session IDs. Owner-specific draft/Refs/no-label/READY process overrides generic boilerplate.

PLAN-EVAL: N/A for bounded static payload and routing repair with issue-defined contract.

## Implementation evidence before independent sign-off

- Docs build and rendered-output: PASS, 52 references/24 presets, largest Markdown twin 5,013 bytes.
- Default builder/workspace JS: 65,435 raw / 24,810 gzip; compact preset metadata: 9,130 raw / 1,162 gzip.
- Browser builder/component suite: 22 PASS / 6 existing census-matrix skips / 0 failed. Every component and all presets mounted without external requests. Initial request test excludes full catalog, CLI decoder and unrelated preview chunks, then proves decoder loads on import.
- Full MCP suite + generator tests: 248 PASS / 0 ignored / 0 failed after complete carrier regeneration.
- Component CSS and native publish-size tests: 4 PASS, preserving existing CSS ceilings.
- Scoped typecheck: all 28 docs-tool TS files, all 11 docs-preview TS/TSX with generated JSX config, four MCP/package files, and browser harness: PASS.
- Lint/fmt wrappers: PASS. Quality scan and architecture/dependency gates: PASS (existing warnings retained).
- docs:links and docs:accuracy: PASS; docs:snippets complete at exit 0.
- Carrier chain generated in order under Deno 2.9.7, using explicit existing --allow-dirty for the export generator. No lockfile churn.
- Full CLI E2E: UNPROVEN; Aspire doctor failed and Docker daemon is unavailable. Resource inspection retains unknown/foreign AppHosts untouched.
- Separate read-only Claude review running; implementation is not yet signed off.

## Independent review repair

Round 1 returned FAIL_FIX: compound names without UI context and sentence-leading capitalisation could capture generic tasks. Removed both broad paths. Added all reviewer probes as negatives, including Postgres data tables, service form fields/HTTP headers, empty worker queues, and sentence-leading Pagination/Select/Search/Alert/Input/Label/Markdown/Progress questions. Exact component names, compound API spellings, explicit registry IDs and adjacent UI context retain positive routes. The full 248-test MCP/generator suite passes again.

The common generated share link now restores its trusted precomputed preset code without loading the CLI decoder. Noncanonical imports still pass through the CLI's existing validation. Browser payload coverage now exercises both initial navigation and a generated share-link reload: 22 PASS / 6 existing census skips / 0 failed. Updated default JS closure: 65,470 raw / 24,826 gzip; metadata unchanged at 9,130 / 1,162.

All 11 non-carrier root check:* tasks passed (including the PR-specific review-thread gate). Four carrier freshness tasks follow implementation commit. Round 2 is with the same independent reviewer. Formatting noise in the browser spec was removed; existing lines are preserved.

Reconcile: live issue has no competing PR or new instructions. Draft #2573 remains Refs #2569 with no labels. Fetched origin/main and found no newer baseline commits. No accepted architecture debt or extra runtime scope.

Round 2: PASS and independent slice-supervisor sign-off. Reviewer independently passed 11 focused tests, 47 additional guidance tests, and 55 routing probes. All 13 blocking generic scenarios now route to framework guidance. Implementer addressed all three nonblocking suggestions too: render/theme phrases must end with the component identity; use/install/add of a capitalised single-word API at the end of a question is recognised without overriding workflow conflicts; shared-link test asserts `preset=ns1_` before reloading. These narrow changes and added regressions are with the same reviewer for final confirmation. No accepted follow-up routing defect or architectural debt remains.

## Implementation sign-off

Final same-reviewer round3: PASS, with separate slice-supervisor sign-off. All blocking and nonblocking findings fixed; independent 58-test routing/generator pass and45 routing probes. Implementer final source:248 MCP/generator PASS and22 browser PASS/6 existing skips; scoped check/lint/fmt PASS. Source hashes captured in `reviewed-source-sha256.json`. Implementation commit carries the reviewed code, generated carriers, worklog and context. Next: four postcommit carrier freshness checks, normal push, exact-head CI policy verification. No READY claim yet.

## Postcommit carrier and delivery reconciliation

All four durable command receipts on implementation head `d01a61ecce29b1480a3a7038f5a35d8c1f1f632e` are PASS/exit0: `check:agent-docs-prose`, `check:mcp-export-corpus`, `check:assets-barrel`, `check:publish-assets`. Together with the 11 previously passed checks, every root `check:*` task has passed. The shared Aspire surface manifest generator also exited0 without changes.

Two-build site reproducibility PASS across1,196 files/316 HTML pages/262 Markdown twins; only the existing workflow-allowed Pagefind metadata files varied. Browser chunks and page output are stable. All reviewed source hashes still match; no lockfile churn or source changes after final independent sign-off.

Draft PR #2573 matches issue milestone0.0.9 and retains no labels. Required core CI checks on the implementation push were explicitly policy-skipped for draft PRs (`ci.yml` excludes drafts); Pages build passed and its browser job was running. These skips are not executed runtime proof. Reconcile the final evidence head immediately after push before publishing READY through the excluded atomic report. Cockpit owns merge; no rebase/force push/merge.
