# Scaffold + Governance Audit — current state at baseline `fac9e339042c` (2026-08-08)

Scope: (1) what `netscript init` + `netscript plugin add` actually produce today; (2) the
governance layer (`docs/architecture/doctrine/`, `.llm/harness/debt/arch-debt.md`, `rfcs/`,
`.agents/skills/`). Every claim below is anchored to a path+line, a `deno eval` result, or an
issue/PR number. Gap classes used: **docs/discovery**, **scaffold/generation**, **API/type seam**,
**runtime correctness**, **plugin-composition**, **product-expectation**.

---

## 1. Scaffold surface — what exists and works

### 1.1 Template inventory and location

Two physically separate template systems under `packages/cli/src/kernel/`:

| Kind | Location | Count | Nature |
| --- | --- | --- | --- |
| Code-emitting generators | `packages/cli/src/kernel/templates/` | 64 files | TypeScript functions returning source strings |
| Verbatim file assets | `packages/cli/src/kernel/assets/` | 106 files | `*.template` files copied into the project |

Generator families: `templates/workspace/` (root `deno.json`, `package.json`, `tsconfig`,
`netscript.config.ts`, README, quality runner, node-modules verifier, Aspire CLI task),
`templates/database/`, `templates/service/`, `templates/plugins/`, `templates/aspire/` (incl.
`aspire/helpers/register/*` — 8 register-emitters), `templates/app/`.

Assets are embedded for publish via `packages/cli/src/kernel/assets/embedded.generated.ts` (a
single generated barrel; produced by `.llm/tools/generate-cli-assets-barrel.ts` /
`generate-publish-assets.ts`).

### 1.2 Generated workspace layout

Directory vocabulary is centralized in
`packages/cli/src/kernel/constants/scaffold/scaffold-dirs.ts:4-24`:

```
apps/ services/ contracts/ plugins/ packages/ workers/ sagas/ triggers/
database/ aspire/ config/ .netscript/ versions/ v1/ .helpers/ .aspire/
modules/ background/ tools/
```

Root `deno.json` is emitted by `packages/cli/src/kernel/templates/workspace/deno-json.ts:31-129`:

- `workspace` = user members + (local-source only) `./packages/<pkg>` members (lines 32-43).
- `catalog` from `scaffold-app-catalog.ts`; import maps deliberately pushed down to per-resource
  `deno.json` (module JSDoc, lines 5-9, 25-27).
- `unstable: ['raw-imports', 'kv']` (line 82) — hard requirement, documented inline.
- JSR mode adds `minimumDependencyAge: { age: 'P1D', exclude: [...] }` with a well-reasoned comment
  about the 24h post-publish breakage window (lines 60-70).
- Tasks: `dev`, `deps:verify`, `aspire:start`/`:isolated`/`:otel`/`:export`, `check`, `lint`,
  `fmt:check`, `fmt`, `test` (lines 83-107).

App layout, from `packages/cli/src/kernel/application/scaffold/writers/write-app-files.ts:91-209`:
`apps/<appName>/{routes,components,assets,lib,.generated}/`, plus `client.ts`, `main.ts`,
`utils.ts`, `router.ts`, `vite.config.ts`, `deno.json`, `tsconfig.app.json`, and two agent-facing
docs written **into the app dir**: `AGENTS.md` and `WEB-LAYER.md` (lines 176-177).

### 1.3 App folder conventions (works)

`packages/cli/src/kernel/templates/app/agent-conventions.ts` generates both app docs from one typed
input (`AppConventionsInput`, lines 1-7) with a `ConventionReference` id union (lines 9-22) and an
`appConventionsReferencedPaths()` accessor (lines 101-105) so the referenced paths are enumerable
and testable rather than free prose. The generated `AGENTS.md` names the MCP discovery path
(`list_api_services` → `list_service_operations` → `get_operation_schema`, line 127), the five-step
architecture (lines 129-133), the three `netscript ui:add` entry points (lines 137-139), and an
explicit copy-vs-delete contract (line 143). `WEB-LAYER.md` states the one-screen path
`contract → createQueryFactories → definePage layers → QueryIsland/useMutation → live stream`
(line 163). This is genuinely good agent-facing scaffolding.

