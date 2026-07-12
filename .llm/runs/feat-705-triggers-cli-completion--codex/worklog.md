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

### Slice 2 — persisted events and authoritative enabled state

- `deno test --allow-all --unstable-kv plugins/triggers/services/src/main_test.ts` — PASS, 5 tests (9 steps) / 0 failed. A live ephemeral service is disabled through the same HTTP adapter used by the CLI, rejects a raw webhook with 409, is re-enabled, accepts the webhook with 202, and returns that persisted event through `/api/v1/events`.
- Targeted HTTP adapter, runtime processor, service connector, and CLI registry tests — PASS, 14 tests (9 steps) / 0 failed before the added live-ledger assertion; the final service-only rerun above includes that assertion.
- Runtime processor test proves a disabled trigger fails before handler/action dispatch through `TriggerEnabledStatePort`.
- Scoped check wrapper over `plugins/triggers` — PASS, 68 files selected, 0 occurrences.
- Scoped lint wrapper over `plugins/triggers` — PASS, 68 files selected, 0 occurrences.
- Scoped format wrapper over `plugins/triggers` — PASS, 68 files selected, 0 findings.
- Reconcile: no PR was opened or commented per owner direction; no issue taxonomy or milestone mutation was authorized.

### Slice 3 — update/remove, full cron preview, and tutorial adoption

- Final targeted matrix across scaffold resources, live service connector, runtime processor, CLI registry, registry golden output, HTTP adapter, and local backend — PASS, 25 tests (9 steps) / 0 failed. A subsequent focused backend rerun after multiline-tag hardening passed 3 / 0.
- The local backend integration proves add scheduled → update cron → `list` observes the new cron → preview produces three Mondays at 02:00 UTC; a second update proves day-of-month previews land on the 15th at 04:30 UTC.
- The same integration removes the trigger, observes the source file absent, and observes a recompiled registry with `triggerCount: 0`.
- A webhook update round-trip proves path, verifier, secret env, description, and tags mutate without changing the inline job reference; multiline tag arrays are also replaced safely.
- Scoped wrappers over `plugins/triggers` — check PASS (72 files), lint PASS (72 files), format PASS (72 files), zero findings.
- Scoped wrappers over `packages/plugin` — check PASS (151 files / 2 batches), lint PASS (151 files), format PASS (151 files), zero findings.
- Doctrine readiness: `plugins/triggers` FAIL=0, WARN=12, INFO=2 after moving CLI tests out of `src/cli` and extracting raw routes; `packages/plugin` FAIL=0, WARN=3, INFO=1. Remaining findings are pre-existing package-level cardinality/default-export/docs warnings; this slice removed its initially introduced `src/cli` cardinality and `services/src/main.ts` >500 warnings.
- Tutorial source alignment: the storefront shipping webhook now begins with `ns-triggers add webhook ... --job ... --verifier ... --secret-env ... --description ... --tags ...` and points to the generated `triggers/` path.
- Reconcile: no PR was opened or commented, as explicitly required. The orchestrator still owns the full `e2e:cli` / `scaffold.runtime` execution.

### Acceptance status

- PASS — `add webhook <id> --job=x` emits a compiling handler whose runtime action targets job `x`.
- PASS — a running ephemeral service accepts a real raw webhook and the CLI HTTP adapter reads the persisted event from `/api/v1/events`; this is not the synthetic test/fire path.
- PASS — disabling through the CLI adapter changes the service response for the raw webhook to 409 and blocks oRPC manual fire; enabling restores 202 acceptance. The processor also checks the same port before dispatch.
- PASS — scheduled cron update appears in `list`; remove deletes the definition and recompiles an empty registry.
- PASS — CLI preview delegates to triggers-core `computeNextFireTimes`; command-level tests cover day-of-week and day-of-month expressions.
- PASS — storefront tutorial references the add verb for scaffolding.
- UNPROVEN HERE — the orchestrator-owned full `deno task e2e:cli` / `scaffold.runtime` gate was intentionally not executed.

## Drift

- D1 (carried, owner-authorized): PLAN-EVAL is waived; the short plan and design checkpoint live in this worklog.
- D2 (scope): dynamic API/config-source registration is deferred p3 and is not implemented.
- D3 (observed route shape): oRPC assembly prefixes the contract namespace, so management procedures are served under `/api/v1/triggers/triggers/...`; the stable raw event-ledger endpoint remains `/api/v1/events`. The CLI adapter follows the actual OpenAPI-mounted paths rather than inventing aliases.
