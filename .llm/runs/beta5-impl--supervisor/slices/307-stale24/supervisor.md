# Supervisor Identity

- Run: `beta5-impl--supervisor`
- Slice: `307-stale24`
- Issue: #307, Waves 2 and 4 only
- Branch: `chore/307-stale-wave2-wave4`
- Worktree: `/home/codex/repos/netscript-307-stale24`
- Baseline: `1c175990` (`origin/main` at slice start)
- Session: WSL Codex implementation slice

## Lane Notes

- Generator lane: WSL Codex implementation slice.
- Evaluator lane: separate-session PLAN-EVAL/IMPL-EVAL is required by harness policy; this slice
  records implementation evidence and leaves evaluator verdicts to the supervisor/evaluator lane.
- Scope guard: Wave 1 already done; Wave 3 blocked on #305; Wave 5 owner-decision items untouched.
