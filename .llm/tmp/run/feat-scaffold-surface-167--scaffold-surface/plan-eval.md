# PLAN-EVAL verdict — Plan v2 for Plugin Command Surface Unification (#157, PR #172)

| field | value |
| --- | --- |
| run id | `feat-scaffold-surface-167--scaffold-surface` |
| evaluator model | `openrouter/minimax/minimax-m3` (via OpenRouter) |
| plan-gate ref | `.llm/harness/gates/plan-gate.md` |
| protocol ref | `.llm/harness/evaluator/plan-protocol.md` |
| branch | `feat/scaffold-surface-167` |
| PR | #172 |
| issue | #167 |
| task | #157 |
| plan artifact | `.llm/tmp/run/feat-scaffold-surface-167--scaffold-surface/plan.md` (v2, locked 2026-06-29 in 3412c469) |
| research artifact | `.llm/tmp/run/feat-scaffold-surface-167--scaffold-surface/research.md` (RE-ARCHITECTURE v2) |
| protocol | read-only plan evaluation; no source/plan edits |
| **VERDICT** | **`PASS`** |

---

## Verdict

**`PASS`** — Plan v2 satisfies every box of `gates/plan-gate.md` and every one of the nine
PLAN-EVAL scrutiny points. The plan is doctrine-legal, layered correctly, JSR-ready,
source-leak-free, item-generator-sound, taxonomically coherent, properly tooled, properly gated,
correctly sequenced, and re-baselined against current branch reality. The user-granted
re-architecture license (commit `beb931d6`, 2026-06-29) is honored: the plan is bold about
restructuring `packages/plugin` and `packages/cli` wherever it reduces duplication, and the
spirit of the license is respected throughout. Implementation may begin.

---

## Evidence (file/line anchored)

### Ground truth confirmed against the live branch tree

- Three overlapping mechanisms exist today and are correctly named by the plan:
  - `packages/cli/src/public/features/plugins/add/render-plugin.ts:36` (`renderPlugin()`) +
    `packages/cli/src/kernel/templates/plugins/generate-plugin-service.ts` and its 7 sibling
    `generate-*.ts` factories — string-concatenated source generators that copy
    `services/`/`router`/`contracts`/`src/runtime`/`src/aspire`/`bin/` into userland.
  - v1 thin `@netscript/plugin/scaffold` shipped in `832fa9e8` (2026-06-28) — `ScaffoldArtifact`,
    `renderManifest`, `parsePluginName`, `createPluginScaffold`. Five per-plugin thin scaffolders
    built on top (`plugins/{workers,sagas,triggers,streams,auth}/src/scaffold/`).
  - Per-plugin `plugins/*/src/scaffolding/` `*.template` files with `{{exportName}}`/`{{id}}`
    placeholders (e.g. `plugins/workers/src/scaffolding/templates/workflow.ts.template:3-4`).
- Three forked item-scaffolder contracts exist today and are correctly named by the plan:
  `PluginItemScaffolder<TInput>` (core), `WorkersItemScaffolder<>` in
  `plugin-workers-core/abstracts/`, inline `SagasItemScaffolder`, bare
  `TriggerDefinitionScaffolder` interface.
- `PluginCli.run()` concrete on a base class — A4 violation — confirmed at
  `packages/plugin/src/cli/base/plugin-cli.ts:30-37`. Fix correctly placed in v2 plan.
- `FRAMEWORK_VERBS = ['add','remove','enable','disable','sync','setup','update','doctor','info']`
  confirmed at `packages/cli/src/public/features/plugins/dispatch/dispatch-plugin-verb.ts:13-22`.
  Plan's rename plan (`add→install`) is grounded.
- Host-side config wiring the plan KEEPS confirmed at
  `packages/cli/src/public/features/plugins/add/add-plugin.ts:144,151,161,165`
  (`copyPluginSchemasToRootDb`, `updateAppsettings`, `ensureNetScriptConfigPlugin`,
  `ensureRootImportsForPluginKind`).
- `deno.json` of `@netscript/plugin` has no `@netscript/cli` import in
  `src/scaffold/` or `src/cli/` — layering direction is correct.
- `deno.lock` has not been touched since `9d477461 (v0.0.1-alpha.12)`; no churn. ✓
- `arch:check` / `plugins:check` wrappers exist at `.llm/tools/fitness/check-doctrine.ts` and
  `.llm/tools/fitness/check-architecture-gates.ts`; the wrapper composition pattern
  (`.llm/tools/run-deno-doc-lint.ts`, `.llm/tools/run-publish-dry-run.ts`,
  `.llm/tools/scaffold-e2e-test.ts`) is available for S8 to compose. ✓
- Branch state: `beb931d6 (HEAD) docs(scaffold-167): record re-architecture license` →
  `3412c469 docs(scaffold-167): lock unified plugin-command-contract architecture (v2)` →
  `8554c427 docs(scaffold-167): add author-side tooling (plugin verify + plugin new) + DoD`.
  Pre-license code commits (S1, S2a, S2b×3, S2c) shipped v1 surface; v2 will reconcile
  forward-only (no force-push, no reverts — v1 deletions STAY deleted; v1 `src/scaffold/*` is
  replaced by `src/adapter/*` IN S1 itself).

