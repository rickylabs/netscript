# Secondary exercise-first ecosystems — Rails, Astro, SvelteKit

Sources: `guides.rubyonrails.org/getting_started.html`, `svelte.dev/tutorial/kit/introducing-sveltekit`
(live-fetched); `docs/site/_plan/research/competitors/astro.md` and
`docs/site/_plan/research/doc-architecture-patterns.md` (in-repo, cited not duplicated).

## Ruby on Rails Guides — "Getting Started with Rails"

Source: `guides.rubyonrails.org/getting_started.html`.

- **One real app, built continuously, across the whole guide.** The reader builds a single blog
  application end-to-end; every later chapter section extends the *same* running app rather than
  introducing disconnected snippets. This is the closest external analog to the eis-chat-backed
  approach topic C mandates — NetScript should hold the same discipline (one project per tutorial
  track, not per chapter).
- **~23 numbered top-level sections**, each with its own numbered subsections (e.g. `3.2 Starting up
  the Web Server`, `5.4 MVC and You`). Deep, explicit numbering lets a reader bookmark/resume at an
  exact position — directly reusable for NetScript's chapter-numbering scheme.
- **Command → observable result → brief explanation**, repeated relentlessly. Quote pattern:
  "Run this command... Rails will create a bunch of files... Let's take a brief look at the most
  important files... Point your browser at `http://localhost:3000`. You should see the Rails default
  information page." The explanation of *why* a generated file matters comes immediately after the
  reader has already seen it exist on disk — concept lands right after the artifact, not before.
  This is a second real-world confirmation (alongside Medusa) that "exercise first, explanation
  follows the artifact" is achievable at very fine grain, not just at the chapter level.
  behind
- **Prerequisites stated up front, explicitly, with a version-pin table** ("This guide is designed
  for beginners... assumes no prior experience with Rails... requires Ruby version 3.2.0 or
  newer..."). NetScript's rewritten tutorials should open each track the same way: exact toolchain
  versions (Deno version, `aspire` CLI, DB engine choices) stated before the first command, not
  buried in a later troubleshooting aside.
- **Checkpoint verification is literal and visual**: "You should see the Rails default information
  page" — never "you should now understand MVC." Same discipline recommended in the Medusa teardown.

## SvelteKit interactive tutorial

Source: `svelte.dev/tutorial/kit/introducing-sveltekit`.

- Delivered as an **in-browser runnable REPL** alongside the lesson text — zero local setup required
  to do the exercise. NetScript cannot literally replicate this (a Deno+Aspire+DB backend framework
  cannot run in a browser sandbox), but the *design intent* — minimize time-to-first-runnable-exercise
  — is directly portable: every NetScript tutorial track should get the reader to one real, running,
  observable artifact (a passing `curl`, a rendered dashboard, a job log line) as fast as the stack
  honestly allows, before any side-quest setup.
- **Narrow, single-concept lesson chunking.** Each tutorial page teaches exactly one idea (e.g. "what
  is SvelteKit", "routing", "loading data") with a tiny, focused code diff, rather than one giant
  chapter covering five concepts. NetScript's current chapters (see
  `analysis/C-tutorials/01-current-tutorial-inventory-and-gaps.md`) tend to bundle several concepts
  per chapter file; SvelteKit's atomicity is a candidate lever if the rewrite wants finer navigability
  (more, shorter chapters vs fewer, longer ones) — flagged as an open question, not a decision (see
  `context/C-tutorials/open-questions.md`).
- Encouraging, low-friction tone; failure states are treated as expected and recoverable, not as
  reader error.

## Astro (in-repo teardown, `docs/site/_plan/research/competitors/astro.md`, cited)

- Astro's own "Build your first Blog" tutorial is Diátaxis-structured and explicitly tutorial-only
  (no reference material mixed in) — reinforces keeping NetScript's Tutorial lane free of Reference
  material bleed (a documented anti-pattern already flagged in `doc-architecture-patterns.md`).
- Astro leans on strong "why this file exists" framing for its file-based routing conventions —
  relevant to NetScript's own convention-heavy scaffold output (doctrine folder vocabulary,
  contract-first layering) which a tutorial reader will otherwise find mysterious.

## Convergent cross-ecosystem rule (Medusa + Rails + SvelteKit + Astro)

All four ecosystems agree on one thing NetScript's rewrite should treat as non-negotiable: **every
chapter/lesson closes on an observable, literal checkpoint** (a URL, a JSON body, a file diff, a log
line) — never a comprehension checkpoint ("you should understand X now"). Cross-reference
`research/C-tutorials/medusa-teardown.md` for the Medusa-specific evidence.
