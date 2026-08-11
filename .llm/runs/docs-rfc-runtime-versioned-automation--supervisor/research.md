# Research — docs-rfc-runtime-versioned-automation--supervisor

Deep findings feeding the RFC. Sub-agent reports live in `evidence/`; this file is the supervisor
synthesis + verification layer. Status: **in progress** (G1 legacy report pending, G2 current-state
report pending).

## Re-baseline

- Branch == `origin/main` @ `2256a67bf` (2026-08-11). No carried-in plan; the launch brief is the
  owner's intent statement, verified against the repos below.
- Legacy subject: `/home/codex/repos/netscript-start-ref` @ `6ba9ba0` (= `origin/master`,
  refreshed read-only at run start).
- Interacting run: `/home/codex/repos/ns-1443-plugin-ai-orchestrator` (PR #1444, S1–S10 landed,
  child-process manifest loader uncommitted at inspection time).

## Supervisor findings (verified directly)

### F1 — `@netscript/runtime-config` is a real hot-reload read path, not a stub

`packages/runtime-config/src/application/loader.ts`: env-resolved dir
(`NETSCRIPT_RUNTIME_CONFIG_DIR`, fallback `dirname(NETSCRIPT_TASKS_DIR)`, fallback `cwd()/runtime`);
`current` pointer file supports **JSON pointer object** or **legacy plain-text version** (mapped to
`<topic>/v<version>.json` for topics jobs/sagas/tasks/triggers/features); malformed/missing
anything → silent empty defaults. `watcher.ts`: `Deno.watchFs` recursive + 300ms debounce →
`loadRuntimeConfig()` → consumer callback; errors swallowed. **No write path, no schema validation,
no history, no audit, no multi-instance story in the package itself.**

### F2 — the CLI already has an operator write path with atomic promotion semantics

`packages/cli/src/public/features/config/override/`:
`publishRuntimeOverride(store, topic, version, value)` ("publish a topic payload and atomically
activate its version"), `rollbackRuntimeOverride` ("atomically activate an existing version"),
`setRuntimeOverrideValue` (dotted-path patch), plus a Cliffy command group
publish/rollback/list/get/set/clear/enable/disable ("dashboard-aligned"). Backed by a
`RuntimeConfigStorePort`. G2 must trace the store adapter (filesystem? DB?) and what tests prove.

### F3 — workers execution is genuinely multi-runtime

`packages/plugin-workers-core/src/executor/`: `MultiRuntimeTaskExecutor` with adapter map by
`TaskType`; adapters seen: Deno, dotnet, cmd (Windows), generic Dax process runner with streaming
capture; `runtime/runtime-types.ts` has both a **static handler registry** and a **dynamic module
importer** seam for runtime job handlers. G2 to enumerate full adapter set + permission model.

### F4 — #1444 control-plane loader (read-only inspection, see `1444-impact.md`)

Owner D-10 decision locks the split: `plugin.ts` manifest-only control plane (child-process load
under consumer deno.json, `clearEnv`, 30s timeout, JSON manifests over stdout marker);
`mod.ts`/`runtime.ts` and `workers|triggers/runtime/**` preserved. Constraints C1–C8 issued to
#1444 (PR comment 5248826402). The RFC builds on: manifests-as-data, additive manifest schema
extension, `generate runtime-schemas` control-plane-only.

### F5 — Frontend Contribution Layer dependency (owner directive D-3)

RFC PR #890 **merged** 2026-08-03 (design record `.llm/runs/plan-frontend-contrib--seed/rfc.md`):
plugins ship UI via `defineFrontend()` contributions — data contracts in
`@netscript/plugin-frontend-core`, generated transactional registry, `App.mountApp` sub-apps,
deny-by-default procedure gateway (#934). Implementation epic **#922 open** (milestone 0.0.9), all
children #923–#934 verified OPEN on 2026-08-11. Consequence: the cockpit is specified in this RFC
as a **downstream consumer** of that layer; minimum dependency cut evaluated in plan.md; no cockpit
frontend slice before the required #922 foundation lands; no parallel dashboard seam. #933 (workers
dogfood zone panel/console route/island) is the natural adjacency for the cockpit's first surface.

## Sub-agent evidence (incorporated on arrival)

- `evidence/legacy-capability-map.md` — G1, Codex Sol medium (thread in `codex-thread-ids.md`).
- `evidence/current-state-matrix.md` — G2, Codex Sol medium.

## Open questions the plan must close

- OQ1: what actually consumes `loadRuntimeConfig`/`watchRuntimeConfig` in scaffolded apps and
  plugin runtime barrels today (is the hot path live end-to-end on a deployed stack)?
- OQ2: `RuntimeConfigStorePort` adapter reality (fs-only? DB? object store?) and its atomicity.
- OQ3: does `generate runtime-schemas` regenerate `schema.json` for the versioned trees, and does
  anything validate version documents against it at publish or load time?
- OQ4: triggers runtime processor parity with workers (stores, idempotency, dead-letter reality).
- OQ5: legacy cockpit workflows — which were wired vs aspirational (G1).
- OQ6: multi-instance propagation — what happens today with >1 replica and a pointer flip?
