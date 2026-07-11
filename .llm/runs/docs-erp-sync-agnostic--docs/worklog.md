# Worklog — docs/erp-sync-agnostic

Overlay: `SCOPE-docs.md` (docs-authoring lane, documentation exception). Branch
`docs/erp-sync-agnostic` off `2205f926918879a940d93b6c52aae1a080dcf4db`.

## Task

Owner directive: rework `docs/site/tutorials/erp-sync/**` (all 6 pages) to be 100% ERP-agnostic —
zero mention of "VIF" or "CSB". Replace with well-known ERPs as recognizable stand-ins: **SAP** =
legacy source, **Microsoft Dynamics** = target ("a legacy SAP export feeding a Microsoft Dynamics
migration"). Factual only, no claims about those products' internals. Keep the validated shape:
exercise-first, observable checkpoints, runnable sandboxed ch3, slugs unchanged, positioning law
(no honesty framing). Touch ONLY `erp-sync/**` (+ this worklog).

## Plan / naming map

- **VIF** → **SAP** (legacy system of record / export source).
- **CSB** → **Microsoft Dynamics** (target / replacement; short form "Dynamics" after first use).
- Task/file renames: `normalize-vif` → `normalize-sap` (task id + `scripts/normalize-sap.ts` +
  `tasks/normalize-sap.ts`); `dedupe-vif`/`dedupe_vif.py` → `dedupe-sap`/`dedupe_sap.py`.
- Sample legacy column shape (de-Frenchified, language-neutral): `art_no,designation,price_centimes`
  → `material_no,description,price_cents`. Target shape `sku,name,price` was already agnostic — kept.
  Sample rows (`WID-1,Widget,999` / `GAD-2,Gadget,1999`) kept, so the off-by-100 → `9.99`/`19.99`
  teaching device and all checkpoint numbers stay identical.
- Narrative reframe: the original leaned on "VIF cannot call an API". Asserting "SAP cannot call an
  API" would be a false claim about SAP internals, so reframed to "the integration you're given is a
  nightly **file export**, not an API" — describes the setup, not the product's capabilities.
- Slugs, filenames of the pages, learning-path hrefs, `products_*.csv` pattern: unchanged.

## Evidence — ch3 rename re-run (checkpoint truth)

Ran the renamed transform with the exact compiled sandbox flags
(`--allow-read=.data --allow-write=.data/staging --allow-env=STAGING_DIR`) against the renamed
`material_no,description,price_cents` sample. Output, verbatim:

```
normalize-sap: 2 rows in, 2 written
{"input":".data/incoming/products/products_2024.csv","output":".data/staging/products_2024.normalized.csv","read":2,"written":2,"skipped":0}
=== normalized file ===
sku,name,price
WID-1,Widget,9.99
GAD-2,Gadget,19.99
```

Exit 0. The ch3 documented outputs (stderr diagnostic, JSON result line, normalized CSV) and the ch2
checkpoint headers (`["material_no","description","price_cents"]`) remain true after the rename.

## Validation

- `deno task verify` (docs/site): **GREEN (exit 0)** — build 516 files; `check:links` 24055 internal
  links across 167 pages all resolve; `check:caveats` 28 caveat markers across 22 pages all resolve
  (the ch3 `arch-debt:workers-non-deno-task-sandbox-boundary` marker intact).
- `grep -rn "VIF\|CSB" docs/site`: **ZERO hits** (exit 1). Also zero leftover VIF-flavored tokens
  (`centime`, `art_no`, `designation`, `normalize-vif`, `dedupe-vif`) in `erp-sync/`.
- Tutorials hub / other pages: whole-tree `docs/site` grep for VIF/CSB is zero, so the hub cards
  carry no VIF/CSB text — nothing to report to the orchestrator.
- Scope: touched only `docs/site/tutorials/erp-sync/**` (6 pages) + this worklog.

## Verdict

DONE. All 6 erp-sync pages reframed to SAP (legacy source) → Microsoft Dynamics (target), ERP-agnostic,
runnable ch3 re-verified, slugs unchanged, positioning law respected, no false product-internal claims.
