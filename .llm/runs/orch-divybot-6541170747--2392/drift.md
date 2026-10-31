# Drift

- Research: runtime has no received/injected logger in this checkout. Use canonical
  @netscript/logger factory without adding an alternative sink/configuration path.
- Add plugins/workers/deno.json to declared write scope for direct logger dependency.
- RTK unavailable; focused raw exploration and authoritative structured wrappers used.

- PLAN-EVAL round 1 FAIL_PLAN: worker child has no logging setup. Routine dev console lifecycle
  output will become silent unless the worker process configures logging. This is intentional
  level-controlled behavior; document setup rather than adding a new initialization path.
  Preserve all diagnostic warnings/errors on console and add unconfigured failure coverage.

- Required dependency lock update: direct @netscript/logger manifest addition invalidates root and
  maintained Fresh-UI/Expo/desktop frozen workspace metadata. Native install / deps:refresh:desktop-lock
  refresh adds one membership line in each of the four locks. No versions/integrities change.
  This is required by the fix; PR body will disclose it.
- Plugin doc-lint baseline fails with two private-type-ref findings in unchanged core contracts.
  Post-change report has identical findings. Kept out of this per-job scope.

- Private-lock guard additionally requires Fresh-UI workspace metadata refresh. Native lock:update
  passed 266 files across three check batches and adds exactly one membership line.

- Independent implementation evaluator classifies new runtime dependency import as requiring
  e2e-cli CI before merge. Earlier tentative no-wiring/no-E2E assessment is superseded.

- CI quality follow-up: workers docs change requires the shipped CLI prose carrier refresh.
  Scope extends to packages/cli/src/kernel/assets/agent-docs-prose.generated.ts; exactly one
  generated page row changes. Owner explicitly requested fixing the red CI.
