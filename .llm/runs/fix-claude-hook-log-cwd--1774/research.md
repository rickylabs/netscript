# Research — fix-claude-hook-log-cwd--1774

## Re-baseline

- Carried-in source: issue #1774 and the leaf brief in `implement.md`.
- Re-derived against `main` at `3e5cbabfcd0a8c1aea5383fa7e1c4f111386dc3c` on 2026-08-30.
- Research is in progress; raw reproduction and source findings will be committed as the next
  phase slice.

## Findings

Bootstrap established the exact branch, baseline, worktree, remote-branch absence, and GitHub
issue state. See the next phase commit for the completed findings and raw evidence.

## jsr-audit surface scan (package/plugin waves)

N/A: this is repository-owned Claude hook tooling and does not change a published package or
plugin surface.

## Open questions

- Resolve the worktree root and output root without a host-specific absolute path.
- Select the smallest fixture that proves both configured events and distinguishes a sibling
  checkout.
- Name the exact minimum Deno permissions.
