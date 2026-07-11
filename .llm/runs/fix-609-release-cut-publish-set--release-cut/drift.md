# Drift

## 2026-07-11 — re-baseline

- Brief expectation: the cut's publish set skips `packages/ai` and likely `packages/plugin-ai-core`.
- Current fact: PR #508 already made `packages/ai` a workspace release member, and `publishWorkspace()` discovers both packages today.
- Adjustment: retain the requested outcome by adding a tested, explicit intended-vs-effective audit and enumerated dry-run evidence. Do not manufacture a redundant hard-coded include list.
- Scope remains tooling-only; `docs/site/**` remains deferred and report-only.

## 2026-07-11 — GitHub taxonomy re-baseline

- Requested `status:in-progress` does not exist in the repository taxonomy; harness lifecycle requires exactly one phase label. Use `status:plan-eval` at the Plan-Gate, then advance through `status:impl`, `status:impl-eval`, and `status:ready-merge`.
- Requested milestone `0.0.1-beta.1` no longer exists on GitHub. The live imminent-cut milestone is `0.0.1-beta.6`; assign that rather than creating a historical milestone.

## 2026-07-11 — publish-set audit finding

- Independent intended-set discovery identified `packages/bench` (`@netscript/bench`) as `publish:false`.
- This is an intentional internal benchmark workspace, not a supported JSR consumer surface; it is now recorded in the code exclusion table with that reason.
