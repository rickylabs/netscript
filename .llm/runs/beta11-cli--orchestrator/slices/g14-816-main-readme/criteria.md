# G14 / #816 — Lane 1 Research Criteria (main README rewrite)

Author: Lane 1 (Claude · Fable 5 · high). Consumer: Lane 2 researcher (Antigravity `agy`,
Gemini 3.5 Flash, extended thinking). Downstream: Lane 3 redactor (Fable 5 · high), Lane 4
adversarial (Codex Sol · xhigh).

**Contract:** the researcher executes EXACTLY this document. No freestyling: every candidate below
is swept, every dimension in §2 is extracted for every candidate, every dimension is scored per §3,
and the output conforms byte-for-byte to the schema in §5. If a candidate README is unreachable,
record `"status": "unreachable"` with the URL tried and move on — do not substitute a different
repo without recording the substitution under `deviations`.

---

## 1. Candidate corpus (final list + rationale)

Sweep the **root repository README on GitHub** (default branch, rendered form) — not the docs site
— for each of the following. The README-as-rendered-on-GitHub is the artifact under study.

### Included (12)

| # | Repo | URL | Why it is in the corpus |
|---|------|-----|-------------------------|
| 1 | Deno Fresh | github.com/denoland/fresh | Same runtime + direct ecosystem neighbor; how a Deno-native framework introduces itself. |
| 2 | Astro | github.com/withastro/astro | Widely cited as best-in-class OSS README/monorepo entry point; strong ecosystem + social-proof craft. |
| 3 | Bun | github.com/oven-sh/bun | Runtime-scale project; extreme hook density and quickstart brevity; large surface presented without overwhelming. |
| 4 | Vite | github.com/vitejs/vite | Monorepo tool with a compact README that routes to docs; the "thin README, fat docs site" pole. |
| 5 | React Router (Remix) | github.com/remix-run/react-router | Framework mid-identity-transition; how versioning/status honesty and migration messaging are handled. |
| 6 | Tauri | github.com/tauri-apps/tauri | Native-desktop framework — directly relevant to NetScript's new native desktop lane; diagram + platform-matrix usage. |
| 7 | Supabase | github.com/supabase/supabase | Product-grade README for a multi-service platform; architecture diagram + feature/status matrix + hosted-vs-self-hosted framing. |
| 8 | tRPC | github.com/trpc/trpc | Contract-first end-to-end type safety — closest conceptual neighbor to NetScript's oRPC story; how type-safety is DEMONSTRATED (gif/snippet) not just claimed. |
| 9 | NestJS | github.com/nestjs/nest | Batteries-included backend framework README; badge wall + sponsor model; how a large module ecosystem is summarized. |
| 10 | Laravel | github.com/laravel/laravel + github.com/laravel/framework | Mature full-stack framework; minimal-README pole with learning-path emphasis; note WHICH repo carries the story. |
| 11 | Rails | github.com/rails/rails | The archetype MVC pitch ("convention over configuration" in one screen); model of philosophy-first structure. |
| 12 | .NET Aspire | github.com/dotnet/aspire | ADDED: NetScript orchestrates with Aspire; how an orchestration stack explains multi-service dev experience and dashboard value. |

### Added beyond the issue list (with justification)

