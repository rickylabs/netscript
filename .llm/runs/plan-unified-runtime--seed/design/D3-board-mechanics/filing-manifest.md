# D3 — Stage-H filing manifest (resumable transaction)

> **DRAFT — executes only after owner in-turn ratification of `decision-brief.md`.** Until then this
> is planning text. The #824 seed run is drafts-only; the board (issues, epics, milestones, repo
> labels) is untouchable before Stage-H (`seed-run.md` §Stage H). Filing is a **resumable
> transaction**, not a one-shot: every step is idempotent and re-entrant, so a mid-run failure resumes
> without duplicating issues or half-rewriting legacy bodies. All GitHub ops use the **GitHub MCP**
> tools (`gh` is not on PATH); read ground-truth with direct git/API GETs.

Canonical issue bodies for **every** slot are the files under `design/canonical/UR-<n>.md` (+
`DD-RESEARCH.md`); the draft→slot merge transforms are in `design/canonical/slot-map.md`. The filer
publishes each file's `## Body` section verbatim — it does not compose prose, and it never
publishes the planning metadata (label tables, dependency notes, `## Fork deltas`) that surrounds
the body.

---

## Invariants (hold for the whole transaction)

- **Stable slot marker.** Every canonical body carries an HTML comment
  `<!-- seed:plan-unified-runtime slot:UR-<n> -->` (and the `DD-RESEARCH` marker). This marker is the
  idempotency key: **search before every create**; if a live issue already contains the exact marker,
  that slot is already filed — record its number and skip creation.
- **Immediate per-slot logging.** `FILING-LOG.md` is appended **after each individual slot/legacy
  mutation**, before the next one — never after the whole blast radius. The log is the durable
  resume cursor.
- **Read-after-write verification.** After every create/edit, re-GET the issue and assert
  title + every label + milestone + the slot marker are present. A mismatch STOPs the transaction.
