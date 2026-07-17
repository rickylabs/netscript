# D3 — Stage-H filing manifest (one-shot)

> **DRAFT — executes only after owner in-turn ratification of `decision-brief.md`.** Until then this
> is planning text. The #824 seed run is drafts-only; the board (issues, epics, milestones, repo
> labels) is untouchable before Stage-H (`seed-run.md` §Stage H). Filing happens **once**, in
> dependency order, from this committed manifest. All GitHub ops use the **GitHub MCP** tools
> (`gh` is not on PATH); read-ground-truth with direct git/API GETs.

This manifest integrates the UR slot table (`proposal.md` §2), plus the D1/D2 pack issue drafts,
into a single ordered filing. Slot bodies for UR-1…UR-10 are supplied by D1/D2; D3 supplies the
skeleton, the milestone/label assignment, and the supersession reconciliation.

---

## Step 0 — pre-flight verification (read-only, no mutation)

1. Re-fetch #823, #830, #451, #453, #454, #455, #349 live; confirm state matches this manifest's
   assumptions (esp. #349 still closed, #451/#453/#454/#455 still open + `epic:unified-runtime`).
   If any drifted, STOP and re-surface to the owner — do not file against a stale snapshot.
2. Confirm PLAN-EVAL = PASS is recorded (Stage-G hard stop) and the owner has ratified the numbered
   forks **in-turn** in this session (not a relayed/stale approval).

## Step 1 — labels (verify vs `.github/labels.yml`; parity PR if the file lags live)

Every label UR-* issues use already exists in `.github/labels.yml` (verified 2026-07-18):

- `type:feat`, `type:umbrella`
- `status:plan` (issues land in the current phase; seed board is pre-impl), `status:research`
- `area:deploy`, `area:database`, `area:service`, `area:sdk`, `area:fresh`, `area:cli`, `area:kv`
- `priority:p1`, `priority:p2`, `priority:p3`
- `epic:unified-runtime` — **verify live**: it is used on live issues (#823/#451/…) but is **not
  present in `.github/labels.yml`**. If still missing at filing, add it to `labels.yml` **first**
  (a one-line parity PR) before relying on it — never create a live label absent from the file.
  Proposed entry: `epic:unified-runtime` / color `5319e7` / "Unified single-runtime deployment epic (#823)".
- `wave:v1`, `wave:defer`

**Action:** file the `labels.yml` parity PR for `epic:unified-runtime` if the audit confirms the
gap; otherwise no label creation. **Never delete** an existing label.

## Step 2 — milestones (create only what is missing; exact title match)

Verify live milestones first. Expected to already exist (referenced by live issues 2026-07-18):
`0.0.1-beta.11`, `0.0.1-beta.12`, `0.0.1-beta.13`, `0.0.1-beta.14`, `Backlog / Triage`. `0.0.1-stable`
is referenced by the netscript-pr skill as a standing milestone — **verify live**; create only if
absent. Do **not** create any milestone that already exists (title-match is exact, incl. spacing in
`Backlog / Triage`). No new milestone is invented by D3.

## Step 3 — epic (already filed) — reconcile, do not recreate

#823 already exists (`type:umbrella`, `epic:unified-runtime`, ms `0.0.1-beta.13`). Stage-H **edits**
its body to add the sub-issue checklist (UR-1…UR-H → live numbers) after they are created (Step 4),
mirroring the #830 pattern (`<!-- filled below at filing -->` → checkbox list). **No closing
keyword on #823** — it closes by hand when every child lands.

## Step 4 — sub-issues (create in DAG order; `Part of #823`, full taxonomy, milestone)

Create in dependency order so `Part of` links resolve. For each: title `[unified-runtime UR-<n>]
<slice>`, body from the owning pack (D1/D2) or D3 (UR-11/UR-H), `Part of #823` in body (**no closing
keyword**), labels per row, milestone per §3.

| Order | Slot | Owning pack draft | Labels | Milestone |
| --- | --- | --- | --- | --- |
| 1 | UR-1 | D1 | `type:feat` `area:service` `area:deploy` `priority:p1` `epic:unified-runtime` `wave:v1` | beta.13 |
| 2 | UR-2 | D1 | `type:feat` `area:deploy` `area:fresh` `priority:p1` `epic:unified-runtime` `wave:v1` | beta.13 |
| 3 | UR-3 | D1 | `type:feat` `area:fresh` `priority:p1` `epic:unified-runtime` `wave:v1` | beta.13 |
| 4 | UR-4 | D1 | `type:feat` `area:sdk` `area:service` `gate:jsr` `priority:p1` `epic:unified-runtime` `wave:v1` | beta.13 |
| 5 | UR-5 | D2 | `type:feat` `area:deploy` `priority:p1` `epic:unified-runtime` `wave:v1` | beta.13 |
| 6 | UR-9 | D2 | `type:feat` `area:kv` `area:deploy` `priority:p2` `epic:unified-runtime` `wave:v1` | beta.13 |
| 7 | UR-7 | D2 | `type:feat` `area:database` `priority:p1` `epic:unified-runtime` `wave:v1` | beta.13 |
| 8 | UR-11 | D3 | `type:chore` `area:database` `priority:p3` `epic:unified-runtime` `wave:v1` | beta.13 |
| 9 | UR-10 | D1+D2 | `type:feat` `area:deploy` `area:sdk` `priority:p1` `epic:unified-runtime` `wave:v1` | beta.13 |
| 10 | UR-6 | D2 | `type:feat` `area:deploy` `priority:p1` `epic:unified-runtime` `wave:v1` | beta.13 (tier-3 cell per OF-4) |
| 11 | UR-8 | D2 | `type:feat` `area:database` `priority:p3` `epic:unified-runtime` `wave:defer` | stable/backlog per OF-5 |
| 12 | UR-H | D3 | `type:chore` `area:deploy` `priority:p1` `epic:unified-runtime` `wave:v1` | beta.13 |

## Step 5 — reconcile pre-existing issues (supersession map — zero filing-time closes)

Execute exactly the `proposal.md` §5 dispositions. Summary of the mutations (all are **edits/labels/
comments — no `close`**, except none):

1. **#451** — body: append `Part of #823`; milestone `Backlog/Triage` → `0.0.1-beta.13`. KEEP OPEN.
2. **#453** — body: append `Part of #823` + re-scope note (declared capability); milestone →
   `0.0.1-beta.13`. KEEP OPEN.
3. **#454** — body: edit acceptance §1 to scope the physical single-process/zero-loopback guarantee
   to in-process-capable presets (D-02); append `Part of #823`; milestone → `0.0.1-beta.13`. KEEP OPEN.
4. **#455** — body: append `Part of #823` + offline-sync-is-a-profile note; milestone per OF-5;
   keep `priority:p3`. KEEP OPEN.
5. **#349** — **no state change** (already closed). Optional single cross-link comment → #823/UR-6.

Do **not** add closing keywords anywhere at filing. Folds land later via the UR-4/UR-7/UR-10/UR-8
implementation PRs' `Closes #N` (each sub-issue is closed by exactly one PR — `netscript-pr`).

## Step 6 — FILING-LOG.md

Write `.llm/runs/plan-unified-runtime--seed/FILING-LOG.md` mapping every draft handle → live number,
and record each supersession action. Shape:

```markdown
# FILING-LOG — plan-unified-runtime--seed (Stage-H)

Filed: <ISO date> · Ratified in-turn by owner: <yes/link> · PLAN-EVAL: PASS <link>

## Epic
- #823 (pre-existing) — body reconciled with UR checklist

## Sub-issues (draft handle → live)
| Handle | Live # | Title | Milestone | Labels |
| --- | --- | --- | --- | --- |
| UR-1 | #___ | … | 0.0.1-beta.13 | … |
| …    | …    | … | …             | … |

## Supersession reconciliation
| Issue | Disposition | Action taken | Folds via |
| --- | --- | --- | --- |
| #451 | FOLD → UR-4 | Part of #823 + ms beta.13; open | UR-4 PR Closes #451 |
| #453 | FOLD → UR-7 | Part of #823 + ms beta.13; open | UR-7 PR Closes #453 |
| #454 | RE-SCOPE → UR-10 | acceptance edited (D-02) + ms beta.13; open | UR-10 PR Closes #454 |
| #455 | FOLD → UR-8 | Part of #823 + ms; open | UR-8 PR Closes #455 |
| #349 | CONFIRM superseded | already closed; cross-link comment only | — |

## Labels / milestones
- epic:unified-runtime parity PR: <#/n-a>
- milestones created: <none / list>
```

## Step 7 — authority banners

Add the "GitHub wins on conflict" authority banner to this run's tag-carrying docs (`proposal.md`,
`synthesis.md`, `plan.md`) rather than retroactively rewriting milestone/issue tags. GitHub is the
single source of truth after Stage-H.

---

## Stop-lines (HARD)

1. Merge requires CI green + opposite-family eval PASS on the PR. Owner granted standing beta-11
   merge authorization (2026-07-17 in-turn) once that bar is met.
2. HARD STOP before any release publish (`release:cut`, JSR publish, tag push, canary or stable) —
   owner sign-off in-turn only; a stale or relayed approval does not count.
3. HARD STOP before closing milestone 13 — owner sign-off only.
4. These stop-lines are repeated verbatim in EVERY sub-agent brief. A sub-brief without the
   stop-lines section is invalid.
5. The #824 seed run is drafts-only until owner ratification; its board filing needs the owner
   in-turn.
