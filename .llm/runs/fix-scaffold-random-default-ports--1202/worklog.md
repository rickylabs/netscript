# Worklog: randomized scaffold default ports

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-scaffold-random-default-ports--1202` |
| Branch | `fix/scaffold-random-default-ports` |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | service |

## Design

### Public Surface

- Existing `netscript init`, `netscript service add`, and `netscript plugin install` options.
- Existing generated service/app source and `appsettings.json` resource entries.
- No exported API or command-vocabulary change.

### Domain Vocabulary

- Scaffold listener range: inclusive high-range floor and ceiling.
- Project/resource seed: stable identity for a generated listener fallback.
- Port allocation: numeric port plus `user` or `auto` provenance.
- Host pin: an explicit user choice; absent for automatic allocation.

### Ports

- Existing filesystem ports discover configured allocations.
- Existing Aspire endpoint directory and `PORT` environment injection discover dynamic endpoints.
- No new external port/interface is introduced.

### Constants

- `SCAFFOLD_PORT_RANGE`: 49152–65535.
- Existing `USER_PORT_RANGE`: explicit override validation remains 1024–65535.
- Protocol target constants remain unchanged and outside this default-listener contract.

### Archetype-6 Structural Inventory

- Five spine abstracts: unchanged (`CliCommand<Input, Result>`, `CliCommandGroup`, `CliRoot`,
  `UseCase<Input, Result>`, `Registry<TKey, TValue>`).
- Layer-2 abstracts: none introduced or changed.
- Vertical features: existing init, service-add, plugin-install, and E2E scaffold gates only.
- Extension registries and composition roots: unchanged.
- Effects remain in existing filesystem/process adapters; the allocator is pure domain policy.

### Commit Slices

| # | Slice | Proving gate | Files |
| --- | --- | --- | --- |
| 1 | Lock evidence/design and open the draft review surface. | composed milestone Plan-Gate recorded | run artifacts; PR body |
| 2 | Add RED-first generated-output contract and route every automatic listener through the high-range/dynamic policy. | focused RED/GREEN tests; scoped wrappers; substantive diff review | CLI allocator, init/app/service/plugin emitters, E2E command, tests, run artifacts |
| 3 | Prove framework quality, clean runtime one-pass, cloud verdict, and close-gate truth. | quality/arch/JSR gates; serialized `scaffold.runtime`; CI/evaluator | run artifacts; PR/issue evidence |

### Deferred Scope

- Windows service identification is owner-owned.
- Upstream protocol ports and endpoint-directory redesign are not part of this slice.

### Contributor Path

To add a listener-bearing scaffold resource, derive its automatic fallback from the shared
project/resource allocation contract, record already configured listener ports, omit a host pin by
default, and extend the semantic generated-output table.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-08-04 | 1 | bootstrap | Issue body and all live comments read; branch equals current origin/main. |
| 2026-08-04 | 1 | interruption recovery | Daemon restarted before any commit; resumed with zero commits/source edits. |
| 2026-08-04 | 1 | plan-gate | `composed per milestone-run.md (orchestrator waiver)`; plan locked before implementation. |

## Gate Results

| Gate | Status | Evidence |
| --- | --- | --- |
| Plan-Gate | composed | `plan-eval.md`; owner/orchestrator waiver |
| Generated-output RED/GREEN | pending | Slice 2 |
| Scoped wrappers | pending | Slice 2 |
| Quality/architecture | pending | Slice 3 |
| JSR static audit | pending | Slice 3 |
| `scaffold.runtime` | pending / serialized | Slice 3; cloud CI is verdict source |

