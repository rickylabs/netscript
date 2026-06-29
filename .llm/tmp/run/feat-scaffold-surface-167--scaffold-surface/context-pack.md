# Context Pack — Plugin Command Surface Unification (#157)

Branch: `feat/scaffold-surface-167` (PR #172, draft). Issue: #167 (marketplace foundation). Lane:
Claude-supervised; framework-source implementation via WSL Codex daemon-attached slices; gates are
the verification bar; PLAN-EVAL (OpenHands minimax-M3) before any slice. Bar = definition of done +
output quality (user).

## State (2026-06-29)

- **Architecture LOCKED v2** (user, 2026-06-29): full unification of `netscript plugin <verb> <kind>`
  into ONE core-owned command contract. Decisions locked into PR #172 body + issue #167 comment.
- v1 thin-scaffold commits on branch (832fa9e8 S1 + 01c4eb49/507c744c/40faebe8/72b02943/64de2b87
  S2a-c) — their DELETIONS (artifacts.ts source factories, auth templates/**, renderPlugin
  full-source copy) are CORRECT and stay; their REPLACEMENT (`src/scaffold/*` + `createPluginScaffold`
  + hand stubs) is the wrong third mechanism → superseded by `src/adapter/*` in S1 (forward-only
  reconcile; no force-push).
- research.md + plan.md rewritten for the unified architecture; this context-pack added.

## The locked architecture (one paragraph)

`@netscript/plugin` + `@netscript/cli` own the command logic and shape (Vite-style composition +
typed seams, strong single-target defaults). Core is never aware of any plugin. A plugin returns a
typed `NetScriptPlugin` object via `createPluginAdapter` (NO cross-package `extends` — doctrine 03
L162-175). MANDATORY commands install/doctor/info/update/remove have shared core logic parameterized
by plugin seams. OPTIONAL `add <resource>` / `generate <resource>` are oRPC-style contract-shaped.
ONE type-checked `ItemScaffolder<TInput>` (stub source + typed substitution, no string concat / no
`.template`) drives BOTH install starter set AND `add <resource>`. Full rename + namespace:
`plugin install <kind>` / `<kind> add <resource>` / `<kind> generate <resource>`. CLI host-side
config wiring + `copyPluginSchemasToRootDb` kept; only `renderPlugin()` full-source branch deleted.

## Next actions (in order)

1. Commit the harness artifacts (research/plan/context-pack/commits) to the branch.
2. Dispatch PLAN-EVAL (OpenHands minimax-M3, separate session) on research.md + plan.md — hard gate.
3. On PASS: implement slices S1→S9 via WSL Codex daemon-attached, gated, one commit each, pushed +
   PR-commented per slice. S1 = core adapter contract (see plan.md §A for the exact API surface).
4. S6 = record plugin-thinness/core-centralization LAW + adapter-contract pattern as doctrine (#158).
5. S8 = `plugin verify` author doctor (deno doc --lint + publish --dry-run + manifest + arch:check +
   contract-completeness → one report); S9 = `plugin new` starter generator (dogfoods the item
   generator; emits a skeleton that passes `plugin verify` + publish dry-run). Marketplace author side.
6. S7 = full verify matrix + dead-code sweep + adversarial review + IMPL-EVAL (qwen3.7-max) → merge.

DoD bar (every slice): skill-first+harness · Deno-native first (@std/Deno/native toolchain, wrap not
reinvent) · JSR-ready (jsr-audit green) · doctrine+fitness = actual merge gates · zero dead/dup code.

## Key files

- `packages/plugin/src/cli/*` (bones: PluginCli — has A4-violating run() to move to a runner;
  PluginItemScaffolder; DoctorReport/isDoctorReportPassing; mountPluginCli; routeVerb).
- `packages/cli/.../dispatch/dispatch-plugin-verb.ts` (`FRAMEWORK_VERBS` already lists the mandatory
  taxonomy; `deno x -A jsr:<pkg>/cli <verb>` dispatch).
- `packages/cli/.../add/add-plugin.ts` (host config wiring KEEP; renderPlugin() full-source DELETE).
- `plugins/<kind>/src/scaffolding/` + `src/cli/*-cli-backend.ts` + v1 `src/scaffold/*` (DELETE/reshape).

## Task IDs

#157 (umbrella) · #160 S1 core · #161 S2 workers · #162 S3 other plugins · #163 S4 CLI · #164 S5 gates
· #165 PLAN-EVAL gate (blocks #160) · #166 S7 verify · #158 doctrine LAW (S6).

## S1 v2 implementation status (2026-06-29)

S1 v2 implemented the `@netscript/plugin/adapter` core contract in `packages/plugin/src/adapter/*`,
removed `PluginCli.run()` orchestration, deleted the v1 `packages/plugin/src/scaffold/*` replacement,
removed the duplicate `PluginItemScaffolder` base, removed the unpublished template/scaffolder
adapter path, and added the `./adapter` export. Package-scoped gates are green: scoped
check/lint/fmt, `deno test --allow-all packages/plugin` (`33 passed`), adapter doc-lint
(`totalErrors:0`), and package-local publish dry-run (`Success Dry run complete`).

Material drift: workspace-level `deno task test --filter plugin` and the workspace-only
`run-publish-dry-run.ts` currently fail on `plugins/auth` importing the deleted v1
`@netscript/plugin/scaffold` export. S1 did not touch `plugins/*`; S2-S4 own that connector/CLI
repointing before final workspace gates.
