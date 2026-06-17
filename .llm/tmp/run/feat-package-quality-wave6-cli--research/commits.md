# Commits — Wave 6 `@netscript/cli` A6-v2 promotion

Plan-phase commit (this run, plan artifacts only — no `packages/` edits):

| Commit | Branch | Scope |
| ------ | ------ | ----- |
| (pending) | `feat/package-quality-wave6-cli` | `docs(wave6-cli): plan + worklog Design + drift + plan-eval skeleton` |

## Planned IMPL commit slices (impl phase, see plan.md §Commit Slices)

- 0.1 `e2e/` workspace member (R-5)
- 0.2 consume `catalog:` baseline
- 1.x `packages/cli/docs/standards.md` + V-1..V-14 checklist
- 2.1 `CliCommandRegistry` (concrete) — closes V-1/F-CLI-27
- 2.2 `DeployTargetPort` + `DeployTargetRegistryPort` — closes V-9
- 2.5 4 in-memory-port unit tests
- 2.G `scaffold.runtime` 41/41 rerun (merge gate)
- 3.x target-tree moves + split two 384-LOC files
- 4.x scaffold improvements E.2.1–E.2.10 + `scaffold.published.runtime`
- 5.x Aspire 13.4 GA apphost shape + schema mirror + `WithProcessCommand` flag-off
- 6.x gate sweep + `research-realized.md` + AP-1 verdict

Each slice = its own commit, LF-normalized, `-c core.autocrlf=false`; gate evidence in worklog.
Slice 2 blocks merge without green `scaffold.runtime`.

## Landed IMPL commits

- 9695420: Slice 0: prep hygiene gates green
- fa3fe22: Slice 1: CLI standards doc doc-lint clean
- 2e18ebd: Slice 2: command registry deploy port E2E green
- e53f011: Slice 3: split CLI registry and app writer

- 43e8ea4: Slice 4a: finish local CLI scaffold improvements
