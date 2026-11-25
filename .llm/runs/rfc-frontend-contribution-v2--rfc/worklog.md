# Worklog: Unified Frontend Contribution RFC (`rfcs/0000-frontend-contribution.md`)

## Run Metadata

| Field          | Value |
| -------------- | ----- |
| Run ID         | `rfc-frontend-contribution-v2--rfc` |
| Branch         | `docs/rfc-frontend-contribution-v2` |
| Archetype      | `N/A (RFC + empirical Wave-0 probes, planning Archetype 1/2/3/4 across 0.0.10 W1–W3)` |
| Scope overlays | `docs, frontend` |

## Design

Record this section before creating implementation files. See `workflow/run-loop.md` § 3b for the
full requirement.

### Public Surface

- **Docs/RFC run only** — zero code/package exports added in this branch. Proposed public surfaces for `0.0.10` W1–W3 are specified normatively in [`rfcs/0000-frontend-contribution.md`](../../../rfcs/0000-frontend-contribution.md):
  - `@netscript/plugin-frontend-core` (`Archetype 1`, zero Fresh/Preact/Vite/DOM dependencies)
  - `@netscript/plugin` `.withFrontend(...)` pointer + `.passthrough()` `schemaVersion: 1` manifest
  - `@netscript/fresh/plugins` (`GuardedPluginApp`, `normalizeFreshRouteModule`, `<FrontendZone>`, `FrontendPluginCatalog`, P5 procedure gateway, server redaction)
  - `@netscript/fresh/vite` (generated registry feed + `canonicalizePreactSignalsImport`)

### Domain Vocabulary

- `ContributionEnvelope` / `ContributionIdentity` / `FamilyRef` — shared `RFC 0005` + frontend contract spine
- `descriptor` + `NsUiFieldHints` (`x-ns-ui`) — renderer-agnostic schema + widget hints aligned with PR `#2670`
- `RedactedSecretHandle` / `SecretFieldWrite` — zero-secret-to-client & write-only secret mutations
- `ZoneLoadState` / `PluginHealthSnapshot` / `ContributionDiagnosisState` — 6-state diagnosis & honest catalog read model

### Ports

- None mutated in this RFC-only run (`PrincipalPort`, `FrontendPluginCatalog`, and CLI `FileSystemPort` contracts specified in RFC for W1–W3).

### Constants

- `REDACTED_SECRET_SENTINEL = '__NS_REDACTED_SECRET__'` (design contract; PR `#2670` form tokens `'__ns_secret_unchanged__'` / `'__ns_secret_clear__'`)
- CSS cascade prelude: `@layer ns-plugins, ns-app;` (verified fixing PR `#890` inversion)
- Order bounds: integer `[-100, 100]`
- Contribution anchors: `<mountId>/<id>/v<apiMajor>` / `<zoneName>/v<major>`

### Commit Slices

| # | Slice | Gate | Files |
| --- | --- | --- | --- |
| 1 | Stage & re-verify Wave-0 Probes A/B/C cleanly (temp-staged Probe B, zero build artifacts in `.llm/runs/`) | `deno run --no-lock -A .../probe-a-fresh-mount.ts && deno run --no-lock --check -A .../probe-b-vite-islands-css.ts && deno run --no-lock --check --allow-all --unstable-kv --unstable-no-legacy-abort .../probe-c-manifest-gateway-redaction.ts` | `.llm/runs/rfc-frontend-contribution-v2--rfc/probes/*` |
| 2 | Author unified Fresh-3-ready RFC & harness run artifacts; run doc link/accuracy gates & open Draft PR | `deno task docs:links` + `check-internal-doc-links.ts --root rfcs --root .llm/runs/rfc-frontend-contribution-v2--rfc` + `deno task docs:accuracy` | `rfcs/0000-frontend-contribution.md`, `.llm/runs/rfc-frontend-contribution-v2--rfc/*.md` |

### Deferred Scope

- All product implementation (`0.0.10` W1/W2/W3 PRs), GitHub issue mutations/closures, RFC numbering (`0000` kept until acceptance), and Fresh 3.x / GPUIX runtime adapters (`0.0.11+` / Fresh 3 GA).

### Contributor Path

