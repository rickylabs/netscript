# Plan

## Profile and doctrine

- Primary: Archetype 6 (CLI/tooling) for scaffold output and CLI E2E.
- Secondary: Archetype 5 for the first-party AI plugin adapter.
- Overlays: docs for the generated README; frontend only for the Fresh dev-server consumer proof (no UI change).
- Current verdict: CLI historical restructure debt is recorded but this bounded test/template work must not deepen it; first-party plugin work remains thin adapter wiring.
- In-scope anti-patterns: AP-18 (semantic generated-output assertions), AP-19 (accurate generated instructions), AP-23/AP-25 (do not move behavior into composition or non-edge files).

## Locked decisions

1. Extend the existing CLI E2E/fixture harness for #1016. The test will assert both artifact contents, run `db generate`, and establish dev-server reachability with the hostile parent config present.
2. Prove counterfactual sensitivity for #1016 by temporarily removing the generated boundary in the fixture or running an equivalent controlled A/B; record the literal red result. Do not accept an assertion that passes in both states.
3. Treat #1021 as drift from the filed 0.0.2 state. Do not reorder correct current docs. Add a minimal regression assertion only if current tests do not semantically prove that clean-clone-required generated route artifacts are emitted/tracked.
4. Follow the #1017 workers pattern for #1039. Explicitly classify all seven AI starters. Sample tool/agent starters are omitted under `--no-samples`; any structural starter gets an explicit comment/policy. Supply an alternate barrel that does not reference suppressed samples.
5. Do not change `packages/plugin`, plugin-install transport, or `includeSamples` plumbing. If current transport prevents the AI proof, stop and coordinate with #1017 instead of duplicating its fix.

## Open-decision sweep

- Exact E2E file placement: must resolve now after focused harness inspection; it affects only test location, not contract.
- Which non-tool/agent AI starters are structural: must resolve now by inspecting emitted imports and the generated workspace type-check.
- Whether #1021 needs a code change: must resolve now by locating existing semantic coverage. Safe outcome is an evidence-only issue slice if the acceptance behavior is already guarded.
- Clean-clone CI job: safe to defer if the existing scaffold suite is not literally an empty-checkout job; record the unchecked acceptance box honestly rather than inventing a broad workflow.

## Commit slices

1. **#1016 hostile-parent boundary proof.** Files: existing CLI E2E fixture/gate tests plus run artifacts. Gate: focused E2E test, controlled boundary-deletion red proof, then scaffold consumer gate. Push/comment before S2.
2. **#1021 clean-clone route-artifact proof.** Files: the narrowest existing generator/E2E test if coverage is absent, otherwise run artifacts only. Gate: actual clean clone plus literal README command and artifact inspection. Push/comment before S3.
3. **#1039 AI no-samples classification.** Files: `plugins/ai/src/adapter/plugin.ts`, narrowly required resource scaffolder/barrel files, black-box fixture test, run artifacts. Gate: plugin install `--no-samples`, absence of sample tool/agent, generated workspace type-check, focused tests. Push/comment.
4. **Merge-readiness evidence.** Files: run artifacts/PR body only. Gates: `deno task check`, `deno task test`, scoped lint/fmt wrappers, `deno task quality:gate`, relevant CLI scaffold suite, JSR/doc checks as applicable; then separate IMPL-EVAL and review-thread gate.

## Risk register

| Risk | Mitigation |
| --- | --- |
| #1016 test passes without exercising upward lookup | Mandatory A/B deletion proof and artifact inspection. |
| Dev server leaks | Use the existing managed process gate and verify teardown; run leak reporter on symptoms. |
| #1021 fix targets obsolete behavior | Current-main clean-clone reproduction is authoritative; avoid unnecessary README edits. |
| AI alternate barrel leaves dangling imports | Type-check the actual generated `--no-samples` workspace. |
| Collision with #1017 | No transport/core edits; stop and report if transport blocks proof. |

## Required gates

- Focused unit/E2E tests per slice; generated artifacts inspected.
- Scoped wrapper evidence for check/lint/fmt; root `deno task test` as requested.
- `deno task quality:gate` for `packages/**` / `plugins/**` changes.
- CLI consumer gate covering generated project, plus the narrowest scaffold suite that includes AI/no-samples.
- JSR surface audit: no planned public/export change; focused doc/publish evidence only if implementation changes an exported surface.

## Deferred scope

- #1017 transport/plumbing and all adjacent plugin-wiring work.
- Scaffold agent-surface work in `/home/codex/repos/ns004-scaffold`.
- General route generation, Fresh migration, README redesign, or new broad CI architecture.
- A new clean-checkout CI workflow if the existing suite cannot host a minimal literal check; this remains an honestly unchecked #1021 criterion.
