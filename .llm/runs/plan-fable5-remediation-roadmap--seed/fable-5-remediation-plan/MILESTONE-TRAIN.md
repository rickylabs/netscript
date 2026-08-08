# Milestone train — FILED

> Executed after owner ratification on 2026-08-08. GitHub is authoritative; see `FILING-LOG.md`
> for the final milestone-object mapping and reconciliation receipts.

Proposed release train for the long-range remediation program. Grounded in the live board
snapshot (`research/github-board-open.md`, 2026-08-08: 259 open issues, 13 open milestones) and
the house milestone-shift pattern verified twice in `research/github-board-history.md` §10
(rename-in-place highest→lowest preserving number/state/description, then create the freed title;
per-issue written move reasons; pre/post tables). **Every existing issue is retained; whole
milestones move by rename, so zero per-issue mutation is needed for the shifted content.**

## 1. Train at a glance

| Cut | Name / theme | Content | Provenance |
| --- | --- | --- | --- |
| **0.0.5** (current, mid-canary) | Close-out as already scoped | The 21 open issues incl. the undispatched W2–W5 remainder (#1326+#1329 pair, #1333, #1208 ph.1, #1338…). **No new scope enters.** | existing |
| **0.0.6** | **Verification, docs truth & RFC ratification** | Existing 22 (#1343, #1210, #1260, #1201, #1278 amended, #1093, #1280/#1320 blocked…) + new: RFC-A + RFC-B tracking issues (T1-01, T3-01), canonical-dialect docs fixes (T5-01…T5-05), soundness/hygiene gates (T6-01…T6-03). Move out: #1279 → 0.0.15 (see §4). | existing + drafts |
| **0.0.7 (new)** | **Typed seams + generation** | T1-02…T1-06 (oRPC re-exposure, typed errors, transport consolidation, auth + second contribution dogfoods), T2-01…T2-07 (route-slice generator, client/query generator, `resolveProjectRoot`, `ui:add` triad, `/design` sync, defect fixes). | new drafts |
| **0.0.8 (new)** | **Runtime truth + service slice** | T4-01…T4-08 (saga receipts p0, child liveness, stream durability, saga spans, env/port fixes, E2E child gates), TA-01…TA-05 (auth defects + generated-path defaults), T3-02…T3-04 (service layout, command kit, webhook recipe), Wave-7 measured smoke as the exit gate. #979/#980 join here (their E2E/docs prerequisites are T4-06/T4-08). | new drafts + 2 unmilestoned |
| **0.0.9** (was 0.0.7) | Frontend contribution layer | #922 + #923–#941 intact (9 p0 critical path unchanged internally). | rename |
| **0.0.10** (was 0.0.8) | as currently scoped (48) | unchanged membership | rename |
| **0.0.11** (was 0.0.9) | as currently scoped (15, incl. #944) | unchanged | rename |
| **0.0.12** (was 0.0.10) | as currently scoped (2) | unchanged | rename |
| **0.0.13** (was 0.0.11) | as currently scoped (10, incl. #942/#943) | unchanged | rename |
| **0.0.14** (was 0.0.12) | enterprise-auth contracts band (#884/#885 et al., 11) | unchanged | rename |
| **0.0.15** (was 0.0.13) | horizon band (44: process-manager/deploy-plugin tail) + #1279 | rename + 1 move |

## 2. Why insert exactly two milestones

- **Dependency shape.** RFC-A/RFC-B ratify in 0.0.6 (docs/verification cut — cheap, already
  half-full of verification work). Their implementations are the only content of new-0.0.7/0.0.8,
  so the remediation program never mixes with #922's nine-p0 critical path — which was the
  pre-plan's explicit constraint ("future plugin/auth milestones shift only as part of a coherent
  dependency graph; never silently absorbed", `research/preplan-package.md` §Milestone).
- **Coherence for #922.** #928 (contracts/v1) freezes plugin contribution contracts. RFC-A
  defines the *SDK/client* contribution axis. Landing RFC-A first (0.0.6 ratify → 0.0.7
  implement) lets #928's envelope be reviewed against it instead of forcing a v2 envelope later.
- **Wave-7 placement.** The measured unfamiliar-agent smoke is the *exit gate of 0.0.8*: the
  program's thesis (generation changes agent behavior) is falsifiable exactly once the
  generators + runtime truth exist. Advancing to 0.0.9 (#922) without that proof repeats the
  capability-present-not-activated failure the corpus measured six times.

## 3. Rename execution order (for the filing stage, owner-ratified only)

Per the house pattern (highest→lowest so titles never collide; title is the only field changed):

```text
0.0.13 → 0.0.15    0.0.12 → 0.0.14    0.0.11 → 0.0.13    0.0.10 → 0.0.12
0.0.9  → 0.0.11    0.0.8  → 0.0.10    0.0.7  → 0.0.9
then create: 0.0.7 "Typed seams + generation", 0.0.8 "Runtime truth + service slice"
```

Milestone descriptions get an authority banner + one-line theme; no due dates (house norm: none
exist today). **This run executes none of this.**

## 4. Per-issue moves (the complete list — everything else moves by rename or stays)

| Issue | From → To | Reason |
| --- | --- | --- |
| #1279 (migration chapter, umbrella) | 0.0.6 → 0.0.15 | Marketing/adoption surface, not remediation; #1275 duplicate folds into it first (amendments). |
| #979 (plugin API port pins) | none → 0.0.8 | Its two prerequisites (endpoint-resolving E2E gates, docs port passages) are T4-08/T4-06 work in 0.0.8. |
| #980 (`service add` port pin) | none → 0.0.8 | Sibling of #979, same prerequisite chain. |
| #1000 (docs) | none → Backlog / Triage | Untriaged; hygiene amendment adds labels. |
| #175, #767, #768, #863, #864 | 0.0.2 → owner retriage (default Backlog) | 0.0.2 shipped long ago; #175 has zero labels. Explicit retriage, never a silent close. |

New drafts are filed directly into their §1 milestones at ratification time.

## 5. Entry/exit criteria per remediation cut

- **0.0.6 entry:** 0.0.5 stable cut green (canary-pair doctrine, `netscript-release`). **Exit:**
  RFC-A + RFC-B ratified (tracking issues closed as accepted); docs speak ONE client dialect and
  the compile-the-docs gate is live; #1343 installed-consumer proof green; #1278 guard rail
  fail-closed.
- **0.0.7 entry:** RFC-A accepted. **Exit:** a scaffolded app + one added service reach a typed,
  cache-first, auth-composable page **entirely through generated modules** (no hand-written
  client/query wiring), with the no-`any` consumer gate green; second-run generator byte-identity
  proven.
- **0.0.8 entry:** 0.0.7 generators shipped in a canary. **Exit:** saga publish/compensation
  causally provable from persisted state + one correlated trace; child-liveness states visible;
  durable-stream restart proof; **Wave-7 measured smoke shows the generated path adopted or
  explicitly rejected by an unfamiliar agent** (see `WAVE7-AND-AGENT-ADOPTION.md`).
- **0.0.9+ entry:** Wave-7 verdict recorded. #922 proceeds on its own already-planned wave
  structure.

## 6. Epic-overlap normalization (amendments, not moves)

Recorded here because the train depends on epic scopes staying disjoint; full text in
`EXISTING-ISSUE-AMENDMENTS.md`:

- #823's entire open membership (#451/#453–#455) sits inside #327's child list → amendment
  declares #327 the umbrella-of-record for those four, #823 narrowed to the Nitro-output RFC.
- #400 ↔ #922: #427/#432 "KEEP-and-re-baseline" from the #890 RFC supersession map has never
  been executed → amendment schedules the re-baseline at 0.0.9 entry.
- #892 vs #327/#830: no cross-reference in either body → amendment adds mutual boundary notes.
- #922 body wave labels (beta.13/15/17) vs actual milestones → additive clarification comment
  mapping waves to the renamed train (0.0.9/0.0.13/0.0.15).
- Duplicate umbrellas: #1276 → folds into #1278 (0.0.6, epic-of-record); #1275 → folds into
  #1279 (moves to 0.0.15).

## 7. What this train deliberately does not do

No issue is closed by this plan (folds happen via owner-ratified supersession comments; closes
only via downstream PR keywords). No epic absorbs another epic's children. 0.0.5 membership is
untouched. The `wave:*` label system stays dead (conventions corpus: zero recent usage) — the
train uses milestones only. Semver stays 0.0.x; no minor-version jump is proposed until the
0.0.8 exit proof exists (a credible "0.1.0" claim is exactly the Wave-7 verdict).
