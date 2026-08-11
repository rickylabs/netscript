# One-shot filing manifest — DevTools contribution architecture RFC

> **DRAFT — not filed. No GitHub mutation has occurred.**

> **AMENDMENT C (2026-08-11).** Fork **F-1** ratified (drift **D-19**): self-contained DevTools
> family and spine, **built first in `packages/devtools-core`** — not serialized behind #890's 24
> unimplemented children. **F-3** ratified in the same event (`.passthrough()` first). All §1
> preconditions are now met (P1 by **owner waiver** D-18, not an evaluator PASS; P3 by the
> owner-approved substitute design route D-15/D-16). This manifest is now executable as a
> **single ordered pass** by the supervisor: no row is conditional, no row carries
> `MILESTONE: OWNER-DECISION`, and every row is unambiguously *create new issue* or *amend
> existing issue* (§4.1 Action column + §5.2). Filing itself still happens later, once, by the
> supervisor — never by the agent editing this file.

Run `plan-devtools-contribution--seed` · draft PR **#1450** · baseline `main` @ `2256a67bf` ·
RFC `rfcs/0000-devtools-contribution.md`.

This file is the **executable-by-a-human ordered plan** for filing *after* owner ratification.
Every `gh` invocation cited below was a **read**. Every label and milestone named here was verified
against live GitHub and against `.github/labels.yml` on **2026-08-11** from this worktree.

Process authority: `.agents/skills/netscript-pr` (branch/PR shape, closing-keyword law, epic ↔
sub-issue standard, colon-label taxonomy, milestone rule, close-gate). Nothing in this manifest
overrides it.

---

## 1. Preconditions — status after Amendment C (2026-08-11): **ALL MET**

| # | Precondition | State (Amendment C, 2026-08-11) | Verifiable by |
| - | ------------ | ------------------------------- | ------------- |
| **P1** | **PLAN-EVAL cleared** on PR #1450 | **MET — by OWNER WAIVER, not by an evaluator PASS** (drift **D-18**). Codex GPT-5.6 Sol returned `FAIL_PLAN` twice; the remaining blockers were owner-gated, and the owner cleared the Plan-Gate in writing ("consider it as passed from me") after both stage-D2 design passes completed. No `[VERDICT: PASS]` comment exists and none may be claimed | drift D-18; the waiver banner on `plan-eval.md` |
| **P2** | **Owner ratification of RFC §15's blocking forks** | **MET** — the two `MUST RESOLVE` forks **F-1** and **F-3** were ratified 2026-08-11 exactly as recommended, and **one-shot board filing from this manifest was authorized** in the same event (drift **D-19**). The remaining §15 forks proceed accepted-as-recommended under that filing authorization | drift D-19 |
| **P3** | **A decision on drift D-10 (the mandated adversarial design pass)** | **MET — by owner-approved substitute route**: the owner declined to waive the pass and instead routed it to **Qwen 3.8 Max (architecture)** + **Kimi K3 (pure UI/UX)** on fresh read-only surfaces (drift **D-15/D-16**); all 22 findings swept to fixed/declined (D-19). **D-0b** (file the launcher gap?) was **never explicitly decided** — DT-18 is therefore NOT filed in this pass (see §4.1) | drift D-15, D-16, D-19; `design/ux-evidence/` |
| **P4** | **F-1 resolved** and **F-3 resolved** | **MET (D-19)** — **F-1: self-contained DevTools family and spine, built first in `packages/devtools-core`**, not serialized behind #890's 24 unimplemented children. **F-3: `.passthrough()` manifest schema-evolution precondition lands before any manifest-visible pointer**, with explicit old/new CLI behavior and tests | drift D-19 |

**Consequences for execution.**

- All four preconditions are met; the manifest is **executable in one ordered pass** by the
  supervisor. The formerly P4-gated rows (DT-6, DT-7, DT-8, DT-13) are resolved in §4.1 under
  F-1 = self-contained — no row remains conditional on an undecided fork.
- **Precision on P1:** the gate was cleared by the written owner waiver that `gates/plan-gate.md`
  allows — it was **not** satisfied by an evaluator verdict. Any downstream artifact citing a
  "PLAN-EVAL PASS" is wrong; cite the D-18 waiver.
