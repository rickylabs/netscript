# Worklog

## Design

1. **Public surface:** static docs content gains semantic callouts, kind tags, readable highlighted code and unified headers; chrome stays ink. Existing components retain compatible arguments.
2. **Domain vocabulary:** tone means info/success/warning/destructive/important; kind is an API export category; syntax role is a generated foreground on the generated code background; language label is a human name for a registered fence grammar.
3. **Ports:** Figma JSON/manifest → token generator; Lume/Vento → rendered HTML; highlight.js registered grammars → token spans; Pagefind → search; Playwright/axe → browser evidence. No app backend.
4. **Constants:** shared language registration/labels, callout tone and icon maps, API kind map and generated syntax roles replace scattered literals. Stable id generation replaces randomness.
5. **Commit slices:** six, ordered with exact surfaces and gates in plan.md; native generated carriers refreshed after content stabilizes. Every slice includes worklog/context and separate reviewer verdict.
6. **Deferred scope:** #2450 owns token-source consolidation and #2453 owns unrelated Pagefind serialization nondeterminism; neither relaxes byte-identical HTML. No package API or release work.
7. **Contributor path:** tools/docs-site/README.md.

## Owner route override (verbatim)

“Run PLAN-EVAL before implementing and IMPL-EVAL after, both with claude -p --model claude-opus-5-5 --effort high, read-only, stdin closed, blockers only. Fix once, record both verdicts.” The implementation stays on the feature matrix primary; evaluation uses this explicit owner route and retains separate session/family independence.

## Bootstrap

- Read the full assignment and repository guidance. Consulted prior memory notes before building.
- Queried feature routing with --json and used local NetScript MCP find_guidance/search_docs successfully.
- Verified fetched main d6dfab0, no dirty tracked source and no duplicate implementation PR.
- PLAN-EVAL pending; implementation has not begun.

## PLAN-EVAL round 1

FAIL_PLAN: final API kind-tag authority was ambiguous. Fixed once: slice 6 owns syntax-role mapping and computed tag/table AA assertions; visible labels distinguish kinds sharing a tone. Re-steered the same independent evaluator.

## PLAN-EVAL round 2

PASS, same independent Claude evaluator after the one plan correction. Baseline docs build and style-policy negative contracts pass. Draft PR #2459 opened before implementation.

## Slice 1 — callout tones

- Implemented case-normalized NOTE/info, TIP/success, WARNING/warning, CAUTION/destructive and backward-compatible ERROR/destructive. Heading/icon share tone; body and links retain foreground ink. IMPORTANT remains neutral until the owner export in slice 6.
- Added rendered internal callout gallery and four-project screenshot/axe coverage. An initial bare-gallery failure revealed missing layout/engine frontmatter; corrected and rerun.
- Gates: docs build exit 0; structured tools check/lint/fmt exit 0; strict browser TypeScript check exit 0; 16/16 callout/style-policy browser checks pass, including four zero-blocking axe gallery audits. Independent slice review pending.
- Reconcile: only declared docs/tooling/run surfaces changed; assignment excluded, locks unchanged.

Slice review initial FAIL_FIX: internal gallery was indexed as public documentation. Fixed once by marking internal pages noindex/ignored in Pagefind, omitting twin links and skipping AI twin/index emission. Added real Pagefind and output assertions. Re-review pending.

Slice 1 final review PASS (same independent reviewer). Expanded browser run 20/20 passes, including real Pagefind exclusion; links: 24,011 links across 252 pages, all resolve. Browser formatting uses docs/site/deno.json. Sign-off commit prepared only after this substantive independent review.

## Slice 2 — API tables

- Ordinary reference Markdown Kind columns and optional object-row kind fields now render small monospace tags with visible labels; recognized aliases include typeAlias/type alias and constants. Names and signatures use full foreground and readable monospace size. Real database reference joins screenshot matrix.
- Gates: docs build exit 0; structured tooling check/lint/fmt and standalone _config.ts check exit 0; 16/16 reference/style-policy browser checks pass with four zero-blocking axe audits. Initial build caught unsupported server-DOM replaceChildren; fixed using textContent + appendChild before the successful build.
- Reconcile: no lock/dependency/API changes. Existing status-token tag paint is intermediate until the locked slice 6 mapping. Independent review pending.

Slice 2 initial review FAIL_FIX: preserve existing generic component tables and lock component kind to syntax function in slice 6. Fixed once, with a real Official plugins table regression assertion and explicit plan/drift mapping.

