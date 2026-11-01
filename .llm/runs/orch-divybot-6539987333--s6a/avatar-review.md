# Avatar native lazy loading independent review

PASS — same read-only Claude Opus5.5 high evaluator; terminal-failure streak0.

Reviewer explicitly corrects its earlier accepted deferral: requiring SSR theme context was too
broad. Native loading=lazy needs no theme input; Chromium defers a lazy display:none image while
fetching a visible one. Worklog/drift/context and visual evidence now carry this correction.

Verified122frozen source hashes; no unmerged paths; main7312ba4 reconciliation preserves both
parents. Only generated MCP carriers overlap. Badge and CodeBlock unchanged. Product fix is one
loading=lazy attribute on the existing Avatar img, with no CSS/props/theme API changes.

The regression renders actual Avatar SSR markup and the actual stylesheet on initial navigation.
It counts real browser requests, requires one visible control-image request, observes layout plus
networkidle, and asserts Utility hidden photo0 / NS One visible decoded photo1. Revealing the same
Utility photo in NS One must load it exactly once. Reviewer found no timing-based false green:
eager requests happen during parsing, while the undisplayed lazy image is not scheduled.

Old source4Utilityred(expected0/actual1)/4NSOnegreen; fix8green; fullfreshscaffold60browserPASS0skips.
335package tests,14rootchecks,scopedcheck/lint/fmt,installedcheck/build,quality/docs/release and
carrier freshnessPASS. All209docs retained,only2reviewedUtility-default pages differ frommain.

Commit merge+fix, non-force push samePR2503, then require new exact-head CI and both fullruntime
suites beforeREADY with fullSHA. EarlierCI is historical;localruntimeUNPROVEN. Refs#2419 only,
no labels/rebase/forcepush/PRmerge. CSS-size/QueryResult work remains excluded. Cockpit owns merge.
