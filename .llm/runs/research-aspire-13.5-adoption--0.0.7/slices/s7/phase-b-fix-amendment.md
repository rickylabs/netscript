# S7 reporter fix — coordinator audit ruling (same thread; supersedes any looser reading of the fix brief)

Phase B is an **honest product FAIL** of the reporter, not infra. Exactly one bounded repair slice
is authorized, with these invariants:

- Ownership evidence must be **explicit and provenance-bearing**: a contained `cwd` and/or a
  `--contentRoot` argv value inside the exact owned root. Each owned classification records which
  evidence proved it.
- That evidence is still **gated** by all of: Aspire identity (DCP labels / `aspire-managed`
  lineage), exact owned-root containment, a **successful AppHost census** (`aspire ps` read
  succeeded), **stable PID + start-time identity** across two reads, an **age threshold**, and an
  **inactive owning run** (the run's CLI is gone).
- Preserve every existing refusal: foreign `cwd`/`contentRoot`, young or active run, MCP
  (`aspire agent mcp`) processes, foreign-worktree AppHosts. **Never accept PPID-only** evidence.
- RED regressions must be **live-shaped**: derived from `phase-b-02/03` snapshots (owned orphan
  → owned; foreign control → foreign; PPID-1 with no contained cwd/contentRoot → unproven).
- Focused/scoped gates as in the fix brief. Keep PR #1744 **draft**. After your push the
  supervisor runs fresh Tier-A; the lease-backed rerun of `phase-b-handoff.md` (same
  foreign-control invariant, targeted TERM only, exact-zero cleanup) and a separate Phase-B
  IMPL-EVAL follow — S3 must converge first. Do not start any runtime yourself.

## Hosted-cleanup caveat (fold into the ownership/teardown rationale)

On the hosted S1 run 33328727942 both `cleanup.aspire-stop` gates passed (PG 544 ms, SQLite
611 ms) yet runner finalization still reaped descendant `dcp`/`docker`/`deno` processes. Hosted VMs
leave no durable residue, so **`cleanup.aspire-stop` alone must never be cited as process-zero**;
your reporter/teardown rationale and receipts must keep an exact local process census mandatory
(PID + start identity, owned-root containment), and the phase-b receipts must state this explicitly.
