# Plan: ship the agent tooling and offline documentation bundles with `agent init`

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `feat-1024-agent-tooling-bundle--agent-init` |
| Branch | `feat/1024-agent-tooling-bundle` |
| Phase | `plan` |
| Target | `packages/cli`, consumer `.llm/tools`, agent skills, and CLI/docs references |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | `docs` |

## Archetype

Archetype 6 is the governing profile because the work changes a public CLI command, installed
project files, generated assets, subprocess behavior, and a full scaffold smoke. The docs overlay
also applies because the release-built prose corpus, symptom routing, and CLI reference must remain
source-aligned and path-valid.

## Current Doctrine Verdict

The historical doctrine table labels `@netscript/cli` **Restructure**, but the matching AP-1 debt
entry records the bounded Archetype-6 promotion as closed on 2026-06-17. This slice preserves the
current public/maintainer/kernel structure and does not reopen the historical monolith work. Open
unrelated CLI debt remains unchanged.

## Axioms in Play

| Axiom | Why it matters |
| --- | --- |
| A1/A2 | The command option, installed manifest, result messages, and failure contract are designed before implementation. |
| A6/A7 | Compression, hashing, path handling, and process execution use Web Platform and `@std/*`; new helpers must encode bundle policy or a real test seam. |
| A8/A9 | Tool/docs generation, installation, and Deno process execution stay in role-named files within the Archetype-6 feature/adapters shape. |
| A10/A11 | Filesystem and command execution remain injected ports; no speculative registry or new extension axis is introduced. |
| A14 | Fixture path closure, missing-binary behavior, docs version checks, scaffold runtime, doc lint, and publish dry-run are required evidence. |

## Goal

Make `netscript agent init` install a discoverable, self-contained agent-grade tool bundle and make
`netscript agent init --with-docs` atomically install a version-locked offline documentation bundle
whose API surfaces cover every export subpath of the exact NetScript packages installed in the
project.

## Scope

- Define and document the exact consumer-facing `.llm/tools` list and installation paths.
- Embed the manifest-declared tool sources into `@netscript/cli` and install them for every host.
- Make the existing full scaffold E2E executable from a consumer project without a framework clone,
  and make it run the Aspire host-port validator against the project it generates.
- Route each tool from the installed skills/help/AGENTS surface by symptom, including the
  excluded-file exit-0 warning for `deno check`.
- Add `agent init --with-docs`, a compressed release-built prose bundle, exact-version/every-export
  API generation, a provenance manifest, loud mismatch/failure semantics, and an informed CLI
  reference entry.
- Add semantic fixture tests for every generated path, no-CWD leakage, no fixture mutation,
  missing executable behavior, version mismatch, and pre-fix red behavior.

## Non-Scope

- Do not edit `/home/codex/repos/ns004-scaffold` or implement #1072's drift/defect evidence gate.
- Do not author or duplicate #1068's task router; consume the merged site-generated `llms.txt`.
- Do not expose all repository `.llm/tools`, release tooling, harness internals, agentic runtime, or
  teardown machinery to consumers.
- Do not add new MCP tools in this slice; installed scripts plus symptom routing satisfy #1024.
- Do not change the stable package export map or release version.

## Hidden Scope

- Generated asset freshness tasks and publish include coverage must include both new generated
  bundles.
- The E2E default CLI changes from a local filesystem entrypoint to the exact embedded public JSR
  specifier when run from an installed project, while preserving local contributor mode in this
  repository.
- Existing generated help paths that do not resolve must be removed or made conditional without
  naming an absent path.
- Docs generation must collect all command output in memory before writing, otherwise a late
  `deno doc` failure leaves a plausible partial bundle.
