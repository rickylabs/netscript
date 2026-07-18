# Worklog: issue #818 minimum-dependency-age lockstep

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `beta11-cli--orchestrator/slices/g11-818-minage` |
| Branch | `fix/818-min-dep-age-lockstep` |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | `docs` |

## Design

### Public Surface

- Existing `dispatchPluginVerb(...)` behavior changes only for release-matched first-party plugin
  packages; its signature remains unchanged.
- Existing `netscript init`, `netscript plugin ...`, `netscript plugin ai ...`, and
  `netscript agent init` command names/options remain unchanged.
- Generated outputs change: JSR-mode root `deno.json`, `.mcp.json`, and `.vscode/mcp.json`.
- No export-map entry, new public function/type, dependency, permission, or command is added.

### Domain Vocabulary

- **lockstep package** — a `jsr:@netscript/*` package resolved at exactly
  `NETSCRIPT_RELEASE_VERSION`.
- **minimum dependency age policy** — Deno root config `{ age: "P1D", exclude: [...] }`.
- **protected dispatch** — third-party or explicitly non-release NetScript `deno x` execution.
- **single-resolver dispatch** — exact-version first-party CDN `cli.ts` under explicit `deno run`.

### Archetype-6 Structure

- Spine abstracts remain `CliCommand<Input, Result>`, `CliCommandGroup`, `CliRoot`,
  `UseCase<Input, Result>`, and `Registry<TKey, TValue>`; none is modified.
- No layer-2 abstract is added or changed.
- Relevant vertical features are `public/features/plugins/{dispatch,ai}` and
  `public/features/agent/init`; kernel generation remains under `kernel/templates/workspace`.
- Extension axes/registries are unchanged. The lockstep predicate is a closed security policy, not
  a registry axis.
- Composition files and the top-level command list are unchanged; R-A6-N5 declarativity is not in
  the diff.

### Ports

- Existing `ProcessPort` remains the subprocess test seam for plugin/AI dispatch.
- Existing `AgentInitFileSystem` remains the host-config write seam.
- No new port: Deno config generation is pure, and package classification is a finite policy.

### Constants

- `NETSCRIPT_RELEASE_VERSION` — authoritative exact release version.
- NetScript lockstep package-name inventory — shipped package/connector names eligible for exact
  version exclusions.
- `P1D` — retained Deno third-party age window.
- `deno.json` — explicit absolute config target for subprocess/MCP argv.

### Semantic Test Strategy

- Parse generated JSON and compare the exact `minimumDependencyAge` object.
- Assert it is absent in local mode.
- Assert complete command arrays for lockstep, third-party, and explicitly different-version cases.
- Assert both Claude and VS Code host argv include the explicit project config and pinned CLI.
- Do not snapshot entire generated files (AP-18).

### Commit Slices

| # | Slice | Gate | Files |
| - | ----- | ---- | ----- |
| 1 | Exact scoped policy in generated JSR workspace config | Workspace generator tests + parser smoke + scoped wrappers | scaffold constants, root generator/test, run artifacts |
| 2 | One-resolver lockstep plugin and AI dispatch with protected fallbacks | Dispatch/AI tests + full plugins feature tests | plugin dispatch/AI source+tests, run artifacts |
| 3 | Explicit MCP config selection and aligned user docs | Agent-init tests + docs overlay checks | agent init source/test, CLI/site docs, run artifacts |

### Deferred Scope

- Owner-authorized fresh canary publication proof — release phase only.
- Deno upstream/backport and minimum supported Deno decision — no product rework required now.
- Existing CLI doctrine and public-doc debt — unchanged.

### Contributor Path

