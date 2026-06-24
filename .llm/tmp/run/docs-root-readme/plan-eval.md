# PLAN-EVAL — PR3 Root README (PR #118, `docs/root-readme`)

- **Verdict**: `PASS`
- **Evaluator**: openrouter/minimax/minimax-m3
- **Evaluator session**: PLAN-EVAL (this artifact) — separate from the generator
- **Plan under evaluation**: `.llm/tmp/run/docs-root-readme/plan.md` (sections D1–D5, gates, debt, pipeline)
- **Research**: `.llm/tmp/run/docs-root-readme/research.md` (re-baseline against main @ f68fa916)
- **Dossier**: `.llm/tmp/run/docs-root-readme/sota-landing-dossier.md`
- **Deep-search brief**: `.llm/tmp/run/docs-root-readme/deep-search-brief.md` (31-package ground truth)
- **Run**: docs-root-readme, archetype SCOPE-docs, harness v2

---

## 1. Gate-by-gate verdict

| Plan-gate item | Verdict | Evidence |
|---|---|---|
| Research present and current | PASS | `research.md` re-baselines against main @ f68fa916 (PR1 #116 + PR2 #117 shipped). Dossier + deep-search brief are dated and explicit. |
| Decisions locked (D1–D5) | PASS | D1 (architecture story), D2 (ASCII hero), D3 (ASCII canvas primary, optional mermaid gated), D4 (six-layer package map, all 31), D5 (absolute URLs, Deno-first install). All decisions are explicit with rationale. |
| Open-decision sweep | PASS | Two author-discretion items remain (mermaid in `<details>` yes/no; exact scaffold-command form `deno run -A jsr:@netscript/cli init my-app` vs. `deno add … && netscript init …`). Both are safe to defer — neither forces rework. |
| Commit slices | PASS-with-note | Single authoring slice (one commit, one file `/README.md`, proven by run gates). The plan should call this out explicitly — minor hygiene note, not a failure. |
| Risk register | PASS-with-note | Risks are tracked in the debt section: no-logo-asset (D2 rationale + backlog), `@netscript/queue` reference-page (DOC-REF-1, follow-up), JSR-render (D2/D3/D5 mitigations), voice doctrine (run-gate). Labels them as "debt" rather than "risks" — minor terminology note, not a failure. |
| Gate set selected | PASS | Run gates: scoped `deno fmt --check` on `/README.md` (`--ext md`), zero relative doc links, 31-package map completeness, voice scan (zero banned tokens), GitHub + JSR dual render. Sufficient for SCOPE-docs. |
| Deferred scope explicit | PASS | "Out of scope: per-package READMEs (shipped PR2), the docs site, any logo/banner binary asset, any publish-config change." |
| jsr-audit applied | PASS-with-note | Plan effectively applies jsr-audit (dossier Track 6 + D2/D3/D5) but the plan-gate's jsr-audit checkbox is not literally marked. D2, D3, and D5 are the audit outputs. Minor hygiene note, not a failure. |
| netscript-doctrine applied | PASS | Plan respects the package/plugin archetype split (26 packages under `packages/` + 5 plugins under `plugins/`, mapped separately in D4). Public-surface story is grounded in real package READMEs (e.g. `contracts`, `queue`, `cli`). |
| netscript-deno-toolchain applied | PASS | Quickstart correctly grounds the scaffold command in `@netscript/cli`'s real `init` command ("Scaffold a new NetScript workspace", `packages/cli/src/public/features/init/init-command.ts`). |
| Voice doctrine enforced | PASS | Banned-tokens list is explicit ("no honest/honesty/honestly, no candor-announcing/apologetic-alpha framing"). Alpha signalled as factual noun-phrase callout + roadmap link (D1 §3, §8). |
| Scope discipline | PASS | SCOPE-docs. Single deliverable `/README.md`. No source, no `deno.json`, no `deno.lock`. Lock hygiene preserved. |

**Overall**: 12/12 gates pass; 3 carry a non-blocking hygiene note.

---

## 2. Plan-claim spot-checks (the accuracy the IMPL-EVAL cannot redo cheaply)

### 2.1 "31 packages" — authoritative and complete (incl. `@netscript/queue`)

- **Filesystem ground truth** (run 2026-XX-XX, branch `docs/root-readme` @ 96063906, off main @ f68fa916):
  - `packages/` (26): `aspire, auth-better-auth, auth-kv-oauth, auth-workos, cli, config, contracts, cron, database, fresh, fresh-ui, kv, logger, plugin, plugin-auth-core, plugin-sagas-core, plugin-streams-core, plugin-triggers-core, plugin-workers-core, prisma-adapter-mysql, queue, runtime-config, sdk, service, telemetry, watchers`
  - `plugins/` (5): `auth, sagas, streams, triggers, workers`
  - **Total = 31** ✓
- **`deep-search-brief.md` ground truth**: exactly 31 unique `@netscript/*` entries, 1:1 with the filesystem.
- **`@netscript/queue` inclusion**: confirmed in both filesystem and brief, and has a real shipped README + JSR badge.
- **Verdict**: Plan's 31-package count is correct, complete, and current.

### 2.2 Badge/voice convention matches `packages/contracts/README.md` (PR2)

- The shipped PR2 convention (verified in `packages/contracts/README.md`):
  1. Heading: `# @netscript/contracts`
  2. Badge row: `[![JSR](…)](https://jsr.io/@netscript/contracts)` + `[![CI](…/ci.yml/badge.svg)](…/ci.yml)` + `[![Docs](img.shields.io/badge/docs-rickylabs.github.io-blue)](https://rickylabs.github.io/netscript/)`
  3. CI workflow path: `actions/workflows/ci.yml` ✓ (matches the plan's claim)
  4. Tagline: single bold noun-phrase, contract-first
  5. Install block: `deno add jsr:@netscript/contracts` (primary) + `npx jsr add` + `bunx jsr add` (fallbacks)
- **Verdict**: Plan D5's "Deno-first with Node/Bun fallback, matching shipped package READMEs" is correct.

### 2.3 Dossier deltas the plan flags — all confirmed

| Dossier finding | Plan disposition | Confirmed? |
|---|---|---|
| Docs badge: `docs-v1.0-blue` (line 157) and `docs-complete-blue` (line 171) | D5: use shipped `docs-rickylabs.github.io-blue` | YES — both inaccuracies present in dossier |
| ASCII canvas illustrative plugin captions: `(Better-Auth)`, `(Fedify Qs)`, `(Sagas/State)` (line 208) | D3: use real plugin names `auth, workers, sagas, triggers, streams` | YES — captions present in dossier |
| Dossier blurbs are paraphrased and over-claim ("feature-complete", "v1.0") | D1: rewrites the architecture story against the real shipped surface | YES — dossier blurbs use aspirational wording that conflicts with the plan's alpha factual framing |
| **Verdict**: All three dossier deltas the plan flags are real and correctly identified. | | |

### 2.4 JSR-safety of the locked devices (D2, D3, D5)

- **D2 (ASCII hero)**: confirmed JSR-safe. Dossier Track 6 establishes that monospace blocks render on both GitHub and JSR scope pages. JSR does not strip preformatted ASCII.
- **D3 (ASCII canvas primary, mermaid gated)**: confirmed JSR-safe.
  - ASCII canvas: always-visible, JSR-safe.
  - Mermaid (optional): correctly gated under `<details>` (GitHub-only viewer convenience) with the ASCII canvas preceding it as the source of truth. JSR strips mermaid but the ASCII is preserved. This is exactly the layered-fallback pattern the jsr-audit skill prescribes.
- **D5 (absolute URLs)**: confirmed JSR-safe. Dossier Track 6 establishes that JSR packages are uploaded in distinct flat directories; relative links break. The plan mandates absolute URLs (`https://github.com/rickylabs/netscript/...`, `https://jsr.io/@netscript/...`, `https://rickylabs.github.io/netscript/...`).
- **Verdict**: All three locked devices survive the JSR scope-page renderer. The plan's JSR-compat toolkit (dossier Track 6 + D2/D3/D5) is correct and complete.

### 2.5 Voice doctrine

- **Banned tokens named**: `honest/honesty/honestly`, candor-announcing, apologetic-alpha. The voice scan run gate will fail the build on any occurrence.
- **Alpha framing**: signalled as a factual noun-phrase callout ("NetScript is pre-1.0 alpha" + roadmap link) — not an apology. Matches the doctrine.
- **Verdict**: Voice doctrine is correctly enforced; no landmines for the author.

### 2.6 Run-gate sufficiency

For a SCOPE-docs run that touches exactly one file (`/README.md`), the run gates are:
1. Scoped `deno fmt --check --ext md /README.md` — formatting
2. Link sanity (zero relative doc links) — D5 enforcement
3. 31-package map completeness (every brief entry appears, in the right layer) — D4 enforcement
4. Voice scan (zero banned tokens) — D1 enforcement
5. GitHub + JSR dual render (manual paste into JSR scope preview) — D2/D3/D5 enforcement

This set is sufficient to certify a single-file Markdown deliverable. No `deno doc --lint` or `deno publish --dry-run` is needed because the run does not touch any `deno.json` (no publish-config change). No `deno task check` is needed because no source is touched.

**Verdict**: Gate set is sufficient; no missing gate would catch a real failure mode for this archetype.

### 2.7 Debt handling

- **No-logo-asset finding** (D2): correctly dispositioned. The ASCII hero ships in this PR; the binary logo/banner is a backlog item, not a blocker. D2's rationale ("Option B's image path is non-existent") is the correct reason to defer.
- **`@netscript/queue` reference-page risk** (D5, DOC-REF-1): correctly tracked. The risk is "the docs site reference page `/reference/queue/` may not be published yet"; the JSR scope page `https://jsr.io/@netscript/queue` is the primary link and is real (verified in `packages/queue/README.md`). The follow-up is to add the docs-site link once the site is published.
- **Verdict**: Both debt items are correctly dispositioned and tracked.

---

## 3. Discrepancies / open items the author should know (non-blocking)

These are *informational* — the plan passes the gate, but the author should be aware so they don't re-litigate the call.

1. **Scaffold command exact form**: The plan does not pin the exact 60-second quickstart command. Suggested form (ground-truthed against `packages/cli/src/public/features/init/init-command.ts`):
   - `deno run -A jsr:@netscript/cli init my-app`
   The author may also use `deno add jsr:@netscript/cli` first. Either is defensible; this is an author-discretion call.
2. **Mermaid `<details>` is optional** (D3 "may be included"). The author may omit it entirely. If included, the ASCII canvas must precede it.
3. **Single-slice commit hygiene**: The plan should call out "one authoring commit, one file" explicitly. (Hygiene only — the run gates prove the slice.)
4. **jsr-audit checkbox**: The plan's gate-section checkbox for `jsr-audit` should be marked PASS with manual evidence (dossier Track 6 + D2/D3/D5). The audit is effectively applied, just not labeled. (Hygiene only.)
5. **Risk register terminology**: Plan uses "debt" where the gate says "risk register". Both work; renaming for the plan-gate checklist would be cleaner. (Hygiene only.)

None of these are rework-forcing.

---

## 4. Final verdict

**`PASS`** — the plan is locked, ground-truthed against the shipped PR1/PR2 reality, scope-disciplined (SCOPE-docs, single deliverable), and the locked devices (D2 ASCII hero, D3 ASCII canvas + optional gated mermaid, D5 absolute URLs) all survive the JSR scope-page renderer. The dossier deltas the plan flags are real and correctly identified. The run gates are sufficient to certify the authored output. The author is cleared to proceed under the plan.

> **Do not author the README** — that is the next (separate, generator) session's job. This evaluator's contract ends at the verdict.

---

## 5. Lock hygiene

- No source, no `packages/`/`plugins/`, no `deno.json`, no `deno.lock` touched.
- Only file written by this evaluator: `.llm/tmp/run/docs-root-readme/plan-eval.md`.
