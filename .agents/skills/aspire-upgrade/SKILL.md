---
name: aspire-upgrade
description: >
  Upgrades NetScript's pinned Aspire version (CLI, SDK, Aspire.Hosting.* integrations, dashboard,
  MCP) from one release to the next and proves nothing regressed. USE FOR: a new Aspire patch
  (13.5.3 -> 13.5.4), minor (13.5 -> 13.6) or major (13 -> 14) landed; "bump Aspire"; "is our Aspire
  pin current"; "what breaks if we take Aspire X"; re-recording Aspire fixtures; the version-parity
  gate is red; a generated project restores an Aspire package that no longer exists. DO NOT USE FOR:
  diagnosing a running AppHost (use `aspire`), release cuts (use `netscript-release`), JSR/npm
  dependency bumps (use `netscript-deno-toolchain`).
---

# Aspire Upgrade Skill

An Aspire upgrade is a **pin sweep plus a surface re-proof**: the version literal lives in a fixed,
enumerable set of places, and the behaviors NetScript depends on are pinned by recorded fixtures and
gates that must be re-recorded or re-run against the new release — never re-asserted from release
notes.

The 13.4.6 -> 13.5.3 adoption (epic #1712, run `research-aspire-13.5-adoption--0.0.7`) is the worked
example; every rule below was paid for there.

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

| Surface                      | File(s)                                                                                                                                                                                     | What it pins                                                                                                                |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Generated project SDK        | `packages/cli/src/kernel/constants/scaffold/scaffold-versions.ts` (`ASPIRE_SDK`, `ASPIRE_HOSTING_DENO`, `ASPIRE_HOSTING_SQLITE`)                                                            | `aspire.config.json` + AppHost SDK of every scaffolded workspace (`generate-aspire-config.ts`, `plan-init.ts`)              |
| Generated integrations       | `packages/cli/src/kernel/constants/scaffold/scaffold-aspire.ts` (`SCAFFOLD_ASPIRE_INTEGRATIONS.*.VERSION`)                                                                                  | `Aspire.Hosting.{PostgreSQL,MySql,SqlServer,Redis,Garnet,Browsers}` + `CommunityToolkit.Aspire.Hosting.Deno` NuGet versions |
| Host toolchain (external)    | `<project-root>/.mise.toml` (`aspire = "…"`) — **not tracked** in the repo; each host (NAS/WSL) pins its own CLI beside the checkout                                                        | The CLI every local agent runs; keep it equal to the CI pin by hand                                                         |
| CI toolchain                 | `.github/workflows/e2e-cli.yml`, `e2e-cli-prod.yml`, `e2e-cli-prod-local.yml` (`dotnet tool install Aspire.Cli --version …`, NuGet cache key `nuget-aspire-*-<ver>-v1`, the `13.5.*` guard) | The CLI the runtime tiers run                                                                                               |
| CI toolchain policy          | `.github/toolchain.env` (Aspire CLI/SDK pins) + `.github/scripts/aspire-nuget-cache-policy.test.ts` (cache-key version literal) — both enforced by the parity gate                          |                                                                                                                             |
| Parity gate                  | `.llm/tools/validation/check-aspire-version-parity.ts` (`PHASE_TWO_COMPAT_VERSION`) + `.llm/runs/research-aspire-13.5-adoption--0.0.7/aspire-surface-manifest.tsv`                          | The expected version and the 900+ path manifest with per-path owner and disposition                                         |
| Recorded surfaces (fixtures) | see "Fixtures that must be re-recorded"                                                                                                                                                     | CLI/MCP/dashboard output shapes at the pinned version                                                                       |
| Prose                        | `skills/aspire/SKILL.md`, `.agents/skills/aspire/SKILL.md`, docs site `reference/aspire`, `explanation/aspire`, `quickstart/aspire`                                                         | Version-tagged evidence keys (S2-Vn, S9-…) and literal version mentions                                                     |

There is **no single source of truth** today: the product pins (first two rows) are legitimately in
`packages/cli`, but the workflow and parity literals are hand-duplicated and the host `mise` pin
lives outside the repository entirely. A patch bump is therefore a sweep of ~8 files, not one edit.
Until `aspire:bump` tooling exists (see Pitfalls), the sweep is the procedure and
`git grep -n '<old-version>'` over the whole tree is the completeness check.

### Patch vs minor vs major — what each really costs

| Bump           | Expect                                                                                                                                                                       | Minimum proof                                                                                                                  |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Patch `13.5.x` | Pin sweep only. Integration NuGets move in lockstep with the CLI (Browsers may stay on a `-preview` line).                                                                   | Parity gate green, `scaffold.runtime` **both tiers** green at the exact head, fixtures unchanged.                              |
| Minor `13.y`   | Pin sweep **+** CLI/MCP/dashboard surface drift. 13.5 changed: `describe` health reports, `otel` JSON, MCP tool list, secured dashboard defaults, `resource` typed commands. | Everything above **+** re-record every fixture in the table, diff them, and re-verify each S2-Vn/S9 evidence key in the skill. |
| Major `14`     | Treat as an adoption epic: research run, slice DAG, canary release, one lease at a time.                                                                                     | The full #1712 shape: `research.md` matrix, `plan.md` slices, PLAN-EVAL, per-slice IMPL-EVAL, canary.                          |

Decide the class from the **upstream what's-new page**, not from the semver digit: 13.5 was a
"minor" that broke every telemetry read path.

### Fixtures that must be re-recorded on a minor bump

| Fixture                                                                                                                         | Records                                                             | Re-record with                                                  |
| ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- | --------------------------------------------------------------- |
| `packages/cli/e2e/tests/application/gates/fixtures/aspire-doctor-<ver>.json`                                                    | `aspire doctor --format Json` shape                                 | the new CLI on a clean host                                     |
| `packages/cli/e2e/tests/application/gates/fixtures/aspire-<ver>-describe-postgres.json`, `aspire-describe-follow-<ver>*.ndjson` | `describe --follow` stream incl. `healthReports`                    | one leased AppHost start, captured through `describe-follow.ts` |
| `packages/cli/e2e/tests/fixtures/aspire-<ver>-mcp-recorded.json`                                                                | the Aspire MCP tool list (14 tools incl. `refresh_tools` at 13.5.3) | an AppHost-less stdio MCP session (`aspire mcp start`)          |
| `packages/mcp/tests/fixtures/telemetry/aspire-<ver>-fixture.ts` (+ README)                                                      | dashboard telemetry API span/trace/log JSON                         | a leased AppHost with OTLP traffic; procedure in that README    |
| `.llm/tools/agentic/teardown/__fixtures__/aspire-ps-<ver>.json`, `process-tree-<ver>-*.json`                                    | `aspire ps` + process tree for ownership probes                     | the leased start above                                          |

Keep the previous version's fixture beside the new one where a test asserts a compat branch
(`aspire-13.4.6-fixture.ts` stays next to `aspire-13.5.3-fixture.ts`); retire it only when the
compat branch is deleted.

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
pushing (D-331 cost one CI cycle). Regenerate in that order on a **clean tree** (the corpus
generator refuses a dirty read set) and run `deno task agentic:dogfood-skills` for the consumer
bundle. Never hand-edit a `*.generated.ts`.

### Runtime evidence is leased and serialized

Local AppHost starts need the coordinator's runtime lease; hosted proof is the `e2e-cli`
`scaffold-runtime` tiers (postgres + sqlite), which serialize behind a global mutex. Plan for one
exact-head dual-green, and keep the head immutable once it is green.

## Workflow

1. **Classify the bump.** Read `https://aspire.dev/whats-new/aspire-<ver>/` (TypeScript view where
   offered). List breaking/deprecated items; tag each TypeScript / CLI / MCP / dashboard / deploy.
   Decide patch / minor / major per the table above and write that decision down first.
2. **Confirm the target exists everywhere it must.** `dotnet tool search Aspire.Cli` /
   `dotnet package search Aspire.Hosting.PostgreSQL --exact-match` for the CLI and **every** id in
   `SCAFFOLD_ASPIRE_INTEGRATIONS`; `CommunityToolkit.Aspire.Hosting.Deno` lags the core line and
   pins separately. A generated project restores all of them — one missing id fails every
   `aspire restore`.
3. **Sweep the pin map** (all tracked rows; the external `mise` pin is updated per host), then
   `git grep -n '<old>'` over the tree; every remaining hit is either archival (documented in the
   manifest) or a miss.
4. **Regenerate the manifest and run parity**:
   `deno run --allow-read --allow-run=git --allow-write .llm/runs/research-aspire-13.5-adoption--0.0.7/tools/aspire-surface-manifest.ts`
   then `deno task check:aspire-version-parity`. Update `PHASE_TWO_COMPAT_VERSION` in the same
   commit. Findings with `status: deferred` name an owner — resolve or re-own them, do not silence.
5. **Regenerate carriers** in chain order on a clean tree; `check:assets-barrel`,
   `check:mcp-export-corpus`, `check:publish-assets`, `agentic:dogfood-skills:check` all exit 0.
6. **Minor/major only: re-record fixtures** (table above) under one runtime lease, diff each against
   the previous recording, and re-verify each tagged evidence key in `skills/aspire/SKILL.md`; edit
   or retag the sentence when the behavior moved.
7. **Prove on hosted CI**: push, wait for `ci` + `e2e-cli` at the exact head — both runtime tiers
   green, `agent.aspire-mcp-smoke`, `behavior.otel.traces`, `behavior.streams.producer-reconnect`
   passing. Then the PR body mirrors acceptance evidence (`acceptance-evidence` block) and the
   close-gate reruns at the same SHA.
8. **Canary**: an Aspire minor or major justifies a dedicated `0.0.x-canary.n` cut from the merged
   SHA before stable; a patch rides the next scheduled canary.

## Common Pitfalls

- **Deciding "latest" from a prerelease tag.** NuGet lists `-preview` lines ahead of stable; pick
  the stable channel unless the integration only ships preview (Browsers at 13.5).
- **Assuming the CLI's JSON is complete.** `aspire otel spans|traces --format Json` drops events and
  link attributes; the dashboard telemetry API (`/api/telemetry/{spans,traces,logs}`) is the
  lossless read path (S9). Any fixture built from the CLI projection under-specifies.
- **A secured dashboard rejects unauthenticated OTLP.** With
  `ASPIRE_DASHBOARD_UNSECURED_ALLOW_ANONYMOUS=false`, exporters need
  `OTEL_EXPORTER_OTLP_HEADERS=x-otlp-api-key=…` (the AppHost hands it to resources; probes must
  borrow it — `otlp-headers.ts`), and API reads need the `X-API-Key` from
  `POST /api/telemetry/validateToken`. Silent trace loss after an upgrade is usually this.
- **`Healthy` is not proof and `Unhealthy` is not disproof.** 13.5 health reports answer "reachable
  at the published endpoint"; consumers wait on `aspire wait` / `healthReports`, never on log text
  (#1880 readiness contract).
- **Hand-ticking acceptance boxes.** Boxes mirror from the PR's `acceptance-evidence` block via the
  close-gate; a merged PR that mirrored the wrong issue leaves boxes stranded (#863 gate 1).
- **Pushing after green.** Any push to the branch cancels in-flight `e2e-cli`/`ci` runs; rerun with
  `gh run rerun <id>` at the same SHA instead. Never write run artifacts from the slice worktree.
- **Merging main by hand-resolving `*.generated.ts`.** Take either side, then regenerate; the
  line-set diff against main must be exactly your own entries.
- **No `aspire:bump` tool yet.** The sweep is manual; a wrapper that reads NuGet, rewrites the pin
  map, regenerates the manifest and carriers, and prints the fixture-diff checklist is the obvious
  follow-up and should live under `.llm/tools/deps/` next to the JSR/npm wrappers.

## Reference Files

| File                                                                                                                              | Load when                                                            |
| --------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `.llm/runs/research-aspire-13.5-adoption--0.0.7/research.md` (run evidence on branch `research/aspire-13.5-0.0.7`; not on `main`) | Building the capability matrix for a minor/major                     |
| `.llm/runs/research-aspire-13.5-adoption--0.0.7/plan.md` (run evidence on branch `research/aspire-13.5-0.0.7`; not on `main`)     | Slicing an adoption epic (S1–S13 DAG, canary points, rollback)       |
| `.llm/runs/research-aspire-13.5-adoption--0.0.7/drift.md` (run evidence on branch `research/aspire-13.5-0.0.7`; not on `main`)    | Checking whether a surprise was already met and ruled on (D-1…D-330) |
| `.llm/tools/validation/check-aspire-version-parity.ts`                                                                            | Parity gate red, or changing the expected version                    |
| `packages/cli/e2e/src/application/gates/scaffold/runtime/evidence/describe-follow.ts`                                             | Re-recording `describe --follow` fixtures                            |
| `packages/cli/e2e/src/application/gates/scaffold/aspire-dashboard-api.ts`                                                         | Reading telemetry through the secured dashboard API                  |
| `packages/mcp/tests/fixtures/telemetry/README.md`                                                                                 | Re-recording the dashboard telemetry fixture                         |
| `skills/aspire/SKILL.md`                                                                                                          | Re-verifying the version-tagged evidence keys                        |

## Checklist

- [ ] Bump class decided from the what's-new page and written in the PR body.
- [ ] Every id in `SCAFFOLD_ASPIRE_INTEGRATIONS` + `Aspire.Cli` confirmed to exist at the target.
- [ ] `git grep -n '<old-version>'` shows only manifest-documented archival hits.
- [ ] Parity, corpus, barrel, publish-assets, dogfood checks green on a clean tree.
- [ ] Both `scaffold-runtime` tiers green at the exact head; fixtures re-recorded for minor/major.