Route-group convention in `assets/app/routes/`: `(_components)/`, `(_islands)/`, `(_shared)/`,
`partials/`, plus a `(design)` group. Confirmed present for `examples/`, `examples/service/`,
`examples/telemetry/`, and `(design)/design/`.

### 1.4 `/design` routes (works, with a drift defect — see 2.1)

`packages/cli/src/kernel/assets/app/routes/(design)/design/` ships:
`_layout.tsx`, `index.tsx` (redirects to `appRoutes.designTokens.href()`), `tokens.tsx`,
`components.tsx`, `composition.tsx`, `(_components)/{tokens,components,composition}-view.tsx`,
`(_islands)/{TokenClipboard,FloatingSurfaceDemo}.tsx`, `(_shared)/{registry,tokens}.ts`, and
`assets/design.css.template`. `/design/composition` is referenced by the generated `AGENTS.md` as
"the live L0-L4 ownership and layout guide" (`agent-conventions.ts:36-39`).

### 1.5 Quality gates after PR #1342

PR #1342 (`1455231b0`, `fix(scaffold): make generated quality gates own executable source`) replaced
string-glob quality tasks with a generated, dependency-free runner:
`packages/cli/src/kernel/templates/workspace/quality-runner.ts` emits `.netscript/quality-runner.ts`
into every project; root tasks `check`/`lint`/`fmt:check`/`fmt` all delegate to it
(`deno-json.ts:98-105`).

Runner properties (`quality-runner.ts:9-217`): explicit `SOURCE_ROOTS` allow-list (lines 15-28),
`SKIP_SEGMENTS`/`SKIP_PREFIXES` (lines 31-41), 200-file batching (line 42), structured JSON verdict
on stdout (lines 80-89), and a separate AppHost arm that type-checks `aspire/apphost.mts` +
`aspire/.helpers/**` through the vendored `tsc` against `aspire/tsconfig.apphost.json` instead of
`deno check` (lines 68-78, 150-153, 191-216). That AppHost split is correct — those files are npm/
Node-resolved, not Deno-resolved.

E2E coverage exists and includes a negative-control gate:
`packages/cli/e2e/src/application/gates/scaffold/generated-quality-gate.ts:7-49` runs
`GENERATED_QUALITY_NEGATIVE` (deliberate-failure probes via `generated-quality-probes.ts`) before
`deno task check` / `lint` / `fmt:check` inside the generated project. This is the right shape: the
gate proves the gate.

---

## 2. Scaffold gaps

### 2.1 `/design/components` gallery under-reports the registry by 16 items — **scaffold/generation failure**

The scaffolded gallery reads a hand-copied snapshot:
`packages/cli/src/kernel/assets/app/routes/(design)/design/(_shared)/registry.ts.template:1-4`
says *"Generated from registry/manifest.ts (fresh-ui-foundation v0.1.0); regenerate when the
registry changes"* and declares `total: 50` (line 28) with exactly 50 `name:` entries.

The live manifest has 66 items:

```
$ deno eval "const m=(await import('./packages/fresh-ui/registry.manifest.ts')).freshUiRegistryManifest;
             console.log(m.items.length, m.collections.length, m.version)"
66 8 0.1.0
```

Missing from the scaffolded gallery (computed by diffing manifest item names against the template):

```
avatar, citation-chip, code-block, model-selector, tool-call-card, chart-block, donut,
prompt-input, message, markdown, command-palette, search, dropzone, chat-render,
mcp-ui-widget, render-ui
```

This matters because `netscript ui:add` / `ui:list` resolve against the **live** manifest —
`packages/cli/src/kernel/application/ui/registry.ts:3` imports `freshUiRegistryManifest` from
`@netscript/fresh-ui`, and `registry.ts:87-91` selects items from that manifest. So the CLI can
install 66 components while the generated "living design reference" advertises 50. The entire
AI/chat surface (`message`, `markdown`, `prompt-input`, `model-selector`, `tool-call-card`,
`chat-render`, `citation-chip`, `mcp-ui-widget`, `render-ui`) and the data-viz surface
(`chart-block`, `donut`) are invisible to any agent that follows the generated `AGENTS.md`
instruction to consult `/design/composition` and `/design/components`.

