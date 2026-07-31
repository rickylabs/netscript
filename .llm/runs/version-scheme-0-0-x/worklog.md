# Worklog: `0.0.x` release scheme

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `version-scheme-0-0-x` |
| Branch | `chore/version-scheme-0-0-x` |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | `docs` |

## Design

### Public Surface

- `deno task release:cut -- <normal-version>` remains the stable cut entrypoint.
- `deno task release:canary -- <normal-version>` derives `<normal-version>-canary.N`.
- `coordinateVersionBump()` / `discoverVersionFiles()` own every coordinated manifest and tracked
  workspace lock.
- `auditMarkdownPins()` rejects stale exact/range NetScript pins across owned Markdown.
- Runtime package identity remains internal metadata; no new package export is added.

### Domain Vocabulary

- `release version` — a normal `0.0.x` core version.
- `canary version` — `<release-version>-canary.N`, ordered below its release.
- `version file` — a coordinated manifest, scaffold manifest, root lock, or tracked member lock.
- `generated package metadata` — publish-safe TypeScript string constants sourced from manifests.
- `historical version` — an immutable shipped-version fact that is intentionally not auto-bumped.
- `current pin` — a consumer/runtime reference that must follow the coordinated release version.

### Ports

- No new ports. Existing filesystem/command seams in the release tools and generator are sufficient.

### Constants

- `PUBLISH_ASSET_OUTPUTS` — complete generated-version output set.
- `CANARY_PRERELEASE_LABEL` — `canary`.
- Generic semver pin patterns — accept normal and prerelease semver without encoding a train name.
- `releaseVersion` / `releaseSpecifier` — docs-site values derived from CLI `deno.json`.

### Commit Slices

| # | Slice | Gate | Files |
| --- | --- | --- | --- |
| S1 | Release discovery + guard semantics | Focused release/CLI tests and scoped wrappers | Release/deps tools, workflow example, CLI guard, run artifacts |
| S2 | Generated runtime versions + owned fixtures | Generator freshness, package/Fresh UI tests, quality gate | Generator/generated files, MCP/plugin cores, CLI/Fresh UI, nested lock, run artifacts |
| S3 | Docs/process/resources/skills | Docs links, skill sync/check, targeted census | Docs/root/RFC/resources/skills/mirror, run artifacts |
| S4 | Full release proof and final evidence | Complete validation + release dry-run + restore verification | Run artifacts and PR evidence |

### Deferred Scope

- Published-version history normalization — immutable evidence remains untouched.
- Public API/architecture remediation — no new API requires it.
- Release publication/merge — explicitly owner-controlled after this PR.

### Contributor Path

To add a version-bearing publishable asset, extend `.llm/tools/generate-publish-assets.ts`, consume
its generated constant, and prove `check:publish-assets`. To add a coordinated version file, extend
`discoverVersionFiles()` and its tests. Documentation uses `releaseVersion`/`releaseSpecifier` or a
version-neutral placeholder; historical literals must identify their historical context.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-07-31 | Plan | Research | Reproduced 325 references; found 193 release-owned and 65 stale nested-lock occurrences. |
| 2026-07-31 | Plan | Design | Locked four slices and the historical/current classification. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| Single normal harness run | One owner-mandated branch/PR and one lockstep release contract | Harness + owner brief |
| A6 + Docs overlay | Release command tooling plus public/process documentation | Archetype decision tree |
| No manifest bump | Owner delegates it to the post-PR release cut | Owner brief |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| Launcher run-dir name lacks canonical branch/suffix shape | minor | yes |
| Supervisor-refined brief expands current owner request | significant | yes |
| Nested Fresh UI lock omitted from bump/residue | significant | yes |
| Markdown gate cannot protect normal-core docs pins | significant | yes |
| Runtime controller cannot prove current Codex mobile attachment | significant | yes |

## Gate Results

### Static Gates

| Gate | Command or check | Result | Notes |
| --- | --- | --- | --- |
| Baseline census | focused `rg` survey | PASS | Exact 325 reproduced. |
| Git baseline | raw `git status/log/rev-parse/ls-remote` | PASS | Base `8dca67985`; remote branch at `fbd57c3bf`; no PR yet. |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Plan-Gate | NOT_RUN | Pending separate Qwen session | Hard stop before S1. |
| jsr-audit scan | PASS | `research.md`; `deno doc` on affected package surfaces | No planned export/type change. |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Agentic runtime | FAIL | `agentic:runtime status` reported degraded / mobile disconnected | Does not block local work; no mobile claim. |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| --- | --- | --- | --- |
| `release:cut -- 0.0.2 --dry-run` | NOT_RUN | Planned S4 | Must restore mutations after completion. |

## Handoff Notes

- PLAN-EVAL should inspect D3 (nested lock), D5 (generic/blocking Markdown scanner), and the
  historical allowlist first.
- No implementation file has been edited before PLAN-EVAL.
