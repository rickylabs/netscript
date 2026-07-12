# #706 contract and service lifecycle extensions — Codex worklog

## Preflight

- Branch: `feat/706-contract-service-lifecycle`.
- Required base: `6f5484d2`.
- Observed HEAD before edits: `6f5484d2d76ce1270a22eaa3f26edc3e5aa6c036` — PASS.
- Required #702 seam:
  `packages/cli/src/public/features/contracts/add/add-contract.ts` — present.
- PLAN-EVAL: owner-waived by the slice brief (carried drift D1); this plan and Design checkpoint
  were recorded before product edits.
- Lock/E2E constraints: do not modify `deno.lock`; do not execute `e2e:cli` or
  `scaffold.runtime` in this lane.

## Plan

1. Generalize the contract version vocabulary and aggregate generation, then add a promotion flow
   that copies one named contract from `--from` to `--to`, renames versioned symbols, regenerates
   the destination aggregate, and regenerates the root version exports.
2. Add contract lifecycle verbs as sibling vertical features: remove files and regenerate affected
   aggregates; append a typed route stub; inspect source into procedure method/path/input/output
   summaries; make list discover every version when no version filter is supplied.
3. Add service lifecycle verbs as sibling vertical features: remove service workspace/config/member
   state and regenerate Aspire helpers; append a contract-verified handler stub; optionally scaffold
   a typed client/query module during `service add --with-client`.
4. Add semantic unit coverage for every mutation/parser path and update Steps 2–4 of the
   add-a-service guide to use the new scaffold verbs.
5. Run targeted tests, scoped CLI check/lint/format wrappers, command help checks, docs link checks,
   and lock/worktree inspection. The orchestrator retains the full scaffold runtime E2E gate.

## Design

### Archetype, overlays, and doctrine verdict

- Selected profile: **Archetype 6 — CLI / Tooling**, with **service** and **docs** scope overlays.
- Current doctrine verdict: `@netscript/cli` is recorded as **Restructure**, with its bounded A6
  promotion complete but separate maintainer-mode and permissions debt still open. This slice uses
  the established `src/public/features/<domain>/<verb>/` vertical shape and does not deepen those
  entries.
- In-scope anti-patterns: AP-1 (file size), AP-11/AP-25 (effects at adapters), AP-18 (semantic
  generated-output tests), AP-21 (feature folder cardinality), AP-23 (declarative composition).
- No package export map, dependency, or public `mod.ts` symbol changes are planned. JSR slow-type
  risk is N/A; the public surface is the CLI command graph and generated workspace contract.

### Public command surface

- `contract version add <name> --from <version> --to <version> [--path] [--force]`.
- `contract remove <name> [--version] [--path]`.
- `contract add-route <contract> <procedure> --method <method> --path <route> [--input] [--output]
  [--version] [--project-root]`.
- `contract inspect <name> [--version] [--json] [--path]`.
- `contract list [--version] [--path]`, where omission lists all discovered versions.
- `service remove <name> [--keep-contract] [--project-root]`.
- `service add-handler <service> <procedure> [--version] [--project-root]`.
- `service add ... [--with-client]` emits `apps/<app>/lib/<service>.ts` when an app workspace exists.

### Domain vocabulary and contracts first

- `ContractVersion` becomes the validated template-literal vocabulary ``v${number}``; parsing
  rejects zero, leading-zero, and nonnumeric versions.
- `ContractProcedure` carries `name`, `method`, `path`, `input`, and `output` summaries for dashboard
  and JSON consumers.
- Promotion/removal/route mutation and service removal/handler mutation receive explicit request,
  dependency, and result types before their implementations.
- HTTP methods are a finite constant tuple with a derived union; route/procedure/resource names use
  existing scaffold validation.

### Ports, effects, and adapters

- All reads, writes, copies, directory removal, and discovery go through `FileSystemPort`.
- Contract source parsing and version-symbol rewriting are pure functions in a focused contract
  adapter module; they use no new dependency or speculative port.
- Version aggregate/root export generation remains in contract template/registry adapters.
- Service appsettings/workspace mutation extends the existing service workspace mutator; Aspire
  helper regeneration continues through its existing injected scaffolder/template ports.
- Commands parse flags and render output only. No `Deno.*` or direct `console.*` is added to feature
  code; composition remains declarative.

### Existing spine, feature catalog, and extension axes

