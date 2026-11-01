# Docs 11b2 source review pack

Implementation is frozen on 23 source/carrier paths and nine canonical browser
build artifacts at the `f1889578` working tree. The same source round1 passed with zero blockers; source commit and committed
proofs are next. The same independent design review passed round two; its
binding complementary-range and fractional-width requirements are implemented.
All final local gates pass and the same independent source round1 passed.

RuledGrid and Hero complete the 17 missing phase2b identities, bringing the
working-tree typed/JSON inventory to 104 shipped identities. That count does not
complete the assignment: the actual six-component Desktop audit, production
extension declarations, all-style harness and whole-phase runtime/final review
are still required. No READY.

RuledGrid uses the ledger's private Docs-card anatomy rather than importing the
base Card. Its Cell member supplies optional eyebrow, icon, title, description
and action content. Native controls retain their behavior; frames add no click
handler, link role or tab stop. Logical cell rules follow the actual responsive
column count. An equal-specificity reset prevents stale desktop Nth-child rules
from removing medium-band boundaries. Feature cards have independent hairlines
and a 32px gap.

Hero has one native section and one necessary inner layout part. It composes
caller-owned actions, code/media and file-path chips without L2 imports or an
island. Heading rank is independent of typography. Paths stay inside the aside,
which renders when either aside content or paths exist. Forced desktop/mobile
references own data-breakpoint; automatic mode leaves it absent and uses the
block's content width. Direct owned-part selector chains prevent an outer mobile
Hero from restyling a feature card or overriding a nested forced desktop Hero.

Both roots use named inline-size containers. Complementary CSS ranges cover
widths at and between 767 and 1100, including fractional values. Browser checks
use an independent native query probe, test every column request and layout at
767, 767.5, 768, 1100, 1100.5, 1101 and 1120 in both directions, and exercise a
real docs SidebarShell with a rail at a 1280 viewport. Forced views, empty slots,
long content, native Tab/Shift+Tab/Enter/Space, strict axe, no-JavaScript SSR and
actual caller Button/CodeBlock/FilePathChip/Figure composition are covered.

Catalog additions explicitly normalize unshipped X8/X9 placeholders. Settled
column, variant, layout and forced breakpoint values are preserved. The root
and qualified Cell slots/conditional parts, Hero headingLevel and paths, and
forced-only breakpoint attribute are represented in both typed and JSON data.
Canonical registry/style/collection/native/legacy and CLI projections include
both items. Actual ui:add consumer tests prove copied TSX/CSS fidelity, compile,
lint and SSR. No token value, dependency or lock change is made.

| Current proof | Result |
| --- | --- |
| Full package, including installed consumers | 801 PASS, zero failed/ignored |
| Focused current Chromium | 28 PASS |
| Focused current Firefox/WebKit | 56 PASS, including both dark WebKit widths |
| Full Chromium including touch | 767 PASS including touch, zero retries/flaky/skipped, 420 captures |
| Affected Firefox/WebKit Docs composition/navigation/Shell | 256 PASS, zero retries/flaky/skipped, 120 captures |
| Dedicated docs browser suite | 140 PASS, zero retries/flaky/skipped, 128 captures |
| Source check/lint/fmt | Nine files each, zero dropped |
| Browser checks/lint/fmt | Four fixture plus one spec check; five lint/fmt, zero dropped |
| Durable working-tree quality/architecture | PASS; not post-commit certification |
| Preflight/docs accuracy/export drift | PASS on unchanged selected source |
| Native member publication | PASS, zero slow types |
| Site and registry build | 260 HTML, 135 registry artifacts, four existing syntax allowances |
| Export doc-lint | Raw exit 1, accepted existing #2531: 123 exact TS findings plus one JSON limitation, zero new/removed |
| Parent and child review-thread gates | PASS, zero threads and unanswered items |

Real negative browser controls first reproduced the medium-band border and
nested style-containment bugs. A later affected run reported dark WebKit raw
fixture buttons at contrast 1.81; the caller now uses the existing themed native
Button. The strict contrast rule is unchanged, with no new allowance. Keyboard
stress fixtures are separate from the ledger-shaped visual reference examples.
The corrected current 84 focused cases pass; interrupted and failed broad runs
are historical and never counted as final passing evidence.

Raw outputs, receipts, hashes and captures remain private. Public resource and
privacy records contain verdicts and counts. The unknown-owner native diagnostic
remains untracked, untouched and excluded; no foreign resource is mutated.
Runtime and required final-head CI remain unproven. Same source review, source
commit, canonical carrier closure, committed-head quality/publication, the same
evidence review, repeated public audit and exact-lease push are still required
before this unit becomes terminal.
