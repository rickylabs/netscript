# Owner decision brief — DevTools contribution architecture RFC

> **Nothing has been filed.** No issue, epic, milestone, or repo label outside draft PR #1450 has
> been created, edited, closed, moved, or commented on. This brief is what I need from you before
> any of that happens.

**Run:** `plan-devtools-contribution--seed` · **PR:** #1450 · **RFC:**
`docs/architecture/rfc/rfc-0002-devtools-contribution.md` · **Baseline:** `main` @ `2256a67bf`

---

## Read this first: one mandated deliverable is missing

**The charter-required GLM 5.2 design pass could not be run.** Not skipped — **unlaunchable**.

`openrouter-run.ts` is the only OpenRouter-through-Claude transport and applies the evaluator model
guard unconditionally ("never optional here", its own doc comment). That guard's allowlist correctly
excludes GLM, because `lane-policy` invariant 6 restricts relay *evaluator* lanes to open models.
Meanwhile the **design** preset `claude-design-glm-5-2` exists in `provider-profiles.ts:192` and is
bound to `major_ui_ux_design` in `routing-policy.ts:90`.

**Policy declares a lane the execution surface cannot launch.** Both failed transcripts are preserved
as evidence; full analysis in `drift.md` **D-10**.

I did **not** fabricate the pass or relabel another model's output as GLM's. There is no authorized
fallback, and the Kimi vision lane is defined as *complementing, never replacing* it. Design scrutiny
was obtained from the stage-F reviewer instead, **labelled explicitly as not the mandated pass** — and
it produced the sharpest design finding in the run (the IA answered "what exists?" instead of "what
is broken?").

| # | Decision | Options | My recommendation |
| - | -------- | ------- | ----------------- |
| **D-0a** | Accept the RFC with substitute design scrutiny, or hold it open until the design lane works? | (a) accept and proceed · (b) hold stage H until GLM runs | **(a) accept.** The substitute found a real design defect, and holding a completed RFC hostage to a launcher bug costs more than it buys. Re-run GLM when the lane is fixed and treat its findings as an amendment. |
| **D-0b** | File the launcher gap as its own issue now? | (a) file it · (b) fold into this RFC's roadmap · (c) leave it | **(a) file it.** It blocks *every* future major-UI/UX run, not just this one, and the fix is small: a design-lane path in the guard, or a non-evaluator mode on the launcher, or stop declaring an unlaunchable lane in `lane-policy`. |

---

## The decisions that gate implementation

Ordered by cost of getting them wrong. Each is expanded in RFC §15.1 with its cost of deferral.

| # | Fork | Recommendation | Why it matters |
| - | ---- | -------------- | -------------- |
| **F-1** | **Depend on #890's spine, or build a self-contained DevTools family?** #890 is **merged design text with zero implementation** — 24 children open, none started | Sibling family on a spine **this lane builds first**, in `packages/devtools-core` | **Correction: this is NOT reversible**, as I first argued and PLAN-EVAL rejected. It fixes the public package home, import specifiers, emitter ownership and whether #922 needs re-baselining. Option (a) serializes DevTools behind 24 unstarted issues; option (b) risks a fourth competing seam. **It blocks the first contracts slice and must be decided before implementation** |
| **F-3** | **Manifest schema-evolution precondition.** #890's "older CLIs ignore an unknown block" claim is **false** — the schema is `.strict()`, so an unknown key hard-rejects and the plugin fails to parse | Land the precondition **before** any manifest-visible pointer | This is a defect in **#890/#922's own plan** (slice #929 is built on it), surfaced by this run and escalated. It is not ours to fix unilaterally |
| **F-4** | **Three seams claim one axis**: #427, #890's pointer axis, #734 | #890's pointer axis wins; #427 folds in as the family definition; **#734 closes** | Left alone, a fourth position appears. #427's thinness law actually *agrees* with the pointer axis |
| **F-5 / F-6** | **Zone ownership** (host-owned closed vs plugin-minted) and **ordering** | Host-owned closed; ordering = anchors, then clamped `(order, mountId, id)` | Both would force rework if deferred, which is why the RFC **locks** them rather than escalating. Flagged here only so you can overrule |
| **F-7** | **Read-only v1** — no mutating actions | Ratify | Actions drag in auth (blocked on the RFC-A chain, which includes an **unfiled** child) and an unbounded audit story |
| **F-8** | **Archetype** — **resolved in-RFC after PLAN-EVAL**: A1 contracts (`packages/devtools-core`) + A6 CLI emission + A5 thin plugin; host app is generated userland. A3 trigger written down | Ratify the resolution and the trigger | The earlier A2 assignment failed doctrine's own trigger — A2 wraps one external system behind a port with adapters, and this unit wraps none |

---

## Board decisions — nothing filed until you say so

| # | Fork | Recommendation |
| - | ---- | -------------- |
| **F-9** | **Milestone.** `0.0.14`'s description claims the dev dashboard but holds **zero** dashboard issues; all children sit on `0.0.15` | **Do not re-milestone.** Their placement is your own **2026-07-19 owner-ratified train**. Fix `0.0.14`'s stale description instead. *(I nearly recommended the opposite until I read the comment thread — see drift D-8)* |
| **F-10** | **Two epics claim dashboard-zone panels** — #933/#944 under #922 vs #428–#431 under #400 | Both survive; different artifacts on different hosts. **#922's children untouched** — this run does not re-scope another epic |
| **F-11** | **`CR-DDX-HOSTAGNOSTIC`** — real, on #400 since 2026-07-06, from epic #510, and **never resolved** | Accept it: host-neutral descriptor + host-provided context. Un-dangles #544 |
| **F-12** | **PR #780** — unlabelled, unmilestoned, stale since 2026-07-14, encoding the superseded flat IA | Salvage its design-language specs, then close |
| **F-13** | **Was the 7-member `DashboardContribution` family ever ratified?** No such event found anywhere | Treat as **unratified analysis**. This is an unverified *negative* and stated as one |
| **F-20** | **`/design` ships ungated today** — the same defect class this RFC guards against | Record and **file separately**. Not fixed inside this RFC's scope |

Full dispositions — every `KEEP` / `AMEND` / `FOLD` / `SUPERSEDE` / `CLOSE-LATER` with its reason —
are in `design/T9-supersession/supersession-map.md`.

---

## Scope boundaries to confirm

| # | Fork | Recommendation |
| - | ---- | -------------- |
| **F-14** | Vite 8 / `@vitejs/devtools-kit` | **Non-goal** with a re-entry condition. The ecosystem needs Vite 8; we pin 7.2.2. Imitate the contracts, implement natively |
| **F-15 / F-16** | Generic Vite contribution; Fresh UI registry contribution | Deferred to their own RFCs, each with **entry criteria and an owning dependency** — not a vague "later" |
| **F-17** | Contribute-into-Scalar | **Declined**, not deferred — the vendored bundle predates `pluginUrls` |
| **F-18** | MCP as the agent surface, DevTools as the human surface | Adopt, following Aspire's own 13.3 Copilot-removal precedent |
| **F-19** | Production posture stricter than every system surveyed | Ratify |

---

## What I am explicitly **not** claiming

Five mitigations are **named gates that do not exist yet**: containment, generator scoping,
production absence, schema evolution, and `arch:check` coverage. The RFC marks them `UNPROVEN`
throughout §9. The charter forbids claiming security or production readiness without an executable
gate, and this is what honouring that looks like — the gates are slice deliverables in §14, not
assertions.

Two host facts are **unverified** and carried as deliberately cheap W0 probes, sequenced first:
package-shipped island specifiers, and a second route/island root in one Vite process.

---

## What happens when you ratify

One-shot filing from a committed manifest, in dependency order: labels → milestones → epic →
sub-issues (`Part of #<epic>`, full taxonomy, milestone) → reconciliation of pre-existing issues per
the supersession map → `FILING-LOG.md` mapping every draft ID to its live issue number.

**Until then the board is untouched, and this PR stays draft.**
