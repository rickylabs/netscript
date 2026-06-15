# Commits — Deno 2.8 + Aspire 13.4 toolchain upgrade

Plan-phase commit (this run, plan artifacts only — no `packages/` edits):

| Commit | Branch | Scope |
| ------ | ------ | ----- |
| (pending) | `chore/deno-2.8-aspire-13.4-upgrade` | `docs(upgrade): plan + Phase-P publish plan + worklog Design + drift + plan-eval skeleton` |

## Planned IMPL commit slices (executed in the impl phase, see plan.md §Commit Slices)

Phase T PR `chore/deno-2.8-toolchain-pin-foundation`:
- T0 aspire barrel dry-run fix
- T1 CI pin v2.8.x
- T2 catalog: + 28-member rewrite
- T3 remove dead suppressions / normalize isolatedDeclarations+lib
- T4 four slow-types carve-outs + debt rows
- T5 deno ci + audit + per-fn coverage + parallel

Phase P PR `chore/jsr-alpha-publish` (after T0+Slice0):
- P1 bump-version prerelease alpha
- P2 exclude cli from publish
- P3 deno publish (dry-run → real)
- P4 scaffold.published.runtime e2e
- P5 research-realized.md log

Phase A PR `chore/aspire-13.4-version-bump` (gated on E-12 GA check):
- A1 SCAFFOLD_VERSIONS → 13.4.x + CTK consolidation
- A2 stub 13.5 blocks + tsx/jsonrpc audit
- A3 wire aspire logs --search nightly
- A4 (joint w/ Wave 6) WithProcessCommand flag-off + doctor skip + skill docs

Each IMPL slice = its own commit, LF-normalized, `-c core.autocrlf=false`, gate evidence in worklog.