- Tool and docs outputs must resolve from the installed project root inferred from the installed
  script/config, never from process CWD.

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| D1 | Install the eight advertised tools under `.llm/tools/`, driven by a checked-in consumer manifest with source path, install path, permissions, and symptom. | It gives one auditable consumer/internal boundary and one source for generation, docs, and fixtures. |
| D2 | Install tools for all `agent init` host selections; keep skill files Claude-specific as today. | Tools are project capabilities, not a Claude-only host configuration. |
| D3 | Refactor `scaffold-e2e-test.ts` into a self-contained consumer entrypoint: remove agentic teardown imports, infer the project root from its installed path, select local maintainer CLI only when it exists, otherwise use the exact release JSR CLI. | Copying the current script would reproduce the repository-clone dependency. |
| D4 | Invoke the shipped host-port validator as a critical semantic E2E step immediately after scaffold generation and before runtime start. | This enforces the rule on the artifact consumers actually receive. |
| D5 | Keep subprocess launch errors structured and add a deno-only fixture with a deliberately absent Aspire executable. | `Deno.Command` throws before an exit code exists; CI must exercise that branch. |
| D6 | `--with-docs` installs to `.netscript/docs`; without the flag, no documentation corpus is written and existing host/skill behavior remains unchanged apart from #1024's unconditional tool bundle. | The corpus is several MB and must remain opt-in. |
| D7 | Build prose assets from the site-generated bundle (including #1068's router), compress the canonical file map with Web Platform gzip, and embed it as generated TypeScript. | This is JSR-safe, reproducible, compact, and does not depend on a package filesystem at runtime. |
| D8 | Generate API text during init from exact `@netscript/*` versions resolved from the project lock/config and a same-release embedded export manifest. Abort before writes if the embedded prose version differs from the running CLI, installed NetScript versions disagree, package evidence is absent, or any `deno doc` command throws/exits non-zero. | It satisfies installed-version fidelity and prevents a plausible but mismatched/partial bundle. |
| D9 | The installed docs manifest records CLI/framework version, source commit, generation time, page count, API package/export counts, and the exact package versions documented. | Consumers can detect and report drift offline. |
| D10 | Do not tick issue checkboxes until a PR acceptance-evidence block maps the verbatim criterion to command output and red/green proof. | The close-gate is part of the implementation, not post-hoc bookkeeping. |

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| Exact consumer tool list | resolved now | The eight #1024 table entries; support files may be manifest dependencies but not advertised tools. |
| Docs install path | resolved now | `.netscript/docs`, avoiding collision with user-authored `docs/`. |
| Runtime registry lookup | resolved now | No network metadata call: embed same-release export maps, resolve exact installed versions locally, then run `deno doc` on each full specifier. |
| Binary distribution of prose | resolved now | Gzip-compressed JSON file map in generated TypeScript. |
| Whether #1072 requires scaffold changes | safe to defer | This slice provides mandatory root announcement and symptom routing; #1072 owns the separate gate in another worktree. Stop if implementation proves that boundary insufficient. |
| Whether full `scaffold.runtime` can run concurrently | resolved operationally | Run leak-check first and only start when no foreign AppHost/Postgres contention is present. |

No must-resolve-now decision remains.

## Risk Register

| Risk | Mitigation |
| --- | --- |
| Embedded docs bloat or JSR rejection | Gzip the canonical map, inspect generated/published file size, run CLI publish dry-run and full doc lint. |
| Tool imports point to absent support files | Make the manifest dependency-closed and run a fresh-project path/reference fixture across every installed file. |
| E2E still assumes monorepo layout | Consumer dry-run asserts every command/path is under the fixture or is an exact public JSR specifier; final guarded runtime smoke runs from the fixture. |
| Docs silently mismatch CLI/project | Compare embedded version, running CLI version, and installed package versions before any write; add red mismatch tests. |
| Missing executable passes locally only | Inject/override the Aspire command in a fixture so `Deno.Command` throws on CI and assert structured failure. |
| Tests mutate checked-in fixtures or process CWD | Use per-test temp projects; resolve outputs from explicit project root; compare checked-in fixture status before/after. |
| Concurrent #1072 causes overlap | Do not edit its worktree; record any required cross-slice change and stop for user direction. |
| Full runtime smoke contends on 15 GB host | Run `agentic:leak-check` first; do not start if resources are foreign/unknown or another scaffold smoke is active. |

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
| --- | --- | --- |
| AP-1 | risk | Keep generation, process adapter, and install orchestration in separate role-named files; watch Archetype-6 LOC caps. |
| AP-2 | risk | Use CompressionStream/DecompressionStream, crypto, URL/path, and existing filesystem abstractions directly. |
| AP-11/AP-25 | risk | Keep `Deno.Command`, filesystem reads, and environment access in adapters or `.llm/tools` edges. |
| AP-18 | risk | Assert semantic file/path/manifest content and runnable commands, not giant bundle snapshots. |
| AP-19 | risk | Consumer manifest/README documents each tool's exact Deno permissions and external binaries. |
| AP-21/AP-22 | clear-by-design | Extend the existing `public/features/agent/init` vertical slice; add no sub-barrels. |
| AP-23 | clear-by-design | Add only an option/dependency wire; no inline command actions in composition. |

## Fitness Gates

| Gate | Required | Expected evidence |
| --- | --- | --- |
| F-1/F-16 | yes | `deno task arch:check`; manual LOC/folder review of touched feature/adapters files. |
| F-3/F-CLI-3..5 | yes | architecture gate plus import review; no kernel-to-surface or public-to-maintainer import. |
| F-5/F-7/F-CLI-8 | yes | `deno task doc:lint --root packages/cli --pretty` → 0 diagnostics. |
| F-6/F-CLI-9..10 | yes | CLI package `deno publish --dry-run --allow-dirty --no-check=remote`; inspect artifact list/size and slow-type output. |
| F-9/AP-19 | yes | installed manifest/README permission table and CLI reference size note. |
| F-10/AP-18 | yes | focused semantic fixtures, pre-fix red proof, no generated-string snapshots. |
| F-15/F-CLI-15..16 | yes | architecture gate; Deno effects remain at adapter/bin edges. |
| F-CLI-21..31 | yes | `deno task arch:check`, `quality:scan`, and manual review for touched Archetype-6 shape. |
| Docs overlay | yes | site build/source alignment, router-presence assertion, and installed local-path closure test. |

## Arch-Debt Implications

| Entry | Action | Notes |
| --- | --- | --- |
| Existing `packages/cli` debt | none | Do not widen or claim closure of unrelated open entries. |
| New debt | none expected | Any incomplete consumer/runtime parity or doc version exception is `FAIL_DEBT`, not an implicit deferral. |

## Validation Plan

| Order | Gate | Command or check | Expected result |
| --- | --- | --- | --- |
| 1 | focused tests | targeted agent-init, asset generator, installed tools, docs builder/installer, E2E option tests | semantic passes plus recorded pre-fix failures |
| 2 | scoped check | `.llm/tools/run-deno-check.ts --root packages/cli --ext ts,tsx` and focused `.llm/tools` roots | selected files > 0; zero failed batches/findings |
| 3 | scoped lint | `.llm/tools/run-deno-lint.ts` on the same roots | selected files > 0; zero findings/failures |
| 4 | scoped format | `.llm/tools/run-deno-fmt.ts` on the same roots | zero formatting drift |
| 5 | generated assets | regenerate tool/docs asset barrels and verify `git diff` is empty after committed outputs | byte-for-byte fresh |
| 6 | package docs | `deno task doc:lint --root packages/cli --pretty` | 0 diagnostics across all exports |
| 7 | quality/doctrine | `deno task quality:scan` and `deno task arch:check` | no new findings/debt |
| 8 | docs quality | docs build/link/accuracy gates applicable to touched references | router included; links/claims aligned |
| 9 | package tests/root gates | `deno task check`, `deno task test`, scoped lint/fmt wrappers, `deno task quality:scan`, `deno task arch:check` | pass with artifacts inspected |
| 10 | publish | CLI package publish dry-run | clean file list, no slow types, generated bundles included |
| 11 | consumer fixture | fresh temp `agent init`, execute installed tool help/dry-run, validate every referenced local path | no framework checkout dependency, no CWD leakage |
| 12 | runtime | leak-check, then one-pass `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` plus installed consumer E2E smoke as scoped by evaluator | no contention; generated project behavior proven |
| 13 | close gate | acceptance mirror dry-run and check-close-gate against draft PR | exact 11/11 mapping before issue mutation |

## Dependencies

- Merged PR #1079 / issue #1068 task router (`origin/main` at `e5bae2858`).
- Deno 2.9 Web Platform compression and `deno doc`.
- Aspire CLI and container runtime only for the guarded runtime smoke.
- No dependency on `/home/codex/repos/ns004-scaffold` changes.

## Drift Watch

- #1072 requires a file change in this worktree rather than its scaffold worktree.
- The built site bundle omits the #1068 router or reports a different release version.
- Installed package versions are mixed in a supported project and the strict same-release rule would
  reject a legitimate configuration.
- The public CLI cannot run the existing full smoke without maintainer-only source copy behavior.
- Generated compressed assets push CLI publish limits or introduce JSR slow-type/doc diagnostics.
