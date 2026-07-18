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

No implementation gates have run. PLAN-EVAL is the next hard gate and is owned by a separate,
supervisor-dispatched session.

## Handoff Notes

- Plan evaluator should inspect D1–D7, the protected explicit-version case, and S1's exact exclusion
  inventory first.
- No product code has been modified.
