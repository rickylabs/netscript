# S8 intake (corrected 2026-08-30)

- Leaf issues: **#1720** (typed resource commands, `excludeFromMcp`, bounded wait) + **#863**
  (`netscript db init` can block on an Unhealthy-but-Running resource) — both milestone 0.0.7,
  exactly `status:impl`; #863 keeps `type:fix`, `area:cli`, `area:aspire`, `wave:v1`, `priority:p1`.
- PR: **#1754** (draft), base `feat/aspire-13-5-s6-health-checks` (stacked S6 → S5), closing set
  `Closes #1720`, `Closes #863`, `Part of #1712`.
- Dependency edge: `issue:1718 → S8` (S6 listener-readiness defines "healthy" for the bounded wait).
- Scope: the already accepted S8 slices only; no expansion. Phase-B receipts are AppHost gates →
  environment-blocked on this NAS (D-43) until the infrastructure boundary is resolved.
- Thread: `01a051e6-90d4-7e50-a91e-ac4bd23b880c` (static), worktree `007-aspire-s8`.
