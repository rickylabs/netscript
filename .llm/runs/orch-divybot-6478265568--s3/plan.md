# Plan & Design — READY FOR REVIEW

Phase 1 of #2416 only. Preserve the issue for gap components and future styles.

## Decisions

- Add a pure `./contracts` facade and category-grouped TypeScript data in `src/contracts/`, exported as JSON through a serialization function and a checked artifact. Schema covers props, parts (element/native/pseudo and conditions), variant/size/state/orthogonal axes, booleans, slots, APG pattern, keyboard map, token roles, priority, shipped availability and spec identity.
- Record the complete 104-entry design inventory, including every shipped surface; planned gaps are data only. Implemented attributes are an explicit subset of the fixed design contract, with native and CSS state representations documented. All six built Figma categories retain spec names/values.
- Migrate class expressions and CSS in component/blocks/island/runtime sources using syntax-aware edits; keep base/element classes. Data attributes carry variant, size, state, orientation and boolean axes. Preserve native interaction and CSS pseudo states without listeners or hydration. Each part receives `data-part`; slots/optional/pseudo parts are explicit.
- Preserve compatibility prop aliases (FormField, Panel tone, Toast error) while giving the contract its chosen names. No token value changes and no missing visual component implementation.
- CLI `ui:migrate variants` rewrites app-owned TSX and CSS, reports unsupported expressions rather than guessing, supports dry-run, preserves custom code, and is idempotent. Use the existing app-root resolver and FS port. No mutation of user lockfiles.
- Contract renderer assertions accept a style fixture provider, not Utility-specific source snapshots. Required parts/attributes and allowed values come from independent contract data. Negative controls remove a part/attribute and must fail.
- Utility parity compares rendered representative variants before/after in Chromium with identical CSS/token inputs. Keep durable compact diffs, not machine paths.

## Commit slices

1. Contract format/public facade and schema tests; contract files, package export/docs and run record. Gate: schema tests + scoped wrappers.
2. Component contracts grouped by category, JSON export, naming decision record; contract data/tests/docs and run record. Gate: inventory/serialization/schema tests.
3. Component data attributes, preserving styles; registry sources/styles, runtime/presentation and run record. Subdivide by coherent component categories if required. Gate: render checks, existing package tests, computed style parity.
4. `ui:migrate variants`; dedicated CLI feature and pure transformer/FS orchestration, thin root registration and run record. Gate: fixture conversion, idempotence, unsupported-input/dry-run cases and 0.0.8 consumer check.
5. Style-independent contract rendering coverage and negative controls; tests/browser proof/docs/run record. Gate: full targeted suites, scoped check/lint/fmt, doc/JSR audit, quality:gate/arch:check, and one full `e2e:cli run scaffold.runtime --cleanup --format pretty`.

Every slice updates worklog/context and is pushed with draft PR evidence. Separate Claude supervisor reviews before sign-off. Final separate Claude IMPL-EVAL, fix once and re-steer if necessary.

## Risks and mitigations

- Dynamic class expressions: use the existing TypeScript syntax tree API where possible; unsupported app edits are reported; no regex rewriting arbitrary JSX expressions.
- CSS specificity/cascade changes: replacement attribute selectors have class specificity; parity exercises all migrated modifiers and interaction pseudo states, not only a single screenshot.
- Spec exceeds shipped anatomy: explicit planned/native/pseudo representations prevent false acceptance and preserve gap scope.
- S2 registry ownership: no schema/build/add/apply edits; expose the migration seam and record embed refresh coordination in PR.
- Existing baseline/tooling failures: record exact unproven gates; no suppressions or unrelated source/lock edits.
- Docker/browser/evaluator availability: test actual commands, retain exit status; do not claim readiness from absent proof.

## Deferred scope / open decisions

No unresolved architectural decision. Gap components, additional styles, tokens/S6 and registry v2/S2 are deferred by owner scope. Legacy public names remain compatibility aliases. Exact visual design for unshipped axes is safe to defer; its contract is still specified.
