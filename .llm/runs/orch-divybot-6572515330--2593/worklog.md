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
