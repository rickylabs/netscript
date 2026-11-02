# Recovery7 design checkpoint — latest-main rebase and combined Utility behavior

## 1. Public surface

Rebase parent orch/divybot-6538112485 (remote71d8df6f) from main7feb24c7 onto
latest fetched main43aa891e. Then restack child feat/fresh-ui-s3-phase2b
(remote d0d8d922). Preserve the complete approved phase2a APIs and native
keyboard/clipboard/tab/diff behavior, all latest-main fixes and Utility role
bindings, and the child's reviewed components. No new identity, future nineteen
promotions, token-value change or chosen dependency/version upgrade.

Unlike recovery6, main changes maintained UI source:284 files,26 overlapping
parent paths. Record actual changed sources and test them; no unchanged-source
browser claim. Main includes automatic CodeBlock syntax rendering, Badge info,
Avatar/Donut/Prose coverage, route bindings and deterministic offline-docs
provenance. Preserve those additions and the frozen legacy registry fixture.

## 2. Domain vocabulary

Raw code is the exact clipboard payload. Display rows preserve row identity,
numbers, diff signs and variants independently of syntax markup. Caller
CodeBlock.Token/line.content remains authoritative. Main's automatic highlighting
applies to recognized languages where content is absent; unknown languages stay
native escaped text. Tabbed files use their own language. A parser's rendered
markup must never replace raw clipboard text or add focus/keyboard behavior.
Utility binds existing semantic roles; it does not authorize dropping the richer
component contract or changing token values.

## 3. Ports

Use the upstream highlight.js common highlighter already added by main, with its
same npm:^11 registry mapping and matching standalone browser import. Inspect the
installed public API first: HighlightResult.value is escaped span markup; the
continuation fields _top/_emitter are explicitly private and must not be used.
The native upstream HTMLRenderer emits escaped text and balanced span tags.

Highlight the complete displayed source once, preserving multiline comments,
strings and embedded-language state. A small local transfer function may split
only that trusted emitter output into balanced line fragments by closing and
reopening its span stack at newlines; this is not an HTML parser for caller input.
It must preserve exact decoded text and nested syntax across line boundaries.
Group fragments back to caller rows when a row text itself contains a newline.
Caller content takes precedence. Memoize by displayed text/language rather than
by a freshly allocated inferred-row array. Keep Tabs panels isolated and avoid
conditional hooks. Never highlight each line independently or consume private
upstream parse trees to simulate continuation.

Canonical serializers/registry embeddings regenerate derived conflicts from the
combined maintained source. A bounded resolution driver handles only explicitly
allowlisted generated files and stops on every maintained conflict. No final
compressed carrier is chosen from either side. Review and combine maintained
conflicts individually, then refresh site/corpus/assets/publication carriers.

## 4. Constants and invariants

Keep existing public prop/part/variant/keyboard vocabulary. No broad exemption
for highlighter data attributes or new base mutation. Existing class-based syntax
markup stays inside caller content; public seven CodeToken roles remain valid.
Bind emitted classes to the same existing syntax roles, retaining the contextual
ink mix and measured AA contrast across default/added/removed/highlighted rows.
Adapt main's role selectors to the enhanced anatomy without discarding its
semantic intent or overriding sm/tab/diff behavior accidentally. No token edits,
new parser/dependency family, new fallback engine or lock churn. Topic root,
Fresh UI and docs locks must have zero delta against the new base.

## 5. Commit slices and validation

Commit this reviewed checkpoint before rebasing. Save exact remote heads and
source hashes privately. Replay the parent commits, regenerate derived conflicts
at each stop, and record every maintained conflict resolution. A focused
integration source commit follows meaningful tests; then committed-source carrier
checks, quality/publication and the same independent integration/evidence review
precede the parent force-push with an exact lease. Repeat for the child restack;
never discard remote commits. Mandatory zero added-line plus whole-run public
audit is a dependent prerequisite before every push.

Run full parent package and browser matrices because maintained source changed.
Add meaningful highlighter controls: known/unknown language, hostile source,
multiline/nested syntax across rows, explicit content precedence, per-file tab
language, exact clipboard payload and decoded display text, line numbering/diff
signs/counts, raw line endings and installed TSX/CSS dependency fidelity. Retain
all existing contract/keyboard/browser negatives and measured contrast gates.
Run scoped wrappers0drop, quality/architecture, preflight/docs accuracy/export
drift/site build, native publication0slow types, explicit doc-lint baseline
attribution and all four committed-source carrier checks. No waiver or silent
loss of main tests. Final runtime/current required CI remain unproven until run.

## 6. Deferred scope

Recovery is integration, not assignment completion. Remaining11b is Toc,
AnchorNav,RuledGrid,Hero,Desktop audit and original Shell Toc integration;12 is
production declared x extensions and the all-style harness;13 is full final
runtime/whole-phase/evaluation/exact-head CI. Historical runtime is predecessor
proof only and draft-skipped checks are not green. No READY, labels, merge or
release. Later nineteen promotions still follow the Utility canary.

## 7. Contributor and evidence path

Combine main's README/reference docs with the actual copied APIs. Record the
resolved conflict paths, source changes and measured results in this run. Public
records use repository-relative paths and verdict/count-only leak output. Raw
logs, receipts, worktree/session identity and baseline hashes remain private.
The same independent read-only Claude Opus5.5 high evaluator reviews the design
and integration; failure streak0. No new evaluator session or self-certification.