- Existing spine abstracts remain `CliCommand<Input, Result>`, `CliCommandGroup`, `CliRoot`,
  `UseCase<Input, Result>`, and `Registry<TKey, TValue>`; none changes.
- No layer-2 abstract or extension registry is introduced.
- Contract sub-features: existing `add`, `list`; new `version-add`, `remove`, `add-route`, `inspect`.
- Service sub-features: existing `add`, `list`, `generate`; new `remove`, `add-handler`.
- Existing registries (`TemplateRegistry`, contract file-backed version registry, command registry)
  keep their current key/value contracts.

### Generated outputs and semantic test strategy

- Version promotion owns `contracts/versions/<to>/<name>.contract.ts`, its `mod.ts`, and root
  `contracts/mod.ts`; tests assert renamed symbols/imports and multi-version discovery.
- Contract removal owns only matching contract files plus regenerated aggregates/root exports.
- Route mutation owns the named contract source and must round-trip through inspection.
- Handler mutation owns `services/<service>/src/routers/<version>.ts` and first verifies the
  procedure exists in the matching contract.
- Service removal owns the service directory, appsettings entry, Deno workspace member, generated
  Aspire helpers, and—unless retained—the paired contract across versions.
- Client scaffolding discovers the first `./apps/<name>` workspace member and mirrors the checked-in
  example client/query asset at `apps/<app>/lib/<service>.ts` with service-specific names.
- Tests assert parsed structure, named exports, file existence/removal, and stable JSON objects—not
  giant string snapshots. Generated-workspace compilation remains an orchestrator-owned consumer
  gate.

### Commit slice and contributor path

- One issue slice: lifecycle contract/types → adapters → vertical features → composition → docs/tests
  → scoped gates. It proves all five #706 acceptance boxes together because the commands share one
  generated-workspace lifecycle and the branch brief requests one pushed slice.
- Contributors add a contract verb under `public/features/contracts/<verb>/`, keep reusable file
  mechanics under `kernel/adapters/contracts/`, and register it in `contracts-group.ts`; service
  verbs follow the matching services path and reuse `kernel/adapters/service/` mutation seams.

### Risks and mitigations

- Source mutation can target the wrong brace: use a brace/string-aware bounded scanner and semantic
  parser tests for both memory and database contract templates.
- Removing a service can leave config drift: mutate directory, appsettings, workspace membership,
  helpers, and paired contracts in one use case with memory-filesystem assertions.
- Arbitrary version strings can become unsafe paths: validate through `parseContractVersion` before
  any join/write.
- Existing template variants use `oc` versus `baseContract`: detect and preserve the contract's
  existing route builder.
- The full scaffold compile is expensive and reserved: author focused semantic/type gates and state
  that end-to-end compilation remains unproven until the orchestrator runs it.

### Open decisions and deferred scope

- Locked: an omitted `contract remove --version` removes the named contract from every discovered
  version; an explicit version narrows the mutation.
- Locked: an omitted `contract list --version` lists all versions; explicit filtering remains.
- Locked: schema summaries are stable source expressions (or `null`), not runtime-evaluated Zod
  metadata; executing arbitrary workspace modules would add unsafe side effects.
- Safe to defer: nested procedure insertion. `add-route` creates a top-level procedure; inspection
  still reports existing nested generated routes using dotted names where discoverable.
- Safe to defer: automatic handler business logic. The emitted handler is compiling scaffolding and
  intentionally throws until implemented.
- Safe to defer: automatic v2 service router aggregation; #706 requires promoted contracts and
  handler scaffolds, not copying a full service implementation between versions.
- Completing the version verb and acceptance in this issue also completes #702's remaining
  version-evolution boxes; final evidence will say so explicitly.

## Evidence

### Implementation

- Generalized `ContractVersion` to validated `vN` values and made aggregate/root export generation
  version-aware. `contract version add` promotes one named contract, renames versioned symbols,
  regenerates the destination aggregate, and lists v1/v2 through the existing resolver.
- Added `contract remove`, `contract add-route`, and `contract inspect [--json]`; inspection emits
  stable method/path/input/output source summaries without executing workspace modules.
- Added `service remove` and `service add-handler`; removal reverses service directory,
  appsettings, Deno workspace, Aspire helpers, paired contracts, and generated client mutations.
