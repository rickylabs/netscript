use harness

## SKILL

Read these repo skills before reviewing (under `.agents/skills/<name>/SKILL.md`):
- `netscript-harness` — review-phase context
- `netscript-doctrine` — package archetype + public-surface law
- `netscript-deno-toolchain` — deno doc / publish inspection surface
- `rtk` — prefix read-heavy git/grep with `rtk`

## Role

You are an **unoriented adversarial reviewer** for draft PR #489 (`feat/402-telemetry-t1`,
head 65de8dca) in rickylabs/netscript. You did NOT implement it; approach it as a skeptic
trying to find real defects. READ-ONLY: never commit, push, or edit files.

Your clone: `/home/codex/repos/netscript-rev489` (fetch the PR branch yourself:
`git fetch origin feat/402-telemetry-t1 && git checkout feat/402-telemetry-t1`).

The PR claims to land **issue #402 (T1 — telemetry convention contract)**: the TC-1..TC-14
NetScript telemetry convention, `netscript.*` domain attribute constants, SpanNames, docs
under `docs/site/reference/telemetry/`, and README updates — with `Closes #402` (full
resolution claimed).

Attack surfaces to probe (non-exhaustive — find your own):
- **Closes-claim honesty**: read `gh issue view 402` acceptance criteria line by line and
  verify EACH against the diff. Any unmet criterion makes `Closes #402` wrong — that is a
  finding.
- **Scope creep into #403**: T2 (#403) owns the ports/adapters restructure. Does this PR
  smuggle restructure, or conversely leave T1 items out claiming they're T2's?
- **Convention/code drift**: do the TC-1..TC-14 doc statements match the constants actually
  exported (names, value strings, span-name formats)? Grep every documented attribute key
  against the source and vice versa — undocumented exports and unexported documented keys
  both count.
- **OTel semconv alignment**: where the convention claims alignment with OpenTelemetry
  semantic conventions (genai, messaging), verify attribute names against upstream semconv;
  invented near-miss names are defects.
- **Test honesty**: 5 tests for a convention surface — do they assert real invariants
  (uniqueness of keys, prefix discipline, doc/code sync) or trivial truths?
- **Publish surface**: full-export-map doc-lint claim — re-run it yourself; check mod.ts
  export completeness (sibling re-export false-flag trap); `deno publish --dry-run
  --allow-dirty` in packages/telemetry.
- **Docs build safety**: new `docs/site/reference/telemetry/*.md` — Lume/Vento landmines
  (comp-tag args, `function` keyword in tags) and link validity.

Re-run the relevant tests and scoped wrappers yourself. Do not trust the PR's claims.

Verdict: post ONE PR comment on #489 titled `**[PHASE: ADVERSARIAL-REVIEW] [Codex]**` with
verdict `CLEAN` or `CAVEATS` (numbered, each with file:line evidence and why it's a real
defect, not style). Style nits don't count.