- **.NET Aspire** (#12, above) — NetScript's orchestration layer; its framing of "run the whole
  distributed app locally" is the exact story NetScript's quickstart must tell.
- **Hono** — github.com/honojs/hono — NetScript's router; small-core multi-runtime README with a
  benchmark-forward hook. Sweep as candidate #13.
- **Encore** — github.com/encoredev/encore — backend framework with an explicitly agent/AI-forward
  positioning; nearest competitor for the "agentic backend framework" pitch. Sweep as candidate #14.

### Considered and dropped (do not sweep)

- **Next.js** — README is a stub deferring entirely to nextjs.org; low extractable signal beyond
  what Vite/Laravel already give for the "thin README" pole.
- **SvelteKit** — overlaps Astro/Vite patterns without adding a new pole.
- **Django** — overlaps Rails (mature, philosophy-first, docs-heavy) without adding signal.

**Total: 14 candidates.** All 14 are mandatory.

---

## 2. What to extract per candidate

For every candidate, extract ALL of the following dimensions. Quote or describe concretely — a
finding without a concrete referent (section name, literal text, element description) is invalid.

### D1. Structure & section order
- Ordered list of top-level sections (exact headings, in order).
- Where the first code block appears (section + approximate line/scroll position).
- Table-of-contents present? Collapsible sections (`<details>`) used, and for what.

### D2. Hook density & first screen
- Everything visible in the "first screen" (from top of file through roughly the first 40 rendered
  lines / above-the-fold on a laptop): logo/banner, tagline, badges, first sentence.
- The one-sentence value proposition, quoted verbatim.
- Time-to-first-code-or-visual: does the first screen contain code, a gif, a diagram, or only prose?
- Does the hook state WHAT it is and WHY it exists as two distinct beats? Quote both if present.

### D3. Diagram & visual usage
- Count and type of visuals: architecture diagram (mermaid/image/ascii), screenshots, gifs, demo
  videos, logos-only.
- What the primary diagram communicates (data flow? layers? ecosystem?) and where it sits.
- Dark-mode handling if observable (picture/source tags).

### D4. Quickstart friction
- Steps-to-running: count the discrete user actions (each command = 1, each file edit = 1) from
  "nothing installed" to "app running or first output".
- Prerequisites: how many, how stated, linked or assumed?
- Is a no-install path offered (npx/deno x/curl|sh/StackBlitz/playground)?
- Claimed time budget ("in 30 seconds", "5 minutes") — quoted, and plausibility note.
- Does the quickstart end with a verifiable payoff (URL to open, expected output shown)?

### D5. Ecosystem presentation
- How the package/plugin/module family is presented: table, list, links-out, monorepo tree, or
  omitted.
- Row/entry count if tabular; what columns (name, badge, description, docs link?).
- Is the ecosystem in the README or delegated to the docs site?

### D6. Social proof placement
- What social proof exists (stars implicit, sponsor walls, "used by" logos, testimonials,
  contributor images, community links Discord/X) and WHERE (top/middle/bottom).
- Contributor/community section: present, and what CTA it makes.

### D7. Length budget
- Approximate rendered length: word count of prose + count of code blocks + count of tables.
- Ratio judgment: content that lives in README vs deferred to docs site; note explicit
  "see the docs" hand-off points.

### D8. Badge usage
- Count and enumerate badges; classify each: build/CI, version/registry, downloads, social
  (stars/Discord/X), sponsors, license, other.
- Badge row position(s) and whether badges exceed one row.

### D9. Versioning / status honesty
- How maturity is communicated: version badge, "beta/RC/stable" prose, roadmap link, breaking-change
  caveat, LTS statement — quote any status language verbatim.
- For pre-1.0 or transitional projects (Fresh, React Router, Aspire): how do they set expectations
  without deterring adoption?

### D10. Audience routing
- Distinct on-ramps for distinct audiences (new user / migrator / contributor / enterprise):
  enumerate which audiences get an explicit path and via what element.
- Anything addressed to AI agents/LLMs (llms.txt mention, MCP, "for AI" section)? This is a key
  scan for NetScript's flagship agentic story — record even small mentions.

---

## 3. Scoring rubric

Score every candidate on each dimension D1–D10 on a 0–4 scale. Scores make candidates comparable;
the anchors below are binding — do not invent intermediate criteria.

- **0 — Absent.** Dimension not addressed at all.
- **1 — Token.** Present but perfunctory; no evident design intent (e.g. one stray badge; a
  quickstart that dead-ends without a payoff).
- **2 — Competent.** Present and functional; standard practice, nothing to steal.
- **3 — Strong.** Deliberate craft; produces a technique worth naming (record the technique as a
  `lesson` string).
- **4 — Best-in-corpus.** The reference implementation of this dimension across all 14; at most
  TWO candidates may hold a 4 on any given dimension.

Additional per-candidate scalar: **overall_first_impression (0–10)** — gut-level "would an
evaluating senior engineer keep reading?", judged after the dimensional pass, with one sentence of
justification.

Scoring rules:
1. Score from the rendered README only; do not credit docs-site quality.
2. Every score of 3 or 4 MUST carry a `lesson` (transferable technique, imperative phrasing, e.g.
   "put the typed-client gif before any prose claim of type safety").
3. Every score of 0 or 1 on a project that is nonetheless successful MUST carry a `note` on whether
   the absence is a deliberate trade-off (e.g. Laravel's thin README) — deliberate thinness is
   itself a finding, not a defect.

---

## 4. What NetScript specifically needs from its entry point (grounding for synthesis)

The comparative synthesis (§5.2) must map corpus lessons onto THESE NetScript-specific needs — this
is the fitness function, derived from the repo, in priority order:

1. **Agentic combo as flagship differentiator.** `@netscript/mcp` × repo skills × agent-aware CLI:
   NetScript is a framework built to be OPERATED BY coding agents as first-class users. No corpus
   candidate leads with this — D10 findings on AI/agent addressing are the closest prior art.
   Synthesis must answer: how do the best READMEs introduce a category-defining feature that has no
   established README convention?
2. **Contract-first typed pipeline.** One oRPC contract → Hono service → typed SDK clients → Fresh
   UI. tRPC (D2/D3) is the reference for demonstrating rather than claiming type safety.
3. **Full-coverage CLI story.** `netscript init` scaffolds a complete orchestrated workspace
   (service + Postgres + plugins + Aspire). Quickstart lessons (D4) must translate to: fresh clone →
   running Aspire dashboard, honestly under 5 minutes, with a visible payoff.
4. **Runtime/services model + Aspire orchestration.** Multi-process dev with dashboard, discovery,
   telemetry — Aspire and Supabase are the reference candidates for making multi-service feel
   simple (D3 diagrams).
5. **Ecosystem scale without overwhelm.** 30+ JSR packages + 6 first-party plugins, each with a
   reworked README (#815) to link. D5 lessons decide table-vs-tiers-vs-delegation.
6. **Deploy targets incl. native desktop lane.** The new desktop/native lane (epic #840, Tauri as
   corpus reference) must read as a deploy TARGET of the same app model, not a separate product.
7. **Docs/tutorial map.** Established docs site (Diátaxis: tutorials/how-to/explanation/reference).
   D7 lessons decide the README↔docs boundary.
8. **Honest pre-release status.** `0.0.1-beta.x`, APIs may move, roadmap via milestones. D9 lessons:
   candor that builds trust instead of deterring (Fresh/React Router/Aspire patterns).

The researcher does NOT write README recommendations beyond mapping lessons to these eight needs —
prescriptive structure is Lane 3's job.

---

## 5. Output schema (mandatory)

Deliver ONE file: `findings.md` in this slice dir, with exactly two parts.

### 5.1 Per-candidate findings

For each of the 14 candidates, one section:

```markdown
## <Candidate name> (<github url>)
- status: swept | unreachable
- snapshot_date: YYYY-MM-DD

### Extraction
- D1 structure: <ordered heading list + first-code position + ToC/details notes>
- D2 hook: <first-screen inventory; value-prop quoted; two-beat WHAT/WHY quotes>
- D3 visuals: <counts, types, primary-diagram description + position>
- D4 quickstart: steps_to_running=<int>; prereqs=<int + list>; no_install_path=<yes/no + what>;
  claimed_time="<quote|none>"; payoff=<description>
- D5 ecosystem: <format, entry count, columns, README-vs-docs>
- D6 social proof: <elements + positions>
- D7 length: words≈<int>; code_blocks=<int>; tables=<int>; docs_handoffs=<list>
- D8 badges: count=<int>; <classified enumeration + position>
- D9 status honesty: <verbatim status language + mechanism>
- D10 audience routing: <audience→element map; AI/agent mentions verbatim or "none">

### Scores
| D1 | D2 | D3 | D4 | D5 | D6 | D7 | D8 | D9 | D10 | first_impression |
|----|----|----|----|----|----|----|----|----|-----|------------------|
| n  | n  | n  | n  | n  | n  | n  | n  | n  | n   | n/10 (+1 sentence) |

### Lessons
- <one imperative lesson line per score of 3 or 4, tagged with its dimension>
### Notes
- <deliberate-absence notes per §3 rule 3, if any>
```

### 5.2 Comparative synthesis

After the 14 sections, a `## Comparative synthesis` section containing exactly:

1. **Score matrix** — one table, all 14 candidates × D1–D10 + first_impression.
2. **Dimension winners** — for each D1–D10: which candidate(s) scored 4 and the transferable
   technique in one line.
3. **NetScript need-mapping** — for each of the eight needs in §4: the 1–3 most relevant corpus
   lessons (cite candidate + dimension) and any observed anti-pattern to avoid.
4. **Structural consensus** — the section-order pattern that recurs across the top-5
   first-impression candidates, stated as an ordered list with per-section corpus attribution.
5. **Open questions for the redactor** — max 5 bullets where the corpus gives conflicting signals
   (e.g. thin-vs-fat README), stated neutrally with both poles cited.
6. **Deviations** — any substitutions, unreachable candidates, or criteria ambiguities encountered
   (empty list if none).

Formatting rules: no additional sections, no prose outside this structure, all scores integers,
all quotes verbatim with quotation marks. Lane 3 consumes this mechanically.

---

## Stop-lines (verbatim, per run policy — binding on every sub-agent executing this document)

1. Merge requires CI green + opposite-family eval PASS on the PR. Owner granted standing beta-11
   merge authorization (2026-07-17 in-turn) once that bar is met.
2. HARD STOP before any release publish (`release:cut`, JSR publish, tag push, canary or stable) —
   owner sign-off in-turn only; a stale or relayed approval does not count.
3. HARD STOP before closing milestone 13 — owner sign-off only.
4. These stop-lines are repeated verbatim in EVERY sub-agent brief. A sub-brief without the
   stop-lines section is invalid.
5. The #824 seed run is drafts-only until owner ratification; its board filing needs the owner
   in-turn.