- Added `service add --with-client`, using root workspace discovery to target the current
  `apps/<name>/lib/` layout and the canonical example SDK/query asset.
- Updated Steps 2–4 of the add-a-service guide with the new scaffold/evolution/inspection/removal
  commands.

### Gate results

| Gate | Result | Evidence |
| --- | --- | --- |
| Focused lifecycle semantic tests | PASS | 11 tests + 5 existing BDD steps, 0 failures. Covers promotion, aggregate/root exports, remove, route inspection, handler binding, service cleanup, client generation, and #702 add regression. |
| Scoped CLI check wrapper | PASS | `run-deno-check.ts --root packages/cli --ext ts,tsx`; 638 selected, 6 batches, 0 failed, using `deno check --quiet --unstable-kv`. |
| Scoped CLI lint wrapper | PASS | `run-deno-lint.ts --root packages/cli --ext ts,tsx`; 638 selected, 4 batches, 0 findings. |
| Owned-file format wrapper | PASS | `run-deno-fmt.ts` over 45 changed TS/TSX files; 1 batch, 0 findings. |
| Package-wide format wrapper | BASELINE DRIFT | One unrelated existing finding remains in `packages/cli/e2e/src/application/gates/scaffold/runtime-gates.ts`, identical in location to #702 evidence; this slice does not edit it. |
| Live public command help | PASS | Exit 0 for `contract version add`, `contract remove`, `contract add-route`, `contract inspect`, `service remove`, `service add-handler`, and `service add --help`; required flags and `--with-client` are present. |
| Focused generated-workspace lifecycle smoke | PASS | Local-source init → `add-route users ping` → `add-handler users ping` → promote v1→v2 → `service add billing --with-client` → generated consumer check → `service remove billing` + filesystem/config assertions. |
| Generated workspace `deno task check` | PASS | Exit 0; checks current app sources, users service/router, root contracts module, and both v1/v2 contract modules. Existing TanStack AI peer-version warning is non-fatal and unrelated. |
| Internal docs links | PASS | 96 docs, 0 broken links, anchors, or orphans. |
| CLI doctrine scan | BASELINE DRIFT | Exit 1 with 46 FAIL / 39 WARN / 1 INFO across documented legacy CLI debt (BDD globals, old cardinality/monolith/folder findings). No finding names a new file in this slice; all new files remain ≤130 LOC and feature folders remain under the 12-child cap. |
| Full `e2e:cli` / `scaffold.runtime` | NOT RUN (owner lane) | Explicitly prohibited by the slice brief; orchestrator retains this merge-readiness gate. |

### Acceptance status

- [x] `contract version add users --from v1 --to v2` produced compiling v2 source, aggregate, and
  root export; live `contract list` showed v1 and v2.
- [x] Contract/service removal semantic tests and the real billing removal smoke proved aggregates,
  appsettings, workspace membership, generated client, and helper regeneration are consistent;
  generated `deno task check` passed after removal.
- [x] `contract add-route` + `service add-handler` produced a compiling ping procedure in the real
  generated users service; the generated app/client consumer compiled against the same contract.
- [x] Live `contract inspect users --json` emitted `name`, `method`, `path`, `input`, and `output`
  for generated and newly appended procedures.
- [x] Steps 2–4 of `docs/site/how-to/add-a-service.md` reference the new verbs.
- [x] The version-evolution acceptance left open by #702 is now implemented and proven; #706
  completion therefore completes #702's remaining version boxes.

### Drift and corrective evidence

- D1 remains the explicit owner waiver for PLAN-EVAL.
- D2 (minor, structural): the planned `contracts/version/add/` source path was flattened to
  `contracts/version-add/` after doctrine review to avoid an unnecessary fifth nesting level; CLI
  spelling remains `contract version add`.
- The first disposable smoke attempt used invalid service port `3991` (allowed range is 3000–3099),
  so scaffold creation stopped and later missing-path errors were cascading non-verdicts. It was
  rerun fail-fast with port `3098`.
- The first corrected smoke check named legacy `app/main.ts`; current scaffold output is
  `apps/dashboard/main.ts`. Rerunning against the emitted path exposed a real `--with-client`
  legacy-path bug (`app/lib`), which was fixed through Deno workspace discovery and regression
  tested. The clean rerun passed add/check/remove end to end.
- No architecture debt was created or deepened. `deno.lock` was not modified.
