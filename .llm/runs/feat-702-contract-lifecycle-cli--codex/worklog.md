# #702 contract lifecycle CLI — Codex worklog

## Preflight

- Branch: `feat/702-contract-lifecycle-cli`
- Required base: `eac57c5f`
- Observed HEAD before edits: `eac57c5f5ac4c10b9c1cc5b17874ae821b27a20d` — PASS.
- PLAN-EVAL: owner-waived by the staged brief (carried drift D1).
- Lock/E2E constraints: do not modify `deno.lock`; do not execute `e2e:cli` or
  `scaffold.runtime` in this lane.

## Plan

1. Complete the existing `contract add <name>` vertical feature with a testable application flow
   and semantic unit tests for file creation, aggregate wiring, validation, and overwrite guards.
2. Add scaffold-suite coverage that invokes `contract add`, confirms it is list-visible, and lets
   the existing generated-contract typecheck gate prove the emitted workspace compiles.
3. Document the supported contract command group in `docs/site/cli-reference.md` and explicitly
   defer tutorial rewrites.
4. Run scoped CLI check/lint/format wrappers and targeted CLI/E2E unit tests; record exact evidence.

## Design

### Archetype and doctrine verdict

- Selected archetype: **Archetype 6 — CLI / Tooling**, because `@netscript/cli` ships a binary,
  command routing, and generated-workspace mutations.
- Current doctrine verdict: `@netscript/cli` is **Restructure**. This slice follows its existing
  vertical `src/public/features/contracts/<verb>/` shape and does not deepen the recorded package
  restructure debt.
- Public package exports (`mod.ts` / `deno.json`) remain unchanged, so the planned JSR surface risk
  is N/A: no new published symbol, entry point, dependency, slow type, or permission is introduced.

### Public surface

- `netscript contract add <name> [--version v1] [--path <workspace>] [--force]` creates
  `contracts/versions/v1/<name>.contract.ts`, regenerates the v1 aggregate, and preserves workspace
  membership.
- `netscript contract list [--version v1] [--path <workspace>]` remains the inspection/list surface
  for this slice and reports contract/service pairing.
- No programmatic `@netscript/cli` export is added; the command tree is the public surface.

### Domain vocabulary and constants

- Existing `ContractVersion`, `DEFAULT_CONTRACT_VERSION`, `ContractScaffoldOptions`,
  `ServiceContractOptions`, `DiscoveredContract`, and `DiscoveredVersion` remain authoritative.
- Existing `SCAFFOLD_VALIDATION.NAME_PATTERN` remains the contract-name invariant.
- E2E gains a named `contract.add` gate ID; command names remain literal at the presentation edge,
  consistent with the current command registry.

### Ports and effects

- Filesystem effects stay behind `FileSystemPort` implementations.
- Template rendering stays behind `TemplatePort`/`ScaffolderPort` and the typed contract template
  registry.
- The public command resolves the workspace and composes adapters; the application flow accepts
  explicit dependencies so tests use `MemoryFileSystemAdapter`.
- CLI text remains routed through `outputText`; no direct `console.*` is added.

### Generated outputs and consumer impact

- Owned output: the v1 contract file and regenerated `contracts/versions/v1/mod.ts`.
- Consumer proof: scaffold E2E will run add, then list, then the existing generated contracts
  `deno check --unstable-kv ./contracts` gate.
- The emitted contract uses the existing `@netscript/contracts`/oRPC/Zod template convention, so a
  tutorial's manual initial contract-file creation can be replaced by `contract add`; route-specific
  authoring remains follow-up work.

### Archetype-6 structural checkpoint

- Existing spine abstracts are `CliCommand<Input, Result>`, `CliCommandGroup`, `CliRoot`,
  `UseCase<Input, Result>`, and `Registry<TKey, TValue>`; this slice changes none of them.
- No layer-2 abstract is introduced.
- Vertical feature catalog touched: `public/features/contracts/add` and the contracts group.
- Extension axes/registries are unchanged; `ContractVersionRegistry` is a file-backed aggregate
  adapter, not a new extension axis.
- Composition ownership remains `src/public/features/root/public-command-tree.ts`; no inline command
  body is added there.
