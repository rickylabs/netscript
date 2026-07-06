# FILING-LOG — Stage H one-shot filing (2026-07-06)

> **AUTHORITY: from this point on, GitHub is the single source of truth** for the
> process-manager epic's scope, slices, labels, milestones, and dependency edges. The run docs
> (`plan.md`, design packs) remain the *design rationale of record* but are frozen — any scope
> change happens on the issues, not here.

## Ratification

Owner ratified in-session 2026-07-06 (verbatim: "OF - 1 YES / OF - 2 yes / OF - 3 YES / OF - 4
YES / OF - 5 Yes ship that later (backlog) / OF - 6 YES / OF - 7 yes / OF - 8 yes / OF - 9 yes").

Recorded interpretation (stated to owner, no objection):

- **OF-1..OF-8 = recommendation (a)** as posted in the Stage-H brief (PR #504 comment).
- **OF-5 override:** clustering slice PM-35 files to **`Backlog / Triage`** ("ship that later
  (backlog)") — *delta vs plan.md §5, which had sketched it at `0.0.1-stable`*.
- **OF-9 = `0.0.1-beta.8`** for milestone 1 (the supervisor's stated lean; "yes").

## What was filed

- Label `epic:process-manager` created (`5319e7`); mirrored in `.github/labels.yml` (this commit).
- **Epic #510** — body from D5 §8 skeleton, owner-forks section rewritten as ratified; sub-issue
  checklist populated with real numbers; linked as a **GitHub sub-issue of #327**.
- **36 children #511–#546** (PM-0..PM-35), each: D5 §9 ISSUE-DRAFT template, full label taxonomy
  (`epic:process-manager` + one `type:` + `area:`* + `priority:` + `wave:` + `status:plan`),
  milestone per the ratified train, `Part of #510` (reference only, no closing keyword), deps as
  live issue links (lower-numbered-deps property → sequential substitution). All 36 linked as
  **GitHub sub-issues of #510**.
- **#345 re-scoped** (title + body) per D3 §D3.7: cross-host HA + secret-store adapters + signing;
  per-host multi-instance explicitly out → #546; dependency edge on #546 recorded.
- **2 comments on #400**: CR-DDX-HOSTAGNOSTIC (comment 4892799802) + `CommandInvokePort`
  first-definer ack (comment 4892800265).
- **PR #504 body** updated with the filed map and stage trail.

## PM → issue map

| PM | Issue | Milestone | | PM | Issue | Milestone |
| --- | --- | --- | --- | --- | --- | --- |
| EPIC | #510 | beta.8 | | PM-17 | #528 | beta.8 |
| PM-0 | #511 | **beta.6** | | PM-18 | #529 | beta.8 |
| PM-1 | #512 | beta.8 | | PM-19 | #530 | beta.8 |
| PM-2 | #513 | beta.8 | | PM-20 | #531 | beta.8 |
| PM-3 | #514 | beta.8 | | PM-21 | #532 | beta.8 |
| PM-4 | #515 | beta.8 | | PM-22 | #533 | beta.8 |
| PM-5 | #516 | beta.8 | | PM-23 | #534 | beta.8 |
| PM-6 | #517 | beta.8 | | PM-24 | #535 | beta.8 |
| PM-7 | #518 | beta.8 | | PM-25 | #536 | beta.8 |
| PM-8 | #519 | beta.8 | | PM-26 | #537 | beta.8 |
| PM-9 | #520 | beta.8 | | PM-27 | #538 | beta.8 |
| PM-10 | #521 | beta.8 | | PM-28 | #539 | beta.8 |
| PM-11 | #522 | beta.8 | | PM-29 | #540 | beta.8 |
| PM-12 | #523 | beta.8 | | PM-30 | #541 | beta.8 |
| PM-13 | #524 | beta.8 | | PM-31 | #542 | beta.8 |
| PM-14 | #525 | beta.8 | | PM-32 | #543 | beta.8 |
| PM-15 | #526 | beta.8 | | PM-33 | #544 | beta.8 |
| PM-16 | #527 | beta.8 | | PM-34 | #545 | **stable** |
| | | | | PM-35 | #546 | **Backlog / Triage** |

## Deltas vs plan.md (all owner-driven or mechanical)

1. **PM-35 milestone:** plan sketched `0.0.1-stable`; owner's OF-5 pick moved it to
   `Backlog / Triage`.
2. **PM-20 type:** filed `type:refactor` (pure extraction + re-export), where the generic mapping
   would have said `type:feat` — more accurate, no scope change.
3. **Sub-issue links:** children were additionally linked via the GitHub sub-issues API (native
   tracked-progress UI) on top of the body checklist — enrichment, not a plan deviation.

## Mechanics (for future seed runs)

Manifest (`===ISSUE` records with `{{EPIC}}`/`{{PM-k}}` placeholders) + WSL bash script:
sequential creates in PM order exploit the DAG's lower-numbered-deps property; each create appends
`s|{{PM-k}}|#num|g` to an accumulating sed file. 37 records, zero failures, one pass.
Scratchpad artifacts: `filing-manifest.md`, `file-issues.sh`, `file-followups.sh`,
`pm-issue-map.tsv`.
