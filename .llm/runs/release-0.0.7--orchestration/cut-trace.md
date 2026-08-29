# Cut trace — release 0.0.7

Canary publication is active. This trace records canary membership from actual first-parent history,
the exact canary-pinned production E2E, and will later record stable publication and exact
artifact-pinned production E2E.

## Pre-publication recovery trace — 2026-08-23T06:59:37Z

- Frozen milestone leaf #1666 merged at exact head `92988da30` via main merge
  `2dd1a75ef55637816b80e04462cc26fa89631b12` on 2026-08-15T22:30:50Z; #1296 closed.
- External main drift after the prior checkpoint, captured for rebase/compatibility review but not
  silently added to the frozen inventory:
  - `8ab438d471` — #1678
  - `aac320d74a` — #1683
  - `43f4c1ff31` — #1685
  - `9634735bc0` — #1686
- This is not a publication membership record. Canary membership remains unset until the documented
  release publication phase begins.

## Foundations canary qualification — 2026-08-29

- Declared content boundary: `checkpoint-foundations` at exact first-parent `main`
  `cf648f1ff973d74c213bb125a6f5f5b9328e693b`, before any re-intake leaf merge.
- Main is clean and `origin/main` resolves to the same SHA.
- Fresh local evidence on that SHA:
  - structured `check`: PASS, 2,925 files, 25 batches, 0 failed batches/findings;
  - structured `test`: PASS, 4,222 passed / 0 failed / 19 ignored;
  - `release:preflight`: PASS for text imports, import attributes, file URLs, and self imports;
  - `publish:readiness`: PASS for 35 effective members, reference coverage, version pins,
    specifiers, first-publish/provisioning, and import-attribute preflight;
  - quality/architecture: PASS (`quality:gate`, 25.5 s); doctrine warnings remain advisory with zero
    failures.
- `release-canary.yml` run
  [33248726023](https://github.com/rickylabs/netscript/actions/runs/33248726023) completed `success`
  at 2026-08-29T11:08:29Z. It checked the JSR attempt budget, minted `v0.0.7-canary.1`, created
  release commit `e2c51c6bfd658ae54296c61fe128265700778148` with sole parent `cf648f1ff...`, passed
  readiness/dry-run/preflight, and published the complete 35-package graph through the production
  OIDC path.
- Exact-version production E2E run
  [33248961170](https://github.com/rickylabs/netscript/actions/runs/33248961170) completed `success`
  against release commit `e2c51c6b...`: Aspire preflight, registry propagation, full scaffold
  runtime, and the seven-verdict quickstart walk all passed; artifacts uploaded successfully.
- Commit status `release/canary-pair` is `success` on content SHA `cf648f1ff...` with description
  `Canary 0.0.7-canary.1 publish + pinned production E2E passed`. The ephemeral branch was removed.
- The publication hold was therefore released. PR #1710 merged only afterward at main merge
  `3b32d1628584749af4dd6e97fd331c24e84f0b9e`, preserving the canary's immutable membership.
