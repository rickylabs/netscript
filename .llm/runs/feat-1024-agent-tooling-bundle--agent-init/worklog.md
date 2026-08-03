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
| 2026-08-03T12:27:00+02:00 | plan-eval | PASS | Verified evaluator commit `c31084e02`: tracked `plan-eval.md` says `PASS`; five advisory checks were carried into implementation. |
| 2026-08-03T12:38:00+02:00 | S1 | red/green implementation | Pre-fix focused test failed on missing `.llm/tools/consumer-tools.json`; implemented the manifest-driven eight-tool bundle, symptom routing, excluded-target detection, clone-independent E2E defaults, generated host-port subprocess gate, and structured missing-binary result. Focused suite now passes 26 tests. |
| 2026-08-03T12:53:00+02:00 | S1 | opposite-family review | Native Claude Opus 4.8 first returned `CHANGES_REQUIRED`: move host-port validation after full plugin/registry generation and add the new barrel to `check:assets-barrel`; two low observations requested a real foreign-CWD dry-run and accurate `--source auto` provenance. All four were fixed, the focused suite passed 26/26, and the resumed independent review returned `SLICE_REVIEW: PASS`. |
| 2026-08-03T13:12:00+02:00 | S2 | red/green implementation | Added `--with-docs`, a 1.18 MB gzip source / 1.6 MB JSR-safe generated asset with 166 router-bearing prose files, exact project evidence resolution (pin, lock range, workspace), every-export `deno doc`, provenance, fail-before-writes installation, symptom routing, and CLI/site references. Focused suite passes 35 tests. |
| 2026-08-03T13:13:00+02:00 | S2 | real consumer fixture | Ran the local CLI from a temp consumer project with one exact `@netscript/config@0.0.3` dependency and the generated-project minimum-age exclusion. Exit 0 installed 168 docs files, the #1068 router, 4/4 config export sections, and matching version provenance; the temp project was removed. |
| 2026-08-03T13:22:00+02:00 | S2 | opposite-family review | Separate Claude Opus 4.8 session `bcdbdd4b-edc6-42ec-82ea-11edf9b2404a` returned `SLICE_REVIEW: PASS` after checking optionality, exact-version resolution, every-export generation, fail-before-write behavior, symptom discovery, generated-asset freshness, and publication boundaries. Its two observations were non-blocking: VS Code hosts retain their pre-existing no-prose behavior, and the new source/generated assets must be included in the slice commit. |
| 2026-08-03T13:30:00+02:00 | S2 | sign-off gates | Combined focused regression suite passed 37/37; scoped check/lint/fmt selected 31 TypeScript files with zero findings; links, accuracy, quality, architecture, CLI doc lint, publish dry-run, and byte-stable asset regeneration passed. The JSR simulation lists the 1.51 MB docs asset plus tool/skill assets. |
| 2026-08-03T13:36:00+02:00 | S2 | commit/evidence | Committed and pushed `e1ba0b005`; detached pre-fix worktree at `d6265fa52` produced exit 1 when asserting `--with-docs` in real CLI help, while current help prints the several-megabyte flag. Checked all five evidenced #1061 boxes and posted issue/PR evidence comments `5165184953` / `5165185588`. |
| 2026-08-03T13:58:00+02:00 | S3 | full static gates | Required `deno task check` and `deno task test` completed without failures; structured verification selected 2,524 TypeScript files across 22 batches with zero diagnostics. Stopped a redundant compact-reporter rerun started only for duplicate evidence. |
| 2026-08-03T14:10:00+02:00 | S3 | runtime contention | Initial guarded runtime was interrupted before service startup when a foreign Aspire verification appeared after the clear leak-check. After that owner exited and the reporter showed zero survivors, a fresh one-pass run started; another foreign AppHost began two seconds later. The run passed 47 gates but `behavior.service-health` returned database-unhealthy and failed; cleanup passed and removed all run-owned containers. This is invalid due to documented concurrency and does not evidence acceptance. |
| 2026-08-03T14:27:00+02:00 | S3 | consumer red/fix | A real fresh-project installed-tool run from `/tmp` proved clone-independent mode selected `jsr:@netscript/cli@0.0.3` but failed before scaffold because direct `deno run jsr:` does not honor the project config's minimum-age exclusion. Added explicit `--minimum-dependency-age=0` only to public-release commands, plus a dry-run regression assertion. Focused tool/runner/host-port suite passes 15/15; scoped check/lint/fmt passes; regenerated embedded tools contain the fix. Runtime rerun waits on a newly started foreign verification. |
| 2026-08-03T14:35:00+02:00 | S3 | consumer command-surface red/fix | Corrected installed fixture then proved exact-release scaffold succeeds, but its first plugin step failed because the tool called nonexistent `plugin add`; public `0.0.3` exposes `plugin install`. Switched all five official plugin steps to the released command and added a dry-run assertion for `plugin install worker`; focused/scoped gates and regenerated asset pass. |
| 2026-08-03T14:40:00+02:00 | S3 | consumer path-closure red/fix | Corrected consumer run passed public scaffold, five plugin installs, DB init/generate/seed/status, and registry generation, then rejected a stale assertion for `plugins/auth/scaffold.plugin.json`; the released thin auth install actually produces `auth/mod.ts`, the generated auth Prisma contribution, and Aspire helper. Updated all three path assertions and added a fixture guard forbidding the nonexistent manifest reference. The failed run's Postgres was proven owned through explicit `--owned-root`, removed by exact container ID, and leak-check returned zero survivors. |
| 2026-08-03T14:45:00+02:00 | S3 | consumer source-boundary red/fix | The next installed-tool run reached generated-workspace validation and failed with TS2307 because consumer projects have no maintainer-clone `./packages` tree. Made generated check targets source-aware: local-source mode retains `./packages`, while exact-release mode checks only consumer-generated directories. Added a consumer dry-run regression assertion, passed the focused 4-test suite and scoped check/lint/fmt, regenerated the embedded tool asset, removed the exact reporter-proven owned Postgres container, and confirmed zero survivors. |
| 2026-08-03T14:50:00+02:00 | S3 | consumer runtime-state red/fix | The installed tool then passed 22 steps through generated type-check but host-port validation threw `PermissionDenied` while descending into the live Postgres `.data` mount. Updated the validator walker to prune generated `.data`, `.git`, and `node_modules` trees before traversal; a new filesystem regression proves runtime state is not scanned. Ten validator tests and scoped check/lint/fmt pass, the embedded asset was regenerated, and the exact owned Postgres container was removed with zero survivors confirmed. |

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
| Named Fable and policy-alias Claude review routes were unavailable; native `claude-opus-4-8` completed the required opposite-family review. | minor | yes |
| `docs:maintenance` reaches unrelated stale Claude mirrors for `aspire` and `netscript-release`; this slice's `docs:links` and `docs:accuracy` sub-gates pass and the foreign mirrors were left untouched. | minor | yes |
| Foreign Aspire verification runs repeatedly appeared after clean leak-check snapshots; one owned run was interrupted and one 47/48 run hit the documented contention-only service-health failure. | moderate | yes |

