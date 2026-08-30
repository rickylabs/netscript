# S7 reporter fix — Tier-A (supervisor, at `4aac6d7be477`)

**Verdict: PASS (static Tier-A).** Ruling invariants verified in `probes.ts`: ownership evidence is
provenance-bearing (`--apphost` / `--contentRoot`/`--content-root` argv + `ASPIRE_DCP_APPHOST_PATH`
env), gated by Aspire process identity (`aspire-managed`/`dcp` basename match, never name-only),
PPID is carried as data (never the sole proof), census has explicit
`unavailable`/`failed` states. Live-shaped RED regression
(`phase-b-live-snapshot_test.ts`, from the phase-b-02/03 snapshots) classifies only leased
descendants owned and plans targeted TERM. Teardown suite 47/0; scoped check 13 files / 0 failed
batches; no product code touched (`.llm/` only). Lease-backed Phase-B rerun (same foreign-control
invariant) is unblocked by S3's convergence — queued behind the hosted S1 rerun; separate Phase-B
IMPL-EVAL after it. The audit-ruling amendment text is on file
(`phase-b-fix-amendment.md`) for the rerun brief.