### Doctrine anchors (cross-checked)

- Doctrine 03 cross-package inheritance ban: heading at
  `docs/architecture/doctrine/03-base-and-derived-classes.md:164` (plan says L162-175, within
  tolerance). Plan honors this — `NetScriptPlugin` is `interface`, `createPluginAdapter(plugin)`
  is a factory returning a typed adapter object (Vite-plugin shape). Per-plugin
  `resources/<r>.ts` implements the interface, not `extends`. ✓
- Doctrine 03 A4 (base classes stub-only): `PluginCli.run()` concrete body is correctly identified
  as the violation; the fix (`PluginCommandRunner` + `PluginCli` returns to abstract stub) is
  sound. ✓
- Doctrine 03 A5 composition-over-inheritance: `createPluginAdapter` factory is the textbook
  composition shape. ✓
- Doctrine 03 A7 @std/Web-first: plan leans on `@std/text`, `@std/path`, `@std/assert`,
  `deno doc --lint`, `deno publish --dry-run`. ✓
- Doctrine 03 A11 name-extension-axes: `install`/`doctor`/`info`/`update`/`remove` mandatory
  set + `add`/`generate <resource>` optional axes — disciplined axis separation. ✓
- Layering: `domain→ports→application→adapters→presentation`; `@netscript/plugin` does not
  import `@netscript/cli` (confirmed by grep on the live tree). ✓
- `doctrine 03 R-BASE-L2` (shared bodies when ≥2 concretes need them): mandatory-command logic
  for install/doctor/info/update/remove lives WITHIN `@netscript/plugin/adapter/commands/` —
  lawful. Plan cites this implicitly. ✓

### Plan-gate.md boxes (`.llm/harness/gates/plan-gate.md`)

| box | result |
| --- | --- |
| Research present, current, with command/file evidence | ✓ — research.md cites live `dispatch-plugin-verb.ts:178-204`, `add-plugin.ts:125-150`, `db-integration.ts:176-234`; re-architecture license cited |
| Decisions locked (one-way, not re-litigated) | ✓ — D-UNIFY, D-MANDATORY, D-OPTIONAL, D-ONE-ITEM, D-RENAME, D-OWN, D-LANE, D-SHAPE, D-EMIT, D-NOCOPY, D-PRISMA, D-CONFIG-KEEP, D-BYTE all locked with rationale |
| Open-decision sweep folded in | ✓ — `add→install` rename, mandatory set, extension model all locked by user 2026-06-29 |
| Commit slices enumerated + ordered | ✓ — S0(folded→S1), S1, S2, S3, S4, S5; S6 anytime after S1; S8 after S1+S4; S9 after S1+S8; S7 last; each slice names what it proves + gates + files touched |
| Risk register | ✓ — risks flagged inline where they bite (S4 breaking rename is acceptable pre-1.0; S5 doctrine gate extension is new work; S9 e2e closes the loop). Not a separate section, but visible and actionable. |
| Gate set selected + wired to slices | ✓ — `arch:check`/`plugins:check` extended over `packages/plugin` + 5 plugins in S5; jsr-audit (`deno publish --dry-run`) per slice; scoped check/lint/fmt per slice; `e2e:cli`; `scaffold-e2e-test.ts` |
| Deferred scope explicit | ✓ — root-schema typed-builder recorded as debt (not blocker); `frame-work-templates/**` deletion recorded in DELETE-list |
| jsr-audit policy | ✓ — explicit return types (no slow types), `@module` + symbol JSDoc with `@example`, clean publish file list (`**/*.test.ts` excluded), `publish:dry-run` green; new `./adapter` export follows the S1 pattern |
| Re-baseline (no stale carried-in plan) | ✓ — plan reflects branch state correctly: v1 `src/scaffold/*` identified as superseded, v2 `src/adapter/*` to be built IN S1, S2-S3 already on v1 surface and will be re-pointed; S0 reconcile is forward-only (no force-push) |

### PLAN-EVAL nine-point scrutiny

1. **One contract, no duplication.** The plan genuinely collapses THREE mechanisms
   (`renderPlugin()`+`generate-*` factories, v1 thin `@netscript/plugin/scaffold`, per-plugin
   `*.template` files) and THREE forked item-scaffolder contracts into ONE core-owned
   `ItemScaffolder<TInput> { name; emit(input): readonly ScaffoldArtifact[] }` plus ONE
   `NetScriptPlugin` contract via `createPluginAdapter`. No fourth mechanism is introduced —
   `ScaffoldArtifact` API is REPLACED by `@netscript/plugin/adapter`, not added to. ✓
2. **Doctrine-legal extension.** Plugins supply a typed contract object via
   `createPluginAdapter` (composition + seams, Vite-style), with NO `plugins/*` adapter
   `extends`-ing a base from `@netscript/plugin`. Shared mandatory-command logic lives WITHIN
   `@netscript/plugin/adapter/commands/`. `PluginCli.run()` orchestration is moved to a
   `PluginCommandRunner` so the spine stays A4 stub-only. ✓
