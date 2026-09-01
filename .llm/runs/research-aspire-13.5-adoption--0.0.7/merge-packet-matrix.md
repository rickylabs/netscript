# Aspire 13.5 — merge-packet readiness matrix

Reconciled against live `origin/main` **`d2b33a09b`** on 2026-09-01. Every column is measured, not
carried forward. Restack columns come from **completed trial rebases** (see
`phase-b-execution-manifest.md` §2); thread counts from `agentic:review-threads`; box counts from the
live issue/PR bodies.

## The matrix

| Slice | PR | Closes | Restack (`--onto` ← base) | Own | Conflicts | Threads | CI failures | PR DoD ✗ | **Close-gate blocking ✗** | Still gated on |
| ----- | -- | ------ | ------------------------- | --: | --------- | ------: | ----------- | -------: | ------------------------: | -------------- |
| S8 | #1754 | #1720 | `origin/main` (top-up) | 26 | **0** | 0 | close-gate, runtime ×2 | 2 | **6** (A3+A6 statically satisfied) | lease |
| S9 | #1759 | #1721 | `<S8-final>` ← `d1c6d8b54` | 14 | 1 generated | 0 | close-gate, **check-test** | 3 | **6** | S8, **TS2322**, lease |
| S10 | #1760 | #1722 | `<S8-final>` ← `d1c6d8b54` | 13 | 2 (D-101, pre-ruled) | 0 | close-gate, runtime ×2 | 2 | **3** | S8, lease |
| S11 | #1771 | **#1642 + #1723** | `<S10-final>` ← `c9e3fcbe8` | 13 | **0** | 0 | **none** | **0** | **8** (#1642×4, #1723×4 — 1 verified satisfied) | **S10 only** |
| S13 | #1779 | #1724 | `<S10-final>` ← `c9e3fcbe8` | 9 | 1 generated | 0 | **none** | 1 | **5** (2 blocked on S9) | S10, S9 |
| S7 | #1744 | **#1429 + #1719** | `origin/main` (independent) | 17 | 1 (#1840, pre-ruled) | 0 | close-gate, runtime | **0** | **3** (all #1719; #1429 already clean) | lease |
| — | #1747 | #1732 | `origin/main` (independent) | 15 | **0** | 0 | close-gate, runtime | 1 | **0 issue boxes — 1 PR DoD box** | **#1858 only** |

Merge order follows the restack DAG: **S8 → {S9, S10} → {S11, S13}**, with **S7** and **#1747**
independent and mergeable out of band.

## What this changes about sequencing

- **#1747 is the closest to merge in the lane.** All five of #1732's acceptance boxes are checked,
  it restacks onto live main with **zero** conflicts, it has zero unanswered threads, and its single
  remaining DoD box is hosted `scaffold.runtime` evidence whose only failure was
  `runtime.wait.garnet` — i.e. **#1858**, which is itself green and waiting on a merge action. It is
  gated on nothing this lane owns.
- **S11 is the cleanest slice and needs no lease at all.** Zero CI failures across 23 checks, zero
  unchecked DoD boxes of 17, zero restack conflicts, and all four of #1723's acceptance boxes are
  **static** (doc-manifest rows, `doc:lint`, PR-body closing keyword, docs_audit log). It is gated
  purely on S10 landing beneath it. Nothing about S11 belongs in the serialized Phase-B pass.
- **S13 is also lease-free but doubly base-gated** — on S10 for its base and on S9 for boxes 1 and 2
  (D-257: the phase-2 sweep's 44 remaining hits are the skills/dogfood corpus, S9's surface).
- **close-gate failing on five PRs is expected**, not a defect: it fails while acceptance boxes are
  unmirrored, and boxes are mirrored rather than hand-ticked.

## Verified-satisfied boxes (evidence captured, awaiting the mirror)