To add a release-train package, add its package name to the finite scaffold/connector inventory and
extend the generator test. To add a plugin dispatch path, classify it as exact lockstep or protected,
then copy the full-array test pattern next to the builder. Do not add a global flag or wildcard
exception.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-07-18T02:03:59+02:00 | Plan | Research + Design checkpoint | Re-baselined #818/#817, verified Deno 2.9 config key/parser, inventoried product call sites, locked three implementation slices. |
| 2026-07-18T02:20:00+02:00 | S1 | Implement + validate | Added the finite release-train inventory and generated JSR-only `P1D` policy with exact exclusions; local mode remains policy-free. |
| 2026-07-18T02:30:00+02:00 | S2 | Implement + validate | Routed only effective lockstep first-party plugin CLIs through direct JSR URLs with the project config; preserved protected `deno x` argv for third-party and old-version inputs. |
| 2026-07-18T02:45:00+02:00 | S3 | Implement + merge-readiness | Added explicit root config to both MCP host argv arrays, aligned CLI/site docs, and completed package plus 60-gate runtime validation. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| Exact-version config exclusions + `P1D` | Preserve third-party supply-chain policy. | Deno 2.9 schema/docs; issue direction |
| Direct run only for lockstep executable paths | Avoid Deno 2.9.3 `x` flag/config loss. | PR #817 causal proof |
| No new public abstraction | Existing seams cover argv and generated config. | Doctrine A6/A9 and focused code |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| Parent orchestrator plan artifacts absent from this worktree | minor | yes |

## Gate Results

| Gate | Result | Evidence |
| --- | --- | --- |
| Tier-A PLAN-EVAL | PASS | Supervisor verdict approved D1–D6 as locked. |
| Focused generator regression | PASS | `deno test -A --unstable-kv .../generators_test.ts`: 15 passed, 0 failed. |
| Full touched template directory | PASS | `deno test -A --unstable-kv packages/cli/src/kernel/templates/workspace`: 15 passed, 0 failed. |
| Generated-config parser smoke | PASS | Deno 2.9.3 subprocess parsed generated JSR config and returned `config-ok`; temporary file removed. |
| Scoped check/lint/fmt wrappers | PASS | 3 files selected; zero failures/findings. |
| `quality:scan` | PASS | Repository scan `ok: true`, zero findings; seven existing allowances reported. |
| `arch:check` | PASS | Exit 0; existing dependency/doctrine warnings only, no new failure. |
| Tier-A S1 review | PASS | Supervisor sign-off confirmed D1/D3/D4 and both-mode generator coverage. |
| Focused S2 dispatch tests | PASS | Dispatch + AI test files: 4 tests / 11 nested steps passed, 0 failed. |
| Full public plugins feature directory | PASS | 22 tests / 54 nested steps passed, 0 failed. |
| S2 scoped check/lint/fmt wrappers | PASS | 4 files selected; zero failures/findings. |
| S2 `quality:scan` | PASS | Repository scan `ok: true`, zero findings; seven existing allowances reported. |
| S2 `arch:check` | PASS | Exit 0; existing dependency/doctrine warnings only, no new failure. |
| Tier-A S2 review | PASS | Supervisor accepted the S2 command-array and full-directory evidence. |
| Focused + full agent-init directory | PASS | 3 tests passed, 0 failed in each invocation. |
| Full CLI package | PASS | 379 tests / 410 steps passed, 0 failed. |
| S3 scoped check/lint/fmt wrappers | PASS | 2 source files selected; zero failures/findings. |
| Documentation links | PASS | 98 docs; zero broken links, anchors, or orphans. |
| README standard | BASELINE FAIL | 35/36 repository READMEs fail existing section-vocabulary rules; CLI was already among them. No new class introduced. |
| CLI doc lint | PASS | 3 exported entrypoints; zero private refs, missing JSDoc, or other findings. |
| Workspace publish dry-run | PASS | `Success Dry run complete`; existing dynamic-import warnings only. |
| S3 `quality:scan` | PASS | Repository scan `ok: true`, zero findings; seven existing allowances. |
| S3 `arch:check` | PASS | Exit 0; existing dependency/doctrine warnings only. |
| Full `scaffold.runtime` | PASS | 60 passed, 0 failed; cleanup gate passed. |

## Handoff Notes

- Implementation is complete and ready for supervisor-dispatched IMPL-EVAL.
- Claude and VS Code MCP argv arrays both select the absolute project `deno.json` before `-A`.
- Documentation consistently states the 24-hour window, exact lockstep exception, and unchanged
  third-party policy.
