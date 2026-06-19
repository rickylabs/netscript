# IMPL-EVAL — W3 Prose/Structure Pass (docs workstream)

**Evaluator Session**: adversarial (separate from docs implementation)  
**Model**: claude-opus-4.6  
**Branch**: `docs/w3-prose-structure` (base: `docs/user-site`)  
**Verdict**: ✅ **PASS**

---

## Summary

The PR contains a voice and structure pass on the user documentation (W3).  
5 docs files changed, ~150 insertions, ~100 deletions. All changes are prose rewrites and line-wrap normalization — exactly the stated scope.

**Files touched:**
- `docs/site/explanation/architecture.md`
- `docs/site/explanation/plugin-model.md`
- `docs/site/explanation/index.md`
- `docs/site/how-to/index.md`
- `docs/site/tutorials/index.md`

**No changes to:** capabilities pages, how-to subpages, tutorial subpages, component/tag Markdown, reference docs, CLI, packages, plugins, tooling, or CI.

---

## Changes

### Prose improvements (voice)
| Before | After |
|---|---|
| "Tutorials are **learning-oriented**: hands-on lessons that take a newcomer from nothing to a first working NetScript result." | "Tutorials are for learning by building." |
| "This page explains *how* the framework is shaped and *why* it is shaped that way. It is understanding-oriented: read it to build a mental model, not to follow steps." | "This page gives you the architectural model: how the packages are shaped, why the boundaries matter, and what the rules are trying to protect." |
| "How-to guides are **task-oriented**: focused recipes that walk you through solving a specific, real-world problem with NetScript." | "How-to guides are for getting a specific job done." |
| "Contract first" is the workflow that the thesis implies." | ""Contract first" is the workflow that follows from that thesis." |

The voice shift is consistent and real: the docs read like technical writing, not LLM output. Less meta, more direct. Good.

### Structural change
- Line wraps normalized to ~80 characters via `deno fmt`, improving readability in source view.

### Stylistic change
- `*emphasis*` → `_emphasis_` (italic style consistency)

---

## Verification

### ✅ 1. No capability-claim changes
- No `/rpc`↔`/api/rpc` endpoint path edits anywhere in the diff.
- No altered status text for: trigger `defer`, streams `publish`/`subscribe`, task/polyglot telemetry, Postgres queue adapter.
- The plugin-model.md mentions "workers", "sagas", "triggers", "streams" in its plugin *architecture* descriptions ("a workers plugin contributes worker job definitions"). These are architectural framing of the plugin contribution model — unchanged conceptually, only rewritten for flow. Not capability claims.
- All 5 files are index/overview pages, not the capability/feature pages where status claims live.

### ✅ 2. No W4/W5/W6 scope creep
- No new chapters or pages added (`git diff --stat` shows only the 5 existing docs files).
- No tutorial restructure: same 5 lessons, same order, same slugs.
- No xref/link-system work introduced (no new tooling, components, or templating changes).

### ✅ 3. Lume docs build is green
- `deno task build` ran independently — exit code 0.
- **142 files generated**, all pages rendered.
- No Vento parse errors ("no `function` keyword inside comp-tag args" check — no such additions).
- Highlight.js unescaped-HTML warnings are pre-existing baseline noise, not introduced by this PR (visible on `docs/user-site` as well).

### ✅ 4. Markdown fmt is clean
- `deno fmt --check docs/site/tutorials/index.md docs/site/how-to/index.md docs/site/explanation/index.md docs/site/explanation/architecture.md docs/site/explanation/plugin-model.md` → exit code 0, all 5 files clean.

### ✅ 5. Voice improvements are real
- Consistent technical-writer voice across all 5 pages.
- Less mechanical Diátaxis scaffolding ("learning-oriented: hands-on lessons that take a newcomer…") replaced with direct voice ("Tutorials are for learning by building.").
- Headings preserved, all internal links preserved (verified by inspection).

### ℹ️ Known limitation (documented, acceptable)
The worklog notes: "Component-heavy Vento Markdown pages were left unchanged in the final diff because `deno fmt` rewrites component arguments into syntax the Lume/Vento build cannot parse."

This is the stated acceptable limitation — component pages need a component-aware formatter policy (a separate workstream item). Not an evaluator concern for W3.

---

## Verdict

| Check | Result |
|---|---|
| Prose/structure only | ✅ PASS |
| No `/rpc`/`/api/rpc` edits | ✅ PASS |
| No trigger `defer` / streams `publish`/`subscribe` / task telemetry / Postgres queue adapter claims altered | ✅ PASS |
| No W4/W5/W6 scope creep | ✅ PASS |
| Lume docs build green | ✅ PASS (142 files, exit 0) |
| Markdown fmt clean (touched files) | ✅ PASS (exit 0) |
| Voice improvements real | ✅ PASS |
| Component pages left unchanged (documented limitation) | ℹ️ ACCEPTABLE |

**Verdict: PASS** — Merge-ready for W3.
