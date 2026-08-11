# RFC-0002 — NetScript DevTools contribution architecture

| | |
| --- | --- |
| **Status** | **Proposed** — awaiting owner ratification. Nothing in §14 files to GitHub before that. |
| **Run record** | `.llm/runs/plan-devtools-contribution--seed/` (charter, corpus, design packs, drift) |
| **Tracking** | Draft PR #1450. Re-evaluates epic #400 and its children. |
| **Evidence base** | 14-agent discovery corpus (6,327 lines) + 78 saved upstream artifacts under the run's `research/sources/`; 8 design packs; every load-bearing claim cited to `path:line`, a `deno doc` surface, a saved artifact, or a URL. |
| **Authority** | Consumes RFC #890 (frontend contribution layer), RFC-0001/#1446 (runtime-versioned automation, which stages this RFC as **P-6**), and RFC-A/#1390 (typed SDK client contributions). Where this document and the run corpus disagree, the run's `drift.md` wins; where this document and **GitHub** disagree after filing, GitHub wins. |
| **Baseline** | `main` @ `2256a67bf`, verified by `git fetch` on 2026-08-11. |

---

## 1. Abstract

NetScript has no way for a plugin to contribute developer-facing UI. Not a weak one — **none**. The
manifest's `capabilities.hasRoutes` describes *service HTTP endpoints*; no generated registry kind
emits a route, page, or island; and the only path by which first-party plugin client code currently
reaches the running app is **three hardcoded Vite aliases in a scaffold template**. A repo-wide
search for `devtools` returns zero matches.

This RFC therefore does not extend an extension point. **It defines the first one.**

It specifies a **NetScript DevTools host** — a separate, loopback-bound, development-only Fresh
application with its own process, port, and route tree — and a **DevTools contribution family**
through which plugins add developer-facing panels, typed deep-links, and diagnostics. Contributions
are declared data, resolved into a **transactionally generated registry**, and rendered by a host
that owns the zone vocabulary, the ordering, and every byte of data access.

Three commitments shape the whole design:

1. **We own only what nobody else does.** Aspire owns resources, logs, traces, metrics, health, and
   process lifecycle; Scalar owns API reference and try-it. DevTools owns framework-only
   state — contribution wiring, contract provenance, generated-surface drift, runtime-domain
   journeys, and safe framework actions — and **deep-links outward** for everything else. Epic
   #400's own acceptance test is adopted verbatim as a normative gate: *every panel must answer "why
   can't this just deep-link to Aspire/Scalar?" with a NetScript-only answer.*
2. **Developer diagnostics are not a production admin console.** RFC-0001 settles this with a
   decision sentence, not a preference, and the market study explains the cost of confusing them:
   sandboxing, manifest host ranges, per-contribution RBAC, and runtime module federation are all
   prices paid for *untrusted third-party code in a long-lived, RBAC-governed, production-data
   surface* — a condition a developer tool does not satisfy. This RFC declines each of them **with
   its cited antecedent**, rather than by omission.
3. **A smaller true design beats a larger plausible one.** The v1 contribution set is deliberately
   small, and every retained kind names a real first-party consumer. A single `DevToolsContribution`
   union covering pages, panels, inspectors, visualizers, actions, data sources, navigation, and
   deep-links is precisely doctrine's AP-3 god interface, and is rejected on those grounds.

The RFC is **planning-only**. It proposes packages, contracts, gates, and a roadmap; it implements
none of them, and it files no board entry before the owner ratifies §15's decision brief.

## 2. Motivation

### 2.1 The cost of having no seam

Adding a contribution kind to NetScript today requires editing **six framework files** — a new kind
provider, the provider barrel, the kind registry, the bare-alias package resolver, the extractor's
hardcoded axis table, and the CLI's axis display. Only `api` is compiled in; every other kind is a
bare alias to a `@netscript/plugin-*` package.

The closedness is not incidental, and it is provable rather than argued: `cli.doctorChecks` is typed
`readonly 'auth-backend'[]`, a **closed string literal** — a third party cannot contribute a doctor
check name without editing the framework package. Alongside it sit ten axis-enum names against
twelve interface keys with nothing enforcing the correspondence, a `mergeContributions` that silently
drops `cli`, lifecycle hooks that are declared, typed, stored, and **invoked by nothing**, and a
duplicate-identity guard that exists but is not on the live load path — so two plugins whose local
names collide silently overwrite each other.

Meanwhile the framework has accumulated exactly the kind of state a developer most needs to see and
currently cannot: which plugins contributed what, whether generated registries match their sources,
whether a saga is compensating, why a trigger did not fire, and where a request went as it crossed
worker, saga, trigger, and stream seams.

### 2.2 Why now, and why this shape

Three adjacent RFCs converged on the same gap from different directions:

- **#890** ratified a frontend contribution layer for the *userland app* family and explicitly parked
  the trust tiers and the zone-conflict inspector "for the dashboard epic" — i.e. here.
- **#1446** designed runtime-versioned automation, split operator frontends into two hosts, and
  staged **P-6: a DevTools RFC** with four named contracts to consume — while deliberately excluding
  diagnostics from its own admin console so as not to pre-empt this design.
- **RFC-A/#1390** designed typed SDK client contributions and stated, in its own words, that *"UI
  contributions and SDK request contributions are separate named extension axes, not one universal
  envelope."*

Each left a DevTools-shaped hole and said so. This RFC fills it.

### 2.3 What this RFC deliberately does not assume

The single largest risk to a document like this is inheriting a predecessor's claim without checking
it. Three carried-in assumptions did not survive contact with the baseline, and the design is built
on the corrected versions:

- **#890's envelope is merged design text with zero implementation.** Thirty-two files, all under
  `.llm/runs/` plus `labels.yml`; all twenty-four children and the epic still open. "Reuse the
  existing envelope" therefore describes a **co-dependency on unbuilt work**, and §6 makes that an
  explicit, reversible owner decision instead of a silent premise.
- **#890's compatibility claim is false at this baseline.** It states that an older CLI ignores an
  unknown manifest block, making a pointer additive. The installer manifest schema ends in
  `.strict()`: an unknown top-level key is **hard-rejected**, and the plugin fails to parse rather
  than degrading. Any manifest-visible pointer needs a schema-evolution precondition first.
- **"Inspired by Medusa zones" is wrong about Medusa.** Medusa's injection zones are a *closed,
  core-owned* vocabulary that plugins cannot mint; the plugin-minted, namespaced model is **Strapi's**.
  The correction matters because it moves design budget off collision — which a closed vocabulary
  makes impossible by construction — and onto **ordering**, which *no* system surveyed had solved.

### 2.4 Non-goals

- Modernizing the visual design of epic #400. Architecture and contribution mechanics are the
  deliverable; the old board's *ownership thesis* is preserved and promoted to a normative gate, its
  screen list is not.
- Duplicating Aspire, Scalar, #890's userland contributions, #1390's SDK contributions, or #1446's
  runtime management architecture.
- Shipping anything to production. There is no production DevTools tier in this design.
