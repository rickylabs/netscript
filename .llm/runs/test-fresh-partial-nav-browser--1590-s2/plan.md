# Plan — Slice 2 browser proof

The locked plan remains
`.llm/runs/fix-fresh-partial-nav--1590/plan.md`, section “Slice 2 — deterministic Fresh/Vite A → B
→ A browser proof.” Its separate PLAN-EVAL returned `PASS`; this implementation run does not
redesign it.

## Selected profile

- Package: `packages/fresh`
- Archetype: 4 — Public DSL / Builder, Keep verdict
- Overlay: frontend/browser runtime
- Product source: forbidden for this proof slice

## Slice

One implementation slice creates the four planned Fresh/Vite fixture files and extends the existing
browser evidence file. `packages/fresh/deno.json` remains unchanged because its explicit browser
task already selects the evidence file.

## Gates

Run scoped check/lint/fmt, navigation and Fresh source tests, `quality:gate`, full-export doc lint,
JSR audit, publish dry-run, diff/file-ceiling/lock checks locally. The supervisor owns the hosted
`fresh-browser` durable gate and formal separate-session IMPL-EVAL. Chromium, Docker, Aspire, and
`e2e:cli` are forbidden on this worker.

## Deferred decision

The publish-filter mismatch found during the dry-run is not resolved here because the locked file
contract permits `packages/fresh/deno.json` only for a browser-task adjustment. See `drift.md`.
