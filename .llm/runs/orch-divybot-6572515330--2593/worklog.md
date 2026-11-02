# Worklog

## Design

1. Public surface: scaffolded Fresh app builds against published dependencies while preserving existing APIs; a pre-publish check rejects server providers in the browser graph.
2. Domain vocabulary: client graph (hydrated islands and runtime dependencies), server provider (AI adapter and provider SDK), published graph (JSR-rewritten specifiers).
3. Ports: existing Deno module graph, Vite/Fresh build hooks and repository validation runners; no new abstraction proposed.
4. Constants: existing package IDs, public subpaths and gate task names remain authoritative; name any new guard's denied graph boundary explicitly.
5. Slices: S0 this run record/draft, gate git diff/privacy review; S1 smallest owner boundary + regression/negative-control + canonical carriers, gates published Vite before/after and structured wrappers; S2 final evidence, gate review threads and exact-head handoff.
6. Deferred scope: publishing, merging, unrelated UI, full local E2E, model/provider changes.
7. Contributor path: research.md links the diagnosed owner and guard once reproduction completes.

## Intake and reconciliation

Issue and branch checked against baseline main; no pre-existing PR. Routing queried before implementation. RTK absent. Source changes have not started. Explicit operator Refs-only instruction takes priority over generic dispatcher closing-keyword boilerplate; coordinator controls issue acceptance and merge. Owner delegates evaluator and sign-off to Cockpit; self-review is explicitly not independent certification.

## Locked owner boundary (before source slice)

The offending new edge is `scaffold-plugin-capabilities.ts` → Vite `import.meta.glob` of the app-owned `ai/ai.ts` → `@netscript/ai/anthropic` → provider adapter inline npm imports. The plain client build succeeds; the observed failure is SSR traversal, so the issue's initial client-graph hypothesis is corrected. Preserve the runtime readiness call through a computed file URL loaded natively by Deno with Vite's documented ignore directive. The caller already discovers the workspace root; pass it explicitly so bundled output paths never determine provider paths. No aliases, package externals, public exports, or Fresh UI changes.

Pre-publish contract: real Vite production build of the emitted loader must never traverse an app-owned provider module. A fixture provider imports the exact offending inline npm specifier and fails at that edge. Restore the old glob in an isolated negative control and require rejection. Execute emitted build output with native test modules to verify readiness and optional-module handling. Contributor entry is packages/cli/src/kernel/assets/app/README.md.

## S1 implementation and gates

Replaced both optional AI globs with a computed native Deno import under the explicitly passed workspace root. Existing model schema validation, handle resolution and sanitized capability states remain. Regenerated CLI embedded assets with `deno task gen:assets-barrel`; no Fresh UI or lock delta.

Added `check:scaffold-provider-boundary` to the required CI quality lane via the gate receipt catalog. This is an actual Vite SSR build of the shipped loader, with a JSR-style inline npm poison edge; it also executes built output and verifies six capability states. The old runtime glob is a mandatory negative control. No app Vite aliases or externals changed.

Local gates: structured check/lint/fmt cover all three owned TS files (0 findings); structured generated-app check covers both rendered capability files (0 findings); focused structured tests 21/21; provider gate PASS, standalone negative control exits 1 with the original npm specifier; quality:gate exits 0 (existing warnings only). Published canary build with the two template changes exits 0, SSR module count 1076→776 and no AI runtime/model chunks. Earlier warmed baseline also exits 0: original cold CI failure remains canonical before evidence, and controlled old-glob reproduction is cache-independent. Asset freshness checks compare to committed HEAD, so run again after committing canonical output. Cockpit IMPL-EVAL and e2e-cli CI remain required; this is not self-certification.

Reconcile: all source changes are within the declared surface, plus the tooling-only gate catalog entry required by durable CI receipts. Baseline remains main's canary2 source; no unrelated work integrated.

## S2 handoff and reconciliation

Source S1 committed/pushed as c9e5e759ea0b1d713ab91283cd1e4639cc5ad6a5. Its per-slice PR comment links the evidence. Committed asset freshness now passes (exit 0), the durable provider-boundary gate passes at this source head, and review-thread gate passes (0 threads, 0 unanswered). A public receipt projection omits runtime identity and private cwd. The final-head receipt will be run after this evidence-only commit and summarized on the PR, avoiding an endless commit/receipt cycle.

Self-review is in self-review.md; no local blockers, no accepted architecture debt. It is not independent certification. Dated lessons and focused memory notes are retained. No source moved since S1. No local resources were started, and there are no ownership-uncertainty symptoms requiring cleanup. Temporary dependencies and caches were retained; only run-created lightweight probe fixtures were removed.

Next action: mark the finished implementation ready for review so CI can run, and hand the immutable final head to the owner-assigned Cockpit lane. The e2e-cli verdict is required; the coordinator controls its label. Stop at READY without merging, tagging or publishing. CI/evaluator results will be reported as observed, never predicted.