Slice 2 final independent review PASS after the single repair. Post-repair docs build exit 0 and all 16/16 reference/style browser checks pass. Generic plugin-table regression covered in every project. Sign-off authorized by the independent review; reconcile against current head is clean within declared scope.

## Slice 3 — unified code headers and registered languages

- Build-time frames give fences a human language label, optional filename and Copy without browser-side rewrapping. Enhanced tabs own one shared visible header; no-JS panels retain their own labelled headers. Selected copy resolves the active panel.
- Registered requested grammars plus existing JS aliases at highlight.js 11.11.1. dotenv uses upstream INI and JSONC uses JSON grammar. Startup validates registration against shared language metadata; rendered unknown fences fail the build. Two tests check real maintained fences and rejected unknown/missing registrations, preserving four-backtick nested samples.
- Internal code gallery covers all requested grammars. Both galleries excluded from Pagefind/AI carriers. Browser tests cover mixed labels, real highlighted spans, clipboard, keyboard, no-JS and responsive captures.
- Gates: docs build exit 0; 24,067 internal links resolve; structured tools check/lint/fmt, standalone config and browser type checks pass; language tests 2/2. Final expanded browser and independent slice review pending.
- Visual inspection: both 390 scheme captures keep a single header, ink chrome and no pale dark surfaces. Syntax paint intentionally waits for slice 6.
- Reconcile: no lock churn or dependency upgrades; the workflow adds the language test to its existing tooling gate.

Slice 3 initial review FAIL_FIX: filename-first tab names hid runtime labels, and build-time metadata entered twins/search. Single repair restores primary tab labels with selected filename metadata, passes labels to no-JS panel headers, explicitly excludes headers/gutters from Pagefind and headers from twins, and adds real runtime-label/twin regressions.

Slice 3 final independent review PASS after the one repair. Post-repair build exit 0; 36/36 code/keyboard/clipboard/no-JS/style/metadata browser checks pass. Browser and site-config structured checks pass, as do browser lint/fmt. Sign-off follows this independent review. Coordinator export is available; syntax slice 6 moves immediately next, followed by remaining slices 4 and 5; the single input-border compatibility exception is recorded in drift.md.

## Slice 6 — owner Figma syntax and IMPORTANT (advanced by coordinator)

- Copied exact b9dd32aac export with Theme set/B, resolving set A. Migration test compares all 281 baseline declarations per scheme byte-for-byte; only the explicit --ns-input-border gray-9 exception changes, with exact old/new assertions.
- Seven syntax roles on generated code background, final API kind mapping, inline TypeScript signatures, violet IMPORTANT heading/fill/border with default body. No raw UI colours or red syntax.
- Contrast/unit tests 6/6 pass: every syntax role meets unrounded 4.5:1 on code and table backgrounds in light/dark, including comments/punctuation; IMPORTANT meets AA on subtle fill.
- Docs build and structured tooling/site/browser type checks pass; an overbroad signature assertion on fresh-ui tables (which have no Signature column) was corrected to verify real signature-bearing tables without changing implementation. Browser and independent review pending.
- Reconcile: export changes are authoritative snapshots; pre-S8c test fixture is evidence, not a second runtime colour authority. No lock or dependency churn. Remaining slices 4 and 5 still required.

Slice 6 targeted browser checks: 32/32 pass with zero serious/critical gallery axe findings. Real authored-policy negative controls both exit 1 for the intended reasons (raw-colour and red-outside-state), not a harness/startup error. Visual review replaced missing Unicode info glyphs with currentColor SVGs and made fixture links real anchors; assertions now require both. Policy rejects red syntax, non-destructive tones and prefix impostors such as errorish/destructive-decoration. Initial independent slice review PASS; small visual/policy delta is in separate read-only addendum before sign-off.

Slice 6 independent addendum PASS. All required source/migration/AA/browser checks for this slice pass, with intended negative-control failures. Sign-off follows independent review. Reconcile: sole existing-role delta is approved input-border; remaining export changes add authoritative roles.

## Slice 4 — path chips and tagline

- File chips now truncate on one line with ellipsis/full title and preserve full clipboard text; code filenames also use real block ellipsis. The four home chips share one actual stack gap after flattening Markdown p wrappers. Fresh package tagline is prose.
- Docs build and structured browser type/fmt gates pass. 12/12 home/path/header browser cases pass, including four zero-blocking axe captures. Independent slice review PASS; its nonblocking note about a vacuous tagline test was strengthened with a required paragraph count before sign-off.
- Reconcile: path spacing portion of reviewed #2452 is already integrated here and must not be duplicated in slice 5. No locks or colour declarations changed.

