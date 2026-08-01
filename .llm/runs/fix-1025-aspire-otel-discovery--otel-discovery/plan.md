# Plan: detached Aspire telemetry discovery

## Cycle 3 implementation plan — 2026-08-02

Owner waiver remains active: the supervisor owns PLAN-EVAL/IMPL-EVAL and this generator will not
invoke an external evaluator lane. Cycle 1's environment-variable change remains rejected.

### Locked decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| C3-L1 | Run one traffic-bearing detached discriminator across bare, `--apphost`, and explicit-URL routes. | Empty telemetry cannot prove discovery, and cycle 2 did not test the bare command. |
| C3-L2 | Emit workspace tasks using whichever route the discriminator proves reliable. | Cold-start users should not memorize Aspire discovery flags. |
| C3-L3 | Keep dashboard configuration and security byte-unchanged. | Anonymous access is load-bearing for existing consumers. |
| C3-L4 | Put runtime coverage in `packages/cli/e2e`'s real `scaffold.runtime` gate. | The rejected `.llm/tools/e2e` path is diagnostic only. |
| C3-L5 | Keep the 53-file dashboard guidance sweep deferred. | Only the generated README, Aspire skill, and one observability page are owned here. |

### Open-decision sweep

| Decision | Status | Resolution |
| --- | --- | --- |
| Task transport (`--apphost` vs `--dashboard-url`) | must resolve now | Step-1 discriminator selects the proven detached route. |
| Export output contract | resolved | Forward all user arguments; Aspire owns output-path semantics. |
| URL-resolution failure wording | resolved | Non-zero exit, actual process/parse cause, and literal explicit-URL invocation. |
| Upstream issue | owner action | This lane has no authority to file against `dotnet/aspire`. |

### Cycle-3 slices

| # | Slice | Gate | Files |
| --- | --- | --- | --- |
| C3-S1 | Traffic-bearing detached discriminator and cause record | raw four-row command evidence | `research.md`, `drift.md`, `worklog.md`, issue/PR comment |
| C3-S2 | Emitted telemetry/export tasks and unit contracts | focused workspace generator tests + scoped static gates | `deno-json.ts`, `generators_test.ts`, supporting generated helper if required |
| C3-S3 | Discoverability at existing entry points | docs maintenance + focused README tests | `generate-readme.ts`, Aspire skill + mirror, one observability page |
| C3-S4 | Real runtime regression | focused E2E tests/static gates | `packages/cli/e2e/src/application/gates/scaffold/**` |
| C3-S5 | One-pass scaffold evidence and handoff | `scaffold.runtime` once, terminal exit | run artifacts, PR evidence |

### Risks

| Risk | Mitigation |
| --- | --- |
| Telemetry flush lag yields a false empty result | Generate traffic first, prove non-empty via the known-good explicit URL, then compare routes against the same live AppHost. |
| Multiple running AppHosts select the wrong URL | Match the generated workspace's absolute `appHostPath` in `aspire ps` parsing. |
| Shell quoting breaks forwarded arguments | Put resolver/forwarding logic in a generated Deno script and keep tasks as simple `deno run -A` entry points. |
| Failure guidance invents a URL when none exists | Print the real discovery/parse cause and an explicit command template using `<url>` when resolution produced no URL. |


## Cycle 2 replacement plan — 2026-08-01

Owner waiver: the open-model Plan-Gate lane is waived. The supervisor owns PLAN-EVAL/IMPL-EVAL;
this generator does not invoke or fabricate either evaluator. The supervisor-authored
`plan-eval-cycle2.md` is the independent cycle-2 verdict.

1. Restore the rejected anonymous-dashboard implementation to `origin/main` and preserve run history.
2. Re-run the authenticated/anonymous detached AppHost A/B before relying on the prior cause.
3. If the A/B matches, emit dependency-free `aspire:otel` and `aspire:export` workspace tasks,
   document them in the generated README, Aspire skill, and one observability page, then add the
   runtime assertion to the real `scaffold.runtime` gate.
4. Run scoped static/docs gates, then the full runtime suite exactly once.

Stop condition: if the A/B differs, record drift and report without implementing the replacement
fix. That condition was reached: both modes returned automatic traces exit 0.

Cycle-2 slices:

| # | Slice | Gate | Status |
| --- | --- | --- | --- |
| C2-S0 | Restore rejected cycle-1 source edits; retain failure history | clean tracked source diff against `origin/main` for the seven files | complete |
| C2-S1 | Verify authenticated/anonymous detached discovery A/B | raw `aspire ps`, HTTP, and `aspire otel` output | divergent; stop |
| C2-S2 | Emit zero-memorisation workspace routes and focused tests | scoped check/lint/fmt/test | not started |
| C2-S3 | Docs/skill/README discoverability | docs maintenance | not started |
| C2-S4 | Real `scaffold.runtime` regression and one-pass runtime gate | full scaffold runtime | not run |

## Superseded cycle-1 plan — retained for history only

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-1025-aspire-otel-discovery--otel-discovery` |
| Branch | `fix/1025-aspire-otel-discovery` |
| Phase | `plan` |
| Target | CLI E2E tooling, Aspire skill, observability docs |
| Archetype | `6 - CLI / Tooling` |
| Scope overlays | `docs` |

## Archetype

Archetype 6 applies narrowly because the product change is to user-run scaffold E2E automation. No
published CLI command or package implementation changes. `SCOPE-docs` governs the skill/docs slice.

## Current Doctrine Verdict

`@netscript/cli` is `Restructure`; this slice does not widen or reorganize that package. The edited
E2E harness remains outside the published package surface.

## Goal

Restore automatic detached-dashboard discovery by removing NetScript's anonymous dashboard mode,
then make scaffold E2E semantically prove automatic `otel` and `export` against the isolated AppHost.

## Scope

- Stop emitting `ASPIRE_DASHBOARD_UNSECURED_ALLOW_ANONYMOUS` in generated Aspire config and helper assets.
- Regenerate the embedded asset registry with the repository-native generator.
- Require automatic `--apphost` telemetry exit 0 and non-empty JSON for traces; add an export artifact assertion.
- Record the NetScript-side cause and the isolated-mode negative finding on #1025/PR.

## Non-Scope

- No NetScript wrapper verb for Aspire telemetry.
- Keep `ASPIRE_ALLOW_UNSECURED_TRANSPORT`; the HTTP OTLP endpoint requires it.
- No Aspire CLI patch or dependency upgrade.
- No workaround docs, skill change, Claude mirror, or upstream issue: automatic discovery is repairable in NetScript.
- No broad E2E refactor.

## Hidden Scope

- Anonymous mode is emitted by both `aspire.config.json` generation and the dashboard helper asset.
- Embedded generated assets must be refreshed from the source template.
- Command success alone is insufficient; JSON and export artifacts require semantic assertions.

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| L1 | Classify root cause as NetScript's anonymous dashboard configuration. | A/B control: removing only anonymous mode restores tokenized dashboard info and automatic discovery. |
| L2 | Preserve automatic `--apphost` discovery in E2E; do not pass `--dashboard-url`. | This proves the actual template fix and disproves the presumed isolated-mode defect. |
| L3 | Extend command execution with an optional stdout assertion callback. | Keeps semantic output checks within the existing harness rather than adding a parallel test. |
| L4 | Make traces and export critical capability checks; retain logs as diagnostic coverage. | Acceptance explicitly requires traces and export, and silent warnings caused the false green. |
| L5 | Remove both anonymous-mode emission sites and regenerate embedded assets. | Leaving either site retains the defect in generated projects. |

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| Minimal C# control | safe to defer | The NetScript configuration A/B control directly falsified the upstream-only hypothesis. |
| Export output path cleanup | resolved | Write under the generated project and remove during normal suite cleanup. |
| Empty logs behavior | safe to defer | Traces after exercised traffic is the acceptance regression; logs remain useful but are not the semantic gate. |
| Acceptance box 1 | resolved | Template fix makes automatic discovery work; no partial documented-remedy claim is needed. |
| Acceptance box 2 | resolved | Patched automatic export exited 0 and wrote a non-empty zip. |

## Risk Register

| Risk | Mitigation |
| --- | --- |
| JSON contains banners/noise | Use `--non-interactive --nologo --format Json`; parse trimmed stdout and report the raw tail on failure. |
| Export passes without a file | Assert the requested zip exists and has non-zero size. |
| Removing anonymous mode breaks HTTP OTLP | Preserve `ASPIRE_ALLOW_UNSECURED_TRANSPORT`; targeted startup control already proved this requirement. |
| Dashboard now requires its one-time login token | Correct the owned generated-config sample, keep the PR draft for human security review, and report the wider 53-file docs surface without expanding scope. |
| Expensive E2E repeated | Run the requested telemetry/full runtime path once after implementation. |

## Fitness Gates

| Gate | Required | Expected evidence |
| --- | --- | --- |
| Scoped check/lint/fmt | yes | Repository wrappers on `.llm/tools/e2e` TypeScript. |
| Focused Deno tests | yes | Matching E2E helper/unit tests if present. |
| Asset generation | yes | Repo-native embedded asset generator plus focused template tests. |
| Runtime telemetry | yes | One-pass scaffold runtime E2E with raw otel/export evidence. |
| Source alignment | yes | Live Aspire 13.4.6 before/control reproduction. |
| Package quality | yes | `deno task quality:gate` because generator/template assets ship in `@netscript/cli`. |
| Asset barrel | yes | `deno task check:assets-barrel` proves generated output is synchronized. |
| JSR surface | scoped | No exported signature change; publish-surface scan recorded in research. |

## Arch-Debt Implications

None. The defect is fixed at its two generator sources; no architecture violation is deferred.

## Validation Plan

1. Scoped check, lint, and fmt wrappers for `.llm/tools/e2e`.
2. Focused tests covering parser/assertion behavior.
3. Embedded asset generation/check and focused template tests.
4. `deno task quality:gate` for the published CLI generator slice.
5. Docs maintenance/build evidence for the corrected `aspire.md` sample.
6. One-pass `scaffold.runtime --cleanup --format pretty` telemetry evidence, with strict semantic checks.

## Drift Watch

- If removing anonymous mode does not restore automatic discovery in the full scaffold E2E, rescope
  before adding any explicit URL workaround.

## Rebase and re-proof plan — 2026-08-02

This is a history-integration and validation slice only. The existing Archetype 6 CLI/tooling
design and emitted-task implementation remain locked; no product redesign is authorized.

1. Capture the local/remote baseline, preserve the supervisor-provided `implement-rebase.md`, fetch
   `origin`, and rebase onto current `origin/main`.
2. Resolve conflicts semantically. For `scaffold-files.ts`, preserve `ASPIRE_CLI_TASK`,
   `TSCONFIG_ROOT`, and `TSCONFIG_APP`; record any deviation from the probe in `drift.md`.
3. Verify the #1034 no-docker-nuke invariant and #1041 emitted-samples CI wiring before validation.
4. Run package-scoped CLI check/lint/fmt wrappers, then the requested root CI gates and
   `quality:gate`. Treat the known unrelated `netscript-release` Claude mirror drift as pre-existing;
   verify the Aspire skill pair directly.
5. Run exactly one full `scaffold.runtime --cleanup --format pretty` pass. Read its retained log,
   record the terminal code, and quote whether `behavior.otel-task-traces` ran and what it returned.
6. Stop owned AppHosts, inspect `aspire ps` and `docker ps -a`, and remove only run-owned leftovers
   if cleanup missed any.
7. Commit the updated run evidence, force-push with lease to the explicit branch ref, and verify the
   local HEAD, remote ref, and PR head object match. Leave PR/issue metadata untouched.

### Rebase risks

| Risk | Mitigation |
| --- | --- |
| Conflict drops #1038 TypeScript config keys | Resolve by preserving all three constants and inspect the rebased diff against `origin/main`. |
| Rebase resurrects destructive container guidance | Run the literal repository-wide forbidden-pattern grep before gates. |
| Rebase drops emitted-sample CI coverage | Inspect `.github/workflows/ci.yml` and run `check:emitted-samples`. |
| Root tasks provide a false green for `packages/cli` | Use all three scoped wrappers with `--root packages/cli --ext ts,tsx`. |
| Runtime suite fails before telemetry | Report the exact preceding gate and do not infer telemetry success. |
| Runtime leaves resources behind | Use `--cleanup`, then Aspire-CLI-first teardown and scoped container inspection. |