| Issue | Box | Evidence |
| ----- | --- | -------- |
| #1720 | A6 — `PROCESS_COMMANDS_FLAG` seam + its version comment removed | At S8 head `7c6522951`: `PROCESS_COMMANDS_FLAG` → **0** files in `packages/cli/src`; `maybeWithProcessCommand` → **0** files in `packages/cli`. Sole `Aspire 13.4` hit is `render-ts-apphost.ts:81`, a tsconfig-validation comment — not the seam's; that leftover is S13's (#1724). |
| #1720 | A3 — `.excludeFromMcp()` exactly on the right resource | Exact-count **and** placement assertions in `generate-db-cli-mode_test.ts`, plus `generated-helpers-compile_test.ts` and `generators-tools-db-index_test.ts`. |
| #1719 | `Will close (via its PR) #1429` | #1744 body line 11 carries `Closes #1429`; its DoD line 54 records the acceptance close-gate verification for both #1719 and #1429. |
| #1723 | `Closes #1642` present; #1000 **not** a closing target | #1771 body line 11 carries `Closes #1642`; no closing keyword for #1000 anywhere in the body. |
| #1721 | `git grep '13\.4\.6'` over skills / `.agents/skills` / `.claude/skills` / CLI assets → 0 | **0** hits at S9 head `a8cf585b0`. |
| #1724 | `tools/aspire-surface-manifest.ts` re-run yields no diff | At S13 head `9b684e176`: re-run reports `rows=815 unmatched=0`, the committed 816-line TSV is left byte-identical, and the worktree shows **zero** modifications. |
| #1724 | `check:assets-barrel`, `agentic:sync-claude:check` green | At `9b684e176`: `check:assets-barrel` exit **0** (regenerates then `git diff --exit-code` over all seven carriers); `agentic:sync-claude:check` exit **0** — *"OK: 18 skill(s), 22 mirrored file(s)"*. |

Both A3 and A6 were **re-proven at S8's current head**. The earlier proof was taken at `854e45cb8`,
which the force-push to `7c6522951` made a non-ancestor — **a static proof is bound to a head and a
force-push voids it**, and nothing in the tooling flags that.

## Open non-runtime gaps

| Slice | Gap | Class |
| ----- | --- | ----- |
| S9 | `evaluate.ts:314` TS2322 `Type 'Timeout' is not assignable to type 'number'` — reproduced locally; fix `let timeout: ReturnType<typeof setTimeout> \| undefined;` verified green then reverted | static, reported on #1759 |
| S9 | `receipts/aspire-13.5-mcp-smoke.json` — box requires it committed in the epic run dir; **absent** from S9's tree (the gate *implementation* files exist; the receipt does not) | lease-produced artifact |
| S9 | Static D-45 baseline receipt (14 tools, `toolsMissing: []`, `get_integration_docs` documented-unobserved) | static |
| S9, S10 | Separate-session IMPL-EVAL / docs-audit records before readiness | evaluation dispatch |
| S13 | Coordinator close-gate work on referenced issues' `gate:` boxes | coordinator |
| S10 | #1722's third box — *"#1372 updated with what S10 covers and what remains"* — has substance (3 comments) but its **head reference is stale**: the last update pins `265466059` while S10 is now `21a0bfec6`, and the restack will move it again. Needs one final head-refresh comment **after** the restack, not before | packet step, post-restack |

## Lease-gated receipts — the whole ask, in one place

Four for #1720 (**A1**, **A2**, **A4**, **A5**), plus:

- **#1719 A1/A2** (S7) — live kill receipt + foreign-AppHost-preserved. These were captured once at
  `bd3dbc843`, but the S7 restack **moves that head**, so the manifest's "re-verify only if the head
  moves" condition is now **met**: they are back in the pass, not carried.
- **#1747** — hosted `scaffold.runtime` evidence for its head.
- **S9** — the D-12 live MCP smoke receipt and `agent.aspire-mcp-smoke` on both tiers.
- **S10** — dual-tier runtime receipts, live process evidence, persistent-container zero proof.