Strengthened tagline regression rerun passes in all four browser projects (4/4); slice 4 sign-off complete.

## Slice 5 — #2451 reviewed follow-ups

- Reconciled source fixes from #2452: bundled CSS, conservative classifier-aware browser skip and complete push diffs, deterministic comparison/tab/diagram identities before search, heading-specific permalink names, lane IDs, real test fixture paths and historical drift repair. Preserved richer dotenv grammar and path-gap fix already delivered. Token consolidation remains #2450.
- Built-in Vento escape preserves API generic text before highlighting; regression covers real SagaState and SagaDefinition signatures. No build highlighter warnings remain.
- Gates: two builds compare all 253 HTML pages, 202 twins, anchor fragments and assets exactly; only upstream Pagefind entry/filter/meta differences reported separately under #2453. 70 classifier tests + 1 workflow guard and 11 tooling tests pass. Structured tooling/site checks pass. Full browser receipt PASS: 100 tests, 0 skipped/flaky, 32 axe reports with zero serious/critical findings; 52 screenshot captures including requested six-page matrix.
- Docs export drift, snippets (668 scanned), 24,069 links and 15 caveat references pass. Independent slice review PASS.
- Required one-pass CLI runtime smoke attempted unchanged, exit 1: Aspire preflight and cleanup cannot reach a Docker daemon. Marked UNPROVEN locally; no gate suppressed or changed. Read-only leak reporter follows, and unchanged hosted workflow will be dispatched after push.
- Reconcile: only reviewed lightningcss lock additions; root lock untouched. No source gate removed, labels changed or foreign resources mutated.

## Native documentation carriers

Ran the documented gen:agent-docs-prose then gen:publish-assets tasks. Only CLI prose and MCP embedded docs differ; no unrelated generated output changed. Decoded carrier comparison: 205 entries before/after, 41 changed, no additions/removals, both non-site context MDX entries byte-identical, no internal gallery entries. Native prose/publish-assets/MCP-export freshness checks pass. Repo quality:gate exit 0 with existing warnings only. Generated-file type check and independent carrier sign-off pending.

Native carrier sign-off PASS in the independent reviewer. Generated-file structured type check passes; MCP 14 docs use 283,018 bytes under unchanged 294,912 budget. All 205 decoded entries preserved with 41 intentional changes and unchanged context MDX. All three real bundled style controls reject intended findings with exit 1. Current main advanced with #2442/#2457; reconcile it after this reviewed carrier commit, preserving the owner design prose and regenerating any changed carrier through native tasks.

## Current-main reconciliation

Merged ff6215ff7 (the complementary #2442/#2457 main commits) normally, without force push. Native prose and publish-assets regeneration after the merge produce no additional source diff: the mergeable carrier preserves both the new Utility specification and S8c rendered changes. Generated data remains in declared scope. Main’s process/label-definition changes are inherited baseline changes and are not PR-owned label operations. Final assets-barrel freshness check follows the committed generated data.

Final assets-barrel and review-thread gates pass. A final capture attempt at 3f73f1b84 raced with check:agent-docs-prose, which rebuilds _site, causing temporary light/mobile 404s (85/100 passed). No product change was made to bypass this; the complete matrix is rerun serially after freshness finished, with its own native receipt ID. This orchestration failure remains recorded rather than relabelled a product failure or hidden.

Final serialized browser receipt PASS at 3f73f1b84: 100/100, 0 skipped/flaky, 32 zero-blocking axe audits and the complete screenshot matrix. All freshness writers had finished before this rerun. The prior race receipt is retained outside the public repo and explicitly superseded by this successful same-source capture. Final evidence is summarized in gate-evidence.json without private transport details.

## Final IMPL-EVAL and hosted proof

Independent mandatory IMPL-EVAL round 1: PASS — implementation accepted, ready for review, no merge/release certification. All #2455 acceptance surfaces and #2451 delivery accepted without blocking code findings. Full verdict preserved in evaluate.md.

Subsequent hosted observations strengthen the recorded proof: Pages run 40708109088 succeeds at reconciled source 3f73f1b84, with screenshot/axe artifact 12823903814. Hosted E2E run 40706285391 completes static, Postgres and SQLite jobs successfully at f9c75c882; additive desktop-native fails because its expected installed executable is missing. No claim of all-workflow success is made. Local Docker limitation remains recorded, and no runtime process/resource was started here.

Final implementation source is unchanged since the evaluated 3f73f1b84; remaining commit carries evidence/lessons only. READY means ready for review, not merge authorization. No labels, merge, tag or release.
