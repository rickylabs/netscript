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

## 2026-08-30 — Generated asset exclusion from the S5 runtime-literal grep

- **What:** Generated `*.generated.ts` barrels embed S9/S11-owned prose and compressed bytes that
  may contain a historical port spelling but are not executable runtime fallbacks.
- **Source:** Tier-A review of slice 6 and the checker's existing `isGeneratedSource` exclusion.
- **Expected:** The S5 grep tests runtime source with the same generated-source boundary as
  `check:aspire-host-ports`; asset serialization remains content-agnostic.
- **Actual:** The test and receipt command exclude `*.generated.ts`, while regeneration preserves
  the source assets verbatim and the check gate continues to validate barrel freshness.
- **Severity:** minor
- **Action:** accept
- **Evidence:** `receipts/07-tier-a-fixes.txt` and
  `.llm/tools/validation/check-aspire-host-ports_test.ts`.
