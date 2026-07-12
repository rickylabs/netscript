# Worklog — #698 generated-project TanStack AI MCP resolution

## Identity

- Orchestrator: beta-7 `df71d36c`.
- Lane: WSL Codex implementation agent.
- Worktree: `/home/codex/repos/ns-wt-698`.
- Branch: `fix/698-scaffold-tanstack-ai-mcp`.
- PR ownership: no PR will be opened; Tier-A review and IMPL-EVAL remain orchestrator-owned.

## Harness drift

- **D1 — PLAN-EVAL owner waiver:** the slice brief explicitly waives the separate PLAN-EVAL pass and
  requires this plan/design checkpoint before implementation.
- **D2 — resolution-mechanism correction:** the brief asked to reuse the mechanism that writes
  `@tanstack/ai*` into generated root import maps. Tree inspection and executable probes show that
  no such root entry exists today: `ui:add ai` writes `@netscript/ai`, while `plugin add ai` writes
  the three `@netscript/*` kind-source aliases. `@tanstack/ai` succeeds because its static import is
  visible to the published JSR package graph; the computed `@tanstack/ai-mcp` imports are not. The
  implementation therefore uses the established #640 cross-mode root-import mechanism
  (`PLUGIN_KIND_ROOT_IMPORTS` plus `resolveNetScriptImports`) for this runtime-only dependency.

## Research

- Issue #698's three acceptance boxes are the contract: published generated projects must resolve
  the MCP connector, the cross-mode guard must fail before/pass after, and CI owns the full local
  `scaffold.runtime` verdict.
- `packages/ai/src/mcp/adapters/tanstack-connector.ts` computes both `@tanstack/ai-mcp` and
  `@tanstack/ai-mcp/stdio`, so Deno/JSR static dependency discovery does not retain them in the
  published graph.
- `packages/ai/deno.json` is the version authority and exact-pins `@tanstack/ai-mcp` to
  `npm:@tanstack/ai-mcp@0.2.1`.
- `deno task deps:why @tanstack/ai-mcp` reports no static source/graph hit, matching the computed
  import diagnosis.
- An executable Deno probe using the package's bare alias imported both the package root and
  `/stdio` successfully (`createMCPClient` and `stdioTransport` were functions). No explicit
  `/stdio` import-map entry is required.
- Executable generated-map probes confirmed `ui:add ai` currently writes `@netscript/ai` but no
  TanStack alias, and `PluginWorkspaceMutator.ensureRootImportsForPluginKind(..., "ai")` likewise
  writes only the NetScript AI aliases.

## Plan

1. Extend the #640 semantic resolver guard to scan `@netscript/ai`'s real computed MCP specifiers
   and run it red against both generated-project package-source modes.
2. Add a finite scaffold package key for `@tanstack/ai-mcp`, map it to the exact package-owned npm
   pin in both resolver modes, and select it for the AI plugin kind through
   `PLUGIN_KIND_ROOT_IMPORTS`.
3. Run the guard green, the affected resolver/mutator/template unit tests, and scoped CLI check/lint
   wrappers; inspect lock and diff hygiene.
4. Complete this worklog, commit the bounded slice, and push the explicit branch refspec. Do not
   open a PR or run the full `scaffold.runtime` suite.

### Locked decisions

- The generated root alias is owned by the existing plugin-kind root-import registry because the
  dependency is required at runtime by the installed AI package, not imported by copied UI source.
- The target is copied exactly from `packages/ai/deno.json`; the guard will fail if the two pins
  drift.
- Only the bare `@tanstack/ai-mcp` alias is emitted. npm package export expansion covers `/stdio`,
  as verified before implementation.
- The change remains additive and kind-scoped; unrelated generated projects do not receive the MCP
  dependency.

### Open-decision sweep

- **Safe to defer:** independently duplicating the alias in the Fresh UI registry manifest. The
  failing generated-project flow installs the AI plugin before the AI collection, and the runtime
  dependency belongs to `@netscript/ai`; duplicating its exact pin in a UI item would create a
  second production version authority.
- No must-resolve-now decisions remain.

### Risks and mitigations

- **Pin drift:** compare the generated alias to the real `packages/ai/deno.json` import in the
  semantic guard.
- **False green from scanning no computed imports:** anchor the guard on both expected MCP
  specifiers before checking either mode.
- **Subpath over-mapping:** rely on the verified bare npm alias and assert `/stdio` resolves through
  that root alias.
- **Local-source shadowing:** the alias points to the same external npm package in both modes; no
  copied `@netscript/*` workspace member is shadowed.

## Design

- **Archetype:** Archetype 6 — CLI/tooling. `packages/cli` owns generated-project package-source
  resolution and plugin-install workspace mutation.
- **Public and command surface:** no exported symbol, entrypoint, option, or command changes. The
  generated root `deno.json` gains one AI-kind-scoped runtime alias.
- **Five spine abstracts:** `CliCommand<Input, Result>`, `CliCommandGroup`, `CliRoot`,
  `UseCase<Input, Result>`, and `Registry<TKey, TValue>` remain unchanged.
