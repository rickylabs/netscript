# Plan — PR3 root README (docs/root-readme, PR #118)

## Scope

Author the repository root `/README.md` from scratch: the landing page / front door for the whole
NetScript meta-framework, rendering correctly on BOTH GitHub and the JSR scope page. Final docs PR
of the "road to JSR publish" topology (after PR1 #116 publish mechanics, PR2 #117 package READMEs).

- **Archetype / overlay**: SCOPE-docs. No `packages/`/`plugins/` source, no `deno.json`, no
  `deno.lock` touched. Single deliverable: `/README.md` (+ harness run artifacts).
- **Generator**: Claude documentation-authoring exception (Markdown only, no framework source).
- **Out of scope**: per-package READMEs (shipped PR2), the docs site, any logo/banner binary asset,
  any publish-config change.

## Design (locked decisions)

### D1 — Structure (chapter order)

Adopt the dossier's canonical framework-landing skeleton, tuned to this stack:

1. Title + Hero (D2) + 3-badge row (D5)
2. 2–3 line value proposition
3. `## 🧭 What is NetScript` — positioning + composable-plugin-backend story (factual alpha
   noun-phrase callout, roadmap link; no apologetic framing)
4. `## 🚀 60-Second Quick Start` — scaffold via `@netscript/cli` under Deno (ground-truthed command)
5. `## 🗺️ Architecture` — the diagram (D3) + a short Hono→oRPC→Fresh→Aspire+plugins mental model
6. `## 📦 Packages` — grouped 31-package map (D4)
7. `## 📖 Documentation` — absolute links into rickylabs.github.io/netscript capability hubs
8. `## 📅 Roadmap & Maturity` — alpha as a clean noun-phrase callout + GitHub issues/milestones link
9. `## 🤝 Contributing` — CONTRIBUTING.md / CODE_OF_CONDUCT.md links
10. `## 📝 License` — MIT + "Published to JSR with cryptographically verified provenance."

### D2 — Hero: Option A (JSR-safe flat ASCII/monospace banner)

Rationale: no logo asset exists in the repo; Option B's image path is non-existent. Option A renders
identically on GitHub + JSR, needs no asset, and is searchable. A commissioned banner image is a
recorded future enhancement, NOT a PR3 blocker. Use the ASCII layered banner showing
Hono / oRPC / Fresh / Aspire over the 5 first-party plugins.

### D3 — Architecture diagram: Option A primary, Option B optional

- **Primary**: Option A ASCII canvas (Aspire → Service bootstrap → Hono router + oRPC contracts →
  Fresh UI / Procedure APIs → plugins). Identical on GitHub + JSR. Plugin boxes labelled by REAL
  names: auth, workers, sagas, triggers, streams.
- **Optional enrichment**: Option B mermaid graph nested under a `<details>` block that FOLLOWS the
  ASCII (mermaid is stripped on JSR; the ASCII is the always-visible source of truth). May be
  omitted if it adds noise — author's call during writing, ASCII is mandatory.

### D4 — Package map: grouped 6-layer table

Six layer sections (Foundation Core / Data & Storage / `*-core` Contracts / Runtime Plugins / Auth
Backends / App Surface), each a table with columns **Package · JSR badge · Capability · Reference
docs**. All 31 real `@netscript/*` packages, exact names + canonical one-liners from
`deep-search-brief.md`'s authoritative map (NOT the dossier's paraphrases). Note: the authoritative
map has 31 packages incl. `@netscript/queue` — verify every one is present (no drops, no invented
rows). Reference links absolute: `https://rickylabs.github.io/netscript/reference/<pkg>/`.

### D5 — Badges + voice aligned to shipped PR2 convention

- 3 badges only: JSR scope `jsr.io/badges/@netscript`, CI `.../workflows/ci.yml/badge.svg`, Docs
  `img.shields.io/badge/docs-rickylabs.github.io-blue` (NOT the dossier's `docs-v1.0`).
- Deno-first install with Node/Bun fallback, matching package READMEs.
- BANNED words enforced: no "honest/honesty/honestly", no candor-announcing/apologetic-alpha framing.
- Absolute URLs only.

## Gates (this run)

- `deno fmt` on `/README.md` only (`--ext md`, README path) is clean — formatting verdict scoped to
  the one authored file, not a repo-wide Markdown sweep.
- Link sanity: zero relative doc links; every doc link is `https://rickylabs.github.io/netscript/...`
  or an absolute github.com URL.
- Package-map completeness: all 31 authoritative packages present, exact names, no invented rows.
- Voice scan: zero banned tokens.
- Renders on GitHub (visual) and degrades cleanly on JSR (no GitHub-only device without a fallback).

## Debt / follow-ups (recorded, non-blocking)

- **Brand/banner asset**: no logo/masthead exists. PR3 ships the ASCII hero. A commissioned banner
  image (with the JSR `<picture>`-stripping caveat handled) is a future enhancement → backlog, not
  this PR.
- `@netscript/queue` reference page existence on the docs site is unverified; if the page 404s the
  link still degrades gracefully (it points at the published site). Track as a DOC-REF follow-up.

## Pipeline / next steps

1. **PLAN-EVAL** — OpenHands `openrouter/minimax/minimax-m3`, separate session, PR-comment output.
   No authoring slice before PASS.
2. **Author** `/README.md` (Claude documentation exception) per the locked design.
3. **IMPL-EVAL** — OpenHands `openrouter/qwen/qwen3.7-max`, separate session.
4. Merge PR #118 → main. Then: `publish:dry-run` green → release tag → OIDC `deno publish`.
