# Drift Log — docs-internal-overhaul--contributor

Append-only. Severity ∈ {minor, significant, architectural}.

## minor — workflow subagent worktree-pin leak (reconciled)

During implementation, the LD-DOCS-LANE authoring step ran a Claude dynamic workflow whose
subagents inherit the parent session's worktree pin. 5/7 slice agents correctly wrote into the
target worktree (`g4-internal` / `docs/internal-overhaul`) via Bash absolute paths, but 2 agents
that used the Edit tool wrote into the supervisor's launch worktree (`release+jsr-readiness`, the
umbrella branch) instead. The supervisor reconciled by `git diff`-patching the leaked files onto
`docs/internal-overhaul` (`git apply --check` clean, base files were byte-identical across the
sibling branches) and `git checkout --` reverting them in the launch worktree. Final state is
correct: all 7 slices landed on `docs/internal-overhaul`. Recorded per protocol §5 ("Drift is
explicit"); lesson promoted to supervisor memory for the Group 3 user-docs workflow. No
implementation defect; bookkeeping completeness only.

> Watch: consolidation that changes a doctrine decision (STOP); broken internal cross-refs;
> hand-edited skill mirrors; file-deletion overlap with Group 1.