3. **Layering + JSR.** `@netscript/plugin/adapter` does not import `@netscript/cli` (live tree
   confirms no `@netscript/cli` import in `@netscript/plugin`); new export follows the S1 JSR
   pattern (barrel with re-exports, explicit types, `@module` + symbol docs, clean file list,
   `publish:dry-run` gate in each touched slice). ✓
4. **No source leak.** The negative e2e (S5) — using `.llm/tools/scaffold-e2e-test.ts` — asserts
   no plugin TS source (`services/`, `router`, `contracts`, `src/runtime`, `src/aspire`,
   `bin/`) in userland. Existing S2a-S2c forbidden-prefix sweeps are the template. Prisma schema
   is the only emitted artifact from the plugin tarball (D-PRISMA). ✓
5. **Item generator soundness.** The ONE `ItemScaffolder<TInput>` uses type-checked stub source
   + typed identifier substitution (named tokens, not `String.replace`, not line-array
   `join`). `install` calls each starter resource's `emit(defaultInput)`; `add <resource> <id>`
   calls `emit({id})`. Same code path → zero duplication. ✓
6. **Command taxonomy + rename.** Mandatory install/doctor/info/update/remove (core-owned) +
   optional `add`/`generate <resource>` (plugin-implemented) + plugin verbs
   (run/logs/inspect/enable/disable). The breaking rename `plugin add <kind>` →
   `plugin install <kind>`, `<kind> add <resource>`, `<kind> generate <resource>` is coherent
   pre-1.0. CLI dispatch rewire (S4) keeps host-side config wiring +
   `copyPluginSchemasToRootDb`. ✓
7. **Author tooling (S8/S9) is real and dogfooded.** `plugin verify` composes
   `deno doc --lint` (via `.llm/tools/run-deno-doc-lint.ts`), `deno publish --dry-run` (via
   `.llm/tools/run-publish-dry-run.ts`), manifest schema, `arch:check` (via
   `.llm/tools/fitness/check-doctrine.ts`), contract-completeness — no bespoke linters.
   `plugin new` (S9) emits a conforming skeleton on the SAME item generator that passes
   `plugin verify` + dry-run with zero edits. ✓
8. **Gates-as-actual-gates + DoD.** `arch:check`/`plugins:check` extension over `packages/plugin`
   + 5 plugins is correctly sequenced in S5 and made merge-blocking. Slice plan is correctly
   sequenced, each slice independently gated/committed/pushed, zero dead/duplicate code at the
   end, no new casts beyond the 2 sanctioned, no `any`, no `deno.lock` churn, forward-only. ✓
9. **Re-baseline.** Plan reflects current branch reality (HEAD = `beb931d6`, v2 plan lock +
   tooling DoD + dispatch prompt are the most recent commits; S1-S2 are pre-license code that
   will be reconciled forward-only by S0/S1/S2/S3). All file/line references accurate within
   ±2 lines. ✓

---

## Non-blocking observations for IMPL-EVAL

These are noted so IMPL-EVAL does not re-discover them. They do NOT affect PASS:

1. **S1 scope is large** — building the full `@netscript/plugin/adapter/*` surface (10 files in
   the directory tree) in one slice. IMPL-EVAL should verify each sub-file is independently
   type-checked, doc'd, and unit-tested within S1.
2. **`ItemScaffolder<TInput>` typed substitution is contractually specified but mechanically
   under-specified.** IMPL-EVAL should verify the implementation uses a type-level `Map<TInput,
   TokenMap>` (or equivalent) such that missing tokens are compile errors, not runtime errors.
3. **Mandatory-command logic location is implicit in the plan.** IMPL-EVAL should verify each
   mandatory verb has exactly one owner module in `@netscript/plugin/adapter/commands/`,
   callable via the `InstallSpec`/`DoctorSpec`/`InfoSpec` seams.
4. **Root-schema typed-builder is explicitly deferred to debt.** Not in scope; record in
   `.llm/plans/` for follow-up.
5. **`enable`/`disable`/`sync`/`setup` keep current names.** Verify dispatch surface in
   `dispatch-plugin-verb.ts` reflects this after S4.

---

## Acknowledged risks (carried by the plan, not blocking)

- The slice plan covers the visible surface but assumes each per-plugin PR is independently
  releasable. S3 (`4 remaining plugins: sagas/triggers/streams/auth`) is high-risk if any of
  them have a non-conforming contract shape; the plan's "shape as a separate commit" guidance
  mitigates this.
- The breaking CLI rename (`add→install`) is acceptable pre-1.0 per the plan; IMPL-EVAL must
  grep for any external doc/example that uses `netscript plugin add` and flag in PR comments.

---

## Sign-off

This plan is **approved for implementation** under the user-granted re-architecture license
of 2026-06-29. IMPL-EVAL may begin when this verdict is recorded against PR #172.