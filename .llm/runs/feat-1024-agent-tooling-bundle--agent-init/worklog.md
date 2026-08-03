# Worklog: agent init tooling and docs bundles

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `feat-1024-agent-tooling-bundle--agent-init` |
| Branch | `feat/1024-agent-tooling-bundle` |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | `docs` |

## Design

### Public Surface

- CLI command remains `netscript agent init`; it adds `--with-docs` and installs the tool bundle
  unconditionally.
- `InitAgentInput` adds `withDocs?: boolean`; `InitAgentResult` continues to report changed files and
  messages, including the docs install location/count when requested.
- No `@netscript/cli` package export or new public entrypoint is added.
- Generated outputs are `.llm/tools/<manifest path>` and, only with the flag,
  `.netscript/docs/{llms.txt,llms-full.txt,pages/**,deno-doc/**,MANIFEST.md}`.

### Domain Vocabulary

- `ConsumerToolManifest` / `ConsumerToolEntry` — exact advertised tool boundary, installed path,
  symptom, permissions, and external binary requirements.
- `AgentToolBundle` — integrity-checked embedded file map plus hash.
- `AgentDocsBundle` — compressed prose payload plus version/provenance/export-map metadata.
- `InstalledNetScriptPackage` — exact package name/version derived from project evidence.
- `AgentDocsGeneration` — complete in-memory file map and package/export counts; only a complete
  value may be written.
- `AgentDocsGenerationError` (or structured equivalent) — mismatch, missing evidence, launch throw,
  non-zero doc command, or empty output.

### Spine and Layer-2 Abstracts

- Five spine abstracts remain unchanged: `CliCommand<Input, Result>`, `CliCommandGroup`,
  `CliRoot<T>`, `UseCase<Input, Result>`, and `Registry<TKey, TValue>`.
- Existing layer-2 abstracts remain unchanged: `ScaffoldCommand`, `DeployStepCommand`,
  `Pipeline<TContext, TResult>`, `PipelineStep<TInput, TOutput>`, `Manifest<TKey, TValue>`, and the
  output-renderer hierarchy. No new abstract is introduced.

### Vertical Feature Catalog

- Existing `public/features/agent/init/` continues to own the command, input/result contract,
  installer orchestration, filesystem port, and Aspire initializer port.
- Existing `public/adapters/agent/` owns real Deno/Aspire process execution. The docs API generator
  process adapter is added here rather than under presentation/application code.
- Existing `kernel/assets/` owns generated embedded strings only; build-time generators remain in
  `.llm/tools/`.
- No other public/maintainer feature catalog changes.

### Extension Axes

- Existing registry axes remain unchanged: plugin kind, DB engine, template, output renderer,
  preset, and deploy target.
- Agent hosts (`claude`, `vscode`) remain a closed finite command vocabulary, not a registry.
- Consumer tool paths are a closed release manifest, not an extension axis.

### Ports

- Reuse `AgentInitFileSystem` for all project writes/existence checks.
- Extend the agent-init dependency contract with one narrow docs generator port returning a complete
  file map; real `Deno.Command` execution lives in `public/adapters/agent/`.
- E2E process launching stays at the standalone tool edge and returns structured command evidence;
  its command name is injectable/overridable for the missing-binary fixture.
- No network port is required for runtime metadata because package export maps are embedded at
  release build time.

### Constants

- `CONSUMER_AGENT_TOOL_PATHS` — the eight manifest-advertised entrypoints.
- `AGENT_TOOL_INSTALL_ROOT` — `.llm/tools`.
- `AGENT_DOCS_INSTALL_ROOT` — `.netscript/docs`.
- `AGENT_DOCS_BUNDLE_FORMAT_VERSION` — finite payload schema version.
- Existing `NETSCRIPT_RELEASE_VERSION` remains the sole CLI release authority.
- Existing command/host/output constants remain unchanged.

### Permissions and Effects

- Installed tool README records exact `--allow-*` needs; full E2E additionally requires Deno,
  Aspire, network, environment, filesystem write, and subprocess permissions.
- Bundle decompression/hash/path validation is pure. Project writes go through the filesystem port.
  `Deno.Command` and lock/config reads belong to the Deno adapter or standalone `.llm/tools` edges.
- Docs generation completes before any `.netscript/docs` write, so mismatch or missing binaries
  cannot leave a partial plausible bundle.

### Semantic Test Strategy

- Build a temp project through the real `initAgent` use case; compare the checked-in consumer
  manifest with installed files and parse every generated local path reference.
- Prove `run-deno-check.ts` selects a deliberately excluded TypeScript file or reports the no-match
  condition structurally; preserve a test that fails against the pre-fix absent install.
- Run installed tool `--help`/dry-run entrypoints from a different process CWD and assert outputs
  remain under the fixture project.
- Exercise the E2E launch path with a guaranteed-missing Aspire executable and assert a structured
  failed step rather than an uncaught exception.
- Feed the docs builder a fixture with/without the #1068 task-router marker and matching/mismatching
  versions.
