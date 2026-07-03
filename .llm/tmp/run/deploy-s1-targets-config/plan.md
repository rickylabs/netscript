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

Replace the `deploy.windows.*`-only deploy schema with a general `deploy.targets.*` discriminated map
(shared base + per-target member schemas), re-key the Windows lane to `deploy.targets.windows`, and
update every consumer + test to the new shape. Clean break, no alias.

## Scope

- New `deploy.targets` map keyed by target name in `packages/config` deploy schema.
- Shared base schema: `mode` (`compile|script`), `denoPath`, `compileTarget`, concurrency, timeouts,
  bundle opts, `workspace`, `v8HeapMb`, `generateEnvFile`, `logging`, `health`.
- Windows member schema (servy: `installBase`, `servicePrefix`, `servyCliPath`) under
  `deploy.targets.windows`, reusing the current field set verbatim.
- Migrate the unused `docker` sub-block + `denoBaseImage` under a docker/compose target; re-pin
  `denoland/deno:2.5` → `denoland/deno:2`.
- Provide member-schema stubs/space for `linux` (systemd), `deno-deploy`, `docker`/`compose` so the
  downstream slices extend rather than restructure — **but only the fields those slices need; do not
  implement adapter logic here.**
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
| L-5  | Per-target member schemas via a discriminated/keyed map with base   | Matches spec §3.3; extensible       |

## Open-Decision Sweep

| Decision                                              | Status              | Notes                                             |
| ----------------------------------------------------- | ------------------- | ------------------------------------------------- |
| Discriminated union vs plain keyed record for targets | resolve now         | Prefer a keyed object with a shared base + per-key refinement; confirm against existing config patterns in the change map |
| Include linux/deno-deploy/docker member stubs now     | safe to defer detail | Provide minimal shapes only; downstream slices own full fields |

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
| F-6   | yes      | JSR publishability of `packages/config`                       |
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
- `src/domain/schemas/deploy-schema.ts` — `WindowsDeployConfigSchema` (L8–106) becomes a member of a
  new shared `DeployTargetBaseSchema` + `WindowsDeployTargetSchema`; `DeployConfigSchema` (L112–117)
  changes `windows: …` → `targets: z.object({ windows: WindowsDeployTargetSchema.optional(), … })`.
  Migrate the `docker` block (L99–104) + re-pin `denoBaseImage` `deno:2.5`→`deno:2`.
- `src/domain/config-section-types.ts` — `WindowsDeployConfig` (L357–420) → base + `WindowsDeployTarget`;
  `DeployConfig` (L423–426) `windows?` → `targets?: { windows?: WindowsDeployTarget; … }`.
- `src/domain/schemas/netscript-config-schema.ts` — L9 import + L154 `deploy: DeployConfigSchema` (no
  change if `DeployConfigSchema` name kept; verify).
- `src/domain/config-root-types.ts` — L68 + L104 `deploy?: DeployConfig` (name kept → no edit; verify).
- `src/public/mod.ts` — re-exports L25 `DeployConfigSchema`, L34 `WindowsDeployConfigSchema`, L45
  `DeployConfig`, L78 `WindowsDeployConfig`: add new exports (`DeployTargetBaseSchema`,
  `WindowsDeployTargetSchema`, `WindowsDeployTarget`), decide whether to keep/rename the Windows
  export names (F-5 public-surface). `src/domain/mod.ts` L14 barrel unchanged.

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

**D. Tests + docs:**
- `src/public/features/deploy/build/deploy_test.ts` — integration mocks `loadConfig()`; update any mock
  that emits `deploy.windows` → `deploy.targets.windows`. ADD schema-validation tests: accept a valid
  `targets.windows`, reject old `deploy.windows`, reject unknown target keys.
- `docs/site/how-to/deploy.md` — old-shape references (L29, L252): the full rewrite is #344's scope;
  here add only the one-line migration note (`deploy.windows` → `deploy.targets.windows`).

**Grep keys before declaring done:** literal `deploy.windows` / `.windows`; type names
`WindowsDeployConfig`, `DeployConfig`, `ResolvedWindowsDeployConfig`; schema names
`WindowsDeployConfigSchema`, `DeployConfigSchema`.

**Type-check task:** no dedicated `check:config`; use scoped wrapper
`.llm/tools/run-deno-check.ts --root packages/config --ext ts` and `--root packages/cli/src/...deploy`,
plus root `deno task check --unstable-kv`.

## Risks

- See Risk Register. Primary: silent consumer breakage → mitigated by type-check + grep of derived types.

## Dependencies

- None upstream. **Unblocks #339, #340, #342, #343** (they extend `deploy.targets.*`).

## Drift Watch

- If the schema change forces scaffold-template regeneration, log it (scope was schema-only).
- If a discriminated union proves incompatible with the existing config-composition pattern, log and
  fall back to a keyed record with base refinement.
