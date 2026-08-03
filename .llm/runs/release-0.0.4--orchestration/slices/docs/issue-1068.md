## Summary

`llms.txt` is a flat 185-link catalog. It tells an agent what exists; it does not tell it what to
read, in what order, for the task in front of it. Two wave-four agents read six manual pages each,
all backend, and never reached the web layer — not because those pages are bad, but because nothing
sequenced them.

## Evidence

Run 1 (Claude Fable 5) read exactly six manual pages: quickstart, concepts, durable-workflows/sagas,
explanation/durability-model, and the two context articles. It never opened a Web Layer page, and
never opened `docs/deno-doc/fresh-ui.txt` — 1,319 lines, present in its bundle, linked three times
from `llms.txt`, and already a declared dependency in its own `deno.json`.

It then hand-wrote a 360-line island and 291 lines of bespoke CSS, reimplementing `Button`, `Input`,
`Card`, `Badge` and `FormField` that were already in its app.

The information was all present and correctly linked. The **sequencing** was absent.

## Proposal

Add a short task router **above** the catalog. Five or six rows, "If you are building…":

> **A real service-backed UI:** read Web Layer overview (38 lines), Live Dashboard chapters 4–5,
> then inspect the scaffold's generated service route and `components/ui/mod.ts`. Use
> `deno-doc/fresh.txt` / `fresh-ui.txt` afterward for symbol details.

The frontend row matters most, but every row should end the same way: manual for the model,
scaffold for the shape, generated surface for symbols. That ordering is what neither wave-four agent
derived on its own.

## Acceptance

- [x] `llms.txt` opens with a task router of ≤ 8 rows, before the catalog
- [x] Each row names a reading order, not just a set of links
- [x] The router is included in the offline bundle build (`.briefing/build-docs-bundle.sh`)
- [x] An agent asked to build a service-backed UI reaches a Web Layer page before writing a route

## Notes

This is documentation only — no release cut required, and it is a good candidate for a subagent
slice. Full analysis: wave-four docs investigation, remediation #3.

