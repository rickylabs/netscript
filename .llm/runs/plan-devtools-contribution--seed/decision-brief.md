# Owner decision brief — DevTools contribution architecture RFC

> **STATUS: RATIFIED 2026-08-11.** This was a request for decisions; it is now the **record of
> decisions taken**. Every fork below is closed. Board filing is authorized and executes once from
> `filing/filing-manifest.md`.

**Run:** `plan-devtools-contribution--seed` · **PR:** #1450 · **RFC:**
`rfcs/0000-devtools-contribution.md` · **Baseline:** `main` @ `2256a67bf`

---

## What the owner decided

| # | Fork | **Ratified decision** | Recorded |
| - | ---- | --------------------- | -------- |
| **D-0a** | The mandated design pass could not be launched — waive it, or hold? | **Neither.** Do **not** waive; **replace GLM 5.2 with Qwen 3.8 Max at `max`**, plus **Kimi K3** for the pure UI/UX lane, via OpenCode/OpenRouter on read-only surfaces | drift **D-15**, **D-16** |
| **F-1** | Depend on #890's unbuilt spine, or self-contained? | **Self-contained DevTools family and spine, built first in `packages/devtools-core`** — not serialized behind #890's 24 unimplemented children | drift **D-19**; RFC §6, §13.1 |
| **F-3** | Manifest schema-evolution precondition | **`.passthrough()`**, `schemaVersion` stays `1`, landing **before** any manifest-visible pointer, with three named tests | drift **D-19**; RFC §6 |
| **Plan-Gate** | A third PLAN-EVAL cycle for the amendments? | **Waived in writing.** Owner supplies the gate clearance | drift **D-18** |
| **Board filing** | — | **Authorized**, once, from the committed manifest, preserving the 2026-07-19 train, no duplicates | drift **D-19** |

**One thing this record deliberately does not say.** The Codex evaluator **never returned `PASS`** —
it returned `FAIL_PLAN` twice, and its remaining blockers were owner-gated. The gate was cleared by
**owner waiver**, not by an evaluator verdict, and `plan-eval.md` carries a banner saying so. Anyone
reading this run later should not mistake one for the other.

---

## Decisions carried forward as recommended, now in force

These were recommendations in the pre-ratification brief; ratification of the whole brief adopts
them. Each is normative in the RFC.

| # | Decision |
| - | -------- |
| **F-4** | #890's pointer axis wins the three-seam contest; **#427 folds in**, **#734 closes** |
| **F-5 / F-6** | Host-owned **closed** zone vocabulary; ordering = host anchors, then clamped `(order, mountId, id)` |
| **F-7** | **Read-only v1.** Mutating actions staged — v1 renders the CLI-equivalent line, it does not execute it |
| **F-8** | **A1** contracts (`packages/devtools-core`) + **A6** CLI emission + **A5** thin plugin; host app is generated userland; A3 trigger written down |
| **F-9** | **Do not re-milestone.** The 2026-07-19 owner-ratified train stands; `0.0.14`'s stale description is the real defect |
| **F-10** | Two epics both survive; **#922's children untouched** |
| **F-11** | `CR-DDX-HOSTAGNOSTIC` **accepted** — host-neutral descriptor + host-provided context; un-dangles #544 |
| **F-12** | PR #780 — salvage the design-language specs, then close |
| **F-13** | The 7-member family was never ratified; treated as **unratified analysis** |
| **F-14 / F-15 / F-16** | Vite 8 a non-goal with a re-entry condition; generic Vite and Fresh-UI contribution deferred to their own RFCs **with entry criteria** |
| **F-17** | Contribute-into-Scalar **declined**, not deferred |
| **F-18** | **MCP is the agent surface, DevTools the human surface** |
| **F-19** | Production posture **stricter than every system surveyed** — no production tier, dual exclusion |
| **F-20** | `/design` ships ungated today — recorded and **filed separately**, not fixed here |

---

## What the design passes changed

The passes the owner refused to waive found **two criticals**, and both changed the RFC:

- **Kimi K3 (UI/UX):** Home could not distinguish *"nothing is broken"* from *"DevTools is blind"*.
  Fixed by §11.3.1 — `all-clear` is reachable only when **every** source reported.
- **Qwen 3.8 Max (architecture):** the trust antecedent was **false** — the RFC's own pipeline
  installs third-party JSR plugins and imported their code **in-process**. Fixed by splitting the
  antecedent, adding **T-10 / INV-9 / G-10**, and forbidding in-generator-process execution.

**22 findings: 21 fixed, 1 declined with a re-entry condition, 0 deferred** — `FINDINGS-SWEEP.md`.

---

## Open items that are *not* forks

Recorded so nothing looks hidden. None blocks filing.

| Item | Status |
| ---- | ------ |
| **Three labels do not exist** — `epic:devtools`, `area:devtools`, `area:frontend` | Filing uses **`epic:dev-dashboard`**, which does exist. Creating repo labels is a different mutation class and was **not** authorized; flagged, not assumed |
| **`.github/labels.yml` drifted** 19 labels behind live; `netscript-pr` milestone guidance stale | Recorded as **D-12**; a parity PR is someone else's lane |
| **The design-lane launcher gap** (**D-0b**) | Policy declares `claude-design-glm-5-2`, no launcher can run it. Still worth its own issue — it blocks every future major-UI/UX run |
| **Vision pass on a prototype** | Kimi's vision capability was unused because nothing is implemented. Re-entry at roadmap wave W4/W6 |
| Five mitigations **UNPROVEN** — containment, generator scoping, production absence, schema evolution, `arch:check` coverage | Named gates in §14, not assertions. Plus **G-10** for the new generate-time surface |

---

## What happens now

One-shot filing from `filing/filing-manifest.md`: **14 new issues**, **1 not filed** (the launcher
gap, pending D-0b), **6 existing amended via 4 rows**, `#922`'s children untouched, the 2026-07-19
train preserved, then `FILING-LOG.md` mapping every draft ID to its live number.

**After filing, GitHub is authoritative** over this run's documents, per the seed-run rule.