- Contributor path: add contract behavior in the `add/` feature, generated-file mechanics in
  `kernel/adapters/contracts/`, and semantic tests beside the feature; add future verbs as sibling
  vertical sub-features.

### Deferred scope and drift

- **D1 (owner waiver):** PLAN-EVAL is waived; this worklog plan/design is the required checkpoint.
- **D2 (scope reconciliation):** issue #706 explicitly owns v2/version evolution, remove,
  add-route/handler, and detailed `inspect --json`. The staged brief prohibits implementing that
  scope here. Therefore the stale #702 `add → version → typecheck` wording cannot be fully proven by
  this slice. This lane will add `add → list → typecheck` E2E coverage and mark version evolution
  unproven, rather than fabricating acceptance evidence.
- `update`, `version`, multi-version enumeration, consumer-client discovery, remove, route mutation,
  and JSON procedure inspection are deferred to #706.
- Tutorial prose changes are explicitly out of scope; the worklog records the follow-up.

## Evidence

### Implementation

- Added `add-contract.ts` as the testable application flow for validation, workspace package-name
  discovery, and contract-scaffolder dispatch.
- Kept Cliffy parsing/workspace resolution/adapter construction in `add-contract-command.ts`.
- Added semantic tests for v1 file generation, aggregate/registry wiring, workspace membership,
  non-destructive reruns, and invalid-name rejection.
- Added the `contract.add` scaffold gate before `contract.list`; the suite's existing
  `generated.contracts-check` subsequently runs `deno check --unstable-kv ./contracts`.
- Added the contract command group to `docs/site/cli-reference.md` with the supported flags and
  explicit evolution follow-up boundary.

### Gate results

| Gate | Result | Evidence |
| --- | --- | --- |
| Targeted feature + E2E-definition tests | PASS | `deno test --allow-read --allow-env .../add-contract_test.ts .../scaffold-gates_test.ts`; exit 0, 5 tests + 3 BDD steps, 0 failures. |
| Scoped check (owned TS files) | PASS | `run-deno-check.ts --file ... --ext ts,tsx`; 6 selected, 1 batch, 0 failed, `deno check --quiet --unstable-kv`. |
| Scoped lint (owned TS files) | PASS | `run-deno-lint.ts --file ... --ext ts,tsx`; 6 selected, 0 findings. |
| Scoped format (owned TS files) | PASS | `run-deno-fmt.ts --file ... --ext ts,tsx`; 6 selected, 0 findings. |
| Public command help | PASS | `deno run --no-lock -A .../bin/netscript.ts contract add --help`; exit 0, documents `<name>`, `--version`, `--path`, and `--force`. |
| Internal docs links | PASS | `rtk proxy deno task docs:links`; exit 0, 96 docs, 0 broken links/anchors. |
| Full scaffold runtime E2E | NOT RUN (owner lane) | Staged brief explicitly reserves `e2e:cli` / `scaffold.runtime` for the orchestrator. Coverage code is present for its run. |
| Package-wide format wrapper | BASELINE DRIFT | The broad CLI scan found one unrelated existing finding in `e2e/src/application/gates/scaffold/runtime-gates.ts`; this slice did not edit it. Owned-file format gate is green. |

### Acceptance status

- [x] Doctrine-first design recorded before implementation (Archetype 6, command surface, ports,
  generated outputs, consumer gate, contributor path).
- [ ] Generated-project `add → version → typecheck` fully proven: **unproven by design**. This slice
  adds `add → list → typecheck` coverage, but #706 owns and the staged brief prohibits v2/version
  evolution. The orchestrator still must execute the authored scaffold E2E gate.
- [x] Initial manual contract-file creation can be replaced by `netscript contract add <name>`;
  route/procedure authoring and tutorial prose changes remain the noted follow-up.
- [x] `docs/site/cli-reference.md` documents the supported contract command group.

### Drift and follow-up

- D1 and D2 remain as recorded in Design; no additional implementation drift occurred.
- No architecture debt was created or deepened.
- `deno.lock` was not modified.
- #706 remains the required follow-up for update/version, multi-version list, remove, add-route,
  service handler generation, consumer discovery, and detailed `inspect --json`.
