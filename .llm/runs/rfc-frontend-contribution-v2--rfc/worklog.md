# Worklog: Unified Frontend Contribution RFC (`rfcs/0010-frontend-contribution.md`)

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

- **Docs/RFC run only** — zero code/package exports added in this branch. Proposed public surfaces for `0.0.10` W1–W3 are specified normatively in [`rfcs/0010-frontend-contribution.md`](../../../rfcs/0010-frontend-contribution.md):
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

- `REDACTED_SECRET_SENTINEL = '__NS_REDACTED_SECRET__'` (presence-only `{ __nsSecretHandle: true, sentinel, isSet }` — zero SHA-256 digests exposed to browser/HTML; merged PR `#2670` form tokens `'__ns_secret_unchanged__'` / `'__ns_secret_clear__'`)
- CSS cascade prelude: `@layer ns-plugins, ns-app;` (verified fixing PR `#890` inversion)
- Order bounds: integer `[-100, 100]`
- Contribution anchors: `<mountId>/<id>/v<apiMajor>` (`anchors[]` pins before `(order ?? 0, mountId, id)`)

### Commit Slices

| # | Slice | Gate | Files |
| --- | --- | --- | --- |
| 1 | Stage & re-verify Wave-0 Probes A/B/C cleanly (temp-staged Probe B, zero build artifacts in `.llm/runs/`) | `deno run --no-lock -A .../probe-a-fresh-mount.ts && deno run --no-lock --check -A .../probe-b-vite-islands-css.ts && deno run --no-lock --check --allow-all --unstable-kv --unstable-no-legacy-abort .../probe-c-manifest-gateway-redaction.ts` | `.llm/runs/rfc-frontend-contribution-v2--rfc/probes/*` |
| 2 | Author unified RFC, integrate GPT-6.2 Astra Pass-1 review (`B1`–`B8`, `M1`–`M6`, `N1`–`N3`, `F-1`–`F-5`), fix Probe A/C gaps, persist `plan-eval.md` + `astra-review-triage.md`, verify doc & probe gates | `deno task docs:links` + `check-internal-doc-links.ts --root rfcs --root .llm/runs/rfc-frontend-contribution-v2--rfc` + `deno task docs:accuracy` + updated Probes A/B/C | `rfcs/0010-frontend-contribution.md`, `.llm/runs/rfc-frontend-contribution-v2--rfc/*.md`, `probes/*` |

### Deferred Scope

- All product implementation (`0.0.10` W1/W2/W3 PRs), GitHub issue mutations/closures (`B8`: RFC acceptance closes zero issues), `eventIterator` RPC streaming (`F-4` Option B HTTP-only W2), RFC numbering (`0000` kept until acceptance), and Fresh 3.x / GPUIX runtime adapters (`0.0.11+` / Fresh 3 GA).

### Contributor Path

