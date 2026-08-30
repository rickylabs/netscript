# Drift Log: #1387 typed principal and procedure policy

Drift is append-only. Record facts that diverge from the plan, issue, doctrine, or current-state
documentation.

## 2026-08-30 — Worktree branch was behind current main

- **What:** The existing leaf branch pointed at `13878a80`, behind fetched `origin/main`.
- **Source:** `git fetch origin main feat/sdk-procedure-meta` and branch ancestry inspection.
- **Expected:** Research re-derived on current main.
- **Actual:** The branch had no local/remote commits and was safely fast-forwarded to
  `625447f1b521e7fb0208fcfcc4ad3ea86cf52e21` before research.
- **Severity:** minor
- **Action:** fix
- **Evidence:** clean Git status and baseline recorded in `supervisor.md`.

## 2026-08-30 — Mandatory metadata dependency is not merged

- **What:** #1466 has an implemented, separately evaluated branch but PR #1731 remains open.
- **Source:** GitHub #1466 / PR #1731; comparison of `origin/main` and
  `origin/feat/sdk-procedure-meta`.
- **Expected:** The binding `NetScriptProcedureMeta.access.authentication` vocabulary might already
  be on main.
- **Actual:** Main has no `NetScriptProcedureMeta`; implementation must wait.
- **Severity:** significant
- **Action:** defer
- **Evidence:** `research.md` findings 7-9; Slice 0 hard precondition in `plan.md`.

## 2026-08-30 — Router-rename acceptance conflicts with contract-local metadata

- **What:** The issue asks for a router rename to break a contract policy at compile time.
- **Source:** #1387 acceptance list and #1466's procedure-local metadata shape.
- **Expected:** A negative compile-time test might be possible.
- **Actual:** A policy attached to the procedure moves with it. Making a rename break policy
  requires a second key/path-indexed declaration and recreates the drift defect.
- **Severity:** architectural
- **Action:** propose-update
- **Evidence:** `research.md` negative-test feasibility and LD-11 in `plan.md`; PLAN-EVAL must
  explicitly adjudicate the corrected proof.

## 2026-08-30 — RTK is unavailable on this host

- **What:** The required RTK skill was read, but the `rtk` executable is not on `PATH`.
- **Source:** `rtk ls` returned `command not found`.
- **Expected:** Read-heavy Git/search commands could use RTK compression.
- **Actual:** Focused `rg`/Git commands and repo-native structured Deno wrappers were used directly.
- **Severity:** minor
- **Action:** accept
- **Evidence:** Gate commands and results in `worklog.md`; no command semantics were substituted.

## 2026-08-30 — Candidate documentation and plugin publish gates are red at base

- **What:** Several plausible public-surface gates fail before any branch change.
- **Source:** Base runs of `run-deno-doc-lint.ts` and `audit-jsr-package.ts`.
- **Expected:** Candidate gates would be evaluated before contracting them.
- **Actual:** Contracts/plugin/SDK/MCP doc lint report 9/15/3/2 existing private-type-reference
  findings; plugin JSR audit reports four existing missing `@module` tags. Service doc lint and the
  other four JSR audits are green.
- **Severity:** minor
- **Action:** accept
- **Evidence:** Base gate census in `research.md`; red candidates are excluded from `plan.md`.

## 2026-08-30 — Main advanced after the research baseline froze

- **What:** GitHub created the draft against `main` at `f8b4f804`, one commit beyond the researched
  baseline `625447f1`.
- **Source:** Draft PR base SHA, followed by `git fetch origin main` and focused name-status diff.
- **Expected:** The draft PR and frozen research baseline could initially share the same main SHA.
- **Actual:** The intervening commit documents cross-host skill installation and changes generated
  agent-doc assets, including `packages/mcp/src/publish-assets.generated.ts`; it does not touch the
  metadata, context, auth, OpenAPI, or MCP projection source researched by this plan. #1466 remains
  unmerged.
- **Severity:** minor
- **Action:** defer
- **Evidence:** `git diff --name-status 625447f1..f8b4f804`; Slice 0 already requires a full rebase
  and base-gate rerun after #1466 lands, so this planning commit remains anchored to its truthful
  research SHA rather than chasing an unrelated moving main.

## D-3 — Slice 1 staled the MCP export corpus; the gate was contracted at the wrong slices

**Severity:** minor · **Class:** gate contract · **Shape:** #1769

**Observed.** `deno task check:mcp-export-corpus` is **exit 0** at base `24f6642f` and **exit 1** at
Slice 1's head `c0d61e648ada` — `MCP export-surface corpus is stale; run deno task gen:mcp-export-corpus`.
Found by PLAN-EVAL cycle 2 (F-2′) and reproduced independently by the supervisor in a detached
worktree; both trees give the same results.

**Cause.** The corpus records each public symbol's **signature and JSDoc**
(`generate-export-surface-corpus.ts` `renderSignature` / `renderJsDoc`), not merely the symbol list.
Slice 1's additive widening of `NetScriptProcedureMeta.access` changes the rendered signature of an
exported contracts type — no new symbol, but a changed one.

PLAN-EVAL cycle 1's F-2 modelled the gate as sensitive to **symbol growth**, and so contracted it only
at Slices 2/4/7 — the slices that add symbols. That model was wrong: **every slice touching an
exported declaration or its JSDoc stales the corpus**, which includes Slice 1 (done) and plausibly 3,
5, 6 and 8.

**Why it went unnoticed at Slice 1.** The gate was not contracted for Slice 1, so nobody ran it. The
Slice 1 worklog line "the MCP export corpus … had no tracked movement from the content head" is true
and **non-probative**: the tracked file did not move *because nothing exercised the gate*. The
supervisor's Tier-A made the same mistake, checking `git status` for carrier movement instead of
running the carrier gates — a negative conclusion drawn from a signal that was never generated. It is
the same class as the `argv`/`durationMs` receipt lesson: an artifact that looks clean because nothing
tested it.

**Consequence had it stood.** Slice 2's contracted `mcp-export-corpus` would have been **red on
arrival**, for a cause outside Slice 2's ceiling exemption — exactly the stop-and-rescope trigger F-2
existed to remove.

**Resolution (owner path 1, no cycle 3).** `mcp-export-corpus` is now contracted at **every** slice
(1–9) plus final readiness; the ceiling exemption permits the Slice 1 staleness to be cleared in a
supervisor-signed `chore(mcp)` regeneration commit before Slice 2; and the regeneration is
`gen:mcp-export-corpus` output only, with no hand edits and `deno.lock` unchanged.

**Lesson.** A gate's contract points must follow **what the gate actually reads**, not what the slice
intuitively "adds". Cycle 1 reasoned from the slice's intent (adds symbols → contract where symbols
are added); the corpus reads signatures and docs, so the honest contract point was every slice. Where
a gate is cheap, contract it everywhere rather than modelling its sensitivity.
