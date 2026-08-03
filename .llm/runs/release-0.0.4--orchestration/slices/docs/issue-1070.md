## Summary

Generated `deno doc` surfaces are what agents actually read — far more than the manual. In wave four
`docs/deno-doc/fresh.txt` was consulted 17 times, tying for the single most-read file. But the
generated surfaces do not cross-route, and for copy-source UI they are actively misleading.

`fresh-ui.txt` was **never opened** by the agent that most needed it, and even if it had been, it
mostly describes types — because the useful Fresh UI surface is copied into the app, not exported at
runtime.

## Proposal

**In `fresh.txt`**, add a generated module overview at the top: link `fresh-ui`, and state when to
read the scaffold instead of package docs. `fresh.txt` is 5,502 lines with builders starting at 644
and streams at 5,162 — a reader who lands in the middle has no map.

**In `fresh-ui.txt`**, render the registry collection and item names from `freshUiRegistryManifest`
rather than only its type, and state plainly:

> Runtime behavior: `/interactive`, `/primitives`, `DataGrid`. Visual components and blocks are
> **copied into your app** — inspect `components/ui/mod.ts` and `/design`, or run `ui:add`.

## Why it matters

Generated docs are excellent lookup tools once you know the symbol you want. They are poor
possibility maps, and for a copy-source registry they under-describe the surface by construction.
Making them honest about *where the useful surface lives* costs little and fixes a wrong impression.

## Acceptance

- [x] `fresh.txt` opens with a module overview and a pointer to `fresh-ui` and the scaffold
- [x] `fresh-ui.txt` lists actual registry collections/items, not only the manifest type
- [x] Both state where copy-source components live and how to add them

## Notes

Documentation/generation only — no release cut required. Wave-four docs investigation, remediation
#5.

