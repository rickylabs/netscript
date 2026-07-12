# Worklog — #705 triggers CLI completion

## Preflight

- Branch: `feat/705-triggers-cli-completion`
- Required baseline: `eac57c5f…`
- Verified HEAD: `eac57c5f5ac4c10b9c1cc5b17874ae821b27a20d`
- Worktree was clean before edits.
- PLAN-EVAL: owner-waived in the slice brief (carried drift D1). This worklog plan is the authorized substitute; no separate PLAN-EVAL is claimed.
- Effective profile: Archetype 6 (CLI/tooling), folding the first-party plugin/runtime concerns; docs overlay applies to the tutorial adoption edit.

## Plan

1. Complete `add webhook|scheduled` inputs and typed stubs so `--job`, verifier/security metadata, description, and tags survive scaffolding; prove generated job handlers compile and enqueue the requested job.
2. Add a small injected HTTP service adapter for persisted event reads and authoritative enable/disable calls, then make the running processor consult the same enabled-state port before dispatch.
3. Add `update` and `remove` as source-definition mutations followed by registry recompilation; expose mutated fields through `list` for round-trip evidence.
4. Replace the local two-field preview approximation with the triggers-core five-field evaluator, add day-of-week/day-of-month tests, and update the storefront tutorial to lead with the add command.
5. Run scoped check/lint/format and targeted tests, record exact evidence, commit in coherent slices, and push the requested branch.

Risks and mitigations:

- Generated source can be syntactically valid but semantically unresolvable; compile generated fixtures against local package mappings.
- Service state can be persisted yet ignored by dispatch; test disable → fire rejection and enable → fire acceptance through the real service routes.
- Text mutation can silently alter the wrong field; restrict updates to known trigger-spec properties, test exact round trips, and fail on unsupported/missing fields.
- Network-backed commands can hide connection failures; return explicit non-zero CLI results with the target service URL.

Open decisions: none that force rework. API URL customization is safe to defer unless existing CLI conventions require it during implementation research.

## Design

Public command surface:

- Existing: `add-webhook`, `add-file-watch`, `add-scheduled`, `list`, `test`, `fire`, `preview`, `enable`, `disable`.
- Added: `events`, `update`, `remove`.
- No new package export map is planned; command classes continue through `plugins/triggers/src/cli/composition/main.ts`.

Domain vocabulary and constants:

- Reuse `TriggerEvent`, `TriggerEventStatus`, `TriggerEnabledStatePort`, `ScheduledTriggerSpec`, and `computeNextFireTimes` from `@netscript/plugin-triggers-core`.
- Extend the closed `TRIGGERS_CLI_COMMANDS` tuple for the three verbs; do not introduce speculative unions.

Ports/adapters:

- `ProjectFiles` gains deletion at its existing filesystem adapter seam so `remove` can be real; memory fixtures implement the same behavior where exercised.
- A trigger-service client interface is constructor-injected into the local backend; its fetch implementation owns `/api/v1/events` and `/api/v1/triggers/:id/{enable,disable}` calls.
- The runtime processor receives the existing enabled-state port and rejects dispatch before handler/action execution when disabled.

Archetype-6 checkpoint:

- No new spine or layer-2 abstract is introduced. The five canonical spine names remain `CliCommand<Input, Result>`, `CliCommandGroup`, `CliRoot`, `UseCase<Input, Result>`, and `Registry<TKey, TValue>` at the governing package level.
- No new extension axis or registry is introduced. Existing trigger resource scaffolders and registry compiler remain the contributor path.
- Existing plugin CLI composition owns the top-level command list; the slice does not broaden into a CLI package restructuring.
- External effects remain at adapter edges (`LocalProjectFiles`, HTTP service client, service/runtime composition).
- Semantic test strategy: inspect requested enqueue action fields, compile emitted modules, exercise service routes with persisted stores, and verify registry output after update/remove.

Deferred scope:

- Item 6, dynamic `source='api'|'config'` trigger registration, is p3/deferred by owner direction. No registration route or CLI verb will be added.
- Full `deno task e2e:cli` / `scaffold.runtime` execution belongs to the orchestrator. This slice may add coverage but will not execute that gate.
- Existing `plugins/triggers` Archetype-5 verification-shape debt remains outside #705 unless this work directly deepens it.

Contributor path:

- Add or change command metadata in `src/cli/commands.ts`, mount it in `src/cli/triggers-cli.ts`, implement behavior in the backend or its injected adapter, and cover it under `tests/cli/`.
- Add scaffold fields in `src/adapter/resources/input.ts`, substitute them in the kind-specific scaffolder/stub, then prove generated source semantically.

## Evidence

### Slice 1 — compiling job-wired scaffolds

- `deno test --allow-all --unstable-kv plugins/triggers/src/adapter/resources/resources.test.ts` — PASS, 7 passed / 0 failed. Generated webhook and scheduled modules were dynamically imported, invoked, and asserted to emit the requested `enqueue-job` action.
- Scoped check wrapper over `plugins/triggers` — PASS, 66 files selected, 0 occurrences.
- Scoped lint wrapper over `plugins/triggers` — PASS, 66 files selected, 0 occurrences.
- Scoped format wrapper over `plugins/triggers` — PASS, 66 files selected, 0 findings.
- Reconcile: no PR was opened per the slice brief; issue #705 remains the sole owned issue and no GitHub state was mutated.

## Drift

- D1 (carried, owner-authorized): PLAN-EVAL is waived; the short plan and design checkpoint live in this worklog.
- D2 (scope): dynamic API/config-source registration is deferred p3 and is not implemented.
