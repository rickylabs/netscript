# Drift

2026-11-11 — **scope precedence:** generic delivery text says implement/ship;
the specific highest-priority source directive says FIRST PLAN/EVIDENCE ONLY,
then STOP for parent PLAN review. S0 only is executed. No product sign-off or
ready/merge transition is authorized.

2026-11-11 — **dependency evidence:** root SDK resolution is oRPC 1.15.5,
distinct from consumer report 1.16.1. Stable lookup reports 1.16.2. Qualification
does not conflate those versions and proposes no dependency change.

2026-11-11 — **cancellation evidence:** init.signal is absent but a single
effective Request signal still cancels in the baseline. Multi-caller cancellation
is separately defective. The plan uses that distinction rather than claiming
the stronger failure solely from RequestInit observations.

2026-11-11 — **tooling/privacy:** RTK unavailable. Direct commands and repo
wrappers used. Raw reports include local fields and are excluded; public copies
explicitly identify normalization. No model/effort runtime attestation exists in
the exposed session tools; only requested binding and matrix route are recorded.

No architecture violation is introduced or accepted by this planning checkpoint.

2026-11-11 — **bootstrap ordering:** the isolated S0 reproducer was written
during research before the final seven-item design checkpoint was persisted.
The checkpoint is now complete; no product source or existing tests were edited,
and all S1+ implementation remains behind the parent continuation gate.
