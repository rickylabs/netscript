# Commits — deploy-s6-deno-deploy

- bf0beeef: docs(deploy): [Deploy-S6] research + plan for Deno Deploy tier-1 adapter (#342) — rev 1 (FAIL_PLAN B1)
- 0c760b3c: docs(deploy): [Deploy-S6] revise research+plan to Archetype-7 7-op contract (#342) — rev 2 (post-FAIL_PLAN correction)
- dc115f3a: feat(deploy): [Deploy-S6] add deno-deploy config member (S1) — config type+schema+exports+tests; check/test/lint/fmt/publish-dry-run green
- 8bea12ac: feat(deploy): [Deploy-S6] add unstable-API preflight guard (S2) — pure domain scanner + 6 tests; check/test/fmt/lint green
- 06f595ff: feat(deploy): add Deno Deploy target adapter (7-op subset) (S3) — DenoDeployTarget (domain) + DenoDeployCliAdapter/DenoDeployPreflightReader (kernel/adapters, ProcessPort-behind-port) + registry wiring; 14 tests; check/test/fmt/lint green; pushed 34013a72..06f595ff
- 2c93ce8d: feat(deploy): wire Deno Deploy target into CLI router + config resolver (S4) — resolveDenoDeployTarget + createDenoDeployTarget composition factory + `netscript deploy deno-deploy` thin router (plan/up/down/status/logs) + README permissions block + arch-debt advance; +4 resolver tests (18 total); check(72 files)/test/fmt green
