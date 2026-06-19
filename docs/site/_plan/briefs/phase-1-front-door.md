# Phase 1 — Front-Door Authoring Briefs (first dispatch wave)

The three highest-ROI pages + the two re-homed concepts. Each brief is dispatch-ready: hand the agent
this brief + the linked `03` outline + `01` positioning + `08` locked decisions + the named research
files. Depends on Phase-0 `comp.*` (hero, featureGrid, card, callout, tabbedCode) existing.

---

### `docs/site/index` (landing) — REWRITE → `.vto` · Tutorial-entry · Phase 1 · **Opus medium**

- **GOAL:** A first-time visitor understands what NetScript is, who it's for, and the six reasons to
  care within one screen — and has a one-click path to Quickstart.
- **AUDIENCE:** `01` primary persona (backend/full-stack TS engineer), cold. Assume zero prior
  knowledge of NetScript; assume TS fluency.
- **OUTLINE:** `03 §1` (hero → hero code sample → featureGrid of 6 USPs → audience cards → learning
  path strip → footer band). One `comp.callout{type:"note"}` near hero: "backend framework + workspace
  generator, not a hosted service."
- **SOURCE UNITS (deno doc):** `service` (`defineService` for the 8-line hero sample), CLI
  (`netscript init`). Lift the hero snippet from `@netscript/service` README quick-example — verify it
  compiles.
- **APPLY FINDINGS:** #5 (Aspire USP + `--no-aspire` visible), #7 (outcome hero verbatim), #9 (tabbed
  code). **EXEMPLAR:** Astro (warm progressive front door) + Encore (scaffold→infra visualization —
  static file-tree + flow, no GIF in wave 1).
- **LOCKED DECISIONS (`08`):** Q1 hero = **C outcome-led headline + B contract-led sub-headline**
  (use the exact strings in `01 §one-liner` / `market-fit.md §2A`); Q2 warm "we", no body emoji; Q5
  Alpha badge present; Q7 Aspire foregrounded with `--no-aspire` opt-out mention; Q12 GitHub + JSR
  links only.
- **COMPONENTS:** `comp.hero`, `comp.tabbedCode` (hero sample: `deno run` vs global-install tabs),
  `comp.featureGrid`+`comp.card` (6 USP cards, each → its capability hub), `comp.card` learning-path
  strip, `comp.callout`.
- **ACCEPTANCE:** The 6 USP cards map 1:1 to `01 §USP` and each links to a real capability-hub slug
  (even if the hub is authored later — link target reserved). Hero strings match `08` Q1 exactly.
  Alpha maturity is visible above the fold. No hype adjectives ("blazing"/"magical").
- **GUARDRAILS:** docs lane; if the hero sample needs a source change to compile, STOP and flag a
  Codex slice — do not edit `packages/`.

---

### `docs/site/why` — NEW `.vto` · Explanation · Phase 1 · **Opus medium**

- **GOAL:** Convert a curious, skeptical engineer: name their pain (hand-assembling a TS backend),
  map each pain to a NetScript value with a code proof, and state honestly when NetScript is *not* the
  tool. This is the single most persuasive page on the site (`03 §2`).
- **AUDIENCE:** `01` primary + secondary (platform engineer evaluating Deno+Aspire). Entry state:
  has seen the landing, wants the argument before investing.
- **OUTLINE:** `03 §2` (problem list → NetScript-answer table → 6 USPs as prose each with one code
  proof → honest-scope callout → comparison framing → CTA to Quickstart).
- **SOURCE UNITS (deno doc):** for the three code proofs — `contracts`+`sdk` (contract→client type
  flow), `plugin-sagas-core` (a saga state machine), `telemetry`/`service` (a traced job/handler).
  Verify each proof compiles from real READMEs.
- **APPLY FINDINGS:** #8 (stop hand-assembling gap pitch — anchor the page), #6 (Alpha / React-Native
  posture, honest), #5 (Aspire as asset not liability), #10 (zero-codegen type-flow proof).
  **EXEMPLAR:** TanStack motivation page ("the problem is hard, here's the working code"). Match its
  persuasive density.
- **LOCKED DECISIONS (`08`):** Q4 = **self-assembly framing + ONE honest sibling table** (compare to
  "assembling it yourself"; the single table may name siblings — NestJS/Encore/tRPC/Temporal/Hono per
  `market-fit.md §3` — but stays confident/honest, never combative). Q5 Alpha. Q2 tone.
