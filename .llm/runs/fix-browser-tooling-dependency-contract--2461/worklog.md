# Design checkpoint

1. Public surface: existing deps:* commands gain explicit standalone project selection and truthful coverage; browser CI contract and Dependabot ownership remain machine-checked.
2. Vocabulary: standalone project, direct declaration, locked inventory, selected project, unsupported production install. No framework APIs.
3. Ports: native npm process for lock-only inventory/outdated/provenance/audit; existing stable registry resolver for latest; filesystem manifest/lock reads. No new runtime/package dependencies.
4. Constants: one project path/manifest/lock/manager registry; command builders own npm flags; use it in wrapper coverage metadata and tests.
5. Commit slices: bootstrap/run+draft; one complete implementation slice plus independent review covering routing/config/contract/regressions; final evidence in same commit. Gates are focused structured wrappers plus native tool proof and full quality scan.
6. Deferred: browser severity/baselines #2460, S3 fingerprints #2462, component work and all releases; no npm/version/lock upgrades or install.
7. Contributor path: .llm/tools/deps/standalone-projects.ts explains registration, supported commands and report contracts.

No source edits before selected PLAN-EVAL PASS. Pending independent plan review.
