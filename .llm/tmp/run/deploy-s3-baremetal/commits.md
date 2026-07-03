# Commits — deploy-s3-baremetal

- 94c332e3: docs(deploy): plan bare-metal deploy targets slice (#339 + #340) — initial planning artifacts (PLAN-EVAL v1 → FAIL_PLAN B1)
- 66e8a640: docs(deploy): revise bare-metal plan per PLAN-EVAL v1 (front-load port contract)
- 12d70ff0: feat(deploy): expand DeployTargetPort to the canonical 7-op contract (S0) — REBASE POINT for #342/#343; additive (legacy build/install/uninstall retained), pushed first. Gate: check 0 errors, fmt clean, tests 8/8 (incl untouched command-registry_test).
