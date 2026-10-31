# Drift

- Owner overrides generic matrix evaluator cells with native claude-opus-5-5 high for both
  evaluation phases. Exact grant is recorded in worklog.md. Independence remains mandatory.
- RTK unavailable: direct shell commands used; structured repo wrappers provide gate verdicts.
- Specific owner instructions override generic assignment boilerplate: Refs-only PR,
  coordinator-owned labels/milestones, CI-only full runtime, stop at READY.
- Local source install fixture under ignored `.llm/tmp/issue-2162/` is run-owned scratch,
  not a shipping source change. It retains Aspire scaffold files but no AppHost is started.
- Root lint/fmt excludes CLI; used explicit config retaining root style/rules and verified
  structured coverage for every selected file. No weakening or suppression introduced.

- S3 CI found one stale E2E fixture title expectation outside the original source-file list.
  Expanding validation-fixture scope only; no test assertion removed or relaxed. Coordinator
  has applied e2e-cli-gate. This invalidates the old exact-head attestation when S3 is pushed.

- S4: full CI exposed a second historical expectation, in plugin-check-command_test.ts, that
  contradicts retained empty workers output. Replaced it with stronger retained-map/inventory
  assertions while preserving missing-output failure. Both runtime CI tiers already passed the
  unchanged runtime source, and actual zero-definition Aspire proof is now complete.