`0.0.10` builders follow W1 (`#1474` + `#1473` + RFC 0005-aligned contracts + `.withFrontend`) -> W2 (separate `app`/`devtools` transactional emitters + `@netscript/fresh/plugins` + template updates + HTTP-only P5 gateway & `stable-v1-adapter.ts`) -> W3a (`#940` `defineFrontendTestSuite` on independent fixture + failing-budget control) -> W3b (`#933` `plugins/workers` dogfood completing `#940` CI receipt + `#939` resource add `--app`).

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| `2026-11-25T20:15Z` | `1` | Checkout branch & stage probes | Created `docs/rfc-frontend-contribution-v2` off `af5107b8d`; copied probe sources/fixtures excluding build caches; updated relative repo depths & added temp-dir staging in `probe-b-vite-islands-css.ts` |
| `2026-11-25T20:25Z` | `1` | Execute Wave-0 Probes A/B/C | Initial baseline run: Probe A `18/18 PASS` runtime (`--check` failed `TS2322`); Probe B 19 matrix rows (`11 PASS, 5 CAVEAT, 3 FAIL`, exit `0`; initial RFC/worklog misreported `15`); Probe C `10/10 PASS` (`--check` passed, exit `0`) |
| `2026-11-25T20:26Z` | `2` | Query live GitHub board & draft RFC/run files | Verified exact live titles/states/milestones for `#922`–`#946`, PR `#890`, PR `#2670`, `#1465`, `#1469`–`#1476`, `#400`, `#427`, `#432`, `#1520`–`#1521`, `#2491`/`#2531`/`#2556`/`#2561`/`#2565`/`#2568`, and downstream consumer patterns (`acme`); authored initial Draft RFC |
| `2026-11-25T20:33Z` | `2` | Rebase cleanly onto live `origin/main` (`f54542169`) & re-verify | Clean rebase onto `f54542169` so `git diff --name-only origin/main` stayed scoped to docs & `.llm/runs/rfc-frontend-contribution-v2--rfc/**` |
| `2026-11-26T05:37Z` | `2` | Persist GPT-6.2 Astra Pass-1 review & integrate findings | Recorded verbatim `openrouter/openai/gpt-6.2-astra#xhigh` (`OpenCode CLI v2.3.2`) review in `plan-eval.md` (`CHANGES_REQUESTED`); triaged all `B1`–`B8`, `M1`–`M6`, `N1`–`N3`, `F-1`–`F-5` in `astra-review-triage.md`; inspected merged `#2670` on `origin/main` (`906da5188`) via `git show` |
| `2026-11-26T06:45Z` | `1, 2` | Fix Probe A & Probe C gaps, rewrite RFC, & re-verify | Added Probe A `P2d` + separated `portable-jobs-loader.ts`/`fresh-jobs-adapter.tsx` (`deno check exit=0`) + dynamic `6.8.3` in `P4e` (`19/19 PASS` runtime, visible `--check exit=1`); updated Probe C (`13/13 PASS`, `--check exit=0`: canonical RFC 0005 spine + 2 installations + host-owned policy + root-anchored containment above `.netscript/generated/` + real `workersContract` authz + presence-only Fresh island redaction + verbatim `#2670` write protocol); re-ran Probe B cleanly (`19 rows: 11 PASS, 5 CAVEAT, 3 FAIL`, exit `0`); revised RFC draft; passed `gemini-4-hydrogen-xhigh` Pass-2 (`PASS`) |
| `2026-11-26T12:15Z` | `2` | Scrub private consumer refs, accept `RFC 0010`, & add Doctrine `AP-26` | Anonymized all downstream citations to `acme`, defaulted `F-3` to Option (B), added `AP-26` (`02-public-surface.md`, `09-anti-patterns-and-fitness-functions.md`, `anti-pattern-catalog.md`), ratified `F-1`–`F-5` (`F-1:A`, `F-2:A`, `F-3:B`, `F-4:B`, `F-5:A`), renamed `rfcs/0010-frontend-contribution.md` (`Accepted`) off clean `origin/main` (`906da5188`), and re-verified Probe C (`13/13`) + all doc gates |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| Owner-authorized `plan_eval` Pass 1 via `openrouter/openai/gpt-6.2-astra#xhigh` (`2026-11-26`) + Pass-2 re-check on Gemini 4 `Hydrogen` (`xhigh`); Neon `0.0.10` builders + `Opus 5.5` / `Hydrogen` PR review (`zero Codex`) | Supersedes earlier deferred `Fable 5.2` plan; maintains independent model families and separate sessions per `lane-policy.md` | Owner directive + `supervisor.md` |
| Stage `probe-b-fixture` into `Deno.makeTempDir` inside `probe-b-vite-islands-css.ts` | Prevents `node_modules/` and `_fresh/` build artifacts from polluting `.llm/runs/` while preserving checked-in fixture readability | Step 4 hygiene |
| Separate portable `portable-jobs-loader.ts` + `fresh-jobs-adapter.tsx` (`deno check exit=0`) while preserving legacy `probe-a-fresh-mount.ts` `--check` status visibly in `probe-a.log` | Proves framework-free loader portability (`B7`) cleanly while reporting `N1` `--check exit=1` (44 pre-existing `PageProps` fixture errors) transparently | `B7` + `N1` |
| Update Probe C for `B1`–`B6`, `M4`, `N3` without weakening existing assertions & adopt W2 HTTP-only gateway (`F-4` Option B) | Replaces fingerprint disclosure (`B3`), synthetic-only gateway (`B4`), weak containment anchor (`B6`), and overstated streaming claims (`B5`) with honest proof | Astra Pass-1 review |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| PR `#890` is `MERGED` (seed docs only, `2026-08-03`) rather than unmerged | minor | `yes` |
| `vite.ts:397` foreign-`importer` / `@preact/signals-core` resolution race in `--no-lock` workspace | significant | `yes` |
| `Probe A` fails `deno --check` (`TS2322`) while passing `19/19` at runtime (`portable-jobs-loader.ts` + `fresh-jobs-adapter.tsx` pass `--check exit=0`) | minor | `yes` |
| Owner-authorized `gpt-6.2-astra#xhigh` Pass-1 + `Hydrogen` Pass-2 (`plan_eval`) & Neon/`Opus 5.5`/`Hydrogen` stack | minor | `yes` |
| `packages/fresh/src/runtime/server/sse.ts` unexported & `stable-v1-adapter.ts` authorization/audience drop | significant | `yes` |
| Astra `CHANGES_REQUESTED` remediation (`B1`–`B8`, `M1`–`M6`, `N1`–`N3`, `F-1`–`F-5`) & Probe B `19`-row recount (`11 PASS, 5 CAVEAT, 3 FAIL`) | significant | `yes` |
| Merged `#2670` inspected on `origin/main` (`906da5188`) prior to clean single-commit branch creation | minor | `yes` |

