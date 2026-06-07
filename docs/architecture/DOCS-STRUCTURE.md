# NetScript `/docs/` Structure & Authoring Guide (v0.0.1-alpha)

> Status: **MUST** for every `@netscript/*` package with > 25 public symbols
> at v0.0.1-alpha. Smaller packages MAY ship a single-page `README.md` only,
> provided that page covers all 12 STANDARDS § 6 sections.

This document codifies the on-disk shape of every package's `docs/` folder so
the future `netscript.dev` site can mirror the tree exactly. Authoring a
package's docs and authoring the docs site is the same activity.

---

## 1. Why this matters

We've seen too many ecosystems where the docs site lives in a separate repo
and drifts from the package. NetScript ships docs **inside the package**:

- One source of truth — what's on JSR is what's on netscript.dev.
- Contributors can review a doc change in the same PR as the API change.
- The future docs-site builder is a thin transformer over the on-disk tree.

---

## 2. Canonical layout

```
packages/<pkg>/docs/
├── README.md                # 1-screen intro + ToC, frontmatter `order: 0`
├── architecture.md          # Archetype, axioms, layered diagram, surface map
├── concepts.md              # Glossary, mental model, invariants, terms
├── getting-started.md       # 10-minute first-run guide
├── recipes/
│   ├── README.md            # ToC for recipes
│   ├── basic-usage.md
│   ├── testing.md
│   ├── observability.md
│   ├── error-handling.md
│   ├── extending.md
│   └── ...                  # one file per task-oriented recipe
├── reference/
│   ├── README.md            # ToC for reference
│   ├── functions.md         # Auto-generated from `deno doc`
│   ├── classes.md
│   ├── types.md
│   ├── errors.md
│   └── adapters.md          # When package ships adapters
└── advanced/
    ├── extending.md         # Extension axes (subclassing, custom adapters)
    ├── migration.md         # alpha → beta upgrade notes (added at beta)
    ├── internals.md         # For contributors only
    └── benchmarks.md        # When perf-sensitive package
```

**Cardinality cap**: ≤ 12 files per directory (matches doctrine F-DOCT-5).
If a `recipes/` or `advanced/` exceeds 12, sub-categorise.

---

## 3. Frontmatter contract

Every `.md` page in `docs/` MUST start with this YAML frontmatter (consumed
by the future docs-site generator):

```yaml
---
title: <Page Title>            # H1 of the page; required
description: <≤160 chars>       # SEO/meta description
package: "@netscript/<pkg>"    # Auto-inserted by check-doctrine.ts
order: <int>                   # Sort within sibling directory; required
---
```

Optional fields:

```yaml
status: stable | alpha | preview     # default `alpha` during alpha cadence
audience: user | contributor          # default `user`
since: 0.0.1-alpha.0                  # version this page was added
deprecated: 0.2.0                     # version this content is removed
seealso:
  - "@netscript/<other-pkg>/docs/foo.md"
  - "https://external-link.example"
```

---

## 4. Authoring conventions

### 4.1 Voice

- **Second person**: "you create a logger by …", not "the user creates …".
- **Active voice**.
- Short sentences. Short paragraphs.
- No conditional language at boundaries: prefer "logger is required" over
  "logger should typically be provided".
- No marketing fluff. State what it does, what it does not do, and one
  reason it's the right shape.

### 4.2 Code samples

- Every code sample is **runnable** as-is. No "// imagine this is …".
- Imports use the JSR specifier (`jsr:@netscript/<pkg>@^0.0.1-alpha.0`) in
  every published example. Internal cross-references inside the monorepo
  use the import map.
- Code samples that appear in `getting-started.md`, `architecture.md`, or
  `recipes/` MUST be imported into a doctest at
  `tests/_fixtures/docs-examples_test.ts` so they don't go stale.
- Multi-step examples use numbered comments:

  ```ts
  // 1. Create the store
  const kv = await openKv({ ... });
  // 2. Define a collection
  const users = kv.collection<User>("users");
  // 3. Insert
  await users.insert({ id: "u_1", name: "Ada" });
  ```

### 4.3 Diagrams

- Use ASCII diagrams in `.md` files (no PlantUML / Mermaid in alpha — the
  future site renders raw markdown).
- Diagrams MUST appear in `architecture.md` showing the layered structure
  (domain → ports → application → adapters → runtime).

### 4.4 Tables

- Use markdown tables for option references, comparison matrices, and
  capability matrices.
- Right-align numeric columns (`---:`).
- Header rows are required.

### 4.5 Cross-package linking

- Use relative paths within a package: `[adapters](./reference/adapters.md)`.
- Use absolute repo paths across packages:
  `[@netscript/logger](../../logger/docs/getting-started.md)`. The future
  docs site rewrites these to canonical URLs.

---

## 5. Page-by-page contracts

### 5.1 `docs/README.md`

- Frontmatter `order: 0`, `title: <Package Name>`.
- 1-screen overview.
- Table of contents linking to every other doc page in the package.
- No code (the README at the package root is the quickstart shop window).