No gate binds the two. The only drift test — `packages/fresh-ui/tests/registry-doc-drift.test.ts:4-24`
— compares `registry.ts` JSDoc **collection names** against the manifest; it does not look at the
CLI snapshot at all. Grep for `registryCatalog` across `packages/cli/src/**/*_test.ts` returns
nothing outside `embedded.generated.ts`.

**Roadmap implication:** this is a one-file mechanical fix plus a drift test, and it is a
prerequisite for #1333's acceptance item *"`/design` and `/design/composition` are named and linked
as the living design/component reference."* Without the gate the snapshot re-rots on the next
registry addition.

### 2.2 Dynamic app naming (#1333) is entirely unimplemented — **product-expectation + scaffold/generation**

`packages/cli/src/kernel/constants/scaffold/scaffold-defaults.ts:9-10` still reads:

```ts
APP_NAME: 'dashboard',
SERVICE_NAME: 'users',
```

Issue #1333 (`fix(scaffold/frontend): make the default app an idiomatic eis-chat-grade reference and
derive its name from the project`, OPEN, milestone **0.0.5**, `priority:p0`, `status:triage`,
labels `type:fix`/`area:cli`/`area:fresh-ui`/`area:fresh`) has 11 acceptance checkboxes; **zero**
are satisfied at this baseline. The issue explicitly states the hardcoded default and cites Wave-6
evidence (`rickylabs/loom`) of an agent hand-rolling tables/buttons/forms and a 676-line island
despite receiving the registry, `/design`, and the app `AGENTS.md`/`WEB-LAYER.md`. Related:
#1071, #1073, #1208, #1210, #1328.

Note the shape of the failure: the guidance surfaces (2.1's `AGENTS.md`, `WEB-LAYER.md`) exist and
are well written, but nothing **gates** on them, so they are advisory. #1333's last acceptance item
("a measured agent smoke … adopts or explicitly rejects the built-ins") is the only proposed
enforcement mechanism and no such gate exists today.

Also unaddressed: `SERVICE_NAME: 'users'` has the same hardcoded-default problem and is not named
in #1333's acceptance list — a scope hole worth catching in the roadmap.

### 2.3 Quality-runner source selection is a hardcoded allow-list — **scaffold/generation**

`quality-runner.ts:15-29` hardcodes `SOURCE_ROOTS` and `SOURCE_FILES`. Consequences:

- `options.workspaceMembers` (arbitrary user-supplied members, `deno-json.ts:35`) are **not**
  reflected into `SOURCE_ROOTS`. A consumer who adds a workspace member outside the fixed list gets
  a silently green `deno task check`/`lint`/`fmt:check` that never touched their code.
- `packages/` (present as workspace members in local-source mode, `deno-json.ts:40-43`) is absent
  from `SOURCE_ROOTS` — probably intentional (vendored framework copies) but undocumented.
- `SCAFFOLD_DIRS.CONFIG` (`config`), `SCAFFOLD_DIRS.TOOLS` (`tools`), `SCAFFOLD_DIRS.MODULES`
  (`modules`), `SCAFFOLD_DIRS.BACKGROUND` (`background`) are declared dirs
  (`scaffold-dirs.ts:15,19-23`) but none appear in `SOURCE_ROOTS`. `tools/` is a real emitted path —
  `templates/aspire/helpers/register/generate-register-tools.ts:39` builds workdirs as
  `${SCAFFOLD_DIRS.TOOLS}/${name}`.

A generated-workspace gate whose coverage is a literal array, disconnected from the generator that
decides the workspace shape, will drift the moment the shape changes. The fix is to derive
`SOURCE_ROOTS` from the same options object that produces `workspace[]`.

### 2.4 `deno lint --no-config` in the generated runner — **API/type seam (minor)**

`quality-runner.ts:169-175` runs `['lint', '--no-config', ...files]`. The generated root
`deno.json` carries `fmt` config and `compilerOptions` but no `lint` key (`deno-json.ts:119-126`),
so today `--no-config` is harmless. But it means a consumer who adds project lint rules to their own
`deno.json` will find `deno task lint` silently ignoring them, while `deno task fmt:check` (no
`--no-config`) honours their `fmt` settings. Inconsistent and unexplained.

---

## 3. Governance layer

### 3.1 `docs/architecture/doctrine/` — the verdict file is stale

`docs/architecture/doctrine/10-codebase-verdict-and-handoff.md:22-51` is the per-package verdict
table. It is materially out of date against `packages/` and `plugins/` as they exist at this
baseline.

**Packages in the verdict table that no longer exist:**

- `@netscript/shared` — verdict "Rewrite", listed as top-priority remediation #3 (lines 46, 67-69),
  and given a dedicated doctrine subsection `06-archetypes.md:378-388` ("About `packages/shared`").
  `ls packages/shared` → *No such file or directory*. The `utils/datetime.ts` (1,112 LOC) exemplar
  that doctrine calls "the cleanest demonstration of A6 + A7 in the whole repo" is gone.
- `plugins/hello-world` — verdict "Keep" (line 47). `ls plugins/hello-world` → *No such file or
  directory*.

**Packages that exist but are absent from the verdict table** (from `ls packages/`, `ls plugins/`):
`ai`, `auth-better-auth`, `auth-kv-oauth`, `auth-workos`, `bench`, `mcp`, `plugin-ai-core`,
`plugin-auth-core`, `plugin-sagas-core`, `plugin-streams-core`, `plugin-triggers-core`,
`plugin-workers-core`, and `plugins/ai`, `plugins/auth`. That is **14 unassessed units** — including
the entire auth family and the whole `plugin-*-core` tier that `11-plugin-thinness-and-base-seams.md`
is built around.

The same staleness reaches `06-archetypes.md:368-381` (archetype assignment table names `shared` and
omits every `plugin-*-core`, `auth-*`, `ai`, `mcp`, `bench`).

**Class:** docs/discovery failure with governance teeth — `10-…md:197-208` defines "definition of
done for the doctrine" as *"the codebase walk above shows zero Restructure or Rewrite verdicts"*.
A walk that omits 14 units and includes 2 deleted ones cannot discharge that condition. **A verdict
re-walk is a hard prerequisite for any long-range remediation roadmap** — it is the roadmap's
denominator.

### 3.2 Doctrine promises the engineering reference does not exist

`10-…md:79-181` specifies ten required contents for "the next engineering reference" (recipe per
archetype, per role folder, per pattern, per anti-pattern; refactor playbooks; fitness-function
source; debt registry; review checklist; glossary; phased migration roadmap A→D). Current state:

- **§7 debt registry — done.** `.llm/harness/debt/arch-debt.md` (2,206 lines) exists with a
  `README.md`.
- **§6 fitness-function source — partial.** `.llm/tools/fitness/` contains only
  `audit-jsr-package.ts`, `check-doctrine.ts`, `check-ds-color-utilities.ts`, `check-ds-no-raw-hex.ts`,
  `check-ds-gates_test.ts`. `deno.json:155-156` wires `arch:check` (scoped) and `arch:check:repo`
  (full scan). The full scan is **known red** — see 3.4.
- **§1–§5, §8–§10 — absent.** No archetype recipe file, no role-folder recipes, no pattern
  skeletons, no per-AP fix catalogue, no refactor playbooks, no review checklist, no glossary. The
  harness carries partial substitutes (`.llm/harness/archetypes/ARCHETYPE-1..7-*.md`,
  `.llm/harness/gates/*.md`) but these are agent-run gates, not the contributor-facing manual the
  doctrine names. `.llm/harness/archetypes/SCOPE-docs.md:29` even cites `.claude/09-glossary.md` —
  which does not exist (see 3.5).

**Class:** docs/discovery failure. The doctrine's own handoff contract is ~20% discharged after
~4 months (verdict file predates the current package set).

### 3.3 No doctrine governs generated consumer output — **structural gap**

Doctrine scope is `packages/` and `plugins/` (`AGENTS.md` line 1; `05-folder-structure.md:1-8`
speaks only of "a package's folder tree"). `.llm/harness/archetypes/SCOPE-frontend.md:7-10` makes
this explicit: *"Application code is a consumer of the package/plugin doctrine unless it modifies
`packages/` or `plugins/`."*

Consequence: the generated workspace — the artifact every user and every Wave-6 agent actually
touches — has **no doctrinal folder vocabulary, no archetype, and no fitness function**. The
generated app uses Fresh route groups (`(_components)/`, `(_islands)/`, `(_shared)/`), which are a
perfectly reasonable vocabulary but appear nowhere in `05-folder-structure.md`'s canonical role
table (lines 12-30). `agent-conventions.ts` is the *de facto* consumer doctrine, shipped as generated
Markdown, owned by one CLI template file, enforced by nothing.

This is exactly the seam #1333 falls through: doctrine binds framework code, the scaffold binds
nothing, and the agent writes a 676-line island. **A long-range roadmap needs an explicit decision:
either extend doctrine with a "generated workspace" archetype/scope, or promote
`agent-conventions.ts` content into a governed, gated surface.** This is RFC-shaped.

### 3.4 `arch-debt.md` — open-entry census

70 entries carry `Status: open`. Grouped for roadmap purposes:

**Doctrine-verdict debt still open (direct roadmap input):**

| Line | Entry | Note |
| --- | --- | --- |
| 316 | `packages/database` — AP-17 / verdict Refactor | open |
| 342 | `packages/kv` — AP-1 / verdict Refactor (`bridge_test.ts` 1,039 LOC) | open |
| 617 | `packages/service` — verdict Refactor | open |
| 846 | `plugins/triggers` — verdict Refactor | open |
| 856 | `plugins/workers` — verdict Refactor | open |
| ~557 | `packages/workers` — AP-1 / verdict Restructure (`task-executor.ts` 1,287 LOC) | top-priority #2 in `10-…md:64-66` |
| 683 | `packages/plugin/.../plugin-builder.ts` — F-1 size (360 LOC) | DEBT_ACCEPTED |
| 778, 789, 866 | `packages/cli` — maintainer-mode-mixing, no-permissions-doc, public-api-doc-completeness | top-priority #1 in `10-…md:61-63` |

**The meta-blocker (line 523):** `repo doctrine task — full historical scan remains red`. AS7 split
`arch:check` (auth-owned surfaces, green) from `arch:check:repo` (full scan, **nonzero**), so the
repo-wide doctrine gate has been accepted-red since **2026-06-21**, target "2026-Q3", closing gate
*"reduce unrelated root failures or replace the legacy root scan with debt-aware package selection."*
Doctrine's definition of done (`10-…md:201-202`) requires `arch:check` green *for every package
without opt-outs except active debt entries* — so this single entry blocks doctrine completion and is
the natural Phase-A item of any remediation roadmap.

**Scaffold-specific open debt (feeds §2):**

- `2164` `cache-local-arm-unreachable-1158` — unreachable `Mode: 'Local'` cache arm; recorded, not
  fixed (#1158 deliberately left scaffold cache defaults alone).
- `2188` `scaffold-default-cache-container-1158` — default cache backend forces a container;
  explicitly out of scope for #1158 as a product-default change.
- `1657` `scaffold-aspire-npm-island-no-lock` — scaffolded `aspire/package.json` ships no lock.
- `991` `generated-ts-scaffold-local-import-overlay`; `1004` `generated-ts-frontend-react-reference`;
  `1017` `generated-ts-sample-e2e-chain` (missing sample E2E chain); `1030`
  `runtime-db-hygiene-persistent-container`; `1045` `cli-runtime-schemas-plugin-dependency`;
  `1950` `DB-GENERATE-ASPIRE-COUPLING`; `2117` `cli-plugin-doctor-published-module`;
  `975` `legacy-csharp-scaffold-plugin-add`; `287` KV cache backend AppHost emission deferred;
  `144` CommunityToolkit Deno/SQLite TS AppHost re-enable deferred.
- `1298` `alpha-specifiers-forward-looking` — scaffold specifiers point at future stable ranges.

**Archetype-7 / deployment (line 1984, `deploy-archetype-7-core-seed`):** doctrine `06-archetypes.md`
already ships Archetype 7, but the deployment **core** package does not exist; deploy lives inside
`packages/cli/src/kernel/domain/deploy/` and `src/public/features/deploy/`. Gates `F-DEPLOY-1`
(uniform 7-op contract) and `F-DEPLOY-2` (no target logic in the command surface) are seeded
`reviewed`, not `gated`, across three surfaces (doctrine, `ARCHETYPE-7-deploy-target-adapter.md`,
gate matrix). The verb-vocabulary lock (`build`/`install`/`uninstall` vs `up`/`down` vs hybrid) is
**explicitly deferred to the first real adapter** — an unsettled public-contract decision. Related
open entries: `1726` `DEPLOY-S7-APPHOST-COMPOSE-GEN`, `1766` `DEPLOY-SECRETS-ROLLBACK-CORE`,
`2038` `DEPLOY-BAREMETAL-PUBLIC-WIRING`, `1396` `cli-deploy-linux-integration-untested`.

**Doctrine text itself carries debt:** `2091` `doctrine-06-archetype-5-folder-shape` — Archetype 5
folder-shape reconciliation deferred during the #306 remainder run. The doctrine document is
knowingly internally inconsistent.

**`DECISION_PENDING` — the RFC-needing set (5 entries, none has an RFC):**

| Line | ID | Unsettled decision |
| --- | --- | --- |
| 1536 | `CRON-SUBSYSTEM-DUP` | Two cron surfaces: workers `.schedule()` vs triggers `defineScheduledTrigger`. Cross-package public API duplication. Recorded "under the overnight don't-block mandate." |
| 1582 | `RUN-ARTIFACT-ARCHIVAL-POLICY` | `.llm/tmp/run/` evidence tonnage — repo-wide policy |
| 1598 | `PAGEBUILDER-LEGACY-COMPAT-TREE` | Fate of `@netscript/fresh/builders` `PageBuilder` legacy tree |
| 1613 | `FORMPAGEPROPS-PLAYGROUND-MIGRATION` | Transitional `FormPageProps` type |
| 1628 | `REDIS-LEGACY-VALUE-FALLBACK` | Pre-`StoredValue` envelope read path in `packages/kv` |

Four of five are **public-surface** questions, which `rfcs/README.md:15-24` says *require* an RFC
("adds, removes, or changes a public API or a `@netscript/*` package export surface"). None has one.
`CRON-SUBSYSTEM-DUP` and `PAGEBUILDER-LEGACY-COMPAT-TREE` are the two most roadmap-relevant: both
are duplicate-surface decisions that get more expensive to reverse after 0.0.5 ships.

Also relevant as an unsettled cross-cutting decision: `1175`
`plugin-service-router-composition-any` — oRPC router-composition `any` + external-boundary casts
across **all** plugin service routers, "SANCTIONED for now" matching the merged sagas exemplar. This
is a plugin-composition failure normalized into a pattern; it will need an RFC or a type-system fix,
not another debt line.

### 3.5 `rfcs/` — the process exists on paper and has never been used

`ls rfcs/` → `0000-template.md`, `README.md`. **Zero numbered RFCs.**
`rtk git log --oneline --all -- rfcs/` shows four commits, all process/release housekeeping
(`603ea69e9` added the process; `317e4b509`, `9b66ec2d1`, `00e3b047f` are release-scheme edits).
No RFC document has ever landed.

Meanwhile RFCs *are* being written — just not where `rfcs/README.md:41-46` says. Label descriptions
in `.github/labels.yml` cite them: `epic:deploy-plugin` → "Deploy plugin family epic (RFC #891)",
`epic:openapi-mcp` → "OpenAPI→MCP service introspection epic (RFC #1123, tracking #1117)". Both are
**merged PRs**, not `rfcs/NNNN-*.md` files:

- PR #891 `RFC: NetScript Deploy Plugin Family …` (MERGED) → landed
  `.llm/runs/plan-deploy-plugin--seed/design/canonical/DP-0..DP-9-*.md`
- PR #1123 `RFC: OpenAPI→MCP …` (MERGED) → landed
  `.llm/runs/plan-openapi-mcp-plugin--seed/design/canonical/00..06-*.md`

Issues carrying the `rfc` label: #820, #510, #313, #234 (all OPEN, all `Backlog / Triage`) and #305
(CLOSED, `[S4] Architecture Doctrine revamp`).

**Class:** docs/discovery failure with real cost. Design records live under `.llm/runs/*--seed/design/
canonical/` — a harness-internal path, not on the published docs site, not numbered, not
status-tracked, and colocated with the `RUN-ARTIFACT-ARCHIVAL-POLICY` debt (line 1582) that proposes
pruning that very tree. The de-facto process and the documented process must be reconciled: either
promote `design/canonical/` bundles into numbered `rfcs/NNNN-*.md` at acceptance, or retire
`rfcs/README.md`. `rfcs/README.md:82-86` already flags itself as provisional — *"the formal, binding
'what requires an RFC' policy … is being reconciled with the architecture doctrine … if it ever
conflicts with a ratified doctrine governance statement, doctrine wins."* No such ratified statement
exists in `docs/architecture/doctrine/`.

### 3.6 `.agents/skills/` coverage

18 skills, all mirrored 1:1 into `.claude/skills/` (both listings identical — mirror is in sync at
this baseline). Sizes: `deno-fresh` 956, `skill-creator` 708, `jsr-audit` 602, `netscript-pr` 384,
`netscript-release` 372, `codex-wsl-remote` 371, `netscript-harness` 341, `openhands-handoff` 255,
`netscript-tools` 203, `agent-milestone-orchestrator` 175, `netscript-cli` 154,
`netscript-doctrine` 147, `claude-manager` 136, `netscript-deno-toolchain` 128, `aspire` 122,
`fresh-ui-horizontal` 102, `rtk` 83, `design` 55.

**Coverage gaps:**

- **No RFC/governance skill.** `netscript-pr` covers branches/PRs/labels/milestones; nothing covers
  the RFC lifecycle, which is precisely the process that is not being followed (3.5).
- **No consumer-scaffold-conventions skill.** `netscript-cli` (154 lines) covers commands;
  `deno-fresh` covers the framework; `fresh-ui-horizontal` covers registry slices. Nothing covers
  "what a generated NetScript app should look like" — the `agent-conventions.ts` content has no
  skill-level home, which is part of why #1333's guidance is ignorable.
- **`netscript-doctrine` is framework-only.** `SKILL.md:27` routes app/service/frontend/infra work
  *away* from doctrine, consistent with 3.3.

**Dead cross-references (docs/discovery failure):**

| Reference | Source | Exists? |
| --- | --- | --- |
| `.claude/05-frontend.md` | `.llm/harness/archetypes/SCOPE-frontend.md:15` | No |
| `.claude/04-services.md`, `.claude/06-infrastructure.md` | `SCOPE-service.md:13-14` | No |
| `.claude/09-glossary.md` | `SCOPE-docs.md:29` | No |
| `.claude/` as descriptive context | `SCOPE-docs.md:10`, `workflow/retrieval-order.md:45` | Only `settings.json` + `skills/` |
| `.resources/deps-docs/` | `netscript-harness/SKILL.md:218`, `workflow/resource-aggregation.md:8,18`, `workflow/retrieval-order.md:38`, `SCOPE-frontend.md:16` | No |

Two whole directories that the harness instructs agents to read **first** do not exist. Every
frontend/service/docs-scoped harness run silently skips its own "Additional Read First" step. Given
that #1333 is a frontend-scope failure, this is a plausible contributing cause and a cheap fix.

---

## 4. Divergence summary — scaffold output vs doctrine target

| # | Divergence | Class | Evidence |
| --- | --- | --- | --- |
| D1 | `/design/components` shows 50 of 66 registry items; whole AI/chat + dataviz surface invisible; no drift gate | scaffold/generation | `registry.ts.template:28` vs manifest `items.length === 66` |
| D2 | Default app name hardcoded `dashboard` (and service `users`); #1333 0/11 acceptance | product-expectation + scaffold/generation | `scaffold-defaults.ts:9-10`; issue #1333 |
| D3 | Generated quality gate coverage is a literal allow-list decoupled from the workspace generator | scaffold/generation | `quality-runner.ts:15-29` vs `deno-json.ts:35-43` |
| D4 | `deno lint --no-config` silently ignores consumer lint config; `fmt` does not | API/type seam | `quality-runner.ts:169-175` |
| D5 | No doctrine, archetype, or fitness function governs generated workspace shape | structural / docs | `SCOPE-frontend.md:7-10`; `05-folder-structure.md:1-8` |
| D6 | Verdict table names 2 deleted units, omits 14 live ones | docs/discovery | `10-…md:22-51` vs `ls packages/ plugins/` |
| D7 | Engineering reference §1–§5, §8–§10 never written | docs/discovery | `10-…md:79-181` vs `.llm/tools/fitness/` contents |
| D8 | `arch:check:repo` accepted-red since 2026-06-21; blocks doctrine DoD | governance | `arch-debt.md:523-537`; `10-…md:201-202` |
| D9 | RFC process documented, never used; real design records hide in `.llm/runs/*/design/canonical/` | docs/discovery | `ls rfcs/`; PR #891/#1123 file lists |
| D10 | 5 `DECISION_PENDING` entries, 4 of them public-surface, none with an RFC | governance | `arch-debt.md:1536,1582,1598,1613,1628` |
| D11 | Archetype 7 shipped in doctrine without the package it describes; gates `reviewed` not `gated`; verb vocabulary unlocked | governance | `arch-debt.md:1984-2036`; `06-archetypes.md:257` |
| D12 | Harness "read first" targets `.claude/*.md` and `.resources/deps-docs/` do not exist | docs/discovery | `SCOPE-{frontend,service,docs}.md`; `ls` |

## 5. RFC-needing decisions (recommended)

1. **Generated-workspace governance** — extend doctrine with a consumer/generated-app scope, or
   promote `agent-conventions.ts` into a gated surface (blocks #1333 durably). D5.
2. **`CRON-SUBSYSTEM-DUP`** — one cron surface or two, with a deprecation path. `arch-debt.md:1536`.
3. **`PAGEBUILDER-LEGACY-COMPAT-TREE` + `FORMPAGEPROPS-PLAYGROUND-MIGRATION`** — `@netscript/fresh`
   public-builder consolidation, before 0.0.5 hardens it. `arch-debt.md:1598,1613`.
4. **Archetype-7 deployment core + 7-op verb vocabulary lock** — settle before the second adapter
   lands. `arch-debt.md:1984`.
5. **RFC-process reconciliation** — `rfcs/NNNN-*.md` vs `.llm/runs/*/design/canonical/`; must be
   settled jointly with `RUN-ARTIFACT-ARCHIVAL-POLICY` (line 1582), which threatens the tree where
   the real RFCs live. D9/D10.
6. **`plugin-service-router-composition-any`** — sanctioned `any` across every plugin router is a
   type-system decision, not debt. `arch-debt.md:1175`.

## 6. Suggested roadmap phasing (doctrine's own A–D, re-grounded)

- **Phase A (unblock measurement):** re-walk the verdict table (D6) — it is the roadmap's
  denominator; make `arch:check:repo` debt-aware and green (D8); fix the dead harness read-first
  paths (D12). Cheap, and everything downstream depends on A.
- **Phase B (scaffold credibility / 0.0.5):** D1 registry drift gate + D2 #1333 app naming and
  idiomatic default app, D3 quality-gate coverage derivation, D4 lint-config consistency. This is
  the user-visible tier.
- **Phase C (doctrine debt burn-down):** the six open verdict-Refactor/Restructure entries
  (§3.4 table) plus the engineering-reference §1–§5 recipes (D7) written *from* those refactors, so
  the manual is a byproduct rather than a separate project.
- **Phase D (governance ratification):** the six RFCs in §5, then D5 generated-workspace doctrine,
  then Archetype-7 gate promotion (D11).
