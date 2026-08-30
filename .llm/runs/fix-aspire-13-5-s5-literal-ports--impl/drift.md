# Drift Log: Aspire 13.5 S5 literal ports

## 2026-08-30 — Infrastructure-port decision label

- **What:** The owner directive calls infrastructure host-port randomization D-16, while the parent
  plan uses D-16 for archival scope and records the port collision under S2 V3/OF-3a context.
- **Source:** Owner prompt; parent `plan.md`; issue #1717 S2 V3 comment.
- **Expected:** One stable decision identifier.
- **Actual:** The behavior and evidence are unambiguous despite the label mismatch.
- **Severity:** minor
- **Action:** accept
- **Evidence:** S2 `02-capture-db-allocation-*.raw.txt`, `02-verify-live-db-endpoint.raw.txt`, and
  `02-aspire-describe-*.json` on `origin/test/aspire-13-5-s2-runtime-verification`.

## 2026-08-30 — Embedded asset source spelling

- **What:** The exact S5 grep includes generated barrels whose embedded skill/prose bytes and gzip
  base64 can contain or coincidentally spell a forbidden port, although those assets are not
  executable runtime fallbacks.
- **Source:** Slice 6 `gen:assets-barrel` output and the locked exact grep.
- **Expected:** Do not edit S9/S11 skill/docs content; generated assets still satisfy the exact S5
  invariant.
- **Actual:** The generator emits JavaScript Unicode escapes only at forbidden source spellings.
  Runtime bytes and canonical bundle hashes remain unchanged and are covered by a round-trip test.
- **Severity:** minor
- **Action:** accept
- **Evidence:** `receipts/06-final-gates.txt` and
  `.llm/tools/generate-cli-assets-barrel_test.ts`.