### 5.2 `docs/architecture.md`

Required content:

1. **Archetype** — explicit declaration: "This package implements the
   Archetype 4 (DSL/Builder) pattern" with link to
   `docs/architecture/doctrine/`.
2. **Layered diagram** — ascii or markdown, showing domain/ports/application/
   adapters/runtime.
3. **Public-surface map** — what's exported via `mod.ts` vs sub-entrypoints.
4. **Axioms in play** — call out which doctrine axioms (A1..A14) the package
   embodies most strongly and how.
5. **Anti-patterns explicitly avoided** — call out which AP-* the package
   does not commit and how the structure prevents them.
6. **State diagram** (A12 packages only — sagas, triggers, workers, watchers).

### 5.3 `docs/concepts.md`

Glossary of every named concept the package introduces, in alphabetical
order. Each entry is 2–4 sentences. No code samples — concepts only.

### 5.4 `docs/getting-started.md`

10-minute first-run guide that:

1. Installs the package via `deno add jsr:@netscript/<pkg>`.
2. Walks through the 80% path (one chained call satisfies one task).
3. Demonstrates one customisation (one option flag flipped, one adapter
   swapped).
4. Points to a recipe page for next steps.

### 5.5 `docs/recipes/`

One file per recipe, named after the task: `basic-usage.md`,
`testing.md`, `error-handling.md`, `migrating-from-x.md`, etc. Each
recipe is:

1. Frontmatter with descriptive `title`.
2. **Goal** — one sentence.
3. **Pre-requisites** — what the reader must already have set up.
4. **Steps** — numbered, each with a code sample.
5. **What this looked like** — a final snippet showing the assembled result.
6. **Pitfalls** — known footguns, with workarounds.
7. **Next steps** — links to related recipes.

### 5.6 `docs/reference/`

Auto-generated from `deno doc` output by the future
`.llm/tools/generate-reference.ts`. Authors do **not** hand-write
reference pages at v0.0.1-alpha — they only check the auto-output is
sensible.

`reference/README.md` is hand-written: it explains how to navigate
`functions.md`, `classes.md`, `types.md`, `errors.md`, and `adapters.md`,
and links to relevant recipes for each major symbol.

### 5.7 `docs/advanced/`

Optional during alpha but recommended for packages that ship extension axes:

- `extending.md` — how to subclass abstract bases, register custom
  adapters, plug into framework hooks.
- `internals.md` — for contributors only; explains the doctrine-aligned
  internal layout.
- `benchmarks.md` — for perf-sensitive packages (kv, queue, streams,
  database) — methodology, results, reproduction steps.
- `migration.md` — added at the first beta release.

---

## 6. Reference page generation

A future tool (Wave 0) at `.llm/tools/generate-reference.ts` will:

1. Run `deno doc --json mod.ts` per package.
2. Categorise output into `functions.md`, `classes.md`, `types.md`,
   `errors.md`, `adapters.md` based on doctrine archetype tags.
3. Group by feature using doctrine **section tags** (`@section <name>` JSDoc
   tag — added to the harmonisation list).
4. Insert auto-generated `<!-- auto-generated -->` markers so re-runs are
   idempotent.

Until that tool lands, packages SHOULD keep `reference/` empty and rely on
JSR's online API explorer (linked from `docs/README.md`).

---

## 7. Documentation review checklist

Before a package is marked publish-ready in `release-readiness.ts`, a human
reviewer (the harness evaluator session) confirms:

- [ ] `docs/README.md` and `docs/architecture.md` exist with frontmatter.
- [ ] `docs/architecture.md` declares archetype.
- [ ] `docs/getting-started.md` matches the README quickstart.
- [ ] At least one recipe exists.
- [ ] Every recipe code sample compiles and is doctest-imported.
- [ ] No "TODO" or "WIP" markers remain.
- [ ] Frontmatter is well-formed YAML.
- [ ] Internal links resolve.

These checks are mechanically enforced by a future
`.llm/tools/fitness/check-docs.ts` (Wave 0).

---

## 8. Mapping to the future netscript.dev site

The site generator (out of scope for v0.0.1-alpha) will:

1. Crawl every package's `docs/` folder.
2. Build a tree:
   ```
   netscript.dev/
   ├── /
   ├── /packages/
   │   ├── /shared/
   │   │   ├── /                  ← docs/README.md
   │   │   ├── /architecture
   │   │   ├── /concepts
   │   │   └── /recipes/...
   │   └── ...
   └── /plugins/...
   ```
3. Render each `.md` with frontmatter as the page metadata.
4. Build search index from frontmatter `title` + `description` + body.
5. Generate cross-package navigation from `seealso` frontmatter and from
   import edges (the docs site can show "this page references @netscript/x"
   inferred from imports in code samples).

The on-disk tree IS the site tree. Don't author docs that depend on
out-of-tree assets at v0.0.1-alpha.
