# Drift Log: Aspire 13.5 S1 pin bump and parity gate

## 2026-08-29 — Draft-of-record inputs are not on the implementation baseline

- **What:** The required research plan, research report, manifest, and manifest generator do not exist at `HEAD`/`origin/main` baseline `3b32d162…`.
- **Source:** direct filesystem search and `git ls-tree`.
- **Expected:** The implementation brief names them as repo-relative required inputs.
- **Actual:** They exist on `origin/research/aspire-13.5-0.0.7` at `ee925896…` only.
- **Severity:** minor
- **Action:** accept — read them directly from the remote ref and import only the manifest blob required by D-13, byte-for-byte; do not regenerate or rewrite archival rows.
- **Evidence:** `git ls-remote --heads origin research/aspire-13.5-0.0.7`; `git ls-tree -r origin/research/aspire-13.5-0.0.7`.

## 2026-08-29 — Manifest generator path differs from the brief

- **What:** The generator is nested inside the research run.
- **Source:** `git ls-tree -r origin/research/aspire-13.5-0.0.7 | rg aspire-surface-manifest`.
- **Expected:** `tools/aspire-surface-manifest.ts`.
- **Actual:** `.llm/runs/research-aspire-13.5-adoption--0.0.7/tools/aspire-surface-manifest.ts`.
- **Severity:** minor
- **Action:** accept — use its class semantics as authority without adding or editing the generator in this slice.
- **Evidence:** remote ref `ee925896ed6bdd06c0333d2a4cc71795a044ba55`.

## 2026-08-29 — Draft manifest row count exceeds the plan narrative

- **What:** The immutable manifest blob contains 813 data rows.
- **Source:** exact blob `3341910f8ba1cab82c008b6ded8e3fe03a6d475d`; phase-1 report counts 812 checked plus one skipped lockfile.
- **Expected:** The research plan narrative says 809 rows at its plan head.
- **Actual:** The issue's draft-of-record branch now carries 813 rows, consistent with four later additions on that branch.
- **Severity:** minor
- **Action:** accept — consume the exact current draft-of-record manifest and do not edit or regenerate it in S1.
- **Evidence:** `wc -l` = 814 including the header; RED receipt `receipts/parity-phase1-red.json`.

## 2026-08-29 — CI runtime is blocked after Aspire restore by unchanged Fresh hydration typing

- **What:** Both CI runtime tiers install and preflight Aspire CLI 13.5.3 and pass
  `runtime.aspire-restore`, but stop at the generated quality gate with TS2345 in the copied Fresh
  hydration source.
- **Source:** Actions run `33276629736`, jobs `99164403085` and `99164403126`.
- **Expected:** Both runtime tiers reach their complete behavior verdict.
- **Actual:** `packages/fresh/src/application/query/hydration.ts:43` passes a readonly
  `DehydratedState` to a mutable TanStack `hydrate()` parameter. Its blob
  `87c8df1bbbe41ada6499fdc76a4db697c599aac5` is identical at the S1 baseline and final pre-repair
  head.
- **Severity:** significant
- **Action:** escalate — do not expand #1713 into the forbidden Fresh package surface; rerun runtime
  after the owning Fresh fix lands.
- **Evidence:** https://github.com/rickylabs/netscript/actions/runs/33276629736

## 2026-08-29 — Tier-A review found two fail-closed parity gaps

- **What:** Missing required rows and unauthorized 13.5.x patch changes could false-green phase 1.
- **Source:** coordinator Tier-A hold on PR #1727.
- **Expected:** A required manifest path is present and every S1 pin matches its locked exact value.
- **Actual:** Missing paths were counted but did not affect `ok`; stale detection covered only
  13.0–13.4.
- **Severity:** significant
- **Action:** repair — missing non-archival paths now produce `fail`; a per-path exact-version policy
  covers all seven pin-bearing phase-1 files, including accepted 13.5.0, Browsers preview, and cache
  suffix variants. All 66 currently missing paths are archival and remain non-failing.
- **Evidence:** 6/6 repaired parity tests; `receipts/parity-phase1-green.json`.
