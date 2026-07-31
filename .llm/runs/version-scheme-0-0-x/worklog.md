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
| 2026-07-31 | Plan-Eval | Provider canary | BLOCKED: local Claude/OpenRouter profile has no OpenRouter credential; no evaluator session started. |
| 2026-07-31 | Plan-Eval | Owner authorization | Owner waived the unavailable automated lane, is evaluating personally, and authorized implementation; no verdict recorded. |
| 2026-07-31 | S1 | Release discovery and guards | Added nested member locks to coordinated bump/residue, generalized Markdown and CLI pin guards, and removed frozen CLI test pins. |
| 2026-07-31 | S2 | Runtime derivation and lock reconciliation | Derived MCP/saga-core/streams-core runtime versions, regenerated Fresh UI's tracked lock through Deno, and extended scoped wrappers with explicit package configs. |
| 2026-07-31 | S3 | Docs, process, and fixtures | Replaced current beta-train policy with normal `0.0.x`/pre-1.0 language, regenerated skill and CLI mirrors, and preserved explicit history. |
| 2026-07-31 | S1 follow-up | CI determinism | Sorted Markdown pin findings by path then line and expanded the regression fixture across nested directories after CI exposed walk-order variance. |

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
| Required PLAN-EVAL provider credential is absent | blocking | yes |
| Shared-worktree supervisor overlapped plan artifact updates | significant | yes |

## Gate Results

### Static Gates

| Gate | Command or check | Result | Notes |
| --- | --- | --- | --- |
| Baseline census | focused `rg` survey | PASS | Exact 325 reproduced. |
| Git baseline | raw `git status/log/rev-parse/ls-remote` | PASS | Base `8dca67985`; remote branch at `fbd57c3bf`; no PR yet. |
| S1 focused tests | 24 bump/preflight/readiness/CLI guard tests + 18 cut/canary tests | PASS | 42 passed, 0 failed. |
| S1 scoped wrappers | check/lint/fmt on `.llm/tools/deps`, `.llm/tools/release`, and `packages/cli/src` | PASS | 0 diagnostics/findings; CLI check covered 623 files. |
| S1 quality gate | `deno task quality:gate` | PASS | Quality scan had 0 findings; doctrine checks had no failures (existing warnings only). |
| S2 publish assets | `deno task check:publish-assets` | PASS | Core package metadata outputs are generator-owned and fresh. |
| S2 package tests | MCP 47; saga-core 53; streams-core 10 | PASS | 110 passed, 0 failed. |
| Fresh UI package task | `deno task --config packages/fresh-ui/deno.json test` | FAIL | 164 passed; 2 existing temp-writing tests lacked task permission. |
| Fresh UI explicit-permission rerun | complete 166-test selection with the same nested lock | PASS | 166 passed, 0 failed. |
| S2 scoped wrappers | check/lint/fmt for MCP, saga-core, streams-core, Fresh UI | PASS after tooling fix | Initial lint/fmt runs failed to parse root workspace; explicit `--config` support added and tested. |
| S2 quality gate | `deno task quality:gate` | PASS | 0 quality findings; no doctrine failures. |
| S2 doc lint | MCP / saga-core / streams-core full exports | BASELINE | MCP 0 diagnostics; saga-core 8 and streams-core 5 private-type refs exactly match `origin/main`. |
| S3 docs links | `deno task docs:links` | PASS | 98 docs; 0 broken links, anchors, or enforced orphans. |
| S3 skill mirrors | `agentic:sync-claude:check` + `agentic:check-claude` | PASS | 17 skills / 21 files synchronized; Claude surface valid; lock unchanged. |
| S3 focused tests | Fresh UI desktop 7 + CLI E2E scaffold gate 5 | PASS | 12 passed, 0 failed. |
| S3 scoped wrappers | CLI E2E and Fresh UI check/lint/fmt | PASS | 107 CLI E2E and 149 Fresh UI files covered. |
| S3 release preflight | `deno task release:preflight` | PASS | Text imports, import attributes, file URLs, and self-imports clean. |
| S4 repo-wide tests | `deno task test` | PASS | Includes the deterministic Markdown-audit regression and nested-lock release tests. |
| S4 generated assets | `deno task check:assets-barrel` after S3 commit | PASS | Native regeneration produced no diff. |
| S4 release proof | `deno task release:cut -- 0.0.2 --dry-run` | PASS | Reached `{"gate":"publish-readiness","ok":true,"version":"0.0.2"}`; publish dry-run and `deno ci --prod` also completed. |
| S4 restoration | explicit restore of dry-run-modified paths | PASS | Clean tree; 37 package/root manifests remain `0.0.1-beta.12`; Fresh UI lock has 66 beta.12 pins. |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Plan-Gate | OWNER EVALUATION IN PROGRESS | Owner authorization following `credential=absent` / `auth_required` | Implementation authorized; no PASS or self-verdict recorded. |
| jsr-audit scan | PASS | `research.md`; `deno doc` on affected package surfaces | No planned export/type change. |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Agentic runtime | FAIL | `agentic:runtime status` reported degraded / mobile disconnected | Does not block local work; no mobile claim. |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| --- | --- | --- | --- |
| `release:cut -- 0.0.2 --dry-run` | PASS | Structured publish-readiness output | Reached `{"gate":"publish-readiness","ok":true,"version":"0.0.2"}` and completed every later dry-run gate; mutations restored. |

