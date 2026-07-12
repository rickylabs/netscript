# Drift — beta.10 non-dashboard stream

Append-only.

## D1 — pre-existing worktree state on the PR branch (minor)

`/home/codex/repos/netscript-547-lffix/.claude/worktrees/mcp-skills-orchestrator` (locked) holds
`feat/netscript-mcp-skills` at `57c2cfe1` — **3 commits ahead of `origin/feat/netscript-mcp-skills`
(`5b1a9877`)**, including `93546ae3`, a commit already merged to `main`, plus an uncommitted
~313-line rewrite of `packages/mcp/README.md`.

That state is un-pushed and its provenance is not recorded in any run artifact, so it is not
trustworthy as a baseline. Rather than disturb a locked worktree or guess at a partial local merge,
this run baselines on the **true PR head** (`origin/feat/netscript-mcp-skills` @ `5b1a9877`) in a
fresh worktree at `/home/codex/repos/ns-b10-715`.

The uncommitted `packages/mcp/README.md` draft was preserved to scratch and will be evaluated as
input for P0(b) rather than discarded — but it is treated as a draft to review, not as landed work.

**Severity:** minor. No scope change.

## D2 — root cause of the `quality` CI failure sat in `packages/mcp`, not in the wrapper alone (minor)

The brief scoped P0(a) as a wrapper bug plus "the real underlying batch failure it was hiding". The
underlying failure turned out to be a lint-selection problem caused by a test fixture inside
`packages/mcp` (`tests/fixtures/doctor/broken/deno.json`).

The fix applied is a **selection/config change** (`deno.json` lint task + `lint.exclude`), not a
change to `packages/mcp` source or to the fixture itself — so it stays inside this lane's tooling
boundary and does not require a WSL Codex slice. Had the correct fix been to alter the fixture or
the MCP doctor's test, that would have been delegated to Tier D.

**Severity:** minor. Within approved scope.
