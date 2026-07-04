# Medusa "Learn" teardown (fresh research, layered on in-repo teardown)

Sources: `docs.medusajs.com/learn` (intro), `docs.medusajs.com/learn/installation`,
`docs.medusajs.com/learn/fundamentals/modules` (live-fetched); merged with the existing in-repo
`docs/site/_plan/research/competitors/medusa.md`.

## What Medusa's "Learn" lane is

A distinct top-level docs lane (`/learn/`), separate from the auto-generated API Reference and the
task-oriented Guides. It is explicitly a **build-along**: the docs intro states "The documentation is
structured to gradually introduce Medusa's concepts, with easy-to-follow examples along the way,"
and immediately routes the reader to the Installation chapter — no detour through concept theory
before the first hands-on step.

## IA / IA numbering

Chapter/section numbering is explicit and hierarchical (e.g. `1.1 Introduction`, `3.3.10 Commerce
Modules`), so a reader always knows their exact position in the ladder. Chapters group into named
tiers: Introduction → Installation → Fundamentals (Modules, Data Models, Migrations, Services,
Workflows, Links, ...) → progressively deeper commerce-domain material.

## Step granularity + sequencing (the load-bearing pattern)

Two concrete chapters were fetched to verify the actual pattern, not just its reputation:

- **Installation chapter**: minimal prose precedes each code block. Pattern is *command, then
  explanation of the result* — "To create a Medusa application, use the `create-medusa-app`
  command:" followed immediately by the command, followed by what happens after ("After answering
  the prompts, the command installs the Medusa application..."). Success is verified in prose +
  diagram: "Once the installation finishes successfully, the Medusa application will run at
  `http://localhost:9000`."
- **Fundamentals → Modules chapter**: the opposite sequencing for *conceptual* material — prose-first.
  "What is a Module?" is explained before any code. Once the concept is grounded, the chapter drops
  into **numbered, granular steps (1–6)**, each producing an observable artifact (a file, a migration,
  a schema change), closing with a "Test the Module" section that runs an API call and shows the
  expected JSON. Quote: *"A data model represents a table in the database. You create data models
  using Medusa's data modeling language (DML)."* — explanation follows the concept name, precedes the
  code.

**Rule extracted:** Medusa is NOT uniformly exercise-first or explain-first — it switches sequencing
by content type. Procedural/setup content is command-first; conceptual/mental-model content is
concept-name-first, then code, then a runnable checkpoint. Topic C's exercise-first mandate (owner:
"the reader builds the thing first; prose follows the build") should be read as the procedural half
of this pattern, applied consistently — not as "never explain a concept before showing code" (Medusa
itself doesn't do that for genuinely new mental models).

## Checkpoint pattern

Every unit of work ends in a verifiable state, always phrased as an observable fact, never as "you
should now understand X": a directory diff, a terminal output block, an HTTP response body, or (for
Installation) a running dev server at a stated URL. This is the single most reusable, highest-value
Medusa pattern for NetScript's rewrite — the existing 5 NetScript tracks already do a version of this
("What you built" + a "Before you begin" state check per chapter, per the index.md files), so this is
convergent evidence the existing skeleton is directionally right; the deficiency is elsewhere (see
`analysis/C-tutorials/01-current-tutorial-inventory-and-gaps.md`).

## Visual/formatting devices

- Directory-structure diagrams shown alongside code changes (so the reader sees *where* new files
  land, not just their content).
- Inline code highlighting of the changed/important line(s) within a larger snippet.
- Version-pinned note callouts ("As of Medusa v2.11.0, ...") — an explicit low-drama way to bound a
  claim to a version, relevant to NetScript's own "Alpha, API subject to change" locked framing.
- Package-manager-neutral command blocks (`npx2yarn` notation) — NetScript's own tracks already do an
  equivalent with `--db postgres|mysql|mssql|sqlite` swap-callouts; keep that pattern.

## Tone

Instructional-yet-conversational, second person, moderate but real friendliness ("Medusa is
open-source, so you can also install and run it locally on your machine" — presenting an option
without pressure). This sits close to the NetScript-locked tone (`docs/site/_plan/08-decisions-locked.md`
Q2: "warm 'we', sparing humor, no body emoji") — no adjustment needed to reconcile Medusa-inspired
writing with NetScript's already-locked voice; they are compatible registers.

## What NOT to import from Medusa

- The teardown in `docs/site/_plan/research/competitors/medusa.md` already flags Medusa's own
  weakness: "Navigating between the core Framework Docs, Commerce Engine Guides, and Auto-generated
  API Reference can feel fragmenting." NetScript's rewrite should keep the tutorial ↔ capability-hub
  ↔ reference cross-linking that `docs/site/_data.ts` already implements (see
  `analysis/C-tutorials/03-docs-cut-logistics.md`) rather than importing Medusa's fragmentation.
- Medusa's domain (e-commerce) is a red herring for NetScript's rewrite — the reusable asset is the
  *writing/IA mechanics*, not the commerce vocabulary. The real project backing NetScript's rewrite is
  eis-chat, per D3/topic spec §2, not a storefront analog to Medusa's own domain.