- The mutation boundary opens **only** for the supervisor's single filing pass authorized by D-19.
  This file remains a draft plan; nothing in it mutates GitHub by itself. PR #1450 stays **draft**
  throughout filing; flipping it to ready-for-review would dispatch
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
| `epic:frontend-contrib` | ✅ | ✅ | **applied to no row** — F-1 ratified self-contained (D-19), so #929/#930/#934/#937 are body-text cross-references only |
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

Read live: `gh api repos/rickylabs/netscript/milestones --paginate` (2026-08-11, **re-verified in
the Amendment C pass the same day**). **Title match is exact**, including the spaces around the
slash in `Backlog / Triage`.

| Milestone (exact title) | Live? | Open issues | Role in this manifest |
| ----------------------- | ----- | ----------- | --------------------- |
| `Backlog / Triage` | ✅ (number 3) | 67 | Epic #400's own ratified home; umbrellas and **undecided-placement rows (DT-17)** live here — its own description covers "undecided work plus epic/umbrella issues" |
| `0.0.15` | ✅ (number 21) | 45 | **Default milestone for every new DevTools sub-issue** — the owner-ratified 2026-07-19 train ("ships after everything else"; beta.18 → `0.0.15`) where all **29** open `epic:dev-dashboard` children already sit (live re-count this pass; earlier passes said 28). **D-19 explicitly preserves this train** |
| `0.0.9` | ✅ (number 24) | 20 | Epic #922's train — **boundary reference only** after F-1 = self-contained (D-19); **no DT row files here** |
| `0.0.6` | ✅ (number 26) | 52 | "RFC ratification" — home of the DT-RFC tracking issue, precedent #1348/#1361 *(open count was 54 at first verification, 52 at the Amendment C re-read — the board moves; titles/numbers unchanged)* |
| `0.0.14` | ✅ (number 20) | 11 | **Description edit only** (strip the stale "Dev dashboard (thin, contribution-based)" clause per F-9 — clause confirmed still present live). **No issue moves.** |

**Rules.**

- **Create no milestone.** Every title above already exists; if a filing step cannot find one by
  exact title, **stop and escalate** — do not create it.
- **Default for new sub-issues: `0.0.15`**, matching the epic's ratified children train (task rule:
  new DevTools issues default to the epic's milestone unless the supersession map says otherwise).
- **Do not re-milestone any existing issue.** F-9's recommendation is explicitly *no moves*, and
  D-19's filing authorization is conditioned on preserving the 2026-07-19 train.
