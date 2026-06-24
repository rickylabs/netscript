# Deep-Search Brief — SOTA README research (PR2 + PR3)

Engine: OpenHands + `openrouter/google/gemini-3.5-flash` (web-browsing research run).
Output: write the dossier to `.llm/tmp/run/docs-readme-revamp/sota-readme-dossier.md` on this branch
(`docs/readme-revamp`), growing it incrementally as you learn. TWO tracks, clearly separated.

Context you are serving (do not research this — it is the ground truth you write FOR):
- NetScript is a **Deno-native, JSR-published meta-framework** (plugin architecture over Hono + oRPC
  + Fresh + .NET Aspire; first-party plugins: workers, sagas, triggers, streams, auth). Alpha
  maturity (`0.0.1-alpha.1`). Packages install via `deno add jsr:@netscript/<pkg>`.
- A full documentation site is already published at **https://rickylabs.github.io/netscript/** with
  per-package reference pages at `/reference/<pkg>/`, plus capability hubs, tutorials, how-to,
  explanation. Package READMEs and the root README will **cross-link into that site** (absolute URLs).
- Downstream consumers of this dossier: (a) a Claude authoring workflow that rewrites all 31
  in-package READMEs from scratch (PR2); (b) a later workflow that writes the **root repo README** as
  a stunning landing page (PR3).

## Track 1 — Best-in-class PACKAGE / library READMEs (serves PR2)

Research 10–15 widely-admired package/library READMEs across ecosystems (npm/JSR/Deno, Rust crates,
Go modules, Python). Bias toward TypeScript/JS libraries and Deno/JSR packages. Candidates to
consider (verify, don't assume): Hono, oRPC, Zod, TanStack Query, Drizzle, Prisma, Vite, tRPC,
Effect, Elysia, Fresh, std (Deno), Biome, Turborepo packages, better-auth. For EACH exemplar capture:
- The section taxonomy & order (hero/tagline → install → quickstart → features → API → links → …).
- How the **value prop / what-it-is** is stated in the first 3 lines.
- Code-sample conventions: how many, how long, runnable vs snippet, where placed, how annotated.
- Install-instructions pattern (single-line, package-manager tabs, version pinning approach).
- How they link to fuller docs (badge, "Documentation" section, inline links) — and how they AVOID
  duplicating the docs site in the README.
- Markdown/visual devices: badges (which, how many — and when too many), tables, collapsible
  `<details>`, callouts/alerts, emoji-as-signpost (tasteful vs noisy), TOC, logo/banner.
- Length norms for a focused library README (lines), and what they deliberately OMIT.
Synthesize into: (1) a ranked pattern list with evidence; (2) a **canonical package-README skeleton**
(section-by-section, with guidance per section); (3) a **quality checklist** authors must pass;
(4) explicit **anti-patterns** (e.g. badge soup, invented examples, dead doc links, marketing fluff,
"honesty"-announcing voice — which is banned here).

## Track 2 — Best-in-class MONOREPO / FRAMEWORK landing READMEs (serves PR3, higher bar)

This is the front door for the whole framework — the bar is **stunning**, enterprise-grade, and
truthful. Research 10–15 framework / meta-framework / large-monorepo root READMEs and how they
present a whole system and stand out VISUALLY. Candidates (verify): Next.js, Nuxt, Remix, Astro,
SvelteKit, NestJS, Medusa, Payload, RedwoodJS, Turborepo, Nx, Vite, Bun, Deno, Supabase, Hono,
Encore, Wasp. For EACH capture:
- The hero treatment: logo/banner/wordmark, one-line positioning, sub-pitch, the first screenful.
- Visual standout devices: centered hero blocks (`<p align="center">`), banner images, animated
  demos (gif/asciinema/video), badge rows, feature-grid tables, architecture diagrams, "why" pitch,
  social proof, shields, light/dark logo swap (`<picture>`), section dividers.
- The chapter structure of a framework landing README: positioning → highlights/features →
  quickstart → architecture overview → ecosystem/packages map → docs/links → community →
  contributing → license. Note ordering and what leads.
- How they present a **monorepo's package map** (table of packages with one-line each + links).
- How they balance "stunning" with truthful **alpha/maturity** signaling without sounding apologetic.
- Concrete GitHub-flavored-markdown TECHNIQUES that render well on GitHub AND on JSR (note any that
  work on GitHub but break on JSR/npm rendering — e.g. raw HTML support differences).
Synthesize into: (1) ranked visual + structural patterns with evidence and a screenshot-or-quote of
the device; (2) a **canonical framework-landing-README skeleton** for NetScript (chapter list with
guidance, including a packages-map table design and a hero design with 2–3 concrete options);
(3) a **visual-design toolkit** (the specific markdown/HTML devices, with GitHub-vs-JSR rendering
caveats); (4) **anti-patterns** for landing READMEs.

## Constraints
- Cite every exemplar with its URL and quote/describe the specific device — no vague generalities.
- Distinguish techniques that render on BOTH GitHub and JSR from GitHub-only ones (NetScript READMEs
  publish to JSR, so JSR rendering matters).
- Do NOT author NetScript's READMEs here — this is research only; produce skeletons + checklists.
- Honor repo voice doctrine: no "honest/honesty/honestly" or candor-announcing framing.
- Write findings to the dossier file EARLY and grow it; do not defer all writing to the end.
