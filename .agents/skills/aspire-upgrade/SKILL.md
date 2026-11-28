---
name: aspire-upgrade
description: >
  Upgrades NetScript's pinned Aspire version (CLI, SDK, Aspire.Hosting.* integrations, dashboard,
  MCP) from one release to the next and proves nothing regressed. USE FOR: a new Aspire patch,
  minor, or major release landed; "bump Aspire"; "is our Aspire pin current"; "what breaks if we
  take Aspire X"; re-recording Aspire fixtures; the version-parity gate is red; a generated project
  restores an Aspire package that no longer exists. DO NOT USE FOR: diagnosing a running AppHost
  (use `aspire`), release cuts (use `netscript-release`), JSR/npm dependency bumps (use
  `netscript-deno-toolchain`).
---

# Aspire Upgrade Skill

An Aspire upgrade is a **pin sweep plus a surface re-proof**: the version literal lives in a fixed,
enumerable set of places, and the behaviors NetScript depends on are pinned by recorded fixtures and
gates that must be re-recorded or re-run against the new release — never re-asserted from release
notes.

The Aspire 17.0.0 adoption (epic #2278) is the worked example; every rule below was paid for across
the 17.0.0 native Deno AppHost and first-party `Aspire.Hosting.JavaScript` (`addDenoApp`) migration.

## When to Use

- A new Aspire release exists and someone asks whether or how to take it.
- `deno task check:aspire-version-parity` fails, or `aspire doctor` on a host disagrees with the
  pin.
- Aspire CLI, dashboard, MCP tool surface, or `aspire ... --format Json` shapes changed and a
  fixture or gate went red.
- Planning canary boundaries for an Aspire bump inside a NetScript release.

## When Not to Use

- A resource is unhealthy, a trace is missing, a port is wrong: that is the `aspire` skill.
- Publishing NetScript or rolling back a release: `netscript-release`.
- `@std/*`, JSR, npm pins: `netscript-deno-toolchain` (`deps:latest` knows registries, **not**
  NuGet).

## Key Concepts

### The pin map — where the version literal lives

| Surface                      | File(s)                                                                                                                                                                                                    | What it pins                                                                                               |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Generated project SDK        | `packages/cli/src/kernel/constants/scaffold/scaffold-versions.ts` (`ASPIRE_SDK`)                                                                                                                           | `aspire.config.json` + AppHost SDK of every scaffolded workspace (`generate-aspire-config.ts`, `plan-init.ts`) |
| Generated integrations       | `packages/cli/src/kernel/constants/scaffold/scaffold-aspire.ts` (`SCAFFOLD_ASPIRE_INTEGRATIONS.*.VERSION`)                                                                                                 | `Aspire.Hosting.{PostgreSQL,MySql,SqlServer,Redis,JavaScript,Browsers}` NuGet versions                     |
| Host toolchain (external)    | `<project-root>/.mise.toml` (`aspire = "…"`) — **not tracked** in the repo; each host (NAS/WSL) pins its own CLI beside the checkout                                                                       | The CLI every local agent runs; keep it equal to the CI pin by hand                                        |
| CI toolchain                 | `.github/workflows/e2e-cli.yml`, `e2e-cli-prod.yml`, `e2e-cli-prod-local.yml` (`dotnet tool install Aspire.Cli --tool-path "$HOME/.dotnet/aspire-cli" --version …`, NuGet/CLI cache keys, exact version guard) | The CLI the runtime tiers run                                                                              |
| CI toolchain policy          | `.github/toolchain.env` (Aspire CLI/SDK pins) + `.github/scripts/aspire-nuget-cache-policy.test.ts` (cache-key and tool-path policy) — both enforced by the parity gate                                    | Single CI policy check across all four runtime jobs                                                        |
| Parity gate                  | `.llm/tools/validation/check-aspire-version-parity.ts` (`ASPIRE_PINNED_VERSION`) + `.llm/tools/validation/fixtures/aspire-surface-manifest.tsv`                                                            | The expected version (currently `17.0.0`) and the manifest with per-path owner and disposition             |
| Bump tool                    | `.llm/tools/deps/aspire-bump.ts` (`deno task aspire:bump`)                                                                                                                                                 | Queries NuGet flat-container indexes and rewrites the allowlisted pin files deterministically              |
| Recorded surfaces (fixtures) | see "Fixtures that must be re-recorded"                                                                                                                                                                    | CLI/MCP/dashboard output shapes at the pinned version                                                      |
| Prose                        | `skills/aspire/SKILL.md`, `.agents/skills/aspire/SKILL.md`, docs site `reference/aspire`, `explanation/aspire`, `orchestration-runtime/how-to/upgrade-aspire-17.md`                                        | Version-tagged evidence keys (`V17-*`) and literal version mentions                                        |

Use `deno task aspire:bump -- --dry-run` (and `--apply` after reviewing the diff) to sweep the
allowlisted pin files atomically; `git grep -n '<old-version>'` plus
`deno task check:aspire-version-parity -- --phase 2` is the completeness check.

### Patch vs minor vs major — what each really costs

| Bump  | Expect                                                                                                                                             | Minimum proof                                                                                                                   |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Patch | Pin sweep only. Integration NuGets move in lockstep with the CLI (`Aspire.Hosting.Browsers` may stay on a `-preview` line on the same major train). | Parity gate green, `scaffold.runtime` **both tiers** green at the exact head, fixtures unchanged.                               |
| Minor | Pin sweep **+** CLI/MCP/dashboard surface drift (`describe` health reports, `otel` JSON, MCP tool list, secured dashboard defaults, SDK methods).  | Everything above **+** re-record every fixture in the table, diff them, and re-verify each `V17-*` evidence key in the skill.   |
| Major | Treat as an adoption epic: research run, slice DAG, canary release, one lease at a time.                                                           | The full #2278 shape: `research.md` matrix, `plan.md` slices, PLAN-EVAL, independent IMPL-EVAL, dual-tier runtime E2E, canary.  |

Decide the class from the **upstream what's-new page**, not from the semver digit alone.

### Fixtures that must be re-recorded on a minor/major bump

| Fixture                                                                                                                         | Records                                                                   | Re-record with                                                  |
| ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- | --------------------------------------------------------------- |
| `packages/cli/e2e/tests/application/gates/fixtures/aspire-doctor-<ver>.json`                                                    | `aspire doctor --format Json` shape                                       | the new CLI on a clean host                                     |
| `packages/cli/e2e/tests/application/gates/fixtures/aspire-<ver>-describe-postgres.json`, `aspire-describe-follow-<ver>*.ndjson` | `describe --follow` stream incl. `healthReports`                          | one leased AppHost start, captured through `describe-follow.ts` |
| `packages/cli/e2e/tests/fixtures/aspire-<ver>-mcp-recorded.json`                                                                | the Aspire MCP tool list (15 tools incl. `wait_for_resources` at 17.0.0)  | an AppHost-less stdio MCP session (`aspire agent mcp`)          |
| `packages/cli/src/kernel/templates/aspire/fixtures/aspire-sdk-<ver>.json.gz`                                                    | real generated TypeScript SDK surface from `aspire restore`               | `aspire restore` against a generated `aspire.config.json`       |
| `packages/mcp/tests/fixtures/telemetry/aspire-<ver>-fixture.ts` (+ README)                                                      | dashboard telemetry API span/trace/log JSON                               | a leased AppHost with OTLP traffic; procedure in that README    |
| `.llm/tools/maint/teardown/__fixtures__/aspire-ps-<ver>.json`, `process-tree-<ver>-*.json`, `docker-inspect-<ver>.json`         | `aspire ps` + Docker inspect + process tree for ownership probes          | the leased start above                                          |

Keep only the current pinned version's fixtures unless a test explicitly verifies an active
multi-version compatibility branch.

### The generated-carrier chain (four gates)

Two skill trees exist and only one is a carrier input. `.agents/skills/` is the authoritative
**agent** source (read directly; `.claude/skills/repo-skills` is the single Claude bridge, no
mirrors). The **consumer** bundle shipped in the CLI comes from the top-level `skills/` tree
(`skills/manifest.json`): `skills/` prose -> `gen:assets-barrel` (`embedded.generated.ts`,
`skills.generated.ts`) -> `gen:publish-assets` -> `check:publish-assets`. `gen:mcp-export-corpus`
reads only `packages/`/`plugins/` doc surfaces and is not part of this chain. Editing
`.agents/skills/**` regenerates nothing; editing `skills/**` must be followed by the chain. A
`docs/site/**` page edit starts one hop earlier: `gen:agent-docs-prose` (site build ->
`prose.json.gz` + `provenance.json`) -> barrel (`agent-docs.generated.ts`) -> `gen:publish-assets`
(`packages/mcp/src/publish-assets.generated.ts`); run `check:agent-docs-prose` locally before
pushing. Regenerate in that order on a **clean tree** (the corpus generator refuses a dirty read
set) and run `deno task maint:dogfood-skills` for the consumer bundle. Never hand-edit a
`*.generated.ts`.

### Runtime evidence is leased and serialized

Local AppHost starts need the coordinator's runtime lease; hosted proof is the `e2e-cli`
`scaffold-runtime` tiers (postgres + sqlite), which serialize behind a global mutex. Plan for one
exact-head dual-green, and keep the head immutable once it is green.

## Workflow

1. **Classify the bump.** Read `https://aspire.dev/whats-new/aspire-<ver>/` (TypeScript view where
   offered). List breaking/deprecated items; tag each TypeScript / CLI / MCP / dashboard / deploy.
   Decide patch / minor / major per the table above and write that decision down first.
2. **Confirm the target exists everywhere it must.** Run `deno task aspire:bump -- --dry-run` (or
   `dotnet tool search Aspire.Cli` / `dotnet package search Aspire.Hosting.PostgreSQL --exact-match`
   for every id in `SCAFFOLD_ASPIRE_INTEGRATIONS`). A generated project restores all of them — one
   missing id fails every `aspire restore`.
3. **Sweep the pin map** (`deno task aspire:bump -- --apply` for the allowlisted pins, plus host
   `.mise.toml` per machine), then `git grep -n '<old>'` over the tree; every remaining hit is
   either archival (documented in the manifest) or a miss.
4. **Regenerate the manifest and run parity**:
   `deno run --allow-read --allow-run=git --allow-write=.llm/tools/validation/fixtures .llm/tools/validation/aspire-surface-manifest.ts`
   then `deno task check:aspire-version-parity` and
   `deno task check:aspire-version-parity -- --phase 2`. Findings with `status: deferred` name an
   owner — resolve or re-own them, do not silence.
5. **Regenerate carriers** in chain order (`gen:agent-docs-prose` -> `gen:mcp-export-corpus` ->
   `gen:assets-barrel` -> `gen:publish-assets` -> `maint:dogfood-skills`); verify
   `check:agent-docs-prose`, `check:assets-barrel`, `check:mcp-export-corpus`,
   `check:publish-assets`, and `maint:dogfood-skills:check` all exit 0.
6. **Minor/major only: re-record fixtures** (table above) under one runtime lease, diff each against
   the previous recording, and re-verify each tagged evidence key in `skills/aspire/SKILL.md`; edit
   or retag the sentence when the behavior moved.
7. **Prove on hosted CI**: push, wait for `ci` + `e2e-cli` at the exact head — both runtime tiers
   green (`RUN=true`, never policy-skipped), `agent.aspire-mcp-smoke`, `behavior.otel.traces`,
   `behavior.streams.producer-reconnect` passing. Then the PR body mirrors acceptance evidence
   (`acceptance-evidence` block) and the close-gate reruns at the same SHA.
8. **Canary**: an Aspire minor or major justifies a dedicated `0.0.x-canary.n` cut from the merged
   SHA before stable; a patch rides the next scheduled canary.

## Common Pitfalls

- **Deciding "latest" from a prerelease tag.** NuGet lists `-preview` lines ahead of stable; pick
  the stable channel unless the integration only ships preview (`Aspire.Hosting.Browsers` on the
  17.0.0 train uses `17.0.0-preview.1.26567.5`).
- **Assuming the CLI's JSON is complete.** `aspire otel spans|traces --format Json` drops events and
  link attributes; the dashboard telemetry API (`/api/telemetry/{spans,traces,logs}`) is the
  lossless read path. Any fixture built from the CLI projection under-specifies.
- **A secured dashboard rejects unauthenticated OTLP.** With
  `ASPIRE_DASHBOARD_UNSECURED_ALLOW_ANONYMOUS=false`, exporters need
  `OTEL_EXPORTER_OTLP_HEADERS=x-otlp-api-key=…` (the AppHost hands it to resources; probes must
  borrow it — `otlp-headers.ts`), and API reads need the `X-API-Key` from
  `POST /api/telemetry/validateToken`. Silent trace loss after an upgrade is usually this.
- **Caching `~/.aspire` in production E2E workflows.** Install the cached Aspire CLI binary outside
  `~/.aspire` (for example `~/.dotnet/aspire-cli`) so `~/.aspire` AppHost state stays completely
  fresh (`release-canary-workflow_test.ts` enforces this).
- **`Healthy` is not proof and `Unhealthy` is not disproof.** Health reports answer "reachable at
  the published endpoint"; consumers wait on `aspire wait` / `healthReports`, never on log text
  (#1880 readiness contract).
- **Hand-ticking acceptance boxes.** Boxes mirror from the PR's `acceptance-evidence` block via the
  close-gate; a merged PR that mirrored the wrong issue leaves boxes stranded (#863 gate 1).
- **Pushing after green.** Any push to the branch cancels in-flight `e2e-cli`/`ci` runs; rerun at
  the same SHA instead. Never write run artifacts from the slice worktree.
- **Merging main by hand-resolving `*.generated.ts`.** Take either side, then regenerate; the
  line-set diff against main must be exactly your own entries.

## Reference Files

| File                                                                                  | Load when                                            |
| ------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `.llm/tools/deps/aspire-bump.ts`                                                      | Bumping pinned Aspire CLI/SDK/integration versions   |
| `.llm/tools/validation/check-aspire-version-parity.ts`                                | Parity gate red, or changing the expected version    |
| `.llm/tools/validation/aspire-surface-manifest.ts`                                    | Rebuilding the owned Aspire-version surface manifest |
| `packages/cli/e2e/src/application/gates/scaffold/runtime/evidence/describe-follow.ts` | Re-recording `describe --follow` fixtures            |
| `packages/cli/e2e/src/application/gates/scaffold/aspire-dashboard-api.ts`             | Reading telemetry through the secured dashboard API  |
| `packages/mcp/tests/fixtures/telemetry/README.md`                                     | Re-recording the dashboard telemetry fixture         |
| `skills/aspire/SKILL.md`                                                              | Re-verifying the version-tagged evidence keys        |

## Checklist

- [ ] Bump class decided from the what's-new page and written in the PR body.
- [ ] Every id in `SCAFFOLD_ASPIRE_INTEGRATIONS` + `Aspire.Cli` confirmed to exist at the target.
- [ ] `git grep -n '<old-version>'` shows only manifest-documented archival hits.
- [ ] Parity (Phase 1 and Phase 2), corpus, barrel, publish-assets, dogfood checks green.
- [ ] Both `scaffold-runtime` tiers green (`RUN=true`) at the exact head; fixtures re-recorded for minor/major.
