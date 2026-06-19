# IMPL-EVAL: PASS

## Dimension scores (A–F, ≤15-word evidence each)

1. **First-5-min onboarding (quickstart) — A.** 3-step install→scaffold→start with banner mock, `--no-aspire` opt-out, and `/design` entry-point called out.
2. **Why adopt over X persuasiveness — A.** Self-assembly framing, honest "not for" callout, single table names NestJS+Encore, tRPC, Temporal, Hono with factual wrap-only copy.
3. **Feature-landscape legibility — A.** Index feature grid covers all 7 USPs (contract-first, sagas, Aspire, observability, plugins, fresh-ui, plus personas); `/design` and `/examples/*` routes surfaced.
4. **Code-proof credibility — B.** Why has 3 accurate TS proofs (contracts, sagas, telemetry); index has 1; quickstart has only bash, no framework-code snippet.
5. **Information architecture & nav clarity — A.** Diátaxis dirs present (`tutorials/`, `reference/`, `explanation/`, `how-to/`); plain-English labels; breadcrumb + learningPath + nextPrev wired.
6. **Visual/comprehension polish — A.** Tabbed code, callouts, featureGrid, learningPath all used purposefully; copy is warm-but-precise per Q2 tone.

## Prioritized improvements (max 8)

- [P0] quickstart — add a 6-line `defineService` or `defineSaga` TS snippet after Step 3 — readers see bash then URLs, never the framework code until tutorial 2.
- [P0] index — promote the "Orchestrated with Aspire" card from #3 to #2 (behind contract-first) — Q7 marks Aspire hero-level; current order buries the differentiator.
- [P1] quickstart — short failure-mode aside (port 18888/8000 collision, `aspire restore` first-run time, missing Deno) — converts a dead-end into a 30-second fix.
- [P1] why — split the combined "NestJS / Encore" row into two named rows — Q4 letters name both; separate rows double the keyword hits without bloat.
- [P1] index — collapse the trailing "API reference / GitHub / JSR" triplet (it duplicates the personas block) — reclaims above-the-fold space for a 7th USP card.
- [P1] why — open with a 2-line value prop above the 6-pain enumeration — skimmers should see the answer before scrolling the diagnosis.
- [P1] quickstart — repeat the tutorial link in the "Next steps" callout body, not only in `nextPrev` — some readers miss bottom-of-page widgets.
- [P1] why — the "NOT the right tool" callout should hyperlink `--no-aspire` to `/concepts/aspire/` so opt-out details are one click, not a guess.

## Notes on locked-08 compliance

- Q1: hero uses C, subhead uses B — locked copy present.
- Q2: warm "we", sparing humor, no body emoji — observed.
- Q4: self-assembly framing + single honest table with NestJS, Encore, tRPC, Temporal, Hono named — observed (NestJS+Encore share one row; both names appear).
- Q5: alpha callout visible on index, why, and quickstart — observed.
- Q7: Aspire in hero/feature grid + `--no-aspire` opt-out in quickstart and why — observed.
- Q8: "own your UI" is a USP card (not hero) on index — observed.
- Q11: hybrid markdown + .vto authoring — observed in frontmatter (`templateEngine: [vento, md]` on why/quickstart).
- Q12: GitHub + JSR links present in index footer area — observed.
- Q13/Q14: plain-English labels + planning-only posture — observed (nav not opened; brief mandates and front-door copy is plain).
---

## IMPL-EVAL — whole-tree authoring wave (Pipeline Step 5) — minimax-m3

- **Cycle 1** (run 27812125012, comment 4749453645): **FAIL_FIX** — single item:
  `tutorials/getting-started.md` stale plan-§4 orphan (truncated install line :32)
  still linked from `tutorials/index.md`. All other zones PASS (build green 150 files;
  accuracy vs ground-truth; fil d'Ariane; scope discipline; comp-tag rigor).
- **Supervisor fix** (commit 05f04513): `git rm` getting-started.md; replaced index.md
  stub with the real 5-rung continuous-app ladder. Build green, 148 files.
- **Cycle 2** (run 27814275586): **PASS** — fix verified (file gone, index relinked,
  no live refs), build green 148 files, all cycle-1 PASS zones reconfirmed. No further
  eval needed (cycle 2 of 2).

### Carried backlog → WSL Codex Step-6 (polish to bar)
- Highlight-plugin plaintext registration (`docs/site/_config.ts`) — kills the non-fatal
  `Unknown language: "no-highlight"` warning. Evaluator suggests tracking as DEBT if not done.
- Watchers / config intent-surface coverage (completeness-critic gap).
- `--no-aspire` CLI flag verification + doc grounding.
- Alpha-badge guardrail; footer edit-links. (NOTE: these touch chrome/_config — the plan
  scoped chrome OUT of the authoring run; confirm with user before Codex edits chrome.)
