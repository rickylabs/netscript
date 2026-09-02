
### D-240 — #1929 merged; formal IMPL-EVAL performed on coordinator-authored #1933 → FAIL_FIX (one defect)

**#1929 merged as `3066a0cc5`; #1920 CLOSED.** The MCP export-corpus gate is on `main`. Its final CI
showed `quality` at **27 steps** with step 15 `MCP export corpus freshness` → **success**: the gate
executed on the very PR that adds it. The fix demonstrated itself on its own merge path.

**Formal IMPL-EVAL performed on #1933 at the coordinator's request.** Independence holds: #1933 was
authored by the Codex coordinator session, and this is a separate opposite-family session that wrote
none of it. Immutable head `99ce0d64c`, equality confirmed three ways. Nine changed files read in
full; no edits; focused gates only, per the stated ceiling.

**Verdict `FAIL_FIX`, one defect — the contract and its enforcement disagree.**
`milestone-reporting.md` §8, added by this very PR, binds: *"Unknown is reported as unknown, never
zero."* `render-milestone-status.ts` honours it with `?? 'unknown'` on all three environment counts.
But `validate-milestone-cluster.ts:317-326` requires `nonNegativeInteger` for each, so `null` fails
and an absent `environment` degrades to `{}` and fails all three. **There is no escape hatch.**

Why it is not cosmetic: a coordinator who does not know the counts must either fail validation or
write `0` — and `0` *reads as "environment clean"* when it means "not checked". This milestone has
already spent real time on leaked containers and foreign-owner resources, so a false zero is exactly
the expensive failure mode. The enforcement pressures toward the value the contract forbids, and the
renderer's `unknown` fallback is dead code under schema v2. Repair is one predicate plus one test.

**Everything else verified PASS** and worth recording because the contract is genuinely good:
cadence bounds match the doc (15-60m, staleness against `state.updatedAt`); red classification
forbids describing a failed administrative gate as a product failure — the error this milestone
repeatedly made; `Ready` is defined as *the pre-merge gate can be run now*, not *a label says ready*,
which this lane hit directly; the orchestrator matrix must cover every topic lane **exactly once**,
closing the silently-missing-lane gap; `lastConcreteProgressAt` is artifact-defined with poll output
and "standing by" explicitly excluded; scope coverage gates on empty `unscheduledIssueNumbers`;
schema v1 stays readable (`must be 1 or 2`, reporting validated only for v2) so historical recovery
is real rather than claimed. Gates: validator tests 22/0, renderer tests 3/0, tools check 0,
`git diff --check` 0 — all real exits.

**Method note.** The finding came from reading the new doc *against* the validator rather than
reading each in isolation — the same shape as D-233's F1, where a specification error survived three
correct executions because every check aimed at the implementation. A doc and its enforcement are two
artifacts that can disagree, and only cross-reading finds it.

Returning to lane. Internals 0.0.7 queue is empty: #1905, #1913, #1920 all closed with their PRs
merged; #1867 narrowed to F-3 on 0.0.8; #1933 is coordinator-owned and now carries an exact repair.
