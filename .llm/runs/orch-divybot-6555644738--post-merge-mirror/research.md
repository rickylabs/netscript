# Research

- Baseline: `6a6a82e15f2de2cd820cef9b879ce263aa7cb06f`.
- #2562 has the owner brief and no orchid-triage duplicate report. Searching PR bodies
  for 2562 found no existing implementation.
- `mirror-acceptance-evidence.ts` owns live API reads, closing-reference selection,
  label gating, whole-mapping validation, retry-on-concurrent-edit, and provenance.
- `acceptance-evidence.ts` owns parsing, exact checkbox resolution, snapshots, and
  mutation rendering. Reuse it without changing its grammar or CI policy.
- Comments on #2558, #2549, and #2507 carry the requested evidence. Their fields cite
  both merge commits and former branch heads. GitHub compare reports the cited heads
  `5f837c0aa` and `4ce4f06a5` diverged from main. Required dry-runs may therefore
  correctly refuse the current evidence; do not weaken ancestry checks or edit it.
- Scoped source wrappers cover internal tooling. CI quality also always executes
  `release:preflight`; JSR-specifier and Aspire-host-port checks scan maintained
  framework/docs surfaces, not this tool. Run them as conservative policy checks.
- This is internal maintenance tooling; package/plugin doctrine, JSR publication,
  release cuts, and scaffold runtime changes do not apply. CI owns path-based E2E
  policy skips for this surface; no labels are authorized.
- Consulted existing repository memory about parser grammar, mirror gating, Orchid
  Refs-only delivery, and public evidence privacy. RTK is unavailable in this environment.