## Handoff Notes

- PLAN-EVAL should inspect D3 (nested lock), D5 (generic/blocking Markdown scanner), and the
  historical allowlist first.
- No implementation file has been edited before PLAN-EVAL.
- Implementation proceeds on explicit owner authority while the owner evaluates the committed plan.

## Baseline Tier Census

The 325 baseline occurrences map as follows; the final release proof will confirm the mechanisms.

| Classification | Baseline count | Disposition |
| --- | ---: | --- |
| Tier 1 — exact literal deleted | 43 | Obsolete roadmap/process pins, frozen tests, and current doc examples removed or made version-neutral. |
| Tier 2 — reduced to stage word | 7 | UI templates and design footers now say `pre-1.0`. |
| Tier 3 — release-owned / auto-bumping | 262 | 193 already coordinated; 65 member-lock and 4 runtime occurrences made derivable. |
| Historical owner exemption | 13 | Immutable release incidents, telemetry compatibility evidence, captured telemetry, and worker incident. |
| **Total** | **325** | **Complete** |

The 132 occurrences outside the original 193 release-owned set landed as 43 Tier 1, 7 Tier 2,
69 newly auto-bumping Tier 3, and 13 immutable historical occurrences. The two CLI E2E literals
that became a constructed semantic-version fixture are Tier 1: `release:cut` does not move that
fixture, and the original exact pins no longer survive.

### Every Tier 3 site and its bump mechanism

| Baseline sites | Count | Why `release:cut` moves them |
| --- | ---: | --- |
| Root and member `deno.json` versions | 106 | `discoverVersionFiles()` walks the root manifest and every workspace-member manifest, then `coordinateVersionBump()` rewrites their exact version. |
| Root `deno.lock` NetScript pins | 66 | The root lock is included in the coordinated file set and exact prior-release ranges are replaced. |
| `packages/fresh-ui/deno.lock` NetScript pins | 65 | The new adjacent-member-lock discovery includes the tracked nested lock; the residue scan independently rejects any prior release left there. |
| `scaffold.plugin.json` versions | 12 | Workspace-member scaffold manifests are discovered and rewritten by the coordinated bump. |
| Existing generated publish metadata | 9 | `release:cut` runs `gen:publish-assets` after manifest bump, regenerating the seven package metadata files plus the CLI and MCP publish-asset constants. |
| MCP, saga-core, and streams-core runtime version consumers | 4 | MCP consumes its existing generated constant; saga-core and streams-core consume new `package-metadata.generated.ts` constants emitted by `gen:publish-assets`. |
| **Tier 3 total** | **262** | **Every site answers “yes” to “will `release:cut` move this?”** |

### Preserved historical exact references

- Eight mirrored beta.10 release-incident references in the NetScript release skill.
- Two beta.5 trigger telemetry migration references.
- One beta.5 telemetry alias-window constant.
- One beta.5 captured Aspire telemetry scope version.
- One beta.7 worker scaffold incident reference.