## Gate Results

### Static Gates

| Gate | Command or check | Result | Notes |
| --- | --- | --- | --- |
| Repo internal doc links | `deno task docs:links` | `PASS` | `docs=105 broken-links=0 broken-anchors=0 orphans=0` |
| RFC + Run internal doc links | `deno run --no-lock --allow-read .llm/tools/validation/check-internal-doc-links.ts --root rfcs/0010-frontend-contribution.md --root .llm/runs/rfc-frontend-contribution-v2--rfc --pretty` | `PASS` | All RFC, triage, `plan-eval`, & run links/anchors verified |
| Repo doc accuracy | `deno task docs:accuracy` | `PASS` | `docs accuracy: PASS` (verified cleanly after RFC & run updates) |
| Build artifact hygiene | `find .llm/runs/rfc-frontend-contribution-v2--rfc ...` | `PASS` | Zero `node_modules`, `_fresh`, `.vite`, `.deno` |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| `F-1..F-19` | `N/A` | Docs & probe-packaging run only (`packages/`, `plugins/`, `apps/`, `examples/`, `deno.lock` untouched) | Applied in `0.0.10` W1–W3 implementation |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Wave-0 Probe A | `PASS` (`19/19`, exit `0` runtime; loader+adapter `--check exit=0`; harness `--check exit=1` logged) | [`probes/probe-a.log`](./probes/probe-a.log) | `deno run --no-lock -A .../probe-a-fresh-mount.ts` (`P2d` + dynamic `6.8.3` in `P4e`) |
| Wave-0 Probe B | `PASS` (`19` matrix rows: `11 PASS, 5 CAVEAT, 3 FAIL`, exit `0`) | [`probes/probe-b.log`](./probes/probe-b.log) | `deno run --no-lock --check -A .../probe-b-vite-islands-css.ts` (partial: localhost aliases + 1 app root) |
| Wave-0 Probe C | `PASS` (`13/13`, `--check` exit `0`) | [`probes/probe-c.log`](./probes/probe-c.log) | `deno run --no-lock --check --allow-all --unstable-kv --unstable-no-legacy-abort .../probe-c-manifest-gateway-redaction.ts` |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Downstream consumer patterns (`acme`) + PR `#2670` (`906da5188`) | `PASS` (RFC spec coverage + Probe C `3.1`–`3.2` `#2670`/redaction proof) | Verified requirements integrated into [`rfcs/0010-frontend-contribution.md`](../../../rfcs/0010-frontend-contribution.md) + [`probes/probe-c.log`](./probes/probe-c.log) | Runtime dogfood executes in `0.0.10` W2/W3 |

## Handoff Notes

- Owner ratified **Forks `F-1` (`A`), `F-2` (`A`), `F-3` (`B`), `F-4` (`B`), `F-5` (`A`)**, assigned **`RFC 0010` (`Accepted`)**, added Doctrine **`AP-26`** (`acme` convention), and moved to Phase 2 board cleanup + Phase 3 `0.0.10` W1 Neon execution.
- Note on Wave-0 & board hygiene: **no GitHub issues close on RFC acceptance (`B8`)** — `#923`–`#927`, `#1469`, and `#1470` record explicit partial/unmet proofs in RFC §11, and `#940` stays open through `W3b` (`#933` Workers CI receipt).
- Note on pre-existing worktree untracked entries: `.llm/runs/consumer-fixes-20261124-intake/` and `.netscript/` existed prior to branch creation and were deliberately left untouched and unstaged (`git diff --name-only origin/main...HEAD` contains strictly `rfcs/0010-frontend-contribution.md` and `.llm/runs/rfc-frontend-contribution-v2--rfc/**`).
