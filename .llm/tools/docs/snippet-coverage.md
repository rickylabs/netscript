# Documentation snippet compile coverage

`deno task docs:snippets` extracts every fenced block under `docs/site`, then type-checks the
unexempted TypeScript blocks on the current coverage floor against exact public `@netscript/*`
entrypoints. It compiles snippets only; it does not execute them or start services.

## Day-one floor

The initial floor covers these #1373 Tier-1 pages:

- `quickstart.vto`
- `index.vto` (zero TypeScript fences)
- `services-sdk/sdk.md`
- `services-sdk/how-to/add-a-service.md`
- `web-layer/query.md`
- `web-layer/examples.md`
- `web-layer/interactive.md`
- `web-layer/form.md`
- `web-layer/query-bridge.md`

The checked-in baseline is:

```text
scanned=578 ts=211 tsx=77 typescript=7 ts_like=295 tier1=35 checked=21 exempt=14 outside_floor=260 malformed=0
```

All 35 candidates occur on eight of the nine pages; `index.vto` contributes none. The checker fails
below 35 candidates or 21 checked blocks, above 14 exemptions, or on a malformed/reasonless marker.
Every exemption is printed as `page:line — reason`, so the 14-block prose-only remainder stays
visible and may shrink without weakening the gate.

## Expanding the floor

Expansion proceeds in coherent page families. Each wave adds pages to the checked policy, compiles
every new unmarked block, marks only deliberate fragments with a specific reason, lowers
`outside_floor`, and records the checked/exempt delta. The exemption baseline must not increase
without explicit reviewer-approved rationale.

1. Remaining golden-path families: the rest of `web-layer/**`, `services-sdk/**`, and
   `quickstart/**`.
2. Runtime guides: `ai/**`, `background-processing/**`, `data-persistence/**`,
   `durable-workflows/**`, `identity-access/**`, `observability/**`,
   `orchestration-runtime/**`, and `explanation/**`.
3. Tutorials: `tutorials/**`, one tutorial track per change so multi-file context stays reviewable.
4. Reference prose fences: `reference/**`, coordinated with #1108 but without expanding that
   issue's export-table scope. Canonicalize the seven `typescript` tags to `ts`; they already compile
   as checked aliases, so that edit is tag cleanup rather than new coverage.
5. Non-published source/templates under underscore directories, reported separately. Package
   READMEs remain #1377.

## Known ratchet window

The demoted positive-presence needles `queryOptions({ input })`, `queryOptions(input)`, and
`no server KV tier` live on `docs/site/reference/sdk/index.md`, outside the day-one floor until wave
4. Their positive presence is therefore not asserted in the interim. This is deliberate: literal
presence was a false-green API check and compilation is its replacement.

The retained exact one-page `createServiceQueryUtils` containment rule still prevents dialect B
from appearing on golden-path pages. Only positive presence on its sanctioned reference page is in
the temporary window; dialect placement remains enforced.
