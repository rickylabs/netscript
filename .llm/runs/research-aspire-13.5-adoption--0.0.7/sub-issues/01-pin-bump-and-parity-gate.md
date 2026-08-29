# [aspire-13-5 S1] Atomic Aspire 13.5.3 pin bump + `check:aspire-version-parity` gate

> DRAFT TEXT ONLY — no GitHub mutation. Labels: `type:chore`, `epic:aspire-13-5`, `area:cli`,
> `area:aspire`, `area:tooling`, `priority:p0`, `status:triage`. Milestone: `0.0.7`. Body must
> contain `Part of #<epic>`. Owner fork OF-2 must be answered first.

## Summary

Move every Aspire version pin from 13.4.6 (and the `e2e-cli-prod` 13.5.0-preview) to **13.5.3** in
one commit, and add a fitness gate that fails whenever the pins disagree with
`SCAFFOLD_VERSIONS.ASPIRE_SDK`.

## Why

Aspire 13.5 SDK/core packages are not binary-compatible with 13.4.6 hosting integrations
(`MissingMethodException`/`TypeLoadException`, upstream "Mixed Aspire 13.4 and 13.5 packages" known
issue), and a 13.5 SDK under a 13.4.x CLI failed TypeScript codegen until 13.5.1 (aspire#19503). The
repo currently carries 13.4.6 in 14 places and 13.5.0-preview.1.26404.10 in one
(`.github/workflows/e2e-cli-prod.yml:53,63`, whose reason — aspire#18948/#18958 — shipped in
13.5.0). See `research.md` §1, §4.

## Scope (files)

- `packages/cli/src/kernel/constants/scaffold/scaffold-versions.ts` — `ASPIRE_SDK: '13.5.3'`;
  `ASPIRE_HOSTING_DENO`/`ASPIRE_HOSTING_SQLITE: '13.5.0'` (CommunityToolkit stable on NuGet).
- `packages/cli/src/kernel/constants/scaffold/scaffold-aspire.ts` — PostgreSQL/MySql/SqlServer/
  Redis/Garnet `13.5.3`; `BROWSERS: '13.5.3-preview.1.26425.3'` (OF-2 default); `DENO_KV`
  `CommunityToolkit.Aspire.Hosting.Deno: '13.5.0'`.
- `packages/cli/src/kernel/templates/aspire/generate-aspire-config_test.ts:70-84` — assertions.
- `.github/toolchain.env` — `NETSCRIPT_ASPIRE_CLI_VERSION`/`SDK_VERSION=13.5.3`.
- `.github/workflows/e2e-cli.yml`, `e2e-cli-prod-local.yml`, `e2e-cli-prod.yml` — install
  `dotnet tool install Aspire.Cli --version 13.5.3` everywhere (drop the `install.sh` + preview
  route and its now-obsolete comment), preflight `13.5.*`, cache key
  `nuget-aspire-${{ runner.os }}-13.5.3-v1`.
- `.github/scripts/aspire-nuget-cache-policy.test.ts` — single train, no `FIXED_PUBLISHED_E2E_CLI`.
- New `.llm/tools/validation/check-aspire-version-parity.ts` +
  `deno task check:aspire-version-parity` wired into `ci.yml` quality gates via `run-gate.ts`.
  **Phase 1 (this slice):** row source = repo-relative
  `.llm/runs/research-aspire-13.5-adoption--0.0.7/aspire-surface-manifest.tsv` (header skipped).
  **Fail** on a stale literal in classes `scaffold-constants`, `ci:*`, `root-config` (scaffold
  constants, `.github/toolchain.env`, the three workflows — install version, preflight pattern,
  NuGet cache key — the policy test, `.openhands/setup.sh`). **Report `deferred`** (non-failing,
  owner-tagged) for every other non-archival row that carries a stale literal. Owner `archival` rows
  (this entire research run dir, the debt registry, design corpus, docs plan, RFCs, version-suffixed
  fixtures, migration fixture, root notes) are `info` only; class `lockfile` is skipped. **Phase 2**
  (complete enforcement) is flipped by S13 (D-13).
- Arch-debt: add "Aspire.Hosting.Browsers preview pin (13.5 train)" with gate "drop when a stable
  13.5.x Browsers package exists".

## Boundaries

- No generator emission changes, no skill prose changes (S4/S9), no fixture re-capture (S3).
- Do not run `aspire update` on the repo; the pins are edited, not migrated.
- Do not widen `check:scaffold-versions` (E-12) to `SCAFFOLD_ASPIRE_INTEGRATIONS`; document the gap.

## Acceptance

- [ ] Phase-1 scoped sweep is clean:
      `git grep -n '13\.4\.6' -- packages/cli/src/kernel/constants/scaffold .github .openhands packages/cli/src/kernel/templates/aspire/generate-aspire-config_test.ts`
      returns nothing; the gate's phase-1 **fail set is empty**. The `deferred` report is non-empty
      and every entry carries its manifest owner (at the plan head: S1/S4 generator tests, S3 compat
      fixtures, S4 generator comments/templates, S9 skills + dogfood bundle, S11 dedicated docs, S13
      internal skill, `derived` barrels/snapshots); no `archival` row appears in it.
- [ ] `deno task check:aspire-version-parity` passes locally and in `ci.yml`.
- [ ] `deno task check:scaffold-versions` passes (no prerelease in `SCAFFOLD_VERSIONS`).
- [ ] `.github/scripts/aspire-nuget-cache-policy.test.ts` passes with the single 13.5.3 train.
- [ ] `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` green on both CI tiers
      (postgres+docker, sqlite+garnet) with `aspire --version` = 13.5.3 in the preflight log.
- [ ] `aspire restore` timing recorded in the PR comment (cold and warm cache) — #1227 class.

## Tests / gates

Scoped check/lint/fmt wrappers on `packages/cli`; `deno task quality:scan`; `deno task arch:check`;
`check:scaffold-versions`; new parity gate; full `scaffold.runtime` (this is the canary-A pivot).

## Docs / static asset regeneration

`deno task gen:assets-barrel` (embedded.generated.ts carries the generator assets); no skill/docs
changes here — their rows are phase-1 `deferred` by design and become enforce in S13 (phase 2).

## Related

Part of #<epic>. Related: #1227 (restore timing), #1597 (canary publish ordering), #1577 (Browsers
preview lineage). Regression-check list: `existing-issue-map.md` §B.

## Canary

This slice is the **canary A** pivot (pin-only train: S1 + S2 + S3, no emitted-output change); cut
`0.0.7-canary.<n>` once S1–S3 are on `main`.
