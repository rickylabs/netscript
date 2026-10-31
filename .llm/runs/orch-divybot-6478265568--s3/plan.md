# Plan & Design — READY FOR REVIEW

Phase 1 of #2416 only. Preserve the issue for gap components and future styles.

## Decisions

- Add a pure `./contracts` facade and category-grouped TypeScript data in `src/contracts/`, exported as JSON through a serialization function and a checked artifact. Schema covers props, parts (element/native/pseudo and conditions), variant/size/state/orthogonal axes, booleans, slots, APG pattern, keyboard map, token roles, priority, shipped availability and spec identity.
- Publish contracts for every shipped surface plus the six owner-approved built Figma categories: Actions, Forms, Navigation, Overlays, Data display, Feedback. Unshipped entries outside those categories remain research inventory only, not published contracts. The owner explicitly requires contracts for the six categories; this is contract data, not gap component implementation. Implemented attributes are an explicit subset of the fixed design contract, with native and CSS state representations documented. All six built Figma categories retain spec names/values.
- Migrate class expressions and CSS in component/blocks/island/runtime sources using syntax-aware edits; keep base/element classes. Data attributes carry variant, size, state, orientation and boolean axes. Preserve native interaction and CSS pseudo states without listeners or hydration. Each part receives `data-part`; slots/optional/pseudo parts are explicit.
- Preserve compatibility prop aliases (FormField, Panel tone, Toast error) while giving the contract its chosen names. No token value changes and no missing visual component implementation.
- CLI `ui:migrate variants` rewrites app-owned TSX and CSS, reports unsupported expressions rather than guessing, supports dry-run, preserves custom code, and is idempotent. Use the existing app-root resolver and FS port. No mutation of user lockfiles.
- Contract renderer assertions accept a style fixture provider, not Utility-specific source snapshots. Required parts/attributes and allowed values come from independent contract data. Negative controls remove a part/attribute and must fail.
- Utility parity compares rendered representative variants before/after in Chromium with identical CSS/token inputs. Keep durable compact diffs, not machine paths.

## Commit slices

1. Contract format/public facade and schema tests; contract files, package export/docs and run record. Gate: schema tests + scoped wrappers.
2. Component contracts grouped by category, JSON export, naming decision record; contract data/tests/docs and run record. Gate: inventory/serialization/schema tests.
3. Component data attributes, preserving styles; registry sources/styles, runtime/presentation, regenerated registry embed and run record. Subdivide by coherent component categories if required. Gate: render checks, existing package tests, computed style parity.
4. `ui:migrate variants`; dedicated CLI feature and pure transformer/FS orchestration, thin root registration and run record. Gate: fixture conversion, idempotence, unsupported-input/dry-run cases and 0.0.8 consumer check.
5. Style-independent contract rendering coverage and negative controls; tests/browser proof/docs/run record. Gate: full targeted suites, scoped check/lint/fmt, doc/JSR audit, quality:gate/arch:check, and one full `e2e:cli run scaffold.runtime --cleanup --format pretty`.

Every slice updates worklog/context and is pushed with draft PR evidence. Separate Claude supervisor reviews before sign-off. Final separate Claude IMPL-EVAL, fix once and re-steer if necessary.

## Risks and mitigations

- Dynamic class expressions: use a bounded byte-preserving tokenizer for JSX class attributes, quoted strings, comments, balanced expressions and the known cn/mapping/conditional forms; unsupported app expressions produce a diagnostic and no file mutation. CSS tokenization skips comments/strings and changes selectors only, retaining specificity. No new parser dependency or lock change.
- CSS specificity/cascade changes: replacement attribute selectors have class specificity; parity exercises all migrated modifiers and interaction pseudo states, not only a single screenshot.
- Spec exceeds shipped anatomy: explicit planned/native/pseudo representations prevent false acceptance and preserve gap scope.
- S2 registry ownership: regenerate registry.generated.ts with existing deno task gen:assets-barrel whenever registry sources change; commit and gate it with check:assets-barrel. This reruns existing tooling without editing registry schema or ui:build/add/apply. Record the hook in PR for S2.
- Existing baseline/tooling failures: record exact unproven gates; no suppressions or unrelated source/lock edits.
- Docker/browser/evaluator availability: test actual commands, retain exit status; do not claim readiness from absent proof.

## Deferred scope / open decisions

No unresolved architectural decision. Gap components, additional styles, tokens/S6 and registry v2/S2 are deferred by owner scope. Legacy public names remain compatibility aliases. Exact visual design for unshipped axes is safe to defer; its contract is still specified.

## Matrix gate mapping

- Archetype 1 F-1/F-5/F-6/F-7/F-8/F-10/F-11/F-12/F-14/F-15/F-16/F-17/F-18/F-19: scoped source check/lint/fmt/test wrappers, public contract import/JSON smoke, structured doc-lint, JSR audit and publish dry-run, quality:gate (includes arch:check). Applicable to slices 1/2/3/5.
- Archetype 6 universal F-1…F-19: the same wrappers/audits on owned CLI files, plus injected FS/CLI architecture review. Applicable to slice 4/5.
- F-CLI-1…F-CLI-31: PENDING_SCRIPT (no dedicated scripts, per archetype §Fitness Gates), with manual evidence: bounded files/folders; no new public↔maintainer or kernel→surface imports; no direct Deno/console/exit; constructor-injected command/use case; no new barrels/templates/inheritance; root registration remains declarative. Existing untouched binary/extension/registry obligations remain baseline. New command is checked against all applicable rules.
- Arch 6 consumer validation: execute migration in a real copied 0.0.8 app, run its deno task check, import the published contract facade and parse its JSON.
- Fresh UI configured freshness/browser gates: check:assets-barrel, existing registry render/generated suites, and fresh-ui-browser-contract (tools/fresh-ui-browser/accessibility.contract.ts). Run the Chromium matrix/axe baseline and Utility computed-style parity; do not update allowances to hide new failures. If markup identity changes existing targets, record exact evidence and only revise legitimate decreased/moved allowances.
- Scaffold-output release gate: one complete deno task e2e:cli run scaffold.runtime --cleanup --format pretty before READY, with exit status and Docker availability.

## Tokenizer contract

The migrator supports native JSX class/className string and balanced expression attributes; cn literal/conditional inputs; named variant/size map lookups; and known template modifiers. It only removes proven legacy tokens. Unknown dynamic class production or conflicting existing attributes makes the file unsupported and leaves its bytes untouched. A whole-app preflight collects all diagnostics before writes. Dry-run performs the same analysis. Tests cover strings/comments/URLs/unrelated classes, nested braces/ternaries, multiple axes, idempotence, unsupported input, and prior customized copies. This is a narrow NetScript migration policy, not a general TypeScript parser.
