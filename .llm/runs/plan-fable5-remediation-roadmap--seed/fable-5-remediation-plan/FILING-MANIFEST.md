# Stage-H filing manifest

Owner ratification: 2026-08-08, in-turn instruction to open all planned issues and execute the
milestone train. PLAN-EVAL and IMPL-EVAL remain explicitly owner-waived for this planning-only run.
GitHub is authoritative after this manifest executes.

## Preconditions captured immediately before filing

- Source PR: #1347 at `1d6c6a70fd6250fee07f8942a2f4873bf68c2b0f`.
- Open issues audited: 259 (pull requests excluded).
- Open milestones audited: 13.
- Proposed issue drafts: 41; exact-title collisions with the live open board: 0.
- Every requested label exists live.
- Existing `0.0.6` milestone number: 25; open-issue snapshot count: 23.

## Milestone rename operations — execute in this order

Title-only collision-free slide, highest to lowest:

1. milestone 21: `0.0.13` → `0.0.15`
2. milestone 20: `0.0.12` → `0.0.14`
3. milestone 19: `0.0.11` → `0.0.13`
4. milestone 18: `0.0.10` → `0.0.12`
5. milestone 17: `0.0.9` → `0.0.11`
6. milestone 16: `0.0.8` → `0.0.10`
7. milestone 24: `0.0.7` → `0.0.9`
8. milestone 25: `0.0.6` → `0.0.8`

Then create:

- `0.0.6` — Verification, docs truth & RFC ratification.
- `0.0.7` — Typed seams + generation.

Milestone 25 becomes the new `0.0.8` — Runtime truth + service slice.

## Existing 0.0.6 preservation snapshot

Move all 23 issues from renamed milestone 25 back to the newly created `0.0.6` before filing new
issues:

`#1085`, `#1093`, `#1112`, `#1139`, `#1140`, `#1163`, `#1175`, `#1201`, `#1210`, `#1243`,
`#1215` (open PR), `#1246`, `#1260`, `#1262`, `#1263`, `#1278`, `#1279`, `#1280`, `#1293`,
`#1296`, `#1306`, `#1320`, `#1343`. The execution script must re-read milestone 25 and move its
entire membership, not trust this prose list. After preservation, move `#1279` from the new `0.0.6`
to `0.0.15` per the plan.

## Other existing-issue moves

- `#979`, `#980` → `0.0.8`.
- `#1000` → `Backlog / Triage`.
- `#175`, `#767`, `#768`, `#863`, `#864` → `Backlog / Triage` from shipped `0.0.2`.
- No existing issue is closed during filing.

## New issue source

File every Markdown draft under `milestones/*/*.md`, using the directory milestone as the locked
milestone decision. Strip the draft marker and metadata preamble from the live issue body. Apply
the declared labels. Count contract:

- `0.0.6`: 10 new issues.
- `0.0.7`: 12 new issues.
- `0.0.8`: 19 new issues.
- Total: 41.

After all issues exist, replace every internal Draft-ID dependency reference with its live issue
number and record the complete mapping in `FILING-LOG.md`.

## Reconciliation

Apply the additive existing-issue amendment blocks from `EXISTING-ISSUE-AMENDMENTS.md` as comments
where the target remains open. Do not close duplicate umbrellas during this filing; preserve the
seed-run rule that supersession closes only through a later owner action or resolving PR.
