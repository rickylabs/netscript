# PLAN-EVAL — fix-fresh-form-navigation-drop--0.0.7

- Plan evaluator session: independent separate-session PLAN-EVAL, cycle 1, 2026-08-31
  (Claude Code host, OpenRouter-routed model `qwen/qwen3.8-flash`; evaluated head `8907c0849`, base `dea449911`)
- Run: `fix-fresh-form-navigation-drop--0.0.7`
- Surface / archetype: `@netscript/fresh/form` published `FormCollectionStrategy` / Archetype 4 — Public DSL / Builder
- Scope overlays: `frontend`

## Decisive premise check (A) — TRUE

Verified independently, not from the research table:

1. `applyCollectionStrategy()` returns untouched props for `!strategy || strategy.mode === 'client'`
   (`components/enhancement.tsx:49-51`), before `resolveFormNavigationProps()` is consulted (lines 55, 62-72).
2. Repo-wide search for consumers of `collectionStrategies` finds only the producer
   (`useFormEnhancement`, `enhancement.tsx:85,160`) and the state-type declaration
   (`_internal/runtime-types.ts:141`). No package-owned code performs a client-mode collection
   update or submission, so no package path could execute a document navigation for it.
3. Form-level document navigation remains expressible after the narrowing via
   `options.strategy: FormNavigationStrategy` (`_internal/runtime-types.ts:108`, applied at
   `enhancement.tsx:116`) and via `mode: 'server' | 'hybrid'` collection strategies
   (tested at `components/form.test.tsx:187-205`). Route (2) removes no live capability.
4. Route (1) would stamp `f-client-nav: 'false'` onto a button whose declared mode never submits —
   metadata describing an operation the mode does not perform. Doctrine A2 supports route (2).

The plan's central decision is correct; the plan's shape is right.

## Checklist results

| Plan-Gate item                          | Result | Evidence / location |
| --------------------------------------- | ------ | ------------------- |
| Research present and current            | PASS   | `research.md` Re-baseline: base `dea449911` vs `origin/main` `eaea940bea`, intervening commit checked (Fresh AI only). Evaluator re-verified findings 1, 2, 3, 6, 7, 8, 10, 11 against the tree — all hold. |
| Decisions locked                        | PASS   | D1–D7 (`plan.md` Locked Decisions) with rationale; worklog Decisions table concurs. |
| Open-decision sweep                     | PASS   | Sweep table, all rows statused; evaluator's own sweep found no unflagged rework-forcing decision (see below). |
| Commit slices (< 30, gate + files each) | PASS   | 2 ordered slices, each names proof, gate, files (`plan.md` Commit Slices; worklog mirrors). |
| Risk register                           | PASS   | 7 risks with mitigations incl. understated break, over-narrowing union, doc-lint private-ref leak, lock drift. |
| Gate set selected                       | PASS (note) | Arch-4 matrix + static/consumer families selected with base measurements and S2 contracts; `./form` doc-lint zero and 45-diagnostic non-increase locked. Note: F-2/F-4/F-8/F-9 not enumerated; substantively covered by the selected doctrine (AP-1..30) and code-quality scans, and the change adds no helpers/classes/permissions/`deno.json` churn. S2 handoff should record their disposition. |
| Deferred scope explicit                 | PASS   | Non-Scope, Hidden Scope, worklog Deferred Scope; MCP corpus / release baseline / site reference named exactly and reported, not absorbed (D6). |
| jsr-audit surface scan (pkg/plugin)     | PASS   | `research.md` JSR/published-surface section: `./form` export chain scanned (evaluator confirmed symbol absent from root `mod.ts`), interface→type-alias kind move named as potentially breaking, publish dry-run and audit baselines measured at `dea449911`. |
| Frontend overlay                        | N/A justified | `runtime-gates.md` requires browser validation "for changed UI"; runtime is byte-for-byte unchanged under the ceiling — N/A with stated reason is correct. |

## Claim table

| Claim | Result | Deciding plan text |
| ----- | ------ | ------------------ |
| A. `mode: 'client'` cannot honour `navigation: 'document'` | CLOSED — premise true, verified from code | D1: "Client mode owns an in-browser collection update and has no package-owned document-submission operation; route (1) would attach fallback metadata and misstate behavior." |
| B. Breaking-change honesty | CLOSED | D5 + "State potentially breaking type change in plan, handoff, later PR metadata, and surface-diff evidence."; blast radius bounded by `./form`-only export (finding 8, verified) and D4. Two-path ceiling suffices because the contract is purely type-level and witnessed in a checked file. Addendum: D5's wording covers consumer object literals; interface→alias also breaks consumers who `extends FormCollectionStrategy` — name it in the PR/surface-diff note. |
| C. Deferred cross-package churn | CLOSED — deferral correct, with a hard supervisor obligation | D6 + research: "S2 must report that discovered churn to the supervisor rather than commit it." Deferral is right under the locked ceiling, but the repo is knowingly stale between S2 and follow-up: the supervisor must assign regeneration of `packages/mcp/src/infrastructure/export-surfaces/export-surface-corpus.generated.ts`, `.llm/tools/release/baselines/public-surfaces.json`, and `docs/site/reference/fresh/index.md:379` (all three existence-verified) to land with the same release 0.0.7 train, before the cut. |
| D. Compile-time witnesses genuinely gate-enforced | CLOSED | Validation Plan row 1: "Focused checked negative/positive witnesses in `form.test.tsx` through the structured check wrapper"; Scoped check contract "PASS, 0 occurrences". `form.test.tsx` is compiled by the scoped check, so an `@ts-expect-error` witness becomes an unused-directive error on any future widening; positive witnesses guard over-narrowing. Runtime tests cannot express type rejection and runtime is unchanged — with no host lease, compile-time proof is the right bar. |
| E. Invalid state unrepresentable after | CLOSED for the defect | Client branch `navigation?: never` rejects `'document'` (not assignable to `never`) and `mode: 'client'` fails the server/hybrid discriminant — the literal matches neither branch. Honest residual, disclosed in worklog Deferred Scope: untyped JS consumers can still send it (no runtime diagnostic — route (2) is a TypeScript contract fix by design), and legacy `partial`/`clientNav` stay representable-but-dropped in client mode (D4, registered as safe-to-defer cleanup). |
| F. Standard plan-gate checklist | PASS | See checklist table above. |

## Open-decision sweep (evaluator-run)

None that would force rework if deferred. The only shape choice left to S2 (inline union vs named
branch aliases) is constrained by the registered doc-lint mitigation ("prefer an inline exported
union") and is not a rework risk.

## Verdict

`PASS`

## Notes

- S2 must not touch `enhancement.tsx`; ceiling + Drift Watch "Product diff ceiling plus explicit
  no-change review" carry that.
- Supervisor pre-merge obligations from this eval: (1) name the owner of the MCP-corpus /
  release-baseline / site-reference regeneration and land it in the 0.0.7 train (claim C);
  (2) ensure the PR metadata labels the change potentially-breaking and mentions the
  `interface extends` consequence (claim B); (3) record F-2/F-4/F-8/F-9 dispositions in the S2
  handoff (checklist note).
- Effort attestation: launched OpenRouter route `qwen/qwen3.8-flash`; no reasoning-effort tier can
  be honestly attested from inside this session (same limitation the harness imposes on OpenHands
  reports).
