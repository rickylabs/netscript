# [aspire-13-5 S13] Stale version-bound surface cleanup + parity phase 2 (complete enforcement)

> DRAFT TEXT ONLY. Labels: `type:chore`, `epic:aspire-13-5`, `area:cli`, `area:agentic`,
> `area:tooling`, `priority:p2`, `status:triage`. Milestone: `0.0.7`. Depends on S1 (gate phase 1),
> S9, S11 (their rows must be current before phase 2 can fail on them). Covered by **canary C**.

## Summary

Close every row of `aspire-surface-manifest.tsv` whose owner is **S13**, then flip
`check:aspire-version-parity` from phase 1 (pins/workflows/policy enforce; skills/docs/static/
generated report-only) to **phase 2: complete enforcement** over every non-archival row, using the
manifest's archival classes as the exclusion set.

## Scope

### Cleanup rows (owner S13 in the manifest)

- `.agents/skills/codex-wsl-remote/SKILL.md` (+ `.claude` mirror via `agentic:sync-claude`): replace
  the `Aspire CLI 13.3.0` toolchain snapshot with a reference to `.github/toolchain.env`.
- `packages/cli/src/kernel/application/scaffold/render-ts-apphost.ts:81`: "Aspire 13.4 validates…" →
  "Aspire ≥ 13.4 validates…".
- **D-17 (locked default in `plan.md`; coordinator ratifies before this slice):** one resolver,
  `packages/mcp/src/domain/telemetry-endpoint.ts` `resolveTelemetryEndpoint` — explicit →
  `NETSCRIPT_TELEMETRY_ENDPOINT` → `ASPIRE_DASHBOARD_PORT` → **new** `aspire_ps` step (running
  AppHost `dashboardUrl` from `aspire ps --format Json`, the `.netscript/aspire-cli.ts` logic
  extracted to a shared helper) → the named compatibility constant `DEFAULT_TELEMETRY_ENDPOINT`
  (`http://localhost:18888`, upstream standalone-dashboard default, `source: 'default'`). Apply to
  `assets/app/routes/examples/telemetry/(_shared)/telemetry-trace.ts.template:70` (no bare `18888`;
  read env → running AppHost → render "dashboard unavailable — run `aspire ps`") and
  `adapters/windows/environment/env-file-{values,content}.ts:213,293` (emit `ASPIRE_DASHBOARD_PORT`
  only when configured; never a magic default). Focused tests for the resolver step and both
  templates; one precedence line in `packages/mcp/README.md:318` and
  `docs/site/reference/mcp/index.md:194` (S11 prose).
- `scaffold-aspire.ts:9-12` `SCAFFOLD_COMMUNITY_TOOLKIT` (`13.2.1-beta.532`, unused): delete or
  re-pin to 13.5.0 with a consumer.
- Consumer CI template `assets/workspace/github/workflows/deploy-compose-ghcr.yml.template:51`: emit
  `dotnet tool install Aspire.Cli --tool-path … --version {{ASPIRE_SDK}}` (from `SCAFFOLD_VERSIONS`)
  before `aspire restore`.
- `.llm/tools/agentic/teardown/ownership.ts:48`: `MCP_COMMAND` matches `aspire agent mcp` (if S7 has
  not already landed it).
- Skill wording rows (`skill:internal`, no version literal expected): grep-verify only.

### Parity phase 2

- `.llm/tools/validation/check-aspire-version-parity.ts` gains `--phase 2` (default after this PR):
  every manifest row whose owner is not `archival` is **enforce**; the exclusion set is exactly the
  manifest rows with class `archival:*` (`resources/design/**`, `docs/site/_plan/**`, `rfcs/*.md`,
  version-suffixed `*-13.4.6-*` fixtures, `prior-release.mcp.json`, this run's
  `sources/`+`receipts/`, `notes.md`, harness docs) plus the git-ignored
  `.llm/runs/**`/`.llm/tmp/**` trees.
- The gate reads the repo-relative
  `.llm/runs/research-aspire-13.5-adoption--0.0.7/aspire-surface-manifest.tsv` (header skipped) as
  its row source and fails if the manifest is stale (`tools/aspire-surface-manifest.ts` re-run
  produces a diff) — the manifest is regenerated in the same PR. Rows with owner `archival`
  (including this research run dir and the debt registry) are `info`; class `compat-fixture` asserts
  the 13.5.3 case; class `lockfile` is skipped.
- `ci.yml` quality gate switches to phase 2 (`run-gate.ts` receipt).

## Boundaries

No `docs/site` prose (S11), no skill behaviour text (S9), no resource emission (S4–S8). Never edit
archival rows.

## Acceptance

- [ ] Phase-2 sweep is clean:
      `M=.llm/runs/research-aspire-13.5-adoption--0.0.7/aspire-surface-manifest.tsv; git grep -nE '13\.[0-4]\.[0-9]|Aspire 13\.[0-4]' -- $(awk -F'\t' 'NR>1 && $3!="archival" && $2!="compat-fixture" && $2!="lockfile" {print $1}' "$M")`
      returns nothing, and every `compat-fixture` row contains a `13.5.3` case.
- [ ] `deno task check:aspire-version-parity` (phase 2) green in `ci.yml`; archival hits reported as
      `info` only.
- [ ] `tools/aspire-surface-manifest.ts` re-run yields no diff against the committed manifest.
- [ ] Template tests updated (`deploy-compose-ghcr` emits the pinned install; telemetry example and
      Windows env file follow D-17; resolver `aspire_ps` step tested).
- [ ] `check:assets-barrel`, `agentic:sync-claude:check` green.

## Rollback

Revert the PR: parity gate returns to phase 1 (pins/workflows/policy enforce, rest report-only);
templates/comments return to their pre-S13 text; `gen:assets-barrel` + `agentic:sync-claude`
regenerate mirrors. No generated-project runtime behaviour changes except the consumer CI template
install line (consumers who scaffolded during canary C keep it; it is additive and correct).

## Tests / gates

Scoped wrappers on `packages/cli`; `quality:scan`; `arch:check`; `check:assets-barrel`; parity gate
phase 2; `scaffold.plugins`.

## Docs / static asset regeneration

`deno task gen:assets-barrel`; `deno task agentic:sync-claude`; manifest regeneration.

## Related

Part of #<epic>. Depends on S1, S9, S11. Inventory: `stale-surface-inventory.md`; manifest:
`aspire-surface-manifest.tsv`.
