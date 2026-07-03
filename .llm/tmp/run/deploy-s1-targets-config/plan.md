# Plan: [Deploy-S1] `deploy.targets.*` config contract (#337)

## Run Metadata

| Field          | Value                                              |
| -------------- | -------------------------------------------------- |
| Run ID         | `deploy-s1-targets-config`                         |
| Branch         | `feat/deploy-s1-targets-config` (off `56ea68b2`)   |
| Phase          | `plan`                                             |
| Target         | `packages/config` (+ CLI deploy consumers)         |
| Archetype      | `1 - small-contract`                               |
| Scope overlays | `none` (schema contract; no frontend/service/docs) |

## Archetype

**ARCHETYPE-1 (small-contract).** The slice's product is a Zod schema + derived TypeScript types and
small invariants published from `packages/config`. Consumer re-keys in the CLI deploy feature are
folded in as consumer-import updates (gate matrix: "Consumer import validation" is required when
touched), not a second archetype. No long-running behavior, no external-system adapter — so not
Arch-2/3/6.

## Current Doctrine Verdict

N/A for a schema contract change beyond: config schemas are a public surface (`packages/config`
exports), so F-5 public-surface and F-6 JSR-publishability apply. Confirm against doctrine file 10 in
the change map step.

## Axioms in Play