- **COMPONENTS:** `comp.callout{type:"tip"}` (honest "when NOT to use"), `comp.apiTable` (the one
  honest comparison table), `comp.tabbedCode` (the 3 USP code proofs, simple/advanced where apt).
- **ACCEPTANCE:** Exactly one comparison table (not a matrix war). Each of the 6 USPs has a runnable
  proof, not just prose. The "not the right tool" section is genuinely honest (names real limits:
  alpha API churn, Aspire/.NET footprint for non-opt-out, backend-only scope). Borrows TanStack's
  problem→proof cadence.
- **GUARDRAILS:** docs lane; the comparison table's competitor claims must be defensible (lift from
  `market-fit.md §3`, don't overstate); flag source-blockers to Codex.

---

### `docs/site/quickstart` — REWRITE (lean half of getting-started) · Tutorial · Phase 1 · **Opus medium**

- **GOAL:** A reader goes from nothing to a running NetScript workspace they can see working, in five
  minutes, on the strict happy path — no option dumps.
- **AUDIENCE:** `01` primary, ready to try. Has Deno 2.x or will install it.
- **OUTLINE:** `03 §3` (prereqs callout → install CLI tabbed → `netscript init my-app` + one-line
  `--dry-run` note → `cd` + start (Aspire/Fresh) → **what you see** (dashboard, `/design`, examples)
  → "you now have X" recap + next-steps card). One output block after `init`.
- **SOURCE UNITS (deno doc):** CLI (`netscript init`, start commands, `--dry-run`, `--no-aspire`).
  Verify command names/flags against the real CLI surface and the scaffold runtime, not prose.
- **APPLY FINDINGS:** #5 (`--no-aspire` mention as the opt-out for .NET-averse readers, one line — do
  not derail the happy path). **EXEMPLAR:** Astro tutorial step pacing + Laravel Sail quickstart
  (copy-paste blocks, verify-success output blocks).
- **LOCKED DECISIONS (`08`):** Q7 Aspire is the default path shown; `--no-aspire` is a single
  callout/aside, not a fork in the main flow. Q5 a small "Alpha" note is fine; don't dwell.
- **COMPONENTS:** `comp.callout{type:"note"}` (prereqs; `--no-aspire` aside), `comp.tabbedCode`
  (install: global vs ad-hoc `deno run`), `comp.card` (next-steps → Tutorial 1 / Capabilities /
  Reference).
- **ACCEPTANCE:** Every step is a copy-paste block; exactly one output block (after `init`) so the
  reader can verify success; no branching/option dumps (those live in Tutorial 1 / how-tos). Total
  reading-to-running ≤ 5 min. Command names verified against the live CLI.
- **GUARDRAILS:** docs lane; do not document flags/commands that don't exist on the current CLI
  surface — verify first.

---

### Re-home: `explanation/architecture.md` + `explanation/plugin-model.md` → Core concepts · RE-HOME · Phase 1 · **Opus low**

- **GOAL:** Move two genuinely good existing prose pages into the "Core concepts" lane with minimal
  edits, lowering their jargon cost for a public reader.
- **OUTLINE:** `02` RELINK/RE-HOME section + `03 §9`. Architecture overview: gloss `composition root`
  / `fitness functions` with a one-line aside or a `comp.callout{type:"note","for framework authors"}`
  around the deepest doctrine bits. Plugin model: largely as-is; render the plugin-vs-core table with
  `comp.apiTable` styling.
- **SOURCE UNITS:** none new — this is re-home + gloss only. Do not rewrite the prose.
- **LOCKED DECISIONS (`08`):** Q2 tone (soften, don't dumb down).
- **ACCEPTANCE:** No doctrine term appears unglossed on a public page; the prose substance is
  preserved; nav/breadcrumb reflects the new "Core concepts" home; pagefind/anchors intact.
- **GUARDRAILS:** RE-HOME only — no content rewrite, no Reference-lane edits. Mechanical lane (Opus
  low / Sonnet acceptable for the pure move; Opus low for the gloss judgment).

---

## Dispatch note for the Stage-4 workflow

Fan out the three `.vto` marketing pages (landing/why/quickstart) only **after** Phase-0 `comp.*`
exist. The re-home task can run in parallel (Markdown, no new `comp.*` beyond apiTable). Each agent:
runs under `netscript-harness` + `deno-fresh` (+ `jsr-audit` for the pages with published-surface
code samples), verifies every sample via `deno doc`, commits its page, appends `commits.md`, and
flags any framework-source blocker to a Codex slice rather than editing `packages/`.
