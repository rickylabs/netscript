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
