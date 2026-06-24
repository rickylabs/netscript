# Plan — package + framework README revamp (PR2 #117, PR3 follow-up)

Archetype: N/A (no source). Overlay: `SCOPE-docs.md`. Lane: Claude authoring workflow (CLAUDE.md
doc-authoring exception) → OpenHands IMPL-EVAL. Branch `docs/readme-revamp`.

## Locked decisions
- **D1 — From scratch, ground-truthed.** Every README is rewritten, not edited. Each authoring agent
  derives the package's real public surface from `deno doc` / source before writing; existing prose
  is reference-only, never trusted.
- **D2 — One deep agent per README (31).** Depth over batching. Family agents (auth, plugins,
  data-persistence, services-sdk, web-layer, observability, background-processing) share a context
  brief so cross-package framing is consistent. Conventions come from `sota-readme-dossier.md`.
- **D3 — Canonical package-README skeleton** (from dossier Track 1; adjust to its findings):
  hero line (what it is, 1 sentence) → install (`deno add jsr:@netscript/<pkg>`, UNVERSIONED) →
  60-second quickstart (runnable) → features → core API / usage (meaningful samples) → docs
  cross-links section → license. No badge soup, no invented examples, no "honesty" framing.
- **D4 — Cross-refs are absolute, verified, meaningful.** Every docs link is
  `https://rickylabs.github.io/netscript/<path>/`, MUST resolve, and MUST point at content that
  discusses the package (not a regex name-match). Each README links its reference page + its
  capability-pillar hub + (where one exists) a how-to/tutorial that actually uses it. The four
  `plugin-*-core` packages use the sibling plugin reference + pillar hub (no own ref page) — see
  research cross-ref map.
- **D5 — `/docs` removal = dead-link + publish-glob cleanup.** Strip dangling `./docs/*.md` links;
  remove `docs/**/*.md` from the affected `deno.json` `publish.include` globs. No folder deletion
  (none exist). `deno.json` publish-glob edits are the ONLY non-README file touch allowed and are
  config, not framework source — within the doc-authoring boundary.
- **D6 — Unversioned install + factual alpha callout.** No version literals in READMEs (drift-free).
  One clean alpha-maturity callout where relevant; no apology, no candor-announcing voice.
- **D7 — PR3 (root README) is a separate authoring pass AFTER PR2 merges.** Bases on finished package
  docs; uses dossier Track 2 (framework-landing/visual design). Highest quality bar; own eval.

## Slices
1. **C0 — deep search** (DONE: dispatched). Output `sota-readme-dossier.md`. Gate: dossier exists,
   both tracks present, exemplars cited. Supervisor folds conventions into D3/skeleton before C1.
2. **C1 — authoring workflow** (Claude). One agent per README, grounded via `deno doc`/source, dossier
   conventions, cross-ref map. Each agent: rewrite README; remove dead `./docs/*.md` links; if its
   `deno.json` has `docs/**/*.md` in publish globs, remove it; emit the README body + a self-report of
   every docs link with its verified target. Supervisor commits per family.
3. **C2 — IMPL-EVAL + link gate** (OpenHands qwen3.7-max, separate session). Per-package verdict +
   HARD link-verification: every cross-ref resolves against `docs/site/**` (and a live HEAD check)
   AND is meaningful (reviewer confirms the target discusses the package, rejecting name-match stubs).
   Plus: ground-truth check (samples match real API), voice check (no banned framing), publish-glob
   correctness.

## Gates
- Dead-link scan: zero dangling `./docs/*.md` (or any) links in the 31 READMEs.
- Cross-ref resolution: 100% of docs links resolve; the 4 `-core` packages verified to use
  pillar+plugin targets, not absent name-match pages.
- `deno.json` publish globs: no `docs/**/*.md` remains where the files don't exist; `publish:dry-run`
  still exit-0 (no surface regression).
- Voice: zero "honest/honesty/honestly"/candor-announcing hits.
- API ground-truth: spot-checked samples compile against the real exported surface.

## Debt
- DOC-REF-CORE-PAGES (record-only): the 4 `plugin-*-core` packages lack dedicated `/reference/` pages;
  cross-refs route to pillar+plugin. If a future docs-site PR adds `-core` reference pages, re-point.
- No load-bearing deletions: README content is non-load-bearing; publish-glob edits only drop globs
  pointing at non-existent files.

## Evaluator protocol
- PR2 needs its own **PLAN-EVAL** (OpenHands minimax-M3, separate session) before C1 authoring —
  dispatch once the dossier lands and D3 is reconciled to it.
- C2 **IMPL-EVAL** = OpenHands qwen3.7-max, separate session, per-package + link gate.
- Supervisor (Claude) coordinates + commits authoring output; never self-certifies.