Release with the §5 proof shape: `aspire ps` `[]`, `docker ps -aq` 0, the known foreign volume
**unchanged**, default networks only, and the `agentic:leak-check` output pasted. **Never remove a
foreign or unknown-owner resource** (#1855).

## Close-gate — measured, not inferred

`check-close-gate.ts` run live against each PR on 2026-09-01. **Counts include every issue the PR
closes**, which is why two rows are larger than the backing issue alone suggests:

| PR | Closing issues | Blocking boxes | Where |
| -- | -------------- | -------------: | ----- |
| #1744 | #1429, #1719 | 3 | all on **#1719**; #1429 is already clean |
| #1747 | #1732 | **0 issue boxes** | one **PR-body** DoD box: hosted `scaffold.runtime` evidence |
| #1754 | #1720 | 6 | A1–A6 |
| #1759 | #1721 | 6 | — |
| #1760 | #1722 | 3 | — |
| #1771 | **#1642, #1723** | **8** | **#1642 ×4** + #1723 ×4 |
| #1779 | #1724 | 5 | — |

**#1771 closes #1642 as well as #1723**, and #1642 carries four unchecked acceptance boxes of its
own (non-TTY/detached `aspire start` live-state documentation, dashboard-token discovery for headless
automation, reuse of `aspire ps --format Json` as the canonical inventory surface, and proving both
paths from the published documentation surface). An earlier reading of this matrix counted only
#1723's four and understated S11's close-gate by half. They are documentation boxes on a
documentation PR, so they are plausibly satisfied by content already in the branch — but they need
evidence and a mirror pass, and they are **not** covered by S11's own DoD being complete.

**#1747 is confirmed as the lane's nearest leaf**: zero unchecked issue boxes across #1732, and a
single PR-body DoD box — *"Hosted runtime / `scaffold.runtime` evidence is attached for this head"* —
whose only prior failure was `runtime.wait.garnet`, i.e. **#1858**.

**Acceptance-mirror dry-run is structurally clean for all seven** — `ok: true`, `changed: 0`,
`errors: 0` on every PR, so no box reference is malformed and nothing would mis-map when the mirror
runs for real.

**#1719's third box (`Will close (via its PR) #1429`) is satisfied in substance but still unticked**
— #1744's body carries `Closes #1429`. Per the close-gate's own remediation text this is a
mirror-flow step (attach structured evidence → `status:ready-merge` → rerun the existing workflow so
its live reads observe the label **without moving the evaluated head**), not outstanding work.

## Delta-evaluation scope, pre-computed per slice

Blob identity computed over each slice's **own** changed-file set, comparing its current head with
the head its trial restack produced (§2 of the manifest). This is the scope an independent IMPL-EVAL
must cover after the real restack — everything else carries by exact blob identity.

Numbers are against each slice's **current** parent, so they must be recomputed against the final
post-#1865/#1858 parents before a verdict is carried. The **shape** is what is being fixed here: the
delta is small and known in advance, so evaluation can be commissioned rather than discovered.

| Slice | Own files | Identical | Δ | Δ files | Product Δ after removing generated carriers |
| ----- | --------: | --------: | -: | ------- | ------------------------------------------: |
| S7 | 112 | 110 | **2** | `teardown.ts`, `leak-check.ts` | 2 |
| S9 | 119 | 114 | **5** | `e2e/src/domain/cli-surface.ts`, `e2e/suites/scaffold/capability-suites.ts`, `e2e/tests/application/builders/runtime-gates_test.ts`, `e2e/tests/presentation/suite-registry_test.ts`, `embedded.generated.ts` | **4** |
| S10 | 39 | 34 | **5** | `gates/scaffold/wait-for-workers-runtime.ts`, `e2e/src/domain/cli-surface.ts`, `e2e/suites/scaffold/capability-suites.ts`, `e2e/tests/application/builders/runtime-gates_test.ts`, `e2e/tests/presentation/suite-registry_test.ts` | 5 |
| S11 | 24 | 24 | **0** | — | **0** |
| S13 | 65 | 61 | **4** | `deno.json`, `packages/mcp/README.md`, `embedded.generated.ts`, `publish-assets.generated.ts` | **2** |
| #1747 | 19 | 18 | **1** | `generators-background-app_test.ts` | 1 |

**S11's restack changes nothing at all** — 24 of 24 own files come through blob-identical, so its
existing IMPL-EVAL verdict carries **exactly** and no delta evaluation is warranted. Combined with
zero conflicts, zero CI failures, zero threads and zero unchecked DoD boxes, S11's only remaining
work is its eight close-gate boxes and S10 landing beneath it.

**#1747's single Δ is worth noting** because the merge-tree probe reported `CLEAN-MERGE` and the
replay produced no conflict: git auto-merged `generators-background-app_test.ts` against main without
stopping, which still changes the blob. **A clean replay is not the same as an unchanged tree** —
which is exactly why the carry rule is blob identity per file and not "did the rebase conflict".

Generated carriers (`embedded.generated.ts`, `publish-assets.generated.ts`) are excluded from the
product column: they need a regeneration check (`gen:assets-barrel` + `check:assets-barrel`), not a
product verdict.
