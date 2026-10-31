# Aspire manifest tracks staged/committed files

aspire-surface-manifest.ts uses git grep over tracked paths. A new CLI test that contains --no-aspire is invisible while untracked but enters the manifest in CI after commit. Stage new files before the final manifest regeneration/parity check, then use the canonical generator. A local PASS before staging is insufficient evidence of manifest freshness after commit. No version upgrade or scan-policy change is needed for a new inventory row.