| Axiom                     | Why it matters                                                             |
| ------------------------- | ------------------------------------------------------------------------- |
| Contract-first            | Define the schema/type contract before any adapter (#339–#343) consumes it |
| Wrap, do not reinvent     | Reuse existing Zod patterns in `packages/config`; no new schema framework   |
| Public surface is explicit | New exports must be intentional and JSR-clean                             |

## Goal

Replace the `deploy.windows.*`-only deploy schema with a general `deploy.targets.*` **keyed object**
(shared `DeployTargetBaseSchema` + a `windows` member extending it), re-key the Windows lane to
`deploy.targets.windows`, and update every consumer + test to the new shape. Clean break, no alias.
This slice ships base + windows only; downstream slices extend the base.

## Scope

- New `deploy.targets` map keyed by target name in `packages/config` deploy schema.
- Shared base schema: `mode` (`compile|script`), `denoPath`, `compileTarget`, concurrency, timeouts,
  bundle opts, `workspace`, `v8HeapMb`, `generateEnvFile`, `logging`, `health`.
- Windows member schema (servy: `installBase`, `servicePrefix`, `servyCliPath`) under
  `deploy.targets.windows`, reusing the current field set verbatim.
- Keep the existing `docker` sub-block + `denoBaseImage` on the Windows target for now; re-pin
  `denoland/deno:2.5` → `denoland/deno:2`. (A dedicated docker/compose target is #342/#343's surface,
  not this slice — see L-6.)
- **This slice ships ONLY the shared `DeployTargetBaseSchema` + the `windows` target member. No
  `linux`/`deno-deploy`/`docker`/`compose` member schemas are added** (resolved: L-6). Downstream
  slices (#339–#343) extend the exported base to add their own members — they do not restructure.
- Update derived type exports + every consumer that reads `config.deploy.windows.*`.
- Update tests, fixtures, and add a one-line config migration note.

## Non-Scope

- No adapter behavior, CLI verb wiring, `deno compile`/systemd/Deno Deploy/Aspire logic (#339–#343).
- No back-compat alias for `deploy.windows.*` (D5 clean break).
- No scaffold-template regeneration beyond what the schema change forces (flag in drift if it does).

## Hidden Scope

- Consumers may read `deploy.windows` via a derived type import rather than a literal path — grep the
  type name, not just the string.
- A scaffold template or fixture may emit a `deploy:` block that must be re-keyed or the E2E fails.
- `z.infer` alias names are part of the public surface; renaming them ripples to importers.

## Locked Decisions

| ID   | Decision                                                             | Rationale                          |
| ---- | ------------------------------------------------------------------- | ---------------------------------- |
| L-1  | Clean break to `deploy.targets.*`; no `deploy.windows.*` alias      | D5 user override 2026-07-03        |
| L-2  | Windows field set reused verbatim under `deploy.targets.windows`    | Preserve the one working lane      |
| L-3  | `denoBaseImage` re-pinned `deno:2.5` → `deno:2`                     | Repo is on Deno 2.9; 2.5 pin dead  |
| L-4  | Only schema + consumer re-key + tests in this slice                 | Adapters are #339–#343             |
| L-5  | Per-target member schemas via a **plain keyed `z.object`** with base | Matches spec §3.3 + existing root-config composition (`deploy` is already `z.object`); a `z.discriminatedUnion` is wrong — `targets` is a name-keyed map, not a tagged array |
| L-6  | Ship ONLY `DeployTargetBaseSchema` + `windows` member this slice; NO linux/deno-deploy/docker/compose member schemas | Unused member schemas are speculative public surface — collide with F-5 (intentional exports) + F-7 (doc-score); #339–#343 extend the exported base to add their own |
| L-7  | **RENAME** the Windows input-config exports to target-oriented names: `WindowsDeployConfigSchema`→`WindowsDeployTargetSchema`, `WindowsDeployConfig`→`WindowsDeployTarget`; add `DeployTargetBaseSchema` + `DeployTargetBase` | D5 clean-break/production-grade directive: the symbol names should match `deploy.targets.windows`. Resolves the F-5 keep-vs-rename open decision. `ResolvedWindowsDeployConfig` (CLI resolved layer) is NOT renamed — it stays windows-shaped this slice (L-4) |
| L-8  | Every NEW exported Zod schema carries an explicit `z.ZodType<…>` annotation | F-6 JSR slow-type avoidance — existing schemas already do this (`z.ZodType<WindowsDeployConfig \| undefined>`); an inferred Zod export becomes a slow type and fails `deno publish`. Highest-probability defect for a schema-export change |

## Open-Decision Sweep

All rework-forcing decisions are resolved before slicing (none deferred):

| Decision                                              | Status              | Resolution                                        |
| ----------------------------------------------------- | ------------------- | ------------------------------------------------- |
| Discriminated union vs plain keyed record for targets | RESOLVED (L-5)      | Plain keyed `z.object({ windows, … })` with a shared base — consistent with how the root schema composes members |
| Keep vs rename the Windows public export names        | RESOLVED (L-7)      | Rename to `WindowsDeployTargetSchema`/`WindowsDeployTarget`; enumerate across all four barrels (Change Map §A) |
| Ship non-windows target member schemas now?           | RESOLVED (L-6)      | No — base + windows only; downstream slices extend the base |
| JSR slow-type risk on new Zod exports                 | RESOLVED (L-8)      | Explicit `z.ZodType<…>` annotation mandatory on every new exported schema |

## Risk Register

| Risk                                                        | Mitigation                                             |
| ----------------------------------------------------------- | ------------------------------------------------------ |
| A missed consumer of `deploy.windows.*` fails type-check    | Grep both the literal path and the derived type names  |
| Scaffold fixture emits old shape → E2E red                  | Evaluator runs `scaffold.runtime` if scaffold touched  |
| Over-building downstream target fields (scope creep)        | L-4: minimal member shapes only                        |

## Anti-Patterns to Resolve or Avoid

| AP        | Status | Plan                                                        |
| --------- | ------ | ----------------------------------------------------------- |
| dead-config | existing | Remove the unused `deno:2.5` docker fragment as part of migration |

## Fitness Gates (ARCHETYPE-1 required)

| Gate  | Required | Expected evidence                                             |
| ----- | -------- | ------------------------------------------------------------ |
| F-1   | yes      | File-size lint on changed files                              |
| F-5   | yes      | Public-surface audit: new/changed exports intentional        |
| F-6   | yes      | JSR publishability of `packages/config` — **every new exported Zod schema (`DeployTargetBaseSchema`, `WindowsDeployTargetSchema`) MUST carry an explicit `z.ZodType<…>` annotation** (L-8) so it is not an inferred slow type; verify via `deno publish --dry-run` / `deno doc --lint` on the package |
| F-7   | yes      | Doc-score gate (JSDoc on new exported schemas/types)         |
| F-8   | yes      | Workspace lib check                                          |
| F-10  | yes      | Test-shape audit: schema tests cover new targets + rejection |
| F-11  | yes      | Forbidden-folder lint                                        |
| F-12  | yes      | Naming-convention lint                                       |
| F-14  | yes      | Console-log lint                                             |
| F-15  | yes      | Re-export-upstream lint                                      |
| F-16  | yes      | Folder-cardinality lint                                      |
| F-17  | yes      | Abstract-derived co-location                                 |
| F-18  | yes      | Sub-barrel lint                                              |
| Static | yes     | fmt:check + lint + `deno task check --unstable-kv`           |
| Consumer-import | yes | CLI deploy consumers type-check against the new shape    |

## Arch-Debt Implications

| Entry                          | Action | Notes                                                   |
| ------------------------------ | ------ | ------------------------------------------------------- |
| `cli-deploy-artifacts-missing` | none here | Owned by #344 (docs/code divergence); note cross-ref  |

## Validation Plan

| Order | Gate            | Command or check                                                                 | Expected result |
| ----- | --------------- | -------------------------------------------------------------------------------- | --------------- |
| 1     | Static check    | `deno run -A .llm/tools/run-deno-check.ts --root packages/config --ext ts` (+`--unstable-kv`) | pass |
| 2     | Config tests    | config schema test task (confirm exact task in change map)                       | pass            |
| 3     | Consumer check  | `.llm/tools/run-deno-check.ts --root packages/cli/src/public/features/deploy`     | pass            |
| 4     | Root quality    | `deno task fmt:check` + `deno task lint` + `deno task check --unstable-kv`        | pass (evaluator) |
| 5     | Scaffold E2E    | `deno task e2e:cli run scaffold.runtime --cleanup` **iff** scaffold config touched | pass (evaluator) |

## Change Map

Shape decision (locks L-5): `deploy.targets` is a **keyed object** (keys `windows`, later `linux`,
`deno-deploy`, `docker`/`compose`), each value a member schema extending a shared base — NOT a
`z.discriminatedUnion` array. This preserves natural `config.deploy.targets.windows.*` access and
matches spec §3.3. Resolution for non-windows targets lands with their adapters (#339+); this slice
keeps the resolved layer windows-shaped and only re-keys its input path.

**A. Schema (`packages/config`) — load-bearing:**
- `src/domain/schemas/deploy-schema.ts` — split `WindowsDeployConfigSchema` (L8–106) into a new shared
  `DeployTargetBaseSchema` (mode/denoPath/compileTarget/concurrency/timeouts/bundle/workspace/v8HeapMb/
  generateEnvFile/logging/health/docker) + `WindowsDeployTargetSchema` (extends base with the servy
  members: `installBase`, `servicePrefix`, `servyCliPath`). `DeployConfigSchema` (L112–117) changes
  `windows: …` → `targets: z.object({ windows: WindowsDeployTargetSchema.optional() })`. Both new
  schemas carry explicit `z.ZodType<…>` annotations (L-8). Re-pin `denoBaseImage` `deno:2.5`→`deno:2`.
- `src/domain/config-section-types.ts` — `WindowsDeployConfig` (L357–420) → `DeployTargetBase` +
  `WindowsDeployTarget`; `DeployConfig` (L423–426) `windows?` → `targets?: { windows?: WindowsDeployTarget }`.
- `src/domain/schemas/netscript-config-schema.ts` — L9 import + L154 `deploy: DeployConfigSchema`
  (`DeployConfigSchema` name kept → import line unchanged; verify).
- `src/domain/config-root-types.ts` — L68 + L104 `deploy?: DeployConfig` (`DeployConfig` name kept → no
  edit; verify).

**A2. Public re-export surface — ALL FOUR barrels (F-5, enumerated per L-7 rename):**
- `src/domain/mod.ts` — L14 `export * from './schemas/deploy-schema.ts'` (wildcard → picks up the new
  `DeployTargetBaseSchema`/`WindowsDeployTargetSchema`, drops `WindowsDeployConfigSchema`; verify no
  explicit named re-export needs editing).
- `src/public/mod.ts` — L25 `DeployConfigSchema` (kept), L34 `WindowsDeployConfigSchema`→
  `WindowsDeployTargetSchema` + add `DeployTargetBaseSchema`, L45 `DeployConfig` (kept), L78
  `WindowsDeployConfig`→`WindowsDeployTarget` + add `DeployTargetBase`.
- `mod.ts` (package root public barrel) — **L117** re-exports `WindowsDeployConfig` → rename to
  `WindowsDeployTarget` (+ `DeployTargetBase` if surfaced here); verify schema re-exports too.
- `src/merge/mod.ts` (the `@netscript/config/merge` entrypoint) — **L46** re-exports
  `WindowsDeployConfig` → rename to `WindowsDeployTarget`; verify the deploy-merge helper below.

**B. Resolver / resolved-config (`packages/cli` kernel) — consumer re-key:**
- `src/kernel/adapters/config/deploy-config-resolvers.ts` — `resolveWindowsDeploy(userDeploy?.windows)`
  (L258–299) → read `userDeploy?.targets?.windows`.
- `src/kernel/domain/resolved-config.ts` — `ResolvedWindowsDeployConfig` (L180–226) + `ResolvedConfig.deploy`
  (L267): keep windows-shaped this slice; note multi-target generalization deferred to #339+.
- `src/kernel/constants/windows.ts` — defaults unchanged (only the input path moved).

**C. Build/adapter consumers (read resolved config, mostly unaffected by the input re-key):**
- `src/public/features/deploy/build/build-windows-strategy.ts` (reads `.workspace`, `.bundleExternal*`,
  `.compileTarget`, timeouts, `.concurrency`, `.generateEnvFile` off the **resolved** config — L130–289):
  unaffected if resolved shape kept; verify.
- `build/build-windows-cli.ts` (L52, L118), `adapters/windows/compile/compile-config.ts` (comment L48),
  `public/adapters/servy-cli.ts` (L18 `.servyCliPath`), `kernel/adapters/deploy/commands/servy-command.ts`
  (L67), `public/features/deploy/deploy-group.ts` (orchestration): verify against resolved shape.

**D. Merge behavior (`packages/config/src/merge`) — granularity shift (non-blocking, test it):**
- `src/merge/mod.ts` L184 deep-spreads deploy one level: `{ ...base.deploy, ...contribution.deploy }`.
  Under the old `{ windows }` shape a plugin fragment replaced at the `windows` key; under
  `{ targets: { … } }` a fragment now replaces the entire `targets` map wholesale (coarser). ADD a
  merge test asserting the new granularity, or explicitly accept it in worklog/drift if no plugin
  contributes a `deploy` fragment today (recon: none found — accept + test-guard).

**E. Tests + docs:**
- `src/public/features/deploy/build/deploy_test.ts` — integration mocks `loadConfig()`; update any mock
  that emits `deploy.windows` → `deploy.targets.windows`. ADD schema-validation tests: accept a valid
  `targets.windows`, reject old `deploy.windows`, reject unknown target keys.
- `docs/site/how-to/deploy.md` — old-shape references (L29, L252): the full rewrite is #344's scope;
  here add only the one-line migration note (`deploy.windows` → `deploy.targets.windows`).
- **Comment-only prose** (not type-load-bearing, fix for accuracy): `deploy-config-background.ts:156`,
  `kernel/constants/windows.ts:5,176`, `adapters/windows/compile/compile-config.ts:48` mention
  `deploy.windows`.

**Grep keys before declaring done:** literal `deploy.windows` / `.windows`; type names
`WindowsDeployConfig`→`WindowsDeployTarget`, `DeployConfig`, `DeployTargetBase`,
`ResolvedWindowsDeployConfig` (unchanged); schema names `WindowsDeployConfigSchema`→
`WindowsDeployTargetSchema`, `DeployTargetBaseSchema`, `DeployConfigSchema`.

**Type-check task:** no dedicated `check:config`; use scoped wrapper
`.llm/tools/run-deno-check.ts --root packages/config --ext ts` and `--root packages/cli/src/...deploy`,
plus root `deno task check --unstable-kv`.

## Commit Slices

Ordered, each names what it proves, the gate that proves it, and the files it touches. Push after
each (incremental, per Directive D). All within `packages/config` + `packages/cli` deploy consumers.

| # | Slice | Proves | Gate | Files |
| - | ----- | ------ | ---- | ----- |
| CS-1 | Schema split: `DeployTargetBaseSchema` + `WindowsDeployTargetSchema`, `DeployConfigSchema.targets`, `denoBaseImage` re-pin, explicit `z.ZodType<…>` annotations | New contract type-checks + is JSR-clean (no slow types) | `run-deno-check.ts --root packages/config --ext ts` + F-5/F-6/F-7 + `deno publish --dry-run` on the package | `src/domain/schemas/deploy-schema.ts` |
| CS-2 | Derived types + four-barrel re-export rename (`WindowsDeployConfig*`→`WindowsDeployTarget*`, add `DeployTargetBase*`) | Public surface consistent across all four barrels; no dangling old export | `run-deno-check.ts --root packages/config` + F-5 + grep-keys clean | `config-section-types.ts`, `src/domain/mod.ts`, `src/public/mod.ts`, `mod.ts` (root), `src/merge/mod.ts` |
| CS-3 | CLI resolver/consumer re-key (`userDeploy?.windows`→`userDeploy?.targets?.windows`); comment-prose fixes | Deploy consumers type-check against the new input shape | `run-deno-check.ts --root packages/cli/src/public/features/deploy` + `--root .../kernel/adapters/config` (consumer-import gate) | `deploy-config-resolvers.ts`, comment-only: `deploy-config-background.ts`, `constants/windows.ts`, `compile-config.ts` |
| CS-4 | Schema + merge-granularity tests, `deploy_test.ts` mock re-key, one-line docs migration note | New shape accepted, old shape + unknown keys rejected, merge granularity guarded | config test task + `run-deno-check.ts --root .../deploy` | `deploy_test.ts`, a schema/merge test, `docs/site/how-to/deploy.md` |
| CS-5 | Root quality reconcile (fmt/lint/check across the diff) | CI quality gate green pre-eval | `deno task fmt:check` + `deno task lint` + `deno task check --unstable-kv` | (whole diff) |

Slice count 5 (< 30). CS-1→CS-2→CS-3 are strictly ordered (types before consumers); CS-4 depends on
CS-1/CS-3; CS-5 last. No scaffold-template edits are planned, so `scaffold.runtime` e2e is an
evaluator-only merge-readiness gate, not a per-slice gate (flag in drift if any scaffold fixture must
change).

## Risks

- See Risk Register. Primary: silent consumer breakage → mitigated by type-check + grep of derived types.

## Dependencies

- None upstream. **Unblocks #339, #340, #342, #343** (they extend `deploy.targets.*`).

## Drift Watch

- If the schema change forces scaffold-template regeneration, log it (scope was schema-only).
- If a discriminated union proves incompatible with the existing config-composition pattern, log and
  fall back to a keyed record with base refinement.
