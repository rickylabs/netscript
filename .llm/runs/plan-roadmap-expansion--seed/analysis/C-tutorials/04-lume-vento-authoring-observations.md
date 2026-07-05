# Lume/Vento authoring observations + known landmines — Topic C

Covers the topic-spec §5/§6 requirement to note Lume/Vento integration points and known authoring
landmines for the tutorial rewrite.

## Comp-tag usage observed in the current 5 tracks

Reading the 5 `index.md` files directly (`docs/site/tutorials/{index,storefront,workspace,erp-sync,
live-dashboard,chat}/index.md`), the tutorials lane uses these Vento components:

- `{{ comp.featureGrid ... }}` — the "five tracks" chooser grid on the lane index page.
- `{{ comp.apiTable ... }}` — structured chapter/prerequisite tables.
- `{{ comp.learningPath ... }}` — the chapter-ladder / breadcrumb-style progress component per track.
- `{{ comp.callout ... }}` — inline notes/warnings (including at least one disclosure-style "Extend"
  aside in the workspace track — flagged in `context/C-tutorials/open-questions.md` Q2 for tone
  compliance against the "no honesty/candor framing" rule).
- `{{ comp.nextPrev ... }}` — chapter-to-chapter navigation footer.

A ground-up rewrite will keep using this same component set (they are the docs engine's load-bearing
authoring primitives per `docs/site/_plan/04-engine-and-components.md`) — the rewrite is a content
and IA change, not a new-component-authoring exercise, unless Stage D's design explicitly calls for a
new component.

## Known landmines (carried from prior-session working knowledge, applicable to every rewritten page)

1. **`function`-keyword landmine**: if the literal word `function` appears anywhere inside a
   comp-tag argument (even inside a string that's part of prose describing code), the Lume/Vento
   build aborts. Any chapter prose that needs to say "define a function" inside a `{{ comp.callout
   }}` block must phrase around it or move the code into a fenced code block outside the tag.
2. **Comp-syntax landmines (4 known defects)**: specific multi-line/nested comp-tag constructions
   pass a naive tag-balance scan but still break the build. Every new/edited page needs a pre-flight
   build attempt, not just a visual tag-balance check.
3. **`deno fmt` reflows/breaks Vento markdown**: root `deno fmt` must continue to exclude
   `.md`/`.mdx`/`.vto` from its formatting targets (already true per the repo's fmt task config,
   confirmed via `AGENTS.md`'s package-quality fmt rule) — a rewrite that inadvertently runs
   unscoped `deno task fmt` risks reflowing/splitting multi-line `{{ comp }}` tags across the entire
   tracked docs tree, not just the files being rewritten. Do not run repo-wide `deno task fmt` for
   this workstream.
4. **`diagrams:render` is Windows-broken**: any new architecture/sequence diagram added as part of a
   rewritten chapter must be rendered from WSL, not from a Windows shell; `diagrams:check` is not
   confirmed to be CI-enforced (see `analysis/C-tutorials/03-docs-cut-logistics.md`), so a broken
   diagram source could land undetected if the author only relies on CI green.

## Front-matter / IA conventions observed

Each track's `index.md` and chapter files carry structured front matter (title, description,
ordering) consumed by `_data.ts`/the layout to build the `learningPath` progress ladder and the
capability-hub cross-links (see `03-docs-cut-logistics.md`'s nav blast-radius finding). Any rewrite
that changes a chapter's filename/slug must update front matter consistently across: the chapter
file itself, the track's `index.md` chapter list, and any `_data.ts` capability-hub entry pointing at
the old slug.

## Verification discipline for the rewrite

Given (1)+(2) above, every rewritten/new page should be validated with the real pipeline
(`deno task build` at minimum, ideally the full `deno task verify` chain from
`docs/site/deno.json`) before being considered done — a visual/manual read of the `.md` source is not
sufficient to catch these landmines.