- **Compare-before-edit on legacy bodies.** Every edit to a live issue (#451/#453/#454/#455/#327/#349)
  first re-reads the current body and verifies the expected pre-edit substring is present and the
  addendum is **not** already present (idempotent). If the body drifted from the snapshot, STOP and
  re-surface to the owner.
- **No closing keywords anywhere at filing.** All folds land later via each legacy issue's own
  downstream implementation PR (`Closes #N`). Epics never carry a closing keyword.

---

## Step 0 — pre-flight verification (read-only, no mutation)

1. Re-fetch #823, #830, #451, #453, #454, #455, #349, #327 live; confirm state matches the
   `slot-map.md` legacy dispositions (esp. #349 still closed; #451/#453/#454/#455 still open +
   `epic:unified-runtime`; #327 still open with its stale D1 saga-exclusion language). If any drifted,
   STOP and re-surface to the owner — do not file against a stale snapshot.
2. Confirm **PLAN-EVAL = PASS** is recorded (Stage-G hard stop) and the owner has ratified the
   numbered forks **in-turn** in this session (not a relayed/stale approval).
3. Confirm **Step 1's label-parity PR is MERGED** (see gated prerequisite below). If it is not merged,
   STOP — filing may not begin.

## Step 1 — GATED PREREQUISITE: `epic:unified-runtime` label-parity PR

`epic:unified-runtime` is used on live issues but is **absent from `.github/labels.yml`** (verified
2026-07-18). Filing depends on it, so it is a **separate, completed prerequisite**, not an in-line
step:

1. Open a one-line PR adding to `.github/labels.yml`:
   `epic:unified-runtime` / color `5319e7` / "Unified single-runtime deployment epic (#823)".
2. This PR merges under the **normal gates** — CI green + opposite-family eval PASS (Stop-line 1).
   Filing (Steps 2–6) does **not** begin until it is merged. The transaction has **no** step that
   proceeds on an unmerged parity PR.
3. Never create a live label absent from the file; never delete an existing label.

## Step 2 — milestones (verify; create only what is missing; exact title match)

Verify live milestones first. Expected to already exist (referenced by live issues 2026-07-18):
`0.0.1-beta.11`, `0.0.1-beta.12`, `0.0.1-beta.13`, `0.0.1-beta.14`, `Backlog / Triage`.
`0.0.1-stable` — **verify live**; create only if absent. Title-match is exact, incl. the spacing in
`Backlog / Triage`. No new milestone is invented. Log the verification result to `FILING-LOG.md`.

## Step 3 — epic #823 reconcile (no recreate, no close)

#823 already exists (`type:umbrella`, `epic:unified-runtime`, ms `0.0.1-beta.13`). It is edited to add
the sub-issue checklist (UR-0…UR-12 → live numbers) **after** Step 4 creates them, mirroring the #830
pattern. **No closing keyword on #823.** Compare-before-edit: confirm the checklist placeholder is
present and not already filled.

## Step 4 — sub-issues (resumable create in DAG order)

Create in dependency order (below). For **each** slot, run this idempotent per-slot transaction:

1. **Search-before-create:** query issues for the exact slot marker
   `<!-- seed:plan-unified-runtime slot:UR-<n> -->`. If found → record the existing number, go to
   step 5 (verify) — do **not** create a duplicate.
2. **Create** with the title from the canonical file's metadata table, and the body = ONLY the
   canonical file's `## Body` section (which must contain `Part of #823`, exactly ONE slot marker,
   and the `- [ ] gate:` boxes — planning metadata such as the label table, dependency notes, and
   `## Fork deltas` is NEVER published). Preflight fails a slot whose `## Body` is missing or whose
   marker count ≠ 1. Labels = the **exact label set** from the metadata table (incl. exactly one
   `status:` = `status:plan`); milestone from the metadata table.
3. **Read-after-write:** re-GET the created issue; assert title, **every** label (preflight fails if
   any requested label is absent from `.github/labels.yml`), the single `status:plan`, the milestone,
   and the slot marker are all present.
4. **Append to `FILING-LOG.md` immediately** (handle → live #, title, milestone, labels) before the
   next slot.
5. **Retry/conflict rule:** on a transient API failure, re-run step 1 (search-before-create) first —
   if the marker now exists the create partially succeeded; adopt that number instead of re-creating.
   On a label/milestone mismatch, STOP (do not patch silently) and re-surface.

DAG create order (Part-of links + dependency edges resolve):

| Order | Slot | Labels (exact — one `status:`) | Milestone |
| --- | --- | --- | --- |
| 1 | UR-11 | `type:feat` `area:deploy` `area:service` `area:sdk` `area:database` `epic:unified-runtime` `epic:deployment` `priority:p1` `wave:v1` `status:plan` | 0.0.1-beta.13 |
| 2 | UR-0 | `type:feat` `area:service` `epic:unified-runtime` `epic:deployment` `priority:p1` `wave:v1` `status:plan` | 0.0.1-beta.13 |
| 3 | UR-1 | `type:feat` `area:service` `area:deploy` `epic:unified-runtime` `epic:deployment` `priority:p1` `wave:v1` `status:plan` | 0.0.1-beta.13 |
| 4 | UR-2 | `type:feat` `area:deploy` `area:fresh` `epic:unified-runtime` `epic:deployment` `priority:p1` `wave:v1` `status:plan` | 0.0.1-beta.13 |
| 5 | UR-3 | `type:feat` `area:fresh` `area:deploy` `epic:unified-runtime` `epic:deployment` `priority:p1` `wave:v1` `status:plan` | 0.0.1-beta.13 |
| 6 | UR-4 | `type:feat` `area:service` `area:sdk` `gate:jsr` `epic:unified-runtime` `epic:deployment` `priority:p1` `wave:v1` `status:plan` | 0.0.1-beta.13 |
| 7 | UR-5 | `type:feat` `area:cli` `area:config` `area:plugins` `epic:unified-runtime` `epic:deployment` `priority:p1` `wave:v1` `status:plan` | 0.0.1-beta.13 |
| 8 | UR-9 | `type:feat` `area:kv` `area:database` `area:service` `area:deploy` `epic:unified-runtime` `epic:deployment` `priority:p2` `wave:v1` `status:plan` | 0.0.1-beta.13 |
| 9 | UR-7 | `type:feat` `area:database` `epic:unified-runtime` `epic:deployment` `priority:p1` `wave:v1` `status:plan` | 0.0.1-beta.13 |
| 10 | UR-6 | `type:test` `area:cli` `area:tooling` `area:deploy` `gate:e2e` `epic:unified-runtime` `epic:deployment` `priority:p1` `wave:v1` `status:plan` | 0.0.1-beta.13 |
| 11 | UR-10 | `type:feat` `area:deploy` `area:sdk` `epic:unified-runtime` `epic:deployment` `priority:p1` `wave:v1` `status:plan` | 0.0.1-beta.13 |
| 12 | UR-8 | `type:feat` `area:database` `epic:unified-runtime` `epic:deployment` `priority:p3` `wave:v1` `status:plan` | 0.0.1-beta.13 |
| 13 | UR-12 | `type:chore` `area:deploy` `epic:unified-runtime` `epic:deployment` `priority:p1` `wave:v1` `status:plan` | 0.0.1-beta.13 |
| 14 | DD-RESEARCH | `type:chore` `area:deploy` `epic:unified-runtime` `epic:deployment` `priority:p3` `wave:defer` `status:research` | 0.0.1-stable |

(Every row carries exactly one `status:` label; preflight FAILS before any mutation if a row lacks a
status or names a label absent from `.github/labels.yml`.)

## Step 5 — reconcile pre-existing issues (KEEP — zero filing-time closes)

Each mutation is compare-before-edit (verify expected pre-edit body, verify addendum not already
present), read-after-write verified, and logged immediately. **No `close`, no closing keyword.**

1. **#451** — append `Part of #823`; milestone `Backlog/Triage` → `0.0.1-beta.13`. **KEEP OPEN.**
   No fold text — #451's full SDK transport surface is a separate open slice (UR-4 is a subset).
2. **#453** — append `Part of #823` + capability re-scope note (writer-ownership is a declared
   capability; desktop realization stays on #830); milestone → `0.0.1-beta.13`. **KEEP OPEN.**
3. **#454** — append `Part of #823` + the **non-closing acceptance addendum** scoping the physical
   single-process / zero-loopback guarantee to in-process-capable presets (F-16); milestone →
   `0.0.1-beta.13`. **KEEP OPEN.** This addendum is the only content edit on a re-homed issue.
4. **#455** — append `Part of #823` + offline-sync-is-a-profile note; milestone per **F-10** (default
   `0.0.1-stable`); keep `priority:p3`. **KEEP OPEN.**
5. **#327** — append the **non-closing addendum** (drafted below) superseding the D1 "excludes sagas /
   not-v1 / 3–5 months" language with the per-preset capability rule + link to UR-5. **KEEP OPEN**,
   no milestone/label change beyond the addendum.
6. **#349** — already CLOSED. **No reopen/re-close.** Correct the terminal status label (F-17): per
   `.github/labels.yml`, a completed closure uses `status:shipped`; a not-planned closure has **no**
   status. Classify at owner ratification, then either replace `status:triage` → `status:shipped` or
   remove `status:triage`. Optional single cross-link comment → #823/UR-6 tier-3 successor.

### #327 non-closing addendum (drafted text — appended, not replacing)

```markdown
---
**Addendum (unified-runtime seed #824 — non-closing supersession).** The D1 disposition on this issue
("unified mode is a separate track, not v1; ~3–5 months; excludes sagas") is **superseded** for the
saga clause by the unified-runtime capability rule: sagas run **in-process only through the NetScript
saga runtime**, and each deploy preset declares `sagas: supported | externalized | rejected` and
proves it (never Nitro-task substitution). See #823 / UR-5. This addendum does not close #327 and does
not alter #327's other clauses.
```

## Step 6 — FILING-LOG.md (append-as-you-go; final shape)

`FILING-LOG.md` is written incrementally (per Step 4/5). Final shape:

```markdown
# FILING-LOG — plan-unified-runtime--seed (Stage-H)

Filed: <ISO> · Ratified in-turn by owner: <yes/link> · PLAN-EVAL: PASS <link> · Parity PR merged: <#>

## Epic
- #823 (pre-existing) — body reconciled with UR-0…UR-12 checklist

## Sub-issues (draft handle → live)
| Handle | Live # | Title | Milestone | Labels | Marker verified |
| --- | --- | --- | --- | --- | --- |
| UR-0 | #___ | … | 0.0.1-beta.13 | … | yes |
| …    | …    | … | …             | …  | …   |

## Successor cards
| DD-RESEARCH | #___ | … | 0.0.1-stable | … | yes |

## Supersession reconciliation (all KEEP — zero closes)
| Issue | Disposition | Action taken | Closes via |
| --- | --- | --- | --- |
| #451 | KEEP → UR-4 subset | Part of #823 + ms beta.13; open | its own SDK-slice PR Closes #451 |
| #453 | KEEP → UR-7 foundation | Part of #823 + re-scope note + ms beta.13; open | #453 realization PR Closes #453 |
| #454 | KEEP → UR-10 foundation | Part of #823 + non-closing addendum (F-16) + ms beta.13; open | #454 realization PR Closes #454 |
| #455 | KEEP → UR-8 foundation | Part of #823 + profile note + ms per F-10; open | #455 impl PR Closes #455 |
| #327 | KEEP + addendum | non-closing saga-supersession addendum + UR-5 link; open | — |
| #349 | CONFIRM superseded | status-label corrected (F-17); cross-link comment | — |

## Labels / milestones
- epic:unified-runtime parity PR: <#> (MERGED before filing)
- milestones created: <none / 0.0.1-stable if it was absent>
```

## Step 7 — authority banners

Add the "GitHub wins on conflict" authority banner to this run's tag-carrying docs (`proposal.md`,
`synthesis.md`, `plan.md`) rather than retroactively rewriting milestone/issue tags. GitHub is the
single source of truth after Stage-H.

---

## Stop-lines (HARD — read twice)
1. Merge requires CI green + opposite-family eval PASS on the PR. Owner granted standing beta-11 merge authorization (2026-07-17 in-turn) once that bar is met.
2. HARD STOP before any release publish (`release:cut`, JSR publish, tag push, canary or stable) — owner sign-off in-turn only; a stale or relayed approval does not count.
3. HARD STOP before closing milestone 13 — owner sign-off only.
4. These stop-lines are repeated verbatim in EVERY sub-agent brief. A sub-brief without the stop-lines section is invalid.
5. The #824 seed run is drafts-only until owner ratification; its board filing needs the owner in-turn.