- **Layer-2 abstracts:** none introduced or modified.
- **Vertical feature catalog:** the public and local plugin-install features already delegate root
  mutation to `PluginWorkspaceMutator`; neither command feature changes. The implementation stays in
  the kernel scaffold constants/resolver and plugin adapter.
- **Extension axes:** existing `plugin kind` (`ai`) selects the root dependency; existing
  `PackageSourceMode` (`jsr`/`local`) selects the resolver target set. No new registry or axis.
- **Ports/adapters:** reuse `FileSystemPort` through `PluginWorkspaceMutator`; no new port, IO edge,
  or composition wiring.
- **Constants:** add `SCAFFOLD_PACKAGES.TANSTACK_AI_MCP` to the finite package vocabulary and reuse
  it in the resolver and AI root-import declaration. The npm target stays exact-pinned.
- **Composition declarativity:** public/maintainer/local composition roots are untouched.
- **Semantic test strategy:** scan the real computed-specifier source, reconstruct the two package
  specifiers, and assert the actual AI-kind generated root map resolves them in both source modes;
  avoid snapshots and hard-coded generated files.
- **Generated-project validation/consumer impact:** focused unit coverage proves import-map shape;
  CI owns the live `createMcpTransportPool(...).listTools()` scaffold runtime acceptance.
- **Commit slice:** one bounded defect-and-guard commit touching the scaffold package vocabulary,
  import resolver, plugin workspace mutator, focused tests, and this worklog. Proof is the recorded
  red/green guard plus scoped package gates.
- **Deferred scope:** no package API change, dependency bump, Fresh UI registry duplication,
  unrelated resolver refactor, full local `scaffold.runtime`, or published re-verification before
  the next immutable JSR cut.
- **Contributor path:** when a generated runtime adds a computed bare dependency, add its finite
  package key, resolver targets for both modes, the owning plugin-kind root declaration, and a
  source-scanning guard anchored on the real computed specifier.
- **Doctrine impact:** A14 is strengthened by a semantic consumer guard. No new layering, folder,
  public-surface, helper, or architecture-debt finding is introduced; AP-9 and AP-18 are avoided.
- **JSR audit:** N/A for this slice because no `mod.ts`, export map, public JSDoc, or package
  publish shape changes; the exact existing package dependency is only made resolvable in generated
  roots.

## Evidence

| Gate                      | Result            | Evidence                                                                                                                                                                                                                                                       |
| ------------------------- | ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Guard red-before          | Expected failure  | `deno test --unstable-kv --allow-read packages/cli/src/kernel/adapters/plugin/workspace-mutator_test.ts`: 12 passed, 1 failed. The scanner found both computed MCP specifiers, then failed because `@tanstack/ai-mcp` was unresolved by the `jsr` resolver.    |
| Guard green-after         | PASS              | Focused mutator run: 13 passed, 0 failed. Final combined resolver/mutator rerun after pin-drift strengthening: 15 passed (7 BDD steps), 0 failed. Both computed specifiers resolve to the exact package-owned target in `jsr` and `local` generated root maps. |
| Affected unit tests       | PASS              | Resolver, workspace mutator, root workspace, app, database, and service generator tests: 34 passed (38 steps), 0 failed.                                                                                                                                       |
| Scoped check              | PASS              | `run-deno-check.ts --root packages/cli --ext ts,tsx`: 600 files, 5 batches, 0 failed batches/occurrences.                                                                                                                                                      |
| Scoped lint               | PASS              | `run-deno-lint.ts --root packages/cli --ext ts,tsx`: 600 files, 3 batches, 0 occurrences.                                                                                                                                                                      |
| Owned-file format         | PASS              | `run-deno-fmt.ts` over the five changed TypeScript files: 5 files, 1 batch, 0 findings. The optional whole-CLI sweep found one unrelated pre-existing finding in untouched `e2e/src/application/gates/scaffold/runtime-gates.ts`; it was not modified.         |
| Bare-alias `/stdio` probe | PASS              | `deno eval --no-lock --config packages/ai/deno.json`: the bare `@tanstack/ai-mcp` alias loaded both `createMCPClient` and `@tanstack/ai-mcp/stdio`'s `stdioTransport` as functions.                                                                            |
| Diff and lock hygiene     | PASS              | `git diff --check` exited 0; `git diff --name-only -- deno.lock` was empty; status contained only the five owned TypeScript files and this run directory.                                                                                                      |
| Full `scaffold.runtime`   | Deferred by brief | CI owns merge-readiness; do not run locally.                                                                                                                                                                                                                   |

## Reconcile

- Re-read issue #698 and its comments (none). The first two acceptance boxes are implemented and
  locally guarded; the third remains the explicitly CI-owned `scaffold.runtime` verdict.
- The only plan drift is D2 above: there was no pre-existing generated-root `@tanstack/ai` alias to
  copy. The selected #640 root-import mechanism stays within the brief's named candidates and does
  not broaden the product surface.
- No PR was opened or updated, no issue metadata was changed, and no new/deepened architecture debt
  or lockfile churn was introduced.
