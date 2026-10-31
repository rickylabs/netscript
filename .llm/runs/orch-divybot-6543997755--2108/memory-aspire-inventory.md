# 2026-10-31 — New Aspire fixtures require inventory regeneration

After adding an Aspire-related fixture/test, run the canonical aspire-surface-manifest.ts generator and check:aspire-version-parity. New fixtures can make the inventory stale even with no version change and with quality:gate green. The KV-only fixture adds six rows. Always perform this before the final exact-head review; a later inventory commit invalidates the previous SHA attestation.
