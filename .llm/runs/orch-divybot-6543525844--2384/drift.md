# Drift

- Owner overrides default matrix evaluators with native claude-opus-5-5/high.
- Owner overrides default closing keyword/labels/milestones and local E2E process:
  PR starts with Refs; coordinator owns metadata and required e2e-cli CI gate.
- RTK is not installed; direct commands substitute without altering verdict sources.
- Final issue report uses Orchid's file handoff, superseding direct comment posting.
- Focused acceptance tests live in packages/cli/tests/browser-auth-reporting_test.ts,
  extending the initially declared src-only test surface. This is a cross-cutting
  test of the reconciler/report renderer, using the existing installed-auth fixture;
  it avoids enlarging the 550-line colocated preservation suite. New shared
  presentation helper: kernel/presentation/output/render-doctor-report.ts.
- CLI is excluded by inherited root fmt/lint configuration. Structured wrappers
  initially refused all selected CLI files (correct fail-closed behavior). A scoped
  run config retains root formatter/linter rules without exclusions; successful
  gates select only owned TypeScript files through that config.
- First IMPL-EVAL launch could read repository files but could not open the
  external review brief in don't-ask mode. It issued no implementation verdict.
  The same session was resumed with an explicit read-only directory grant; no
  write tools or broader implementation permissions were added.
- IMPL-EVAL F1 repair: authored layouts outside/equal to the project root are
  reported without filesystem inspection; the scaffold-only resolver keeps its
  existing rejection policy. No app directory ownership or write policy changes.
- Absent authored candidates skip formatting; per-file canonical comparison for
  existing candidates is retained. Batch formatting remains deferred.