- **No row carries `MILESTONE: OWNER-DECISION` any more.** Amendment C resolved the three former
  carriers: **DT-6 → `0.0.15`** (F-3 makes it a precondition of the DevTools spine's own
  manifest-visible pointer, and the spine builds first per F-1 — it no longer waits on, or
  re-scopes, #922's `0.0.9` wave; #929 gets a cross-post, not a label); **DT-17 →
  `Backlog / Triage`** (outside the epic, no ratified train — the milestone whose stated rule
  covers undecided placement; the owner may re-home it later); **DT-18 → NOT FILED** (D-0b was
  never decided; the gap stays recorded in drift D-10/D-15).

---

## 4. Filing order

Epic first, then sub-issues in **dependency order** (RFC §14's DAG). Every sub-issue body carries
`Part of #<epic>` — **never** a closing keyword (`Closes`/`Fixes`/`Resolves`), which belongs only in
the PR that later resolves the issue. The epic **never** carries a closing keyword at all.

Each issue body uses the house shape, with acceptance criteria under an **`## Acceptance`** heading
(that is the heading the close-gate reads) and everything non-gating — background, design pointers,
sequencing notes — **outside** it.

### 4.0 Step 0 — the epic

**No new epic is created — standing decision D-11: the epic AMENDS #400.** Per the supersession
map, **#400 is the epic** and its disposition is `AMEND`: the ownership thesis, the three acceptance lines, and the killed-surfaces
list survive verbatim; the invent-your-own-discovery premise, the dead `beta.6` prose, and the
screen list are rewritten to point at RFC-0002. #400 keeps `Backlog / Triage`, `type:umbrella`, and
`epic:dev-dashboard`; its `status:` stays a single label per the taxonomy.

A **separate DevTools epic is not created in this pass** — D-11 settles it as AMEND-#400. The
note stands only as the escape hatch's paper trail: if the owner ever overrules D-11, the §2.2
`epic:devtools` label blocker must clear first (labels.yml PR, then label, then file), and the
new epic's milestone would be `Backlog / Triage` per that milestone's own stated rule.

### 4.1 Ordered sub-issue table

`Order` = filing sequence. `Dep` = RFC §14 dependency. Every row's live-board dedup result is in
§4.2 and must be re-read immediately before filing.

| # | Draft ID | Slice | Title (proposed) | Labels | Milestone | Dep | Action |
| - | -------- | ----- | ---------------- | ------ | --------- | --- | ------ |
| 1 | **DT-RFC** | — | `docs(rfc): ratify RFC-0002 — DevTools contribution architecture` | `type:docs`, `area:docs`, `rfc`, `status:triage`, `priority:p2`, `epic:dev-dashboard` | `0.0.6` | — | **NEW** — filed by default in the single pass (0.0.6's precedent #1348/#1361); the owner may hand-close it later if PR #1450 suffices |
| 2 | **DT-1** | W0-a | `chore(devtools): probe — can a package ship island specifiers under Deno resolution?` | `type:chore`, `area:cli`, `status:triage`, `priority:p2`, `epic:dev-dashboard` | `0.0.15` | — | **NEW** |
| 3 | **DT-2** | W0-b | `chore(devtools): probe — second route/island root in one Vite process` | `type:chore`, `area:cli`, `status:triage`, `priority:p2`, `epic:dev-dashboard` | `0.0.15` | — | **NEW** |
| 4 | **DT-3** | W1-a | `feat(devtools-core): contracts/v1 + orderContributions + arch:check roots` | `type:feat`, `area:plugins`, `area:tooling`, `status:triage`, `priority:p1`, `epic:dev-dashboard` | `0.0.15` | — | **NEW** (+ SUPERSEDE comment on #412 — DT-3 is the re-file of its seam; see §4.2/§5.2) |
| 5 | **DT-4** | W1-b | `feat(devtools-core): typed deep-link helper (resolveDevToolsLink)` | `type:feat`, `area:plugins`, `status:triage`, `priority:p1`, `epic:dev-dashboard` | `0.0.15` | DT-3 | **NEW** (re-file of #424's URL contract) |
| 6 | **DT-5** | W1-c | `fix(cli): path-containment invariant + scoped generator subprocess (INV-1/INV-2)` | `type:fix`, `area:cli`, `status:triage`, `priority:p0`, `epic:dev-dashboard` | `0.0.15` | DT-3 | **NEW** |
| 7 | **DT-6** | W1-d | `fix(plugin): manifest schema-evolution precondition — .passthrough() before any manifest-visible pointer (F-3)` | `type:fix`, `area:plugins`, `status:triage`, `priority:p0`, `epic:dev-dashboard` | `0.0.15` | F-3 ✅ (D-19) | **NEW** — P4 met; F-3 ratified `.passthrough()` with explicit old/new CLI behavior + tests. **Cross-post a reference comment on #929** (its plan rests on the false "older CLIs ignore unknown blocks" claim); no `epic:frontend-contrib` label — F-1 = self-contained |
| 8 | **DT-7** | W2-a | `feat(cli): transactional replace-set registry generator for devtools contributions` | `type:feat`, `area:cli`, `status:triage`, `priority:p1`, `epic:dev-dashboard` | `0.0.15` | DT-3, DT-5 | **NEW** — F-1 = self-contained (D-19). Body MUST state why it is not **#930**: DevTools-owned family emitted by A6 against the `packages/devtools-core` spine; #930 remains #922's app-family mechanism, untouched |
| 9 | **DT-8** | W2-b | `feat(cli): plugin doctor five-state contribution taxonomy + quarantine diagnosis` | `type:feat`, `area:cli`, `status:triage`, `priority:p1`, `epic:dev-dashboard` | `0.0.15` | DT-7 | **NEW** — F-1 = self-contained (D-19). Body states the **#937** boundary and cross-refs **#1454** (live doctor defect, same surface) |
| 10 | **DT-9** | W3-a | `feat(cli): CLI-generated DevTools host root + devtools command group` | `type:feat`, `area:cli`, `status:triage`, `priority:p1`, `epic:dev-dashboard` | `0.0.15` | DT-7 | **NEW** (+ AMEND #415) |
| 11 | **DT-10** | W3-b | `fix(devtools): dual production exclusion — build-graph absence + runtime refusal` | `type:fix`, `area:cli`, `status:triage`, `priority:p0`, `epic:dev-dashboard` | `0.0.15` | DT-9 | **NEW** |
| 12 | **DT-11** | W4-a | *(no new issue — AMEND #427)* `panel` kind + UiNode render + per-contribution error boundary | existing labels on #427 unchanged | unchanged (`0.0.15`) | DT-9 | **AMEND / FOLD** |
| 13 | **DT-12** | W4-b | `feat(devtools): link kind wiring — rendering + disabled-with-reason` | `type:feat`, `area:plugins`, `status:triage`, `priority:p2`, `epic:dev-dashboard` | `0.0.15` | DT-4, DT-9 | **NEW** |
| 14 | **DT-13** | W5-a | *(AMEND #423)* DevTools read contract + in-process MCP, deny-by-default | existing labels on #423 unchanged | unchanged (`0.0.15`) | DT-9 | **AMEND** — P4 met; F-1 = self-contained, so the gateway is **not** shared: #423 serves the DevTools family's own registry. Amendment names the **#934** boundary as a statement, not a gate |
| 15 | **DT-14** | W5-b | `feat(fresh): promote createSSEStream to the public export map` | `type:feat`, `area:fresh`, `status:triage`, `priority:p2`, `epic:dev-dashboard` | `0.0.15` | DT-13 | **NEW** |
| 16 | **DT-15** | W6-a | *(AMEND #428)* workers console as the first real consumer + #933 boundary sentence | existing labels on #428 unchanged | unchanged (`0.0.15`) | DT-11, DT-13 | **AMEND** |
| 17 | **DT-16** | W6-b | *(AMEND #429, #430, #431)* sagas / triggers / streams consoles + #944 boundary sentence; streams asserts the degraded state | existing labels unchanged | unchanged (`0.0.15`) | DT-15 | **AMEND** |
| 18 | **DT-17** | F-20 | `fix(fresh-ui): /design ships ungated — the defect class RFC-0002 guards against` | `type:fix`, `area:fresh-ui`, `status:triage`, `priority:p2` | `Backlog / Triage` | — | **NEW, outside the epic** |
| 19 | **DT-18** | D-0b | `fix(agentic): the major_ui_ux_design lane is declared but unlaunchable (evaluator guard blocks GLM)` | — | — | P3 | **NOT FILED** in this pass — D-0b was never decided (see §1 P3); the gap stays recorded in drift D-10/D-15. Filing it later requires an explicit owner decision, not this manifest |

**Milestone resolutions for the three former `MILESTONE: OWNER-DECISION` rows (Amendment C):**

- **DT-6 → `0.0.15`.** F-3's ratified wording ("`.passthrough()` **before any manifest-visible
  pointer**") makes it a precondition of the DevTools spine's own pointer, and F-1 puts that spine
  first on the DevTools train. It is no longer scheduled *for* #922's wave; #929 learns about it
  via a cross-post comment, which re-scopes nothing.
- **DT-17 → `Backlog / Triage`.** Outside the epic, no ratified train, and F-20's recommendation
  is "record and file separately" — `Backlog / Triage`'s own stated rule ("undecided work") is the
  only placement that invents nothing. The owner may re-home it at triage.
- **DT-18 → not filed.** D-0b (file / fold / leave the launcher gap) never received a decision;
  the unambiguous single-pass reading is *leave*, with the defect recorded in drift.

### 4.2 Live-board dedup check — per row

Executed 2026-08-11, `gh` **reads only** (`gh search issues`, `gh issue list`, `gh issue view`,
`gh label list`, `gh api …/milestones`). **Re-run this table immediately before filing** — the board
moves.

| Draft ID | Existing coverage found? | Verdict |
| -------- | ------------------------ | ------- |
| **DT-RFC** | No. `gh search issues "devtools"` (all states) returns only **#218** (closed, Aspire browser-logs), **#234**, **#375** — none is an RFC tracker. **#1380** schedules the *doctrine verdict table* on `0.0.6`, a different subject (but F-2 records that RFC-0002's home pre-empts it). | **FILE — no duplicate** |
| **DT-1 / DT-2** (W0 probes) | No. No open issue mentions island specifiers as a probe; **#922** surfaces in an `island specifiers` search only as the epic. #923–#927 are #922's *own* P1–P5 proofs and cover different questions (mounted sub-app ordering, lazy loaders, dependency-island build matrix, SSR containment, gateway threat model). | **FILE — no duplicate** |
| **DT-3** (W1-a) | **Partial.** **#412** (`[dashboard DDX-2] plugin-dashboard-core scaffold + contract seam`, OPEN, `0.0.15`) is the same seam and is dispositioned `AMEND`. **#928** (`[frontend-contrib S6] plugin-frontend-core contracts/v1`, `0.0.9`) is the *parallel* contracts unit for the app family — sibling, not duplicate. **#1403** (`quality:gate … arch:check omits 20 of 36 packages`, OPEN, `0.0.6`, `priority:p0`) already owns the **general** arch:check-coverage fix. | **FILE, with two constraints:** (a) DT-3's arch:check line is scoped to adding **its own two roots**, and the body must cross-reference **#1403** as the general fix rather than restating it; (b) **#412 is SUPERSEDED in substance by `packages/devtools-core`** (Amendment C / Qwen Q-m5 — the RFC locks contracts into A1 + A6 emission + A5 thin plugin; a surviving `plugin-dashboard-core` would be a second package home for the same role). DT-3 is the re-file of #412's seam; #412 gets a supersede **comment**, stays open, and closes **only after** DT-3 is live (the #424/DT-4 pattern). |
| **DT-4** (W1-b) | **Yes — #424** (`[dashboard DDX-14] CLI surface + auto-launch`, OPEN, `0.0.15`) holds the flat URL scheme the map marks the board's *one recorded outright contradiction*, disposition **SUPERSEDE**. | **FILE as the re-file**, and #424 closes **only after** DT-4 exists (map's precondition: "re-filed issue drafted before #424 closes"). |
| **DT-5** (W1-c) | No. `path containment` returns only **#1429** (agentic leak-check descendants) — unrelated. No open issue covers `resolveTarget` containment or bare `--allow-read`/`--allow-write` in the generator spawn. | **FILE — no duplicate** |
| **DT-6** (W1-d) | **Adjacent, not duplicate.** **#929** (`[frontend-contrib S7] @netscript/plugin pointer axis (.withFrontend)`, OPEN, `0.0.9`, `priority:p0`) is *built on* the false "older CLIs ignore unknown blocks" claim. No issue states the `.strict()` defect. | **FILE** — P4 met (F-3 ratified `.passthrough()`, D-19). **Cross-post a reference on #929** rather than silently re-scoping it. This is a defect in #922's plan surfaced by this run; the cross-post is the only touch #929 receives. |
| **DT-7** (W2-a) | **Strong overlap — #930** (`[frontend-contrib S8] Frontend registry emissions: transactional replace-set`, OPEN, `0.0.9`). Same mechanism, different family. | **FILE** — F-1 ratified **self-contained** (D-19), so DT-7 is not #930 and no fourth seam arises: the DevTools registry is emitted against our own `packages/devtools-core` spine. Body must state that boundary explicitly; **#930 is untouched**. |
| **DT-8** (W2-b) | **Strong overlap — #937** (`[frontend-contrib S15] Doctor frontend check + five-state taxonomy`, OPEN, `0.0.9`); also **#938** (quarantine render states). | **FILE** — same F-1 resolution as DT-7; body states the #937/#938 boundary. Also cross-reference **#1454** (`fix(plugin doctor): package-backed workers/streams treated as local workdirs`) as a live doctor defect in the same surface. **#937/#938 are untouched.** |
| **DT-9** (W3-a) | **Partial — #415** (`[dashboard DDX-5] Fresh build-console shell + app-registration + IA`, OPEN, `0.0.15`, `AMEND`) owns the shell; **#424** owns the CLI surface + auto-launch. | **FILE the host-root/command-group slice**; **AMEND #415** to adopt RFC §11's IA rather than duplicating it. |
| **DT-10** (W3-b) | No. `production build exclusion` returns nothing. | **FILE — no duplicate** |
| **DT-11** (W4-a) | **Yes — #427** (`[dashboard DDX-17] DashboardPanelContribution`, OPEN, `0.0.15`), disposition **FOLD**. | **FILE NO NEW ISSUE.** Amend #427 into the RFC's `panel`-kind slice; record the `CR-DDX-HOSTAGNOSTIC` resolution on it. |
| **DT-12** (W4-b) | No standalone issue; the link-rendering surface is implied by #424 (superseded) and #411 (`DDX-1 Aspire command+app kinds`, **KEEP** — the out-link seam, not the render seam). | **FILE — no duplicate**, body states the #411 boundary. |
| **DT-13** (W5-a) | **Yes — #423** (`[dashboard DDX-13] Introspection endpoint /_netscript/*`, OPEN, `0.0.15`, `AMEND`). Also **#934** (`[frontend-contrib S12] Generated deny-by-default procedure gateway`, `0.0.9`) — the same deny-by-default shape for the app family. | **FILE NO NEW ISSUE.** Amend #423; the amendment must name the #934 boundary. P4 met: F-1 = self-contained (D-19), so the gateway is **not** shared — #423 serves the DevTools family's own registry; #934 is untouched. |
| **DT-14** (W5-b) | No. `SSE stream` returns only **#232**/#234 (unrelated). `createSSEStream` promotion is unclaimed. | **FILE — no duplicate**; note it is a `packages/fresh` **public-surface** change (consumer gate applies). |
| **DT-15** (W6-a) | **Yes — #428** (`[dashboard DDX-18a] workers per-capability dashboard section`, OPEN, `0.0.15`, `AMEND`). Boundary counterpart **#933** (`[frontend-contrib S11] Workers dogfood: zone panel + console route + island`, `0.0.9`). | **FILE NO NEW ISSUE.** Amend #428 with the one-sentence #933 boundary. **#933 is untouched.** |
| **DT-16** (W6-b) | **Yes — #429 / #430 / #431**, all OPEN `0.0.15`, all `AMEND`. Boundary counterpart **#944** (`[frontend-contrib S22] Sagas/triggers/streams dashboard-zone panels`, `0.0.11`). | **FILE NO NEW ISSUES.** Amend the three. **#944 is untouched.** |
| **DT-17** (F-20) | No. `design ungated production` and `/design route` return nothing on point (**#1277** is a docs-site UI polish epic; **#1335** is scaffold conformance). | **FILE — no duplicate** |
| **DT-18** (D-0b) | No. `GLM design lane`, `openrouter launcher`, `lane-policy` return nothing on point (**#768** is an OpenHands runtime bootstrap failure; **#1082** is a *closed* Gemini routing fix — related class, different defect). | **NOT FILED** — no duplicate exists, but D-0b was never decided (§1 P3); the single-pass reading is *leave*, recorded in drift. |

**Net result (post-Amendment C, nothing conditional): 14 new issues filed** (DT-RFC, DT-1, DT-2,
DT-3, DT-4, DT-5, DT-6, DT-7, DT-8, DT-9, DT-10, DT-12, DT-14, DT-17), **1 row not filed**
(DT-18 — D-0b undecided), and **4 rows that are amendments of live issues, not new filings**
(DT-11 → #427, DT-13 → #423, DT-15 → #428, DT-16 → #429/#430/#431 — six issues amended). The
former F-1 conditionals (DT-6, DT-7, DT-8) resolved to FILE under the ratified self-contained
family.

That ratio is the point of running dedup: RFC §14's 15-slice roadmap does **not** map to 15 new
issues, because part of it is already on the board as amendable issues — and F-1's resolution
turned the two spine-overlap rows into boundary-stating new filings rather than #922 hand-offs.

### 4.3 Per-issue body template

```markdown
## Summary

<1–3 sentences: what this slice delivers and which RFC section is its authority.>

## Scope

- Archetype / area: <A1 packages/devtools-core | A6 packages/cli | A5 plugins/devtools>
- Part of #400
- Depends on #<draft-id resolved to a live number>
- RFC: `rfcs/0000-devtools-contribution.md` §<n>

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
| **#414, #415, #420, #423, #426, #428, #429, #430, #431, #551** | AMEND | One comment each stating the re-baseline onto RFC-0002 and the specific boundary sentence (#428–#431 name #933/#944; #423 names #934; #551 names #1446's Surface-1/Surface-2). No milestone change, no label change beyond an intentional single-`status:` correction. | n/a — they stay open |
| **#412** | **SUPERSEDE** (Amendment C — was AMEND; Qwen Q-m5) | Comment naming **DT-3 as the re-file** of its contracts seam and **RFC-0002 A1 `packages/devtools-core`** (+ A6 emission + A5 thin plugin) as the ratified package home — `plugin-dashboard-core` does not survive as a second home for the same role. **Do not close at filing.** | Closes after DT-3 is live (the #424/DT-4 precondition pattern) |
| **#427** | FOLD | Comment: folds into RFC-0002 §6/§7 as the `panel`-kind slice; records the `CR-DDX-HOSTAGNOSTIC` resolution; cross-refs #890 §2.3. **Stays open** as the implementation slice. | Closes with the PR that lands W4-a |
| **#734** | FOLD | Comment cross-referencing #890 §2.3, the 2026-07-19 owner flag, and the RFC section that absorbs it. **Do not close at filing.** | Closes only once the absorbing RFC section is ratified **and** the owner confirms — F-4 |
| **#424** | SUPERSEDE | Comment naming DT-4/DT-9 as the re-file and RFC §11 as the URL contract. **Do not close at filing** — the map's precondition is that the re-filed issue exists first. | Closes after DT-4 and DT-9 are live |
| **#507** | CLOSE-LATER | Comment recording that closure fires when the RFC design pack absorbs the duplication + flow≠waterfall design-review gate. | Owner confirms the trigger has fired |
| **PR #780** | CLOSE-LATER (F-12) | **Salvage first**: `DS-UPLIFT-BACKLOG.md` + `DESIGN-LANGUAGE.md` into the **#509** lane. Comment on #780 recording the salvage and the superseded flat IA. | Close only after the salvage lands |
| **#410, #411, #413, #416, #417, #418, #419, #432, #509, #552–#557** | KEEP | **No action.** | — |
| **#421, #422, #425** | KEEP (already closed) | **No action.** The kills are documented in RFC §11 non-goals so they cannot creep back. | — |
| **#544** | AMEND — **coordinate only** | This run does **not** edit #544. Post the CR resolution on **#400/#427**; the body edit belongs to epic **#510**'s lane. | — |
| **#922, #933, #944** and **all 24 #922 children** | **explicitly untouched** | **ZERO actions. No comment, no label, no milestone, no body edit.** The RFC states the ownership boundary (C2) on the #400 side only. F-1 = self-contained (D-19) removes any DevTools dependency on their waves — the sole permitted #922-adjacent touch anywhere in this manifest is the DT-6 **cross-post comment on #929**, which informs, and re-scopes nothing. | — |
| **`0.0.14` milestone description** | F-9 | Strip the stale "Dev dashboard (thin, contribution-based)" clause; keep the auth/deploy tail wording. **Description edit only — zero issue moves.** | — |

### 5.3 The bright line

**#922's children are not re-scoped by this run, at filing time or after** — no body edit, no
label, no milestone, no state change on any of them. The charter forbids re-scoping another
epic's children, and F-10's recommendation is that both epics survive because they are different
artifacts on different hosts; F-1 = self-contained (D-19) means DevTools does not even depend on
their waves. **Exactly one informational touch is authorized:** the DT-6 **cross-post comment on
#929** (§4.1/§4.2), which reports the `.strict()`/F-3 defect to the lane that owns it and changes
nothing on the issue. Every other #922 child — including #933 and #944 — receives zero actions of
any kind. If the owner wants consolidation, that is a new decision requiring its own drafted
map — none exists, and none is implied here.

---

## 6. `FILING-LOG.md` template

Written to `.llm/runs/plan-devtools-contribution--seed/filing/FILING-LOG.md` **after** filing, and
committed to PR #1450 in the same session. It is the draft-ID → live-number mapping that makes the
filing auditable.

````markdown
# FILING-LOG — DevTools contribution RFC

**Filed:** <ISO-8601 UTC> · **By:** <session id / operator> · **Ratification:** drift D-19
(owner in-turn, 2026-08-11) · **PLAN-EVAL:** cleared by owner waiver, drift D-18 — **no evaluator
PASS exists; do not cite one**

## Preconditions at filing time

| # | Precondition | Evidence |
| - | ------------ | -------- |
| P1 | PLAN-EVAL cleared | **owner waiver** — drift D-18 (`plan-eval.md` banner); Codex verdicts were `FAIL_PLAN` ×2 |
| P2 | Blocking §15 forks ratified + filing authorized | drift D-19 |
| P3 | D-10 satisfied / D-0b | drift D-15/D-16 (substitute route: Qwen + Kimi) — D-0b undecided → DT-18 not filed |
| P4 | F-1 / F-3 resolved | drift D-19 — F-1 = **self-contained (`packages/devtools-core` first)**, F-3 = **`.passthrough()` before any manifest-visible pointer** |

## Draft ID → live issue

| Draft ID | Slice | Live # | Title as filed | Milestone | Labels applied | Notes |
| -------- | ----- | ------ | -------------- | --------- | -------------- | ----- |
| DT-RFC | — | #____ | | 0.0.6 | | |
| DT-1 | W0-a | #____ | | 0.0.15 | | |
| DT-2 | W0-b | #____ | | 0.0.15 | | |
| DT-3 | W1-a | #____ | | 0.0.15 | | cross-ref #1403; **re-file of #412's seam (supersede comment on #412)** |
| DT-4 | W1-b | #____ | | 0.0.15 | | re-file of #424 |
| DT-5 | W1-c | #____ | | 0.0.15 | | |
| DT-6 | W1-d | #____ | | 0.0.15 | | cross-posted on #929 (informational only) |
| DT-7 | W2-a | #____ | | 0.0.15 | | body states the #930 boundary (F-1 = self-contained) |
| DT-8 | W2-b | #____ | | 0.0.15 | | body states the #937/#938 boundary; cross-refs #1454 |
| DT-9 | W3-a | #____ | | 0.0.15 | | amends #415 |
| DT-10 | W3-b | #____ | | 0.0.15 | | |
| DT-11 | W4-a | **#427** (amended) | — | unchanged | unchanged | no new issue |
| DT-12 | W4-b | #____ | | 0.0.15 | | |
| DT-13 | W5-a | **#423** (amended) | — | unchanged | unchanged | no new issue |
| DT-14 | W5-b | #____ | | 0.0.15 | | packages/fresh public surface |
| DT-15 | W6-a | **#428** (amended) | — | unchanged | unchanged | no new issue |
| DT-16 | W6-b | **#429 / #430 / #431** (amended) | — | unchanged | unchanged | no new issues |
| DT-17 | F-20 | #____ | | Backlog / Triage | | outside the epic |
| DT-18 | D-0b | **NOT FILED** | — | — | — | D-0b undecided; gap stays in drift D-10/D-15 |

## Reconciliation actions performed

| Issue / artifact | Disposition | Action taken | Comment URL | Closed? |
| ---------------- | ----------- | ------------ | ----------- | ------- |
| #400 | AMEND | | | no |
| #412 | SUPERSEDE (Amendment C) | supersede comment → DT-3 | | no |
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
- [ ] **Zero** mutations on #922, #933, #944, or any of #922's 24 children — with the single
      authorized exception of the informational DT-6 cross-post **comment** on #929 (§5.3);
      verified by `gh issue view` timeline reads (no body/label/milestone/state change anywhere).
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
- `rfcs/0000-devtools-contribution.md` §13, §14, §15
- `.llm/runs/plan-devtools-contribution--seed/plan.md` (L1–L14, rework audit, risk register)
- `.llm/runs/plan-devtools-contribution--seed/design/T9-supersession/supersession-map.md`
- `.llm/runs/plan-devtools-contribution--seed/decision-brief.md`
- `.agents/skills/netscript-pr/SKILL.md`
