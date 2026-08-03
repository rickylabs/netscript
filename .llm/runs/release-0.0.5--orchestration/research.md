# Research — release-0.0.5--orchestration

The milestone read (stage A), recorded so the plan's clustering is evaluator-verifiable. Sources:
`gh issue list/view --repo rickylabs/netscript` (all 44 open 0.0.5 bodies, read 2026-08-03 via a
read-only explore agent), RFC #1123, epic #1169's slicing comment (read directly by PLAN-EVAL;
incorporated in plan v2), the three system artifacts, and the owner brief (`owner-brief.md`).

## Structural facts the plan is built on

### Epic #1169 (one-pass publish) — pre-sliced by its own record

Slice order is binding, from the epic's slicing record: **S1 (#1168) first** (introduces the
attempt-visible verdict primitive), then S2 (#1170) / S4 (#1174 + #1142 as one slice), then S3
(#1171), then S5 (#1172), then S6 (#1173), then S7 (already fixed via #1165/#1167), then S8
(#1175 — post-release; moved to 0.0.6). #1142 is a Group-A member via #1174's body.

### RFC #1123 / epic #1126 (OpenAPI→MCP) — gating graph

- Wave-0 proofs (p0): S1 #1127 (P1 — **arbitrates F1**; FAIL is legitimate and activates F1(b):
  `aspire-cli` adapter primary, S7 re-scoped), S2 #1128 (P2 — gates S4 #1130 and S6 #1132; keyword
  inventory feeds the F2-gated validator), S3 #1129 (P3 — feeds S5 wording, gates nothing
  structurally). Each emits a committed `proofs/P<n>-verdict.md`; a skipped proof must be
  indistinguishable from a failed one, never from a passed one.
- S1 #1127 gates S5 #1131 and S7 #1133 ("do not start before the verdict exists").
- S8 #1134 hard-blocks S10 #1136 ("do not land ahead of S8 under any sequencing pressure");
  S6 #1132's receipt semantics also depend on S8.
- F2 stands at (a): #1139 out of scope. F3(a): all contracts in one slice (#1137). F4(a): #1136.
- Every `packages/**` slice: full Archetype-2 gate column, `quality:scan`, `arch:check`; the
  helpers-template slice takes `scaffold.runtime` at merge-readiness; no new lint-ignores.

### Cross-issue facts that shaped clusters

- #1166 explicitly invalidates #1149's payload-difference box until its fix lands, and its own
  boxes 2–4 require a real canary cut *after* the fix merges → the PR can only `Refs #1166`;
  closure is a hand-close on canary.1 evidence.
- #1173 (S6 audit) and #1085 overlap on one refusal path (`duplicate_sender_risk` exit-0); the
  audit decides how much of #1085 box 2 survives — sequence #1173 before #1085, separate PRs.
- #1105 and #1171 share `check-close-gate.ts` and the verdict-honesty acceptance family.
- #1108 subsumes #1110's contracts-inventory defect but each carries a full independent
  acceptance set → separate PRs, #1108 first, #1110 sequenced after around the shared page.
- #1024 has one box left (standalone consumer scaffold e2e). #1004 has one box left
  (demonstrated partial-publish retry).
- Mislabels (docs label, code acceptance): #1112, #1110, #1108, #1102 — routed as code slices.

### Observational criteria inventory

- #1149 — six boxes, all observational; retro-audit of the two 0.0.4 canaries + live evidence
  from this run's canary points; box 4 gated on #1166.
- #1090 — 0.0.5's verification hub for observations inherited from **0.0.4** (from #1068/#1071/
  #1072/#1073); stays in 0.0.5, hand-closed on evidence or moved at cut with reason.
- #1140 — post-ship observation of the 0.0.5-shipped surface → **moved to 0.0.6** (comment on
  issue, 2026-08-03); #1117 box 6 and #1102's tracking box route to it there.
- #1169's one-pass DoD box — evidenced only by this run's own stable cut.

## Quota / transport baseline (stage-B inputs)

- `agentic:routing-state`: no persisted quota-fallback transitions.
- Codex account (from the PLAN-EVAL turn's rate-limit event, 2026-08-03): weekly window
  **57% used**, resets ~2026-08-10; plan `prolite`, no credits. Headroom for early waves;
  re-check and record before every wave dispatch.
- agy (docs lane): Google subscription; 0.0.4 hit a hard cap mid-delivery — docs PRs serialized
  one per wave, with re-waving (never model substitution) as the contingency.
