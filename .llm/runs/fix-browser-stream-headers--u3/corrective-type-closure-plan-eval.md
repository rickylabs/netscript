# Corrective PLAN Review Verdict — U3 four-owner native type-closure candidate

## Verdict: **PASS** — as **DEBT_ACCEPTED** (conditional on the repaired wording below); never an unqualified F-15 PASS

## Coverage
- Packets read **in full, no truncation**: `corrective-plan.md` (61/61), `proposed-debt-entry.md` (45/45), `source-evidence-packet.md` (828/828).
- Own MCP lookup: `find_export HeadersRecord` → **0 first-party matches** — no existing `@netscript/*` surface exports it, so there is no in-repo `@netscript/*`-core routing alternative today; the only closure paths are this candidate or a materially different (out-of-scope, root) solution.
- Direct source spot-checks: current `packages/fresh/src/runtime/streams/mod.ts` (98 lines, export block verified) and `plugins/workers/streams/mod.ts` (37 lines) match the packet's candidate bases byte-for-byte outside the diff; `create-stream-db.ts` verified against the prior sealed state. The **exact candidate delta is the four-site +8/−2 patch** — nothing else rides along.

## Scope/type decision
The candidate — type-import + type-export of native `HeadersRecord` and `MaybePromise` at the two factory sources, plus the same two names in the two existing aggregate export lists — is the **only measured, identity-preserving closure** of the doc-lint delta. Measured evidence (own-CWD copied graphs, warning-free, cross-CWD zeros explicitly rejected): Fresh 10/12/10, workers 0/1/0; nonempty native declarations at pinned client 0.2.7; 13 positive identity/anti-any assertions (code 0) and 3 negatives × 3 intended TS2322. The failed source-only predecessor (12 stayed 12, archived/reverted) is honestly recorded; its verdict stays immutable and is **not** transferred — this is a new, wider, still-bounded exception covering four sites/two types, accepted as such.

## Doctrine dispositions (explicit, as required)
1. **chapter02/AP-14/F-15:** the import-then-`export type {}` spelling evades the literal F-15 scanner patterns — scanner blindness is not compliance. This candidate puts two upstream names on two public aggregate facades: a genuine, acknowledged violation, acceptable only as a named, time-bounded **DEBT_ACCEPTED** exception.
2. **chapter11/F-5 facade growth:** Fresh 52→54, workers 24→26 (workers already above the nominal ≤20). I disposition the measured two-name growth as acceptable **only within this exception**, because it is exactly what the measured closure requires and the alternative leaves the accepted U3 feature gate RED. Baseline surplus on both facades is **not waived** and must remain visible as a separate open condition; the mandatory closing gate makes eventual removal non-optional.

## Repaired debt-entry wording (second-cycle repair, in lieu of file edits)
Replace the entry's **Gate** first sentence with:

> "**Gate:** Closure is `DEBT_ACCEPTED` for two distinct acknowledged violations — upstream native type re-export (chapter02/AP-14/F-15) and measured two-name aggregate facade growth (chapter11/F-5; Fresh 52→54, workers 24→26, prior surplus unwaaived) — never an unqualified F-15 PASS. Warning-free actual owning Fresh 12-to-10 with exactly the same ten baseline findings (identities as listed), workers 1-to-0; nonempty native declarations at all four sites; positive mutual identities/anti-any plus three meaningful negative controls; unchanged runtime controls; scoped type/lint/fmt, doctrine, quality, package/publish dry-run and independent IMPL evidence. `MaybePromise` is exported solely because the measured closure requires its public shape; the closing gate removes both names together. Reference parity for the two added names per package is a **pending root-scoped gate**: it is satisfied only by a root-authorized reference-page edit backed by a retained failing-parity receipt, or by an explicit root waiver recorded in this entry — the currently failing Windows coverage prerequisite and any unrun parity state never satisfy it implicitly."

## Approved footprint/bounds
- Four exact sites, two exact native names, type-only, no runtime value/alias/dependency/config/lock/auth change. +8/−2 lines.
- Source/docs owners: 11 current + `plugins/workers/streams/mod.ts` = 12; canonical debt registry +1 → **13 excluding run/evidence provenance**; two distinct new tracked owners vs the current 383 changed paths. Prospective, root-disposed.
- Expiry **2026-11-10 fixed**, no extension, no growth; owner milestone coordinator + rickylabs; closing gate = removal via compatible public-doc solution retaining exact identity, OR a separately reviewed doctrine amendment; at expiry a fresh explicit owner disposition is required.

## Pending/unresolved gates and explicit non-acceptances
- Actual owning-package application, reference parity, full architecture/publish dry-runs, quality gate, and independent IMPL remain **unrun/open**; this review qualifies nothing runtime.
- The ten Fresh baseline findings remain **RED/unwaived**; the oRPC no-lint-only-reexport debt is unchanged and not overridden; no baseline reset, no checker override, no erasure/cast/suppression.
- No shipping, authentication/issuer, or release acceptance. S16 remains separate work.
- Material scope decisions returned to root: any reference-page edit (needs precise root scope; Windows coverage prerequisite currently fails), and any future `@netscript/*`-core structural alternative (none exists today per my lookup; would be a materially different solution, not inferred here).