`0.0.10` builders follow W1 (`#1474` + `#1473` + `@netscript/plugin-frontend-core` + `.withFrontend`) -> W2 (transactional generator + `@netscript/fresh/plugins` + template updates + `stable-v1-adapter.ts` / P5 gateway) -> W3a (`#940` `defineFrontendTestSuite`) -> W3b (`#933` `plugins/workers` dogfood + `#939` resource add `--app`).

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| `2026-11-25T20:15Z` | `1` | Checkout branch & stage probes | Created `docs/rfc-frontend-contribution-v2` off `af5107b8d`; copied probe sources/fixtures excluding build caches; updated relative repo depths & added temp-dir staging in `probe-b-vite-islands-css.ts` |
| `2026-11-25T20:25Z` | `1` | Execute Wave-0 Probes A/B/C | Probe A `18/18 PASS` (`deno run --no-lock -A`, exit `0`; note `--check` fails existing `TS2322` signature mismatch on `RouteComponent<ProbeState>`); Probe B 15 matrix cells exit `0` (`--check` passed); Probe C `10/10 PASS` (`--check` passed, exit `0`); zero `node_modules`/`_fresh`/`.vite`/`.deno` left in `.llm/runs/` |
| `2026-11-25T20:26Z` | `2` | Query live GitHub board & draft RFC/run files | Verified exact live titles/states/milestones for `#922`–`#946`, PR `#890`, PR `#2670`, `#1465`, `#1469`–`#1476`, `#400`, `#427`, `#432`, `#1520`–`#1521`, `#2491`/`#2531`/`#2556`/`#2561`/`#2565`/`#2568`, and `eis-etl` `#63`/`#421`/`#422`/`#425`/`#426`/`#438`/`#448`/`#450`/`#453`; authored `rfcs/0000-frontend-contribution.md` + harness artifacts |
| `2026-11-25T20:33Z` | `2` | Rebase cleanly onto live `origin/main` (`f54542169`) & re-verify | Three unrelated PRs (`#2682`, `#2657`, `#2660`) had advanced `origin/main` past `af5107b8d`; rebased cleanly onto `f54542169` so `git diff --name-only origin/main` contains strictly the 54 docs/probe files, and re-verified all checks & probes |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| Neon builders (`antigravity/gemini-4-neon`, `xhigh`) + Friday 23:30 `Fable 5.2` RFC review + `Opus 5.5` (`xhigh`) Pass-1 / `Hydrogen` (`xhigh`) Pass-2 PR review; zero Codex; zero Claude spend in this run | Owner-directed matrix override recorded per `lane-policy.md` | Owner brief |
| Stage `probe-b-fixture` into `Deno.makeTempDir` inside `probe-b-vite-islands-css.ts` | Prevents `node_modules/` and `_fresh/` build artifacts from polluting `.llm/runs/` while preserving checked-in fixture readability | Step 4 hygiene |
| Keep `probe-a-fresh-mount.ts` code unmodified and run with `deno run --no-lock -A` | Preserves Wave-0 probe integrity; `--check` fails `TS2322` on inline `PageProps<T>` helper signatures without affecting Fresh runtime assertions | `probe-a.log` verification |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| PR `#890` is `MERGED` (seed docs only, `2026-08-03`) rather than unmerged | minor | `yes` |
| `vite.ts:397` foreign-`importer` / `@preact/signals-core` resolution race in `--no-lock` workspace | significant | `yes` |
| `Probe A` fails `deno --check` (`TS2322`) while passing `18/18` under `deno run --no-lock -A` | minor | `yes` |
| Owner-directed Neon/`Fable 5.2`/`Opus 5.5`/`Hydrogen` routing override (zero Codex) | minor | `yes` |
| `packages/fresh/src/runtime/server/sse.ts` unexported & `stable-v1-adapter.ts` authorization/audience drop | significant | `yes` |

## Gate Results

### Static Gates

| Gate | Command or check | Result | Notes |
| --- | --- | --- | --- |
| Repo internal doc links | `deno task docs:links` | `PASS` | `docs=105 broken-links=0 broken-anchors=0 orphans=0` |
| RFC + Run internal doc links | `deno run --no-lock --allow-read .llm/tools/validation/check-internal-doc-links.ts --root rfcs/0000-frontend-contribution.md --root .llm/runs/rfc-frontend-contribution-v2--rfc --pretty` | `PASS` | All RFC & run markdown links and anchors verified |
| Repo doc accuracy | `deno task docs:accuracy` | `PASS` | `docs accuracy: PASS` (216 published pages, 287 corpus files, 111/111 commands) |
| Build artifact hygiene | `find .llm/runs/rfc-frontend-contribution-v2--rfc ...` | `PASS` | Zero `node_modules`, `_fresh`, `.vite`, `.deno` |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| `F-1..F-19` | `N/A` | Docs & probe-packaging run only (`packages/`, `plugins/`, `apps/`, `examples/`, `deno.lock` untouched) | Applied in `0.0.10` W1–W3 implementation |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Wave-0 Probe A | `PASS` (`18/18`, exit `0`) | [`probes/probe-a.log`](./probes/probe-a.log) | `deno run --no-lock -A .../probe-a-fresh-mount.ts` |
| Wave-0 Probe B | `PASS` (15 cells, exit `0`) | [`probes/probe-b.log`](./probes/probe-b.log) | `deno run --no-lock --check -A .../probe-b-vite-islands-css.ts` |
| Wave-0 Probe C | `PASS` (`10/10`, exit `0`) | [`probes/probe-c.log`](./probes/probe-c.log) | `deno run --no-lock --check --allow-all --unstable-kv --unstable-no-legacy-abort .../probe-c-manifest-gateway-redaction.ts` |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| --- | --- | --- | --- |
| `eis-etl` (`#63`, `#421`, `#422`, `#426`, `#438`, `#448`, `#450`, `#453`) + PR `#2670` | `PASS` (RFC spec coverage) | Verified requirements integrated into [`rfcs/0000-frontend-contribution.md`](../../../rfcs/0000-frontend-contribution.md) | Runtime dogfood executes in `0.0.10` W2/W3 |

## Handoff Notes

- Next step after Draft PR opens: scheduled **Friday 23:30 UTC `Fable 5.2` adversarial RFC review** (`plan_eval`), checking Fresh 3.x / GPUIX seam, `#1473`/`#1474` preconditions, `descriptor` + redaction model, and Owner Forks `F-1`–`F-5`.
- Note on pre-existing worktree untracked entries: `.llm/runs/consumer-fixes-20261124-intake/` and `.netscript/agent/diagnostics/project.json` existed prior to branch creation and were deliberately left untouched and unstaged (`git diff --name-only origin/main` contains strictly `rfcs/0000-frontend-contribution.md` and `.llm/runs/rfc-frontend-contribution-v2--rfc/**`).