- Feed the docs installer fake locked packages/export maps and a fake doc runner; assert every
  subpath command, provenance manifest, zero writes on mismatch/failure, and unchanged no-flag path.
- Avoid giant string snapshots; assert hashes, counts, key content, paths, and commands.

### Generated-Project Validation and Consumer Impact

- The installed E2E dry-run uses the exact release JSR CLI when no local maintainer binary exists.
- The full smoke validates host-port policy before Aspire starts and writes logs/smoke workspaces
  under the fixture project, not the repository or caller CWD.
- A final guarded runtime execution from a fresh initialized fixture proves the framework repository
  is not required.

### Composition Declarativity

- `create-public-cli.ts` and `create-maintainer-cli.ts` stay declarative and unchanged unless one
  constructor dependency must be threaded through the existing command-dependency factory.
- `init-agent-command.ts` only parses `--with-docs` into `InitAgentInput`; orchestration remains in
  `initAgent` and process behavior remains in adapters.

### Commit Slices

| # | Slice | Gate | Files |
| - | ----- | ---- | ----- |
| 1 | Install and route the eight consumer agent tools; make scaffold E2E clone-independent and host-port enforcing. | focused agent-init/tool/E2E tests; scoped check/lint/fmt; `quality:scan`; `arch:check`; consumer path-closure fixture | `.llm/tools/consumer-tools.json`, `.llm/tools/README.md`, `.llm/tools/generate-cli-assets-barrel.ts` or focused bundle generator, eight tool sources/tests, generated tool asset, `init-agent*.ts`, `skills/**`, asset/root task wiring, run artifacts |
| 2 | Add `agent init --with-docs` with compressed router-bearing prose, exact-version every-subpath API docs, loud mismatch semantics, and reference docs. | docs builder/installer tests including pre-fix and missing-binary paths; fixture install/path closure; docs gates; CLI doc lint/publish dry-run; full required root gates | focused docs bundle generator/tests, generated docs asset, agent init input/command/use case and Deno adapter/tests, `skills/**`, CLI/agent-tooling references, root asset tasks, run artifacts |

### Deferred Scope

- #1072's drift-entry doctor/otel gate and MCP exposure of `help.md` remain in the separate scaffold
  slice; this run only announces/routes its own installed artifacts.
- Adding MCP wrappers for the scripts is unnecessary for the eleven acceptance criteria.
- Publishing/cutting a release is not part of this PR; publish dry-run is.

### Contributor Path

To add a future consumer tool, add one manifest row with its source/install path, symptom,
permissions, and dependency list; make the source dependency-closed; regenerate the embedded asset;
add a fixture assertion; then route the symptom from the appropriate installed skill. To extend the
docs corpus, change the authoritative docs site, rebuild the external bundle, and regenerate the
compressed asset; never hand-edit the generated TypeScript or API text.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-08-03T11:08:30+02:00 | bootstrap | research/plan | Rebased clean branch onto merged #1079, read both issue bodies and governing skills/doctrine, selected Archetype 6 + docs overlay, and locked two slices. |
| 2026-08-03T12:14:00+02:00 | plan-eval | route canary | Canonical local OpenRouter/Qwen canary returned `BLOCKED (auth_required)` without launching a process. Selected the separate OpenHands Qwen fallback; implementation remains stopped pending its tracked verdict. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| Keep the tool boundary at eight entrypoints | Matches measured issue evidence and excludes release/harness internals. | #1024; research finding 4 |
| Generate API docs at install, prose at release build | They have different freshness authorities. | #1061; external builder incidents |
| Fail before docs writes | A partial/mismatched bundle is worse than none. | #1061 acceptance and trap section |
| Consume merged router | Concurrent docs slice owns its prose. | user brief; PR #1079 |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| Baseline advanced from `ab0fa13fe` to `e5bae2858` to consume merged #1079. | minor | yes |
| Current owner-started Codex session identity is opaque and differs from the named orchestrator route. | minor | yes |
| Local formal evaluator route lacks OpenRouter credentials; use separate OpenHands Qwen fallback. | moderate | yes |

## Gate Results

### Static Gates

| Gate | Command or check | Result | Notes |
| --- | --- | --- | --- |
| CLI baseline doc lint | `deno task doc:lint --root packages/cli --pretty` | PASS | 3 entrypoints, 0 diagnostics. |
| agent-init baseline tests | focused `deno test --allow-all` | PASS | 9 passed, 0 failed. |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Plan-Gate | IN_PROGRESS | local canary blocked; separate OpenHands Qwen fallback requested | No implementation permitted before tracked `plan-eval.md` says `PASS`. |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| scaffold runtime | NOT_RUN | implementation not started | Leak-check required first. |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| --- | --- | --- | --- |
| current agent-init fixture | PASS | 9 focused tests | Establishes pre-change behavior only. |
| tool/docs bundle | NOT_RUN | implementation pending | Must include pre-fix red proof. |

## Handoff Notes

- PLAN-EVAL should challenge D8: whether project lock/config evidence is sufficient and whether the
  strict same-release assumption matches generated projects.
- It should also inspect D3/D4 for a credible clone-independent E2E without reintroducing agentic
  teardown dependencies.
