# Worklog — docs/435-tutorial-workspace (issue #435, workstream C2)

Branch: `docs/435-tutorial-workspace` from `9be23cce2cf65179df6aea39371f25cbddb55bcb`.
Lane: documentation-authoring exception (CLAUDE.md), under beta-7 shipping orchestrator.
Scope: `docs/site/tutorials/workspace/` only.

## Plan

Design sources read: `design/CD-docs/proposal.md` §3.0–3.4 (C2 row), `epic-and-issues.md` §3,
`research/C-tutorials/medusa-inspired-writing-style-contract.md`,
`analysis/C-tutorials/01-current-tutorial-inventory-and-gaps.md`,
`analysis/C-tutorials/02-eis-chat-build-arc.md`, `specs/02-eis-chat-reference.md`.

Finding carried forward (inventory §"Shared structural pattern"): the track's pedagogy
(learningPath, exercise-first steps, literal checkpoints, verify-then-advance, arch-debt caveats)
is already sound — the C2 rewrite **keeps the mechanic and replaces the premise** (§3.0). The
current premise is a stakes-free generic "my-workspace". The rewrite grounds the narrative in
eis-chat's real domain (Project > Channel hierarchy; ops team accumulating live incident context
during a VIF→CSB ERP cutover; org-catalog + per-channel dual-database pattern) — per proposal §3.2
Track-2 row and the Q7 dual-DB reservation for this track.

Locked design decisions:

1. **Slugs preserved**: `01-scaffold … 06-deploy` untouched (nav anchor
   `/tutorials/workspace/02-auth/` confirmed live in `_data.ts:176`). No `_data.ts` edit needed.
2. **Auth chapters (`02-auth`, `05-route-authz`) stay grounded in the framework's own
   `builder-auth_test.ts` 401/403/200 pattern + package docs — NOT eis-chat** (eis-chat has zero
   auth usage; issue acceptance). All existing API claims/commands in those chapters are kept
   verbatim (they already trace to the package surface); only narrative framing changes.
3. **`arch-debt:seamless-auth-roadmap` factual callouts kept** in 03 and 05 (issue acceptance),
   plus the existing `arch-debt:auth-single-active-backend-boundary` caveat in 02.
4. **Folder name `my-workspace/` kept** — renaming would churn every code block for zero premise
   value; the stakes come from the story, not the directory name.
5. **eis-chat named as the grounding app** in premise prose only (index, 03 dual-DB evidence,
   04 workers evidence) — factual claims limited to what the seam-dogfooding research verified
   (org-catalog Prisma + per-channel datasource split; workers-plugin embedding/vision jobs).
   No eis-chat claim in the auth chapters. eis-chat is already publicly named on the docs site
   (`durable-workflows/streams.md`).
6. **`tutorials/index.md` untouched** — the hub featureGrid is C6's declared merge hotspot (it
   adds a 6th lane); the existing workspace-lane copy stays accurate for the rewritten premise.
7. Voice: style contract enforced — no honesty framing, no hype, exercise-first, every step keeps
   its literal observable checkpoint (all existing checkpoints preserved).

Files edited: `docs/site/tutorials/workspace/{index,01-scaffold,02-auth,03-workspace-data,
04-provision-job,05-route-authz,06-deploy}.md` — premise/narrative prose (intros, "What you will
build" framing, chapter-linking transitions, "What you built" closers, one new grounding note in
03 and 04). All commands, code blocks, apiTables, ports, checklists, and caveat comments preserved.

## Evidence

Edits landed (7 files, prose-only; every command, code block, apiTable, checklist, port, slug, and
caveat comment preserved):

- `index.md` — new stakes-bearing premise (eis-chat-grounded ops-team framing: off-boarded
  contractor vs locked-out responder); new "Where this track's patterns come from" note stating the
  eis-chat grounding AND the auth-chapter exception (framework `builder-auth` suite, not eis-chat);
  closer re-grounded.
- `01-scaffold.md` — intro frames the team layer being built; closer sets up chapter 2's stakes.
- `02-auth.md` — intro carries the "who is this?" stakes before data lands; adds the
  config-not-rewrite build-efficiency line; closer hands off to chapter 3. No technical change;
  grounding remains package docs (`AuthBackendPort`, `authContractV1`, backend matrix all kept).
- `03-workspace-data.md` — blast-radius rationale in intro; NEW note "This split is how a real
  NetScript app stores its data" grounding the dual-DB pattern in eis-chat's org-catalog/per-channel
  split (Q7 reservation); `arch-debt:seamless-auth-roadmap` callout kept verbatim; closer re-framed.
- `04-provision-job.md` — intro replaces abstract rationale with the mid-incident provisioning
  scenario; names eis-chat's embedding/vision jobs as the same `workers` seam; closer sets up
  fail-closed stakes for chapter 5.
- `05-route-authz.md` — intro states what the route now fronts (member list + write path) and the
  fail-closed bar with the 401/403/200 triple named up front as the framework's own `builder-auth`
  test assertions; `arch-debt:seamless-auth-roadmap` callout kept verbatim; closer names the three
  outcomes as the test's assertions.
- `06-deploy.md` — intro/closer carry the full narrative arc (contractor 401 / paged engineer
  provisioned off-path).

C-common bar check:
- Exercise-first: unchanged — every step still closes on its original literal checkpoint (curl
  output, dashboard state, file listing, checklist commands). No comprehension checkpoints added.
- Stakes: premise now grounded in the track's real domain (ops-team workspace, eis-chat-shaped).
- Slugs: `01-scaffold…06-deploy` all preserved; `_data.ts` untouched (hub anchor
  `/tutorials/workspace/02-auth/` verified live at `_data.ts:176`).
- Track-specific: auth chapters grounded in framework `builder-auth` 401/403/200 + package docs,
  never eis-chat; `arch-debt:seamless-auth-roadmap` callouts kept (03 + 05), plus
  `arch-debt:auth-single-active-backend-boundary` (02).
- Positioning law: no honesty framing (grep for honest/candid/blazing/seamless/revolutionary clean,
  excluding the debt slug); no version claims added; no new API symbols introduced (prose-only
  edits over the already-verified surface); no competitor comparisons.

Validation (`docs/site`, `deno task verify` = build → check:links → check:caveats):

- build: `500 files generated in 8.32 seconds` — green
- check:links: `23016 internal links across 162 pages — all resolve` — green
- check:caveats: `27 caveat markers across 22 pages — all references resolve` — green
