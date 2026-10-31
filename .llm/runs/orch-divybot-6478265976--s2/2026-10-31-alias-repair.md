# Cockpit review repair — longest import-alias prefix

Baseline29e66fadc286e5bbc6e6067cf7d657c48b1973d9. Cockpit independent native Opus5.5 review CHANGES finds one blocker: config schema lists components before ui; @/components/ catches @/components/ui/x and ignores an independent aliases.ui destination. One repair round is explicitly authorized, with requested remove/update diagnostics. Previous READY is superseded.

## Contract and repair

- Flatten the existing literal import prefixes once per copy plan and sort by descending prefix length. Match the first prefix. Extension/index resolution, source scoping, destination safety and collision checks remain in their existing implementation. No new API/port/constant/helper or dependency.
- Installer integration fixture has a component that statically imports, re-exports and dynamically imports @/components/ui/x; dependency x is actually copied to @ui/x.ts. Custom configuration separates components=client/components and ui=client/widgets. Every rewritten reference must resolve to the copied file. Short @ui imports and ordinary/similarly named @/components/uikit prefixes remain covered. The default-config control uses actual defaults.
- Explicit named ui:update validates every requested name against its lock before registry resolution or writes. Missing/empty/populated locks refuse absent names with an install-first diagnostic. Unnamed legacy discovery remains; public legacy API is unchanged. Normal installed updates retain existing regression coverage.
- Removing a missing locked item reports not installed, before writes. The command renders a zero-copy legacy/metadata-only result as Nothing to remove, avoiding a misleading Removed0 message. Positive removal, drift/dependency guards and page removal are covered by the existing suite.

## Red and green evidence

Alias fixture before production fix:4 passed/1 failed/0 ignored, failure only custom ui case, with wrong /app/client/components/ui/x versus actual /app/client/widgets/x.ts. Default-alias negative control already passes. Diagnostic before-controls:0 passed/3 failed/0 ignored (missing named updates in empty/populated locks, absent item remove). Focused repaired initial proof8/0/0; complete final UI application/domain/presentation suite **114/0/0**, including native CLI integration, no process failure.

All six changed TypeScript files pass structured check/lint/fmt: zero findings, zero dropped files/refusals. Canonical release preflight PASS/zero findings. Review threads0 unanswered. Evidence is retained privately; public summary has no native identifiers or machine paths. Archetype6 CLI and existing layering; no new architecture debt. PLAN-EVAL N/A for this concrete authorized bounded repair.

Next: clean-source durable root quality, four carrier checks and workspace publication; retained separate native Opus5.5 High read-only IMPL-EVAL. Commit final evidence BEFORE non-draft full CI. Final READY now requires all actual8 CI shards, check-test, quality, whole CI workflow, scaffold-static and BOTH actual scaffold-runtime jobs/full suite steps at the exact final head. Existing owner-applied e2e-cli-gate label stays unchanged. No label/policy override, force push, new PR, self-merge or release. No further push after green; final GitHub proof is external and canonical issue report uses the atomic ignored file handoff.
