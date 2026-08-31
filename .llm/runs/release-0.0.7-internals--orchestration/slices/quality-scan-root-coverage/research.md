# Research — quality-scan-root-coverage

## Re-baseline

- Carried-in source: live issue [#1542](https://github.com/rickylabs/netscript/issues/1542), the
  coordinator's frozen contract, and historical reports from #1405/#1398.
- Re-derived against `main` @ `473e8d75b5281c93dc4729d99f3358a34f2bd687` on 2026-08-15.
- The issue's load-bearing acceptance criteria remain current, but one historical detail changed:
  `arch:check` no longer has a hand-maintained root list that omits
  `packages/plugin-streams-core`. It now uses dynamic discovery and tests that exact path.

## Live acceptance contract

The live issue has exactly three close-gated boxes:

1. configured `quality:scan` / `arch:check` roots cover every published workspace package under
   `packages/**` and `plugins/**`, or name and justify each deliberate exclusion;
2. a test or gate fails if a published package is absent from configured roots;
3. `quality:gate` reports the roots scanned.

Criterion 2 is the design center. A broad root edit without an independently derived published-member
denominator would be another point-in-time fix.

## Findings

### F1 — workspace and task wiring

- Root workspace membership is declared as `packages/*`, nested `packages/cli/e2e`, `plugins/*`,
  `examples/*`, and `apps/*` (`deno.json:3-9`).
- `quality:scan` currently passes roots `packages/cli/src`, `plugins`, and `docs/site`
  (`deno.json:50`).
- `quality:scan:repo` already passes broad roots `packages`, `plugins`, `.llm/tools/fitness`,
  `.llm/tools/quality`, and `docs/site` (`deno.json:51`).
- `quality:gate` composes `quality:scan` then `arch:check` (`deno.json:52`).
- `arch:check` and `arch:check:repo` both call `check-doctrine.ts --all-roots`; the former also runs
  dependency checks (`deno.json:163-164`). There is no remaining hand-maintained doctrine root list
  in `deno.json`.

### F2 — published-member denominator

`.llm/tools/deps/workspace.ts:100-121` already expands the declared workspace patterns, including
explicit nested members. `memberFromDenoJson()` defines `publishable` as `publish !== false`
(`.llm/tools/deps/workspace.ts:124-140`). Reusing that authority yields:

- 35 published members under `packages/**` and `plugins/**`;
- two explicit non-published members: `packages/bench` and `packages/cli/e2e` (`publish:false`);
- no other deliberate publication exclusions in the contracted package/plugin workspace surface.

The 35 published members are 29 `packages/*` members and six `plugins/*` members. A configured root
fully covers a member only when it equals the member root or is an ancestor of it; a descendant such
as `packages/cli/src` does not cover `packages/cli`'s `mod.ts`, binary, or other published files.

### F3 — current quality coverage gap

Applying the full-root rule to the live `quality:scan` roots produces:

- fully covered: `plugins/ai`, `plugins/auth`, `plugins/sagas`, `plugins/streams`,
  `plugins/triggers`, `plugins/workers`;
- not fully covered (29):
  `packages/ai`, `packages/aspire`, `packages/auth-better-auth`, `packages/auth-kv-oauth`,
  `packages/auth-workos`, `packages/cli`, `packages/config`, `packages/contracts`, `packages/cron`,
  `packages/database`, `packages/fresh`, `packages/fresh-ui`, `packages/kv`, `packages/logger`,
  `packages/mcp`, `packages/plugin`, `packages/plugin-ai-core`, `packages/plugin-auth-core`,
  `packages/plugin-sagas-core`, `packages/plugin-streams-core`, `packages/plugin-triggers-core`,
  `packages/plugin-workers-core`, `packages/prisma-adapter-mysql`, `packages/queue`,
  `packages/runtime-config`, `packages/sdk`, `packages/service`, `packages/telemetry`, and
  `packages/watchers`.

The issue's three named examples are therefore confirmed, but they are not the full denominator.

### F4 — scanner reporting already satisfies the output shape

The scanner selects explicit `--root` values at `.llm/tools/quality/scan-code-quality.ts:1025-1037`
and emits them in the structured `scanned` field at lines 1040-1050. Because `quality:gate` streams
the `quality:scan` task output before doctrine output, criterion 3 already has an implementation;
the missing fact is complete roots, not a new reporter.

The scanner's source comment and `DEFAULT_ROOTS` still describe the historical narrow policy
(`.llm/tools/quality/scan-code-quality.ts:25-31`), but the configured task always supplies roots.
Changing scanner rule logic or its default invocation is unnecessary for the acceptance contract.

### F5 — doctrine coverage is dynamic and currently complete

`discoverDoctrineRoots()` enumerates every named top-level directory under `packages` and `plugins`
(`.llm/tools/fitness/check-doctrine.ts:26-42`). `--all-roots` executes the doctrine checker once per
discovered root and fails if any child fails (`.llm/tools/fitness/check-doctrine.ts:86-104`).

Existing tests independently enumerate the same set, require exactly 36 roots, explicitly require
`packages/plugin-streams-core`, and explicitly exclude nested `packages/cli/e2e`
(`.llm/tools/fitness/check-doctrine_test.ts:5-32`). Doctrine documentation likewise states that the
36 top-level units are gated and names the nested E2E harness as intentionally excluded
(`docs/architecture/doctrine/10-codebase-verdict-and-handoff.md:90-98`; F-19 at
`docs/architecture/doctrine/09-anti-patterns-and-fitness-functions.md:330-341`).

The doctrine denominator is deliberately broader than the publish denominator because it includes
non-published `packages/bench`. A new root-coverage checker can compare doctrine discovery against
the 35-member publish denominator without changing doctrine discovery or its documented 36-unit
contract.

### F6 — existing test and CI surfaces

- No test currently binds the configured `quality:scan` roots to the published workspace census.
  Searches find task-string tests only for the allowance budget; no published-root invariant exists.
- The authoritative PR code-quality workflow scans changed files and invokes `arch-check` through
  durable receipts (`.github/workflows/code-quality.yml:29-77`); push/schedule runs the repo-wide
  quality scan (`.github/workflows/code-quality.yml:80-100`).
- `run-gate.ts` has allowlisted durable gates for `check`, `test`, `quality-job`, `quality-gate`,
  both scan variants, `arch-check`, docs format/accuracy, and `publish-dry-run`
  (`.llm/tools/gates/catalog.ts:28-38,54-66`). No gate-catalog edit is needed.

### F7 — recent #1653 findings are baselines, not scope

The merged #1653 IMPL-EVAL records two low observations:

- one publicly reachable `any` can produce both `explicit-any` and `public-any` at the same site;
- unknown scanner CLI flags are ignored, so a misspelled `--max-allow` can disable the ceiling.

Evidence: `.llm/runs/release-0.0.7-internals--orchestration/slices/quality-scan-allowance-rail/evaluate-cycle-2.md:300-407`.
This plan does not add scanner flags or touch scanner parsing, so neither issue is naturally in the
edit path. Both are explicit deferrals.

## JSR-audit surface scan

JSR audit is applicable because the gate changes what is claimed across every published member.
The proposed edit surface, however, contains no publishable workspace member and changes no export
map, package `deno.json`, `@netscript/*` dependency pin, or published source file.

- Touched publishable-member denominator: empty.
- Per-touched-member public export and exact-pin audit: vacuously empty, to be re-evaluated if the
  implementation diff enters any `packages/**` or `plugins/**` member.
- Workspace regression proof: the canonical `publish:dry-run` must pass at final history-bound head;
  root `isolatedDeclarations:true` is at `deno.json:170-179`.
- Runtime asset / `import.meta` risk: the three proposed tooling/config files are not published. A
  final diff audit must reject any publishable-source entry; if one appears, the plan must rescope
  before implementation and add the package-level release preflight required by `jsr-audit`.

## Relevant doctrine/debt state

- Selected archetype: 6 CLI/tooling, because this is repository-run automation with task and
  machine-readable output surfaces.
- Axioms: A7 (reuse workspace discovery), A8 (one root-coverage concern), A9 (tooling archetype),
  A14 (the gate must prove its denominator).
- AP/F focus: avoid AP-2/AP-9 by reusing `.llm/tools/deps/workspace.ts`; preserve F-6, F-19, and the
  dynamic doctrine coverage checks.
- Existing package debt, including `plugin-workers-core` and plugin/runtime debts, is not remediated
  or deepened. Coverage is not a claim that those packages have no accepted debt.

## Open questions resolved by the plan

- **Must resolve now:** Is scanner reporting new work? No; the existing `scanned` output is the
  criterion-3 mechanism.
- **Must resolve now:** Does `check-doctrine.ts` need editing? No; current discovery is dynamic,
  already tested, and covers every currently published member plus Bench. The new checker will
  assert the published subset against it.
- **Must resolve now:** What is a deliberate exclusion? Only members with `publish:false`; currently
  Bench and CLI E2E. Doctrine still scans Bench and documents why CLI E2E is outside doctrine roots.
- **Safe to defer:** Scanner diagnostic deduplication and unknown-flag rejection from #1653.