## Gate Results

### Static Gates

| Gate | Command or check | Result | Notes |
| --- | --- | --- | --- |
| CLI baseline doc lint | `deno task doc:lint --root packages/cli --pretty` | PASS | 3 entrypoints, 0 diagnostics. |
| agent-init baseline tests | focused `deno test --allow-all` | PASS | 9 passed, 0 failed. |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Plan-Gate | PASS | `c31084e02`; OpenHands/Qwen 3.7 Max/high | Five advisory checks retained for IMPL-EVAL. |
| S1 focused tests | PASS | 26 passed, 0 failed | Includes pre-fix red, foreign-CWD tool help, exact public CLI, missing Aspire binary, and generated JSON host-port scan. |
| S1 opposite-family review | PASS | Claude Opus 4.8 session `964dfe11-04fb-4f0e-8b80-66d423354123` | Initial two medium findings fixed; resumed review verified all fixes and reported no actionable defect. |
| S1 scoped check/lint/fmt | PASS | 12 TypeScript files selected; zero failed batches/findings | Repo-native JSON wrappers, rerun after review fixes. |
| S1 quality/doctrine | PASS | `quality:scan`; `arch:check` exit 0 | Existing warnings only; no new findings/debt. |
| CLI doc lint | PASS | 3 entrypoints, 0 diagnostics | Published package bar remains clean. |
| Generated asset freshness | PASS | regenerate + byte-compare | Skills and agent-tools barrels unchanged after regeneration; hashes recorded in command output. |
| S2 focused tests | PASS | 35 passed, 0 failed | Includes router-required build, no-flag absence, path closure, lock/workspace/no-lock cases, mismatch, and launch-throw behavior. |
| S2 docs site build | PASS | `NO_COLOR=1 deno task build` in `docs/site` | 589 files generated; an initial Vento failure caught unsafe Markdown formatting churn, which was reverted before the successful build. |
| S2 real install | PASS | temp local-CLI consumer fixture | 168 docs files; router true; exact version true; 4/4 config export subpaths. |
| S2 opposite-family review | PASS | Claude Opus 4.8 session `bcdbdd4b-edc6-42ec-82ea-11edf9b2404a` | No actionable defect; all eight requested challenge areas verified. |
| S2 combined regression suite | PASS | 37 passed, 0 failed | Includes S1 tool regressions, optional docs, exact package evidence, every export, router/path closure, mismatch, and missing-binary launch throws. |
| S2 scoped check/lint/fmt | PASS | 31 TypeScript files selected; zero failed batches/findings | Includes generated assets, CLI agent feature/adapters, and docs builder. |
| Docs links/accuracy | PASS | 98 docs, 0 broken links/anchors; accuracy PASS | Umbrella maintenance then stopped on two unrelated stale Claude mirrors. |
| S2 quality/doctrine | PASS | `quality:scan`; `arch:check` exit 0 | Existing warnings only; no new findings/debt. |
| S2 CLI doc lint | PASS | 3 entrypoints, 0 diagnostics | Zero missing JSDoc or private-type references. |
| S2 publish dry-run | PASS | `@netscript/cli@0.0.3`; generated docs 1.51 MB | Simulated JSR file list contains docs, tools, and skills assets. |
| S2 generated asset freshness | PASS | regenerate + identical SHA-256 | Docs `71606ae0…`, tools `ea4529fb…`, skills `42880579…`. |
| S2 pre-fix red | PASS | detached `d6265fa52` CLI help assertion exited 1 | Current CLI prints the `--with-docs` option; temporary worktree removed. |
| Consumer exact-release availability | PASS after fix | fresh installed tool reached exact `jsr:@netscript/cli@0.0.3`; pre-fix failed on Deno 24h policy; regression suite 15/15 | Explicit public-release flag bypasses only the time-based registry quarantine; local CLI commands are unchanged. Runtime continuation pending quiet host. |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| scaffold runtime | INVALID — retry required | guarded run passed 47/48; `behavior.service-health` database-unhealthy while a foreign AppHost ran concurrently | Suite cleanup passed; no acceptance box ticked. Wait for a stable quiet window before a fresh one-pass retry. |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| --- | --- | --- | --- |
| current agent-init fixture | PASS | 9 focused tests | Establishes pre-change behavior only. |
| tool bundle | PASS | 26 focused tests; independent review | Pre-fix missing-manifest red proof retained; installed paths, foreign-CWD dry-run, missing binary, and final-artifact host-port ordering covered. |
| docs bundle | PASS | 35 focused tests; real temp-project install; independent review | Pre-fix no-flag behavior and missing-generator/path/router/version/binary failure cases are asserted; exact install produced 168 files and 4/4 exports. |

## Handoff Notes

- PLAN-EVAL should challenge D8: whether project lock/config evidence is sufficient and whether the
  strict same-release assumption matches generated projects.
- It should also inspect D3/D4 for a credible clone-independent E2E without reintroducing agentic
  teardown dependencies.
