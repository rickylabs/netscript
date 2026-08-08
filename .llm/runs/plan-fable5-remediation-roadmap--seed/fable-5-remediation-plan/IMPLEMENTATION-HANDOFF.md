# Implementation handoff — DRAFT (no GitHub mutation; owner ratification pending)

What becomes executable, in what order, on which lanes, once the owner ratifies the fork sweep
(`MASTER-PLAN.md` §7) and a later authorized run files the board from the manifest
(`ISSUE-DEDUP-AND-SUPERSESSION.md`). Implementation lanes launch from **GitHub + these design
packs**, never from this run's chat history. Routing is data: select every lane from
`.llm/harness/workflow/lane-policy.md` at dispatch time; identities below are the *expected*
canonical routes as of 2026-08-08.

## 0. Pre-implementation gate (owner + one filing run)

1. Owner ratifies forks F1–F12 (or amends; every default is reversible).
2. A dedicated filing session executes, in order: label parity (`.github/labels.yml` — the file
   is missing 33+ live labels and live is missing `status:close-gate-override`/`docs-eval:skip`),
   milestone renames highest→lowest + create 0.0.7/0.0.8, amendments from
   `EXISTING-ISSUE-AMENDMENTS.md`, then issue filing per milestone directory with `FILING-LOG.md`
   mapping draft-ID → live number. Re-verify each touched issue's live state immediately before
   mutation (GitHub wins over this plan on conflict).
3. After filing, GitHub is the single source of truth; these run docs get authority banners.

## 1. First executable groups (PR-sized, cluster rules per `agent-milestone-orchestrator`)

**Group A — 0.0.5 close-out (already implementation-ready today, no ratification needed).**
The undispatched W2–W5 remainder is fully specified on live issues: the streams pair
(#1326+#1329, one supervisor — they share the envelope), #1333 (p0 scaffold frontend), #1208
phase 1. Lane: `complex_implementation` (Codex Sol · high) for #1326/#1329/#1333;
`documentation_authoring` for #1208. Ready because: complete contracts + acceptance on the live
issues; the corpus adds only evidence pointers (amendments).

**Group B — 0.0.6 wave 1 (ready at ratification; docs + gates, cheap lanes).**
- B1: T5-01 dialect fix (**after F7 is decided**) + T5-02 compile-the-docs gate — one docs-lane
  PR pair; T5-02's checker is repo tooling (`chore_code` lane).
- B2: T5-03 + T5-04 MCP wiring — small scoped slices, `light_implementation`.
- B3: T6-01 + T6-02 quality/CI gates — `normal_implementation`; T6-02's lock decision first.
- B4: RFC-A + RFC-B tracking issues filed; RFC review is owner + `deep_analysis` (Fable) session
  over the `rfcs/` drafts; ratification recorded on the tracking issues.
- Gate set: scoped wrappers + `doc:lint` + the new gates' own RED-first fixtures. Not e2e-cli.

**Group C — 0.0.7 wave 1 (entry: RFC-A accepted).**
- C1: T1-04 transport consolidation (prereq of T1-02) — `normal_implementation`.
- C2: T1-02 seam re-exposure + T1-03 typed errors — `complex_implementation`, jsr-audit gate
  (public surface changes), review per effort-paired ladder.
- C3: T2-03 root-targeting fix (hard prereq of T2-01/02/04) — `normal_implementation`.
- Then C4: T2-02 generator → C5: T2-01 slice generator + T2-04 triad → C6: T1-05 auth dogfood →
  C7: T1-06 trace contribution. Byte-identity and no-`any` consumer gates are the slice gates.

**Group D — 0.0.8 wave 1 (entry: 0.0.7 generators in a canary).**
- D1: T4-01 saga receipts (p0, **after F10**) + T4-08 E2E truth gates (its detector) — one
  supervisor, `complex_implementation`.
- D2: TA-02 → TA-01 → TA-03a/b/c auth cluster — TA-02 first (the seam), `complex_implementation`;
  security-review skill on every TA PR.
- D3: T3-02 service layout → T3-03 command kit (after RFC-B) — `complex_implementation`.
- D4: T4-02/T4-03/T4-04 runtime truth set — parallelizable across supervisors.
- Exit: T7-01 Wave-7 smoke (arms per `WAVE7-AND-AGENT-ADOPTION.md`, **after F11**).

## 2. Harness profile per group

Every brief starts with `use harness` and carries a `## SKILL` chapter. Group A/C/D framework
slices: archetype per touched package (`netscript-doctrine`; SDK work = Archetype 2/4, CLI =
Archetype 6, plugins = Archetype 5) + `SCOPE-service` or `SCOPE-frontend` overlay as fits; gates
from `gates/archetype-gate-matrix.md` **plus** `quality:scan` + `arch:check` (mandatory for
`packages/**`/`plugins/**` — the #745 lesson), jsr-audit for public-surface waves. Docs slices:
`SCOPE-docs` + the doc-audit pipeline (`docs_audit` Sol pass → `docs_polish` Fable pass).
PLAN-EVAL: conditional per current policy — required for RFC-A/RFC-B implementation waves and the
milestone-rename filing run; N/A for single-issue mechanical slices. IMPL-EVAL: mandatory
(this run's waiver does **not** extend to implementation runs).

## 3. Agent-brief skeleton (per PR cluster)

```text
use harness
## SKILL
netscript-harness, netscript-doctrine, netscript-pr, <domain: netscript-cli|deno-fresh|aspire|jsr-audit>, rtk
## Contract
<live issue #s + the draft files by path — the draft IS the spec>
## Gates (deliverables, not suggestions)
<slice gates + quality:scan + arch:check + RED-first fixture named in the draft's Acceptance>
## Boundaries
<the draft's Boundaries section verbatim — the adjacent issues you must not touch>
## Trail
branch <type>/<slug>; draft PR on first commit; per-slice PR comments; closing keyword only when
every acceptance box is truthfully tickable (close-gate #387).
```

## 4. Why these groups are implementation-ready

Every draft carries current-source evidence (file:line at `fac9e339042c`), an executable
acceptance set with negative tests, explicit boundaries against the 259-issue live board, and
dependency edges that the group ordering above respects. The three verify-first rows (T4-07,
theme-island CORS, saga OOM) and the G16 service-name question are staged as verification tasks,
not implementation, so no group blocks on an unproven claim. The measurement chain
(#1102/#1201/#1197/#1090) is consumed, not duplicated, by T7-01.

## 5. Standing constraints for every implementing agent

No `deno.lock` deletion or cache nukes; rtk-prefixed reads; scoped wrappers for verdicts; e2e
(`deno task e2e:cli`) only at merge-readiness; canary discipline per `netscript-release`;
`agentic:leak-check` on any failed runtime session; drift → run `drift.md`, never silent.
