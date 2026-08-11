# One-shot filing manifest — DevTools contribution architecture RFC

> **DRAFT — not filed. No GitHub mutation has occurred.**

Run `plan-devtools-contribution--seed` · draft PR **#1450** · baseline `main` @ `2256a67bf` ·
RFC `docs/architecture/rfc/rfc-0002-devtools-contribution.md`.

This file is the **executable-by-a-human ordered plan** for filing *after* owner ratification.
Every `gh` invocation cited below was a **read**. Every label and milestone named here was verified
against live GitHub and against `.github/labels.yml` on **2026-08-11** from this worktree.

Process authority: `.agents/skills/netscript-pr` (branch/PR shape, closing-keyword law, epic ↔
sub-issue standard, colon-label taxonomy, milestone rule, close-gate). Nothing in this manifest
overrides it.

---

## 1. Preconditions — filing MUST NOT begin while any is unmet

| # | Precondition | State today | Verifiable by |
| - | ------------ | ----------- | ------------- |
| **P1** | **PLAN-EVAL verdict `PASS`** on PR #1450 from a separate session (Codex GPT-5.6 Sol high), evaluated against an immutable commit | **NOT MET** — stage G in progress (`phase-registry.md`, task #8) | the `[PHASE: PLAN-EVAL] [VERDICT: PASS]` comment on #1450 |
| **P2** | **Owner ratification of RFC §15** — every fork in §15.1 (F-1…F-8), §15.2 (F-9…F-13), §15.3 (F-14…F-20) either accepted-as-recommended or overruled **in writing** | **NOT MET** — `decision-brief.md` is the ask; no ratification recorded | an owner comment on #1450 enumerating the forks |
| **P3** | **A decision on drift D-10 (the outstanding GLM 5.2 design pass)** — decision brief **D-0a** (accept the RFC with substitute stage-F scrutiny, or hold stage H until the design lane launches) **and D-0b** (file the launcher gap now, fold it, or leave it) | **NOT MET** — the lane is unlaunchable; substitute scrutiny is explicitly *not* the mandated pass (risk R12) | an owner comment answering D-0a **and** D-0b |
| **P4** | **F-1 resolved** (depend on #890's spine vs self-contained family) and **F-3 resolved** (manifest schema-evolution precondition) | **NOT MET** | both are `MUST RESOLVE — would force rework` in `plan.md` |

**Blocking rules.**

- P1–P3 are **hard gates on the whole manifest**. If any is unmet, file **nothing** — not even the
  "obviously safe" probe issues.
- **P4 is a hard gate on §4's rows DT-6, DT-7, DT-8, DT-13 only.** Those four rows change *which
  epic owns them* depending on F-1 (see the dedup column: each has a live #922 counterpart). Filing
  them before F-1 is how a fourth competing seam gets created.
- If **P3 resolves as D-0a(b) "hold"**, the entire manifest is suspended until the GLM pass runs and
  its findings are dispositioned as an RFC amendment.
- The run's **no-board-mutation boundary stays in force until P1–P3 are all met.** PR #1450 stays
  **draft** throughout; flipping it to ready-for-review would dispatch
  `.github/workflows/docs-openhands-eval.yml`, which the charter forbids for this run.

---

## 2. Label verification

Checked against `.github/labels.yml` (the documented source of truth) **and** the live label set
(`gh label list --repo rickylabs/netscript --limit 300`, 129 labels, 2026-08-11). A label is
**usable** only when it is present in **both**.

### 2.1 Labels this manifest uses — all verified present in both

| Label | `.github/labels.yml` | Live | Used by |
| ----- | -------------------- | ---- | ------- |
| `type:feat` | ✅ `:17` | ✅ | most implementation sub-issues |
| `type:fix` | ✅ `:20` | ✅ | DT-5, DT-10, DT-17, DT-18 |
| `type:chore` | ✅ `:26` | ✅ | DT-1, DT-2 (disposable probes) |
| `type:docs` | ✅ `:23` | ✅ | DT-RFC |
| `type:umbrella` | ✅ `:38` | ✅ | epic (already on #400) |
| `status:triage` | ✅ `:46` | ✅ | **every newly filed issue** (the one `status:` at filing time) |
| `priority:p0` | ✅ `:81` | ✅ | DT-5, DT-6, DT-10 |
| `priority:p1` | ✅ `:84` | ✅ | DT-3, DT-4, DT-7, DT-8, DT-9, DT-13 |
| `priority:p2` | ✅ `:87` | ✅ | DT-1, DT-2, DT-12, DT-14, DT-15, DT-16, DT-17, DT-18, DT-RFC |
| `area:cli` | ✅ `:95` | ✅ | DT-5, DT-7, DT-8, DT-9, DT-10, DT-13 |
| `area:plugins` | ✅ | ✅ | DT-3, DT-11, DT-15, DT-16 |
| `area:fresh` | ✅ | ✅ | DT-14 |
| `area:fresh-ui` | ✅ | ✅ | DT-17 |
| `area:tooling` | ✅ | ✅ | DT-3 (arch:check roots), DT-18 |
| `area:docs` | ✅ | ✅ | DT-RFC |
| `epic:dev-dashboard` | ✅ | ✅ | **every** DevTools sub-issue (see §2.2) |
| `epic:frontend-contrib` | ✅ | ✅ | cross-reference only on DT-6/DT-7/DT-8/DT-13 **if F-1 selects the spine** |
| `rfc` | ✅ | ✅ | DT-RFC |
| `ci:skip-e2e`, `ci:skip-scaffold` | ✅ | ✅ | the implementation PRs later, not the issues |

### 2.2 BLOCKERS — labels that do **not** exist

| Wanted | Status | Consequence |
| ------ | ------ | ----------- |
| **`epic:devtools`** (or `epic:devtools-contribution`) | **DOES NOT EXIST** — absent from `.github/labels.yml` *and* from the live 129-label set | **Blocker, not a to-create item.** Creating a label is a board mutation the owner has not authorized. **Default resolution: do not create it** — the DevTools work is filed under the existing **`epic:dev-dashboard`**, which is correct under the §5 default (the epic is amended #400, not a new epic). A new label is required **only** if the owner overrules that and files a separate DevTools epic. In that case: add the label to `.github/labels.yml` in a normal PR **first**, then create it, then file. |
| **`area:devtools`** | **DOES NOT EXIST** in either | **Blocker.** Not created. Use `area:cli` / `area:plugins` / `area:fresh` per the touched root instead — which is what §13.1's package split actually says. |
| **`area:frontend`** | **DOES NOT EXIST** in either | **Blocker.** Not needed; `area:fresh` covers surface #1/#2 work. |

### 2.3 Recorded label-set drift (informational, not this run's to fix)

`.github/labels.yml` and the live label set have **diverged**. Live carries labels the file does not
document: `area:packages`, `area:queue`, `area:workers`, `area:streams`, `area:sagas`,
`area:triggers`, `area:contracts`, `area:services`, `area:runtime-config`, `area:ai`, `area:db`,
`area:release`, `area:agentic`, and the epics `epic:road-to-stable`, `epic:unified-runtime`,
`epic:desktop-frontend`, `epic:enterprise-auth`, `epic:deploy-plugin`.

**This manifest deliberately uses none of them**, because the skill's rule is that the file is the
source of truth and a label absent from it is undocumented. The drift is recorded here and in
`drift.md`; fixing it is a separate `area:tooling` chore, not a filing-time action.

---

## 3. Milestone verification — verify live, create nothing

Read live: `gh api repos/rickylabs/netscript/milestones --paginate` (2026-08-11). **Title match is
exact**, including the spaces around the slash in `Backlog / Triage`.

| Milestone (exact title) | Live? | Open issues | Role in this manifest |
| ----------------------- | ----- | ----------- | --------------------- |
| `Backlog / Triage` | ✅ (number 3) | 67 | Epic #400's own ratified home; umbrellas live here |
| `0.0.15` | ✅ (number 21) | 45 | **Default milestone for every new DevTools sub-issue** — the owner-ratified 2026-07-19 train ("ships after everything else"; beta.18 → `0.0.15`) where all 28 open `epic:dev-dashboard` children already sit |
| `0.0.9` | ✅ (number 24) | 20 | Epic #922's train — relevant **only** to the F-1-conditional rows, and only if the owner routes them there |
| `0.0.6` | ✅ (number 26) | 54 | "RFC ratification" — home of the DT-RFC tracking issue, precedent #1348/#1361 |
| `0.0.14` | ✅ (number 20) | 11 | **Description edit only** (strip the stale "Dev dashboard (thin, contribution-based)" clause per F-9). **No issue moves.** |

**Rules.**

- **Create no milestone.** Every title above already exists; if a filing step cannot find one by
  exact title, **stop and escalate** — do not create it.
- **Default for new sub-issues: `0.0.15`**, matching the epic's ratified children train (task rule:
  new DevTools issues default to the epic's milestone unless the supersession map says otherwise).
- **Do not re-milestone any existing issue.** F-9's recommendation is explicitly *no moves*.
- Rows carrying **`MILESTONE: OWNER-DECISION`** in §4 are the ones where the map does **not** settle
  it. They are listed with the reason; filing them without a decision would be inventing a train.

---

## 4. Filing order

Epic first, then sub-issues in **dependency order** (RFC §14's DAG). Every sub-issue body carries
`Part of #<epic>` — **never** a closing keyword (`Closes`/`Fixes`/`Resolves`), which belongs only in
the PR that later resolves the issue. The epic **never** carries a closing keyword at all.

Each issue body uses the house shape, with acceptance criteria under an **`## Acceptance`** heading
(that is the heading the close-gate reads) and everything non-gating — background, design pointers,
sequencing notes — **outside** it.

### 4.0 Step 0 — the epic

**Default: no new epic is created.** Per the supersession map, **#400 is the epic** and its
disposition is `AMEND`: the ownership thesis, the three acceptance lines, and the killed-surfaces
list survive verbatim; the invent-your-own-discovery premise, the dead `beta.6` prose, and the
screen list are rewritten to point at RFC-0002. #400 keeps `Backlog / Triage`, `type:umbrella`, and
`epic:dev-dashboard`; its `status:` stays a single label per the taxonomy.

If the owner instead wants a **separate DevTools epic**, that is a fork this manifest does not
pre-decide: it requires the §2.2 `epic:devtools` label blocker to clear first, and its milestone is
**`MILESTONE: OWNER-DECISION`** (recommend `Backlog / Triage`, matching #400's ratified umbrella
placement and the milestone's own stated rule).

### 4.1 Ordered sub-issue table

`Order` = filing sequence. `Dep` = RFC §14 dependency. Every row's live-board dedup result is in
§4.2 and must be re-read immediately before filing.

| # | Draft ID | Slice | Title (proposed) | Labels | Milestone | Dep | Action |
| - | -------- | ----- | ---------------- | ------ | --------- | --- | ------ |
| 1 | **DT-RFC** | — | `docs(rfc): ratify RFC-0002 — DevTools contribution architecture` | `type:docs`, `area:docs`, `rfc`, `status:triage`, `priority:p2`, `epic:dev-dashboard` | `0.0.6` | — | **NEW** (optional; owner may treat PR #1450 as sufficient) |
| 2 | **DT-1** | W0-a | `chore(devtools): probe — can a package ship island specifiers under Deno resolution?` | `type:chore`, `area:cli`, `status:triage`, `priority:p2`, `epic:dev-dashboard` | `0.0.15` | — | **NEW** |
| 3 | **DT-2** | W0-b | `chore(devtools): probe — second route/island root in one Vite process` | `type:chore`, `area:cli`, `status:triage`, `priority:p2`, `epic:dev-dashboard` | `0.0.15` | — | **NEW** |
| 4 | **DT-3** | W1-a | `feat(devtools-core): contracts/v1 + orderContributions + arch:check roots` | `type:feat`, `area:plugins`, `area:tooling`, `status:triage`, `priority:p1`, `epic:dev-dashboard` | `0.0.15` | — | **NEW** (+ AMEND #412) |
| 5 | **DT-4** | W1-b | `feat(devtools-core): typed deep-link helper (resolveDevToolsLink)` | `type:feat`, `area:plugins`, `status:triage`, `priority:p1`, `epic:dev-dashboard` | `0.0.15` | DT-3 | **NEW** (re-file of #424's URL contract) |
| 6 | **DT-5** | W1-c | `fix(cli): path-containment invariant + scoped generator subprocess (INV-1/INV-2)` | `type:fix`, `area:cli`, `status:triage`, `priority:p0`, `epic:dev-dashboard` | `0.0.15` | DT-3 | **NEW** |
| 7 | **DT-6** | W1-d | `fix(plugin): manifest schema-evolution precondition — .strict() hard-rejects unknown blocks` | `type:fix`, `area:plugins`, `status:triage`, `priority:p0`, + `epic:frontend-contrib` **iff** F-1 = spine | **`MILESTONE: OWNER-DECISION`** | F-3 | **NEW — gated on P4.** See §4.2 |
| 8 | **DT-7** | W2-a | `feat(cli): transactional replace-set registry generator for devtools contributions` | `type:feat`, `area:cli`, `status:triage`, `priority:p1`, `epic:dev-dashboard` | `0.0.15` | DT-3, DT-5 | **CONDITIONAL — gated on P4.** Live counterpart **#930** |
| 9 | **DT-8** | W2-b | `feat(cli): plugin doctor five-state contribution taxonomy + quarantine diagnosis` | `type:feat`, `area:cli`, `status:triage`, `priority:p1`, `epic:dev-dashboard` | `0.0.15` | DT-7 | **CONDITIONAL — gated on P4.** Live counterpart **#937** |
| 10 | **DT-9** | W3-a | `feat(cli): CLI-generated DevTools host root + devtools command group` | `type:feat`, `area:cli`, `status:triage`, `priority:p1`, `epic:dev-dashboard` | `0.0.15` | DT-7 | **NEW** (+ AMEND #415) |
| 11 | **DT-10** | W3-b | `fix(devtools): dual production exclusion — build-graph absence + runtime refusal` | `type:fix`, `area:cli`, `status:triage`, `priority:p0`, `epic:dev-dashboard` | `0.0.15` | DT-9 | **NEW** |
| 12 | **DT-11** | W4-a | *(no new issue — AMEND #427)* `panel` kind + UiNode render + per-contribution error boundary | existing labels on #427 unchanged | unchanged (`0.0.15`) | DT-9 | **AMEND / FOLD** |
| 13 | **DT-12** | W4-b | `feat(devtools): link kind wiring — rendering + disabled-with-reason` | `type:feat`, `area:plugins`, `status:triage`, `priority:p2`, `epic:dev-dashboard` | `0.0.15` | DT-4, DT-9 | **NEW** |
| 14 | **DT-13** | W5-a | *(AMEND #423)* DevTools read contract + in-process MCP, deny-by-default | existing labels on #423 unchanged | unchanged (`0.0.15`) | DT-9 | **AMEND — gated on P4.** Live counterpart **#934** |
| 15 | **DT-14** | W5-b | `feat(fresh): promote createSSEStream to the public export map` | `type:feat`, `area:fresh`, `status:triage`, `priority:p2`, `epic:dev-dashboard` | `0.0.15` | DT-13 | **NEW** |
| 16 | **DT-15** | W6-a | *(AMEND #428)* workers console as the first real consumer + #933 boundary sentence | existing labels on #428 unchanged | unchanged (`0.0.15`) | DT-11, DT-13 | **AMEND** |
| 17 | **DT-16** | W6-b | *(AMEND #429, #430, #431)* sagas / triggers / streams consoles + #944 boundary sentence; streams asserts the degraded state | existing labels unchanged | unchanged (`0.0.15`) | DT-15 | **AMEND** |
| 18 | **DT-17** | F-20 | `fix(fresh-ui): /design ships ungated — the defect class RFC-0002 guards against` | `type:fix`, `area:fresh-ui`, `status:triage`, `priority:p2` | **`MILESTONE: OWNER-DECISION`** | — | **NEW, outside the epic** |
| 19 | **DT-18** | D-0b | `fix(agentic): the major_ui_ux_design lane is declared but unlaunchable (evaluator guard blocks GLM)` | `type:fix`, `area:tooling`, `status:triage`, `priority:p2`, `epic:harness-v3` | **`MILESTONE: OWNER-DECISION`** | P3 | **NEW, outside the epic — only if D-0b = (a) file it** |

**Why three rows say `MILESTONE: OWNER-DECISION`:**

- **DT-6** — the defect lives in `packages/plugin`'s manifest schema and is a precondition of
  **#929** (`0.0.9`, `epic:frontend-contrib`), not of the DevTools train. Placing it on `0.0.15`
  would schedule a #922 blocker behind the DevTools tail; placing it on `0.0.9` re-scopes another
  epic's wave. The map does not settle it and this run does not re-scope #922.
- **DT-17** — `/design` is a `packages/fresh-ui` production-exposure defect. It belongs to no
  DevTools train, and F-20's own recommendation is "record and file **separately**". No milestone is
  derivable from the map.
- **DT-18** — a harness/agentic-runtime defect. `epic:harness-v3` exists, but no ratified train
  covers it, and D-0b may resolve as "do not file at all".

### 4.2 Live-board dedup check — per row

Executed 2026-08-11, `gh` **reads only** (`gh search issues`, `gh issue list`, `gh issue view`,
`gh label list`, `gh api …/milestones`). **Re-run this table immediately before filing** — the board
moves.

| Draft ID | Existing coverage found? | Verdict |
| -------- | ------------------------ | ------- |
| **DT-RFC** | No. `gh search issues "devtools"` (all states) returns only **#218** (closed, Aspire browser-logs), **#234**, **#375** — none is an RFC tracker. **#1380** schedules the *doctrine verdict table* on `0.0.6`, a different subject (but F-2 records that RFC-0002's home pre-empts it). | **FILE — no duplicate** |
| **DT-1 / DT-2** (W0 probes) | No. No open issue mentions island specifiers as a probe; **#922** surfaces in an `island specifiers` search only as the epic. #923–#927 are #922's *own* P1–P5 proofs and cover different questions (mounted sub-app ordering, lazy loaders, dependency-island build matrix, SSR containment, gateway threat model). | **FILE — no duplicate** |
| **DT-3** (W1-a) | **Partial.** **#412** (`[dashboard DDX-2] plugin-dashboard-core scaffold + contract seam`, OPEN, `0.0.15`) is the same seam and is dispositioned `AMEND`. **#928** (`[frontend-contrib S6] plugin-frontend-core contracts/v1`, `0.0.9`) is the *parallel* contracts unit for the app family — sibling, not duplicate. **#1403** (`quality:gate … arch:check omits 20 of 36 packages`, OPEN, `0.0.6`, `priority:p0`) already owns the **general** arch:check-coverage fix. | **FILE, with two constraints:** (a) DT-3's arch:check line is scoped to adding **its own two roots**, and the body must cross-reference **#1403** as the general fix rather than restating it; (b) **#412 is AMENDED**, not closed — its owned-model set re-derives from RFC §6. |
| **DT-4** (W1-b) | **Yes — #424** (`[dashboard DDX-14] CLI surface + auto-launch`, OPEN, `0.0.15`) holds the flat URL scheme the map marks the board's *one recorded outright contradiction*, disposition **SUPERSEDE**. | **FILE as the re-file**, and #424 closes **only after** DT-4 exists (map's precondition: "re-filed issue drafted before #424 closes"). |
| **DT-5** (W1-c) | No. `path containment` returns only **#1429** (agentic leak-check descendants) — unrelated. No open issue covers `resolveTarget` containment or bare `--allow-read`/`--allow-write` in the generator spawn. | **FILE — no duplicate** |
| **DT-6** (W1-d) | **Adjacent, not duplicate.** **#929** (`[frontend-contrib S7] @netscript/plugin pointer axis (.withFrontend)`, OPEN, `0.0.9`, `priority:p0`) is *built on* the false "older CLIs ignore unknown blocks" claim. No issue states the `.strict()` defect. | **FILE only after F-1/F-3 (P4)**, and **cross-post a reference on #929** rather than silently re-scoping it. This is a defect in #922's plan surfaced by this run. |
| **DT-7** (W2-a) | **Strong overlap — #930** (`[frontend-contrib S8] Frontend registry emissions: transactional replace-set`, OPEN, `0.0.9`). Same mechanism, different family. | **DO NOT FILE if F-1 = depend on #890's spine** — DT-7 is then #930, and filing it creates the fourth seam R9 warns about. File only if F-1 = self-contained family, and then the body must state why it is not #930. |
| **DT-8** (W2-b) | **Strong overlap — #937** (`[frontend-contrib S15] Doctor frontend check + five-state taxonomy`, OPEN, `0.0.9`); also **#938** (quarantine render states). | **Same rule as DT-7.** Also cross-reference **#1454** (`fix(plugin doctor): package-backed workers/streams treated as local workdirs`) as a live doctor defect in the same surface. |
| **DT-9** (W3-a) | **Partial — #415** (`[dashboard DDX-5] Fresh build-console shell + app-registration + IA`, OPEN, `0.0.15`, `AMEND`) owns the shell; **#424** owns the CLI surface + auto-launch. | **FILE the host-root/command-group slice**; **AMEND #415** to adopt RFC §11's IA rather than duplicating it. |
| **DT-10** (W3-b) | No. `production build exclusion` returns nothing. | **FILE — no duplicate** |
| **DT-11** (W4-a) | **Yes — #427** (`[dashboard DDX-17] DashboardPanelContribution`, OPEN, `0.0.15`), disposition **FOLD**. | **FILE NO NEW ISSUE.** Amend #427 into the RFC's `panel`-kind slice; record the `CR-DDX-HOSTAGNOSTIC` resolution on it. |
| **DT-12** (W4-b) | No standalone issue; the link-rendering surface is implied by #424 (superseded) and #411 (`DDX-1 Aspire command+app kinds`, **KEEP** — the out-link seam, not the render seam). | **FILE — no duplicate**, body states the #411 boundary. |
| **DT-13** (W5-a) | **Yes — #423** (`[dashboard DDX-13] Introspection endpoint /_netscript/*`, OPEN, `0.0.15`, `AMEND`). Also **#934** (`[frontend-contrib S12] Generated deny-by-default procedure gateway`, `0.0.9`) — the same deny-by-default shape for the app family. | **FILE NO NEW ISSUE.** Amend #423; the amendment must name the #934 boundary. Gated on P4 because F-1 decides whether the gateway is shared. |
| **DT-14** (W5-b) | No. `SSE stream` returns only **#232**/#234 (unrelated). `createSSEStream` promotion is unclaimed. | **FILE — no duplicate**; note it is a `packages/fresh` **public-surface** change (consumer gate applies). |
| **DT-15** (W6-a) | **Yes — #428** (`[dashboard DDX-18a] workers per-capability dashboard section`, OPEN, `0.0.15`, `AMEND`). Boundary counterpart **#933** (`[frontend-contrib S11] Workers dogfood: zone panel + console route + island`, `0.0.9`). | **FILE NO NEW ISSUE.** Amend #428 with the one-sentence #933 boundary. **#933 is untouched.** |
| **DT-16** (W6-b) | **Yes — #429 / #430 / #431**, all OPEN `0.0.15`, all `AMEND`. Boundary counterpart **#944** (`[frontend-contrib S22] Sagas/triggers/streams dashboard-zone panels`, `0.0.11`). | **FILE NO NEW ISSUES.** Amend the three. **#944 is untouched.** |
| **DT-17** (F-20) | No. `design ungated production` and `/design route` return nothing on point (**#1277** is a docs-site UI polish epic; **#1335** is scaffold conformance). | **FILE — no duplicate** |
| **DT-18** (D-0b) | No. `GLM design lane`, `openrouter launcher`, `lane-policy` return nothing on point (**#768** is an OpenHands runtime bootstrap failure; **#1082** is a *closed* Gemini routing fix — related class, different defect). | **FILE — no duplicate**, only if D-0b = (a). |

**Net result: 11 genuinely new issues** (DT-1, DT-2, DT-3, DT-4, DT-5, DT-9, DT-10, DT-12, DT-14,
DT-17, DT-18) **+ DT-RFC (optional)**, **2 conditional** (DT-7, DT-8), **1 conditional-new** (DT-6),
and **6 rows that are amendments of live issues, not new filings** (DT-11 → #427, DT-13 → #423,
DT-15 → #428, DT-16 → #429/#430/#431).

That ratio is the point of running dedup: RFC §14's 15-slice roadmap does **not** map to 15 new
issues, because a third of it is already on the board.

### 4.3 Per-issue body template

```markdown
## Summary

<1–3 sentences: what this slice delivers and which RFC section is its authority.>

## Scope

- Archetype / area: <A1 packages/devtools-core | A6 packages/cli | A5 plugins/devtools>
- Part of #400
- Depends on #<draft-id resolved to a live number>
- RFC: `docs/architecture/rfc/rfc-0002-devtools-contribution.md` §<n>

## Files / roots

- <the exact roots from RFC §14's table>

## Acceptance

- [ ] <the RFC §14 "Introduces" contract exists and is exported>
- [ ] gate: `<the exact proving command from RFC §14>` passes
- [ ] gate: `deno task arch:check && deno task quality:scan` green for the touched roots

## Notes (non-gating)

- <sequencing, boundaries against #922/#944/#933, degraded states>
```

Rules that are not negotiable:

- **No closing keyword anywhere in an issue body.** `Part of #400` only.
- Everything that must gate merge goes under **`## Acceptance`**; everything else goes under
  `## Notes (non-gating)`. A durable completion claim parked outside `## Acceptance` to dodge the
  close-gate is the exact failure #260 exists to prevent.
- Exactly **one** `status:` label — `status:triage` at filing.

---

## 5. Reconciliation of pre-existing issues

Applies the supersession map's dispositions. **Default: zero filing-time closes.**

### 5.1 The default

**No issue is closed at filing time.** Every `FOLD` / `SUPERSEDE` / `CLOSE-LATER` row records its
disposition as a **comment** on the issue and leaves the issue **open**, because each has a
precondition that filing itself does not satisfy. Closing is a later, separately-evidenced action.

### 5.2 Actions at filing time

| Issue | Disposition | Filing-time action | Close condition (later, not now) |
| ----- | ----------- | ------------------ | -------------------------------- |
| **#400** | AMEND | Rewrite the body: thesis + three acceptance lines + killed-list **verbatim**; replace the discovery premise, `beta.6` prose, and screen list with RFC-0002 pointers. Post the `CR-DDX-HOSTAGNOSTIC` **resolution** comment (F-11 accept). Keep `Backlog / Triage`. | Hand-close when every child is done. **Never** a closing keyword. |
| **#412, #414, #415, #420, #423, #426, #428, #429, #430, #431, #551** | AMEND | One comment each stating the re-baseline onto RFC-0002 and the specific boundary sentence (#428–#431 name #933/#944; #551 names #1446's Surface-1/Surface-2). No milestone change, no label change beyond an intentional single-`status:` correction. | n/a — they stay open |
| **#427** | FOLD | Comment: folds into RFC-0002 §6/§7 as the `panel`-kind slice; records the `CR-DDX-HOSTAGNOSTIC` resolution; cross-refs #890 §2.3. **Stays open** as the implementation slice. | Closes with the PR that lands W4-a |
| **#734** | FOLD | Comment cross-referencing #890 §2.3, the 2026-07-19 owner flag, and the RFC section that absorbs it. **Do not close at filing.** | Closes only once the absorbing RFC section is ratified **and** the owner confirms — F-4 |
| **#424** | SUPERSEDE | Comment naming DT-4/DT-9 as the re-file and RFC §11 as the URL contract. **Do not close at filing** — the map's precondition is that the re-filed issue exists first. | Closes after DT-4 and DT-9 are live |
| **#507** | CLOSE-LATER | Comment recording that closure fires when the RFC design pack absorbs the duplication + flow≠waterfall design-review gate. | Owner confirms the trigger has fired |
| **PR #780** | CLOSE-LATER (F-12) | **Salvage first**: `DS-UPLIFT-BACKLOG.md` + `DESIGN-LANGUAGE.md` into the **#509** lane. Comment on #780 recording the salvage and the superseded flat IA. | Close only after the salvage lands |
| **#410, #411, #413, #416, #417, #418, #419, #432, #509, #552–#557** | KEEP | **No action.** | — |
| **#421, #422, #425** | KEEP (already closed) | **No action.** The kills are documented in RFC §11 non-goals so they cannot creep back. | — |
| **#544** | AMEND — **coordinate only** | This run does **not** edit #544. Post the CR resolution on **#400/#427**; the body edit belongs to epic **#510**'s lane. | — |
| **#922, #933, #944** and **all 24 #922 children** | **explicitly untouched** | **ZERO actions. No comment, no label, no milestone, no body edit.** The RFC states the ownership boundary (C2) on the #400 side only. | — |
| **`0.0.14` milestone description** | F-9 | Strip the stale "Dev dashboard (thin, contribution-based)" clause; keep the auth/deploy tail wording. **Description edit only — zero issue moves.** | — |

### 5.3 The bright line

**#922's children are not touched by this run, at filing time or after.** The charter forbids
re-scoping another epic's children, and F-10's recommendation is that both epics survive because
they are different artifacts on different hosts. If the owner wants consolidation, that is a new
decision requiring its own drafted map — none exists, and none is implied here.

---

## 6. `FILING-LOG.md` template

Written to `.llm/runs/plan-devtools-contribution--seed/filing/FILING-LOG.md` **after** filing, and
committed to PR #1450 in the same session. It is the draft-ID → live-number mapping that makes the
filing auditable.

````markdown
# FILING-LOG — DevTools contribution RFC

**Filed:** <ISO-8601 UTC> · **By:** <session id / operator> · **Ratification:** <link to the owner
comment on #1450 answering P2 and P3> · **PLAN-EVAL PASS:** <link to the verdict comment>

## Preconditions at filing time

| # | Precondition | Evidence |
| - | ------------ | -------- |
| P1 | PLAN-EVAL PASS | <comment URL> |
| P2 | §15 forks ratified | <comment URL> |
| P3 | D-0a / D-0b decided | <comment URL> — D-0a = <a\|b>, D-0b = <a\|b\|c> |
| P4 | F-1 / F-3 resolved | <comment URL> — F-1 = <spine\|self-contained>, F-3 = <choice> |

## Draft ID → live issue

| Draft ID | Slice | Live # | Title as filed | Milestone | Labels applied | Notes |
| -------- | ----- | ------ | -------------- | --------- | -------------- | ----- |
| DT-RFC | — | #____ | | 0.0.6 | | |
| DT-1 | W0-a | #____ | | 0.0.15 | | |
| DT-2 | W0-b | #____ | | 0.0.15 | | |
| DT-3 | W1-a | #____ | | 0.0.15 | | cross-ref #1403, amends #412 |
| DT-4 | W1-b | #____ | | 0.0.15 | | re-file of #424 |
| DT-5 | W1-c | #____ | | 0.0.15 | | |
| DT-6 | W1-d | #____ | | <decided> | | cross-posted on #929 |
| DT-7 | W2-a | #____ / NOT FILED | | | | NOT FILED if F-1 = spine (→ #930) |
| DT-8 | W2-b | #____ / NOT FILED | | | | NOT FILED if F-1 = spine (→ #937) |
| DT-9 | W3-a | #____ | | 0.0.15 | | amends #415 |
| DT-10 | W3-b | #____ | | 0.0.15 | | |
| DT-11 | W4-a | **#427** (amended) | — | unchanged | unchanged | no new issue |
| DT-12 | W4-b | #____ | | 0.0.15 | | |
| DT-13 | W5-a | **#423** (amended) | — | unchanged | unchanged | no new issue |
| DT-14 | W5-b | #____ | | 0.0.15 | | packages/fresh public surface |
| DT-15 | W6-a | **#428** (amended) | — | unchanged | unchanged | no new issue |
| DT-16 | W6-b | **#429 / #430 / #431** (amended) | — | unchanged | unchanged | no new issues |
| DT-17 | F-20 | #____ / NOT FILED | | <decided> | | outside the epic |
| DT-18 | D-0b | #____ / NOT FILED | | <decided> | | filed only if D-0b = (a) |

## Reconciliation actions performed

| Issue / artifact | Disposition | Action taken | Comment URL | Closed? |
| ---------------- | ----------- | ------------ | ----------- | ------- |
| #400 | AMEND | | | no |
| #427 | FOLD | | | no |
| #734 | FOLD | | | no |
| #424 | SUPERSEDE | | | no |
| #507 | CLOSE-LATER | | | no |
| PR #780 | CLOSE-LATER | salvage → #509 | | no |
| `0.0.14` milestone | description edit | | — | — |

## Invariants asserted after filing

- [ ] Every filed issue carries ≥1 `type:`, ≥1 `area:`, exactly one `status:`, a `priority:`, and a
      milestone.
- [ ] **No** issue body contains `Closes` / `Fixes` / `Resolves`.
- [ ] Every sub-issue body contains `Part of #400`.
- [ ] **Zero** mutations on #922, #933, #944, or any of #922's 24 children (verified by
      `gh issue view` timeline reads).
- [ ] **Zero** labels created; **zero** milestones created.
- [ ] Every filing-time close: **none** (or each one listed with the precondition it satisfied).
````

---

## 7. Sources

**Live GitHub reads (read-only, `rickylabs/netscript`, 2026-08-11, this pass):**

- `gh api repos/rickylabs/netscript/milestones --paginate` — 14 milestones; exact titles and open
  counts in §3
- `gh label list --repo rickylabs/netscript --limit 300` — 129 live labels; §2.2 blockers and §2.3
  drift derived from the diff against `.github/labels.yml`
- `gh issue list --repo rickylabs/netscript --label epic:frontend-contrib --state open --limit 30` —
  #922 + 24 children with milestones (the DT-6/7/8/13 counterparts)
- `gh issue view <n>` for n ∈ {929, 1380, 1403}
- `gh search issues --repo rickylabs/netscript "<q>"` for q ∈ {devtools, contribution registry, vite
  plugin, deep link, SSE stream, production build exclusion, manifest schema evolution, path
  containment, arch:check roots, island specifiers, workers console, /design route, GLM design lane,
  openrouter launcher, lane-policy, design pass, registry generator transactional, plugin doctor}

**Repo (baseline `main` @ `2256a67bf`):**

- `.github/labels.yml`
- `docs/architecture/rfc/rfc-0002-devtools-contribution.md` §13, §14, §15
- `.llm/runs/plan-devtools-contribution--seed/plan.md` (L1–L14, rework audit, risk register)
- `.llm/runs/plan-devtools-contribution--seed/design/T9-supersession/supersession-map.md`
- `.llm/runs/plan-devtools-contribution--seed/decision-brief.md`
- `.agents/skills/netscript-pr/SKILL.md`
