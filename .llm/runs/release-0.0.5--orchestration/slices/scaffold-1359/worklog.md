# Worklog: #1359

## Metadata

- Branch: `fix/app-routes-crud-example`
- Base: `origin/main@3d04f025e`
- Archetype: 6 — CLI/tooling
- Tier: D; no self-certification

## Progress

- Clean branch created from the requested base with upstream unset.
- Live issue, route seeds, router asset, both link sites, stale test, doctrine, and generator opened.
- `PLAN-EVAL: N/A` recorded before product implementation because the change is fully bounded.
- Tier-D runtime status returned `missing_identity`, raw exit 3; this existing sole-writer thread
  continues without claiming daemon identity.
- Added the semantic route/link proof and duplicate-target invariant before changing the template.
- Corrected the one route alias and regenerated the CLI embedded asset canonically.

## Gates

| Gate | Result |
| --- | --- |
| Pre-fix focused test | expected RED, exit 1; mapping, resolved-link, and collision steps failed |
| Canonical asset generation | PASS, exit 0 |
| Focused route-template test | PASS, exit 0; 21 steps |
| Deliberate duplicate in detached scratch | expected RED, exit 1; named both keys and target |
| Clean rerun after scratch | PASS, exit 0; 21 steps |
| Scoped check | PASS, exit 0; 829 files, 7 batches, 0 findings |
| Scoped lint | PASS, exit 0; 829 files, 5 batches, 0 findings |
| Scoped format | PASS, exit 0; 829 files, 5 batches, 0 findings |
| `quality:scan` | PASS, exit 0; no findings, 7 pre-existing allowances |
| `arch:check` | PASS, exit 0; pre-existing warnings only |
| `check:assets-barrel` after commit | PASS, exit 0; canonical regeneration is byte-clean |

The first check-wrapper invocation accidentally supplied `--unstable-kv` twice (the wrapper already
adds it) and exited 1 with seven command failures/no findings. The canonical invocation with only
`--deno-arg --no-lock` then ran `deno check --unstable-kv --no-lock` and passed; only that corrected
command is decisive.

No Aspire, container, or `e2e:cli` command ran; no serialized token was granted.
