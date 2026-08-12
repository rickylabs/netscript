# VERDICT: PASS WITH FINDINGS

IMPL-EVAL (owner-directed fallback) — Slice W2-H / PR #1574 / issue #1454

| Field | Value |
| --- | --- |
| Evaluator route | **Claude · Anthropic · Opus 5 · medium** (fallback after the automatic evaluator hung >30 min in `Run OpenHands`, run `31613147606` / generation `29349445386`, cancelled with no verdict) |
| Family relation | **Opposite-family** — the implementation is Codex-authored; this evaluator is Claude. Generator ≠ evaluator and opposite-family review both hold. This is a full-strength verdict, not a stand-in. |
| Evaluated head | `7bbccf51455f01aa424bb7a1669e1250973adc97` (PR head; base `fc312f2116f9b463e5a049b5e70d8152e448463c`) |
| Worktree | `/home/codex/repos/ns006-w2h-impleval`, detached at that head. Read-only. `git status --porcelain` empty before and after. `/home/codex/repos/ns006-w2-1454` never touched. |
| GitHub writes | **None.** No comment, no label, no edit, no PR/issue mutation of any kind (cost-safety guard for #1594). Only read-only `gh api` / `gh pr view` calls were made. |
| Publication | None. No publish, dry-run publish, or version bump. |
| `scaffold.runtime` | **Not run** (serialized/contended, per brief). Its reported evidence was sanity-checked against the retained raw log and against the runner source. |

**PASS WITH FINDINGS** authorizes merging the p1 fix. All seven attack items hold. Ten findings
are recorded; **none is blocking**. One of them (**F-6**) is a forward risk that the 0.0.6 release
lane must handle before or during the version bump, and it should be carried to the release lane
even though it does not block this merge.

Commit-hash note: the brief's hashes (`668b3b3d6`, `132d96d6e`, `49a93397b`, `afe72911d`,
`568e4d0d0`, `71fb905df`) are pre-rebase. The branch was rebased onto `fc312f211`; the equivalent
post-rebase hashes are `5addf89bd`, `ec8aebe1a`, `817d39fff`, `ed7b337a8`, `e42f6dbcc`, `acacab569`
(plus `66237b3c0` and `7bbccf514`). I evaluated the post-rebase commits. The PR body itself already
records the rebased gate hash correctly.

---

## Item 1 — Is the negative control real? **YES — verified from history and from the code, not from prose.**

**The gate genuinely landed before the fix.** `git show --stat 5addf89bd` ("test(cli): prove
package-backed doctor baseline fails") touches five files, 310 insertions, **zero deletions**, all
of them e2e:

```text
packages/cli/e2e/src/application/gates/scaffold/behavior-plugins-health-gate.ts   |  36 +
packages/cli/e2e/src/application/gates/scaffold/package-backed-plugin-doctor-fixture.ts | 269 +
packages/cli/e2e/src/application/gates/scaffold/scaffold-capability-gates.ts      |   2 +
packages/cli/e2e/src/domain/cli-surface.ts                                        |   1 +
packages/cli/e2e/suites/scaffold/capability-suites.ts                             |   2 +
```

I then compared blob hashes rather than trusting the stat:

```text
plugin-registry.ts        base=a9af7226ec8a…  gate=a9af7226ec8a…  same=YES
doctor-plugin-use-case.ts base=e1bfd5646f30…  gate=e1bfd5646f30…  same=YES
resolved-config.ts        base=22087beb70f4…  gate=22087beb70f4…  same=YES
deploy-config-resolvers.ts base=6bf852995330… gate=6bf852995330…  same=YES
```

Every product file at the gate commit is byte-identical to the merge base. The gate was therefore
executed against genuinely unfixed code.

**The recorded red is causally the red that unfixed code must produce.** At that tree:

- `resolveScaffoldPluginMetadata` returns `null` for any spec not starting with `.` or `/`, so a
  `jsr:` spec falls to `normalizePluginSpecMetadata`, which returns name-only data and manufactures
  `workdir = paths.plugins/<name>` via `resolvePluginWorkdirFromSpec`.
- `checkWorkdir` unconditionally probes that manufactured path → `plugins/workers does not exist`,
  `plugins/streams does not exist`.
- `checkPermissions` read only `plugin.permissions`, which the fallback drops →
  `No plugin permissions declared`.
- `plugin.doctor` is `undefined`, so `checkPluginDoctor` returns `[]` → the three workers registry
  checks never execute.

Those four consequences are **exactly and only** the eleven assertion failures in the baseline-red
log. The red is mechanistic, not decorative.

**The raw logs exist as artifacts**, in the orchestrator run dir (not just quoted in prose):

```text
logs/package-doctor-baseline-red.log             3097 B  16:48
logs/package-doctor-postfix-deliberate-red.log   3281 B  17:02
logs/package-doctor-green.log                     319 B  17:02
logs/package-doctor-restored-green.log            319 B  17:20
logs/scaffold-runtime.log                        7106 B  17:30
```

**Post-fix narrow-seam red.** `FAILED 1884ms / Command exited 1; expected 0`, five assertions, and
the doctor output shows `Permission metadata --allow-net`. That is internally consistent: dropping
the transported manifest permissions makes the chain fall through to the fixture's appsettings
`Defaults.Deno.Permissions: ['--allow-net']` (fixture line 65). The break did not disable the
module-resolution or workers-registry checks, and those assertions correspondingly do **not** appear
in the seam-red output — the seam was narrow, as claimed. Restored green `PASSED 1845ms`, and
post-rebase green `PASSED 3198ms`.

**What I did not do:** I did not re-execute the gate at `5addf89bd`. It requires network JSR
resolution and holds the same suite lease the brief told me not to contend. The verification above
is structural (blob identity), causal (the pre-fix code path), and artifactual (retained logs) — not
re-execution.

## Item 2 — Is the discriminator sound? **YES.**

`packages/cli/src/kernel/application/plugin/registered-plugin-source.ts` never touches the
filesystem. Classification is a pure function of the configured string:

```ts
export function isExplicitFilesystemSpecifier(specifier: string): boolean {
  const normalized = specifier.trim();
  return normalized.startsWith('.') || normalized.startsWith('/') || normalized.startsWith('file:');
}
```

That predicate is the **same** one the pre-fix code already used to decide local-scaffold resolution
(`!spec.startsWith('.') && !spec.startsWith('/')` at base `plugin-registry.ts:277`), so no
previously-local specifier is reclassified. Only `file:` is newly admitted as local, which is
strictly the plan's intent.

- **JSR plugin that also has a local directory.** Package wins, and it is tested with a *real*
  directory on disk: `doctor-plugin-invariants_test.ts` "plugin doctor treats a bare package alias as
  package-backed despite an incidental directory" does `Deno.mkdir(join(projectRoot, 'plugins/fixture'))`,
  then asserts `source` is `healthy` / `Package-backed`, asserts
  `checks.some(c => c.id === 'workdir') === false`, and asserts the permission check reports the
  manifest's `--allow-read`. Presence of the directory does not change the result, exactly as §2 of
  the plan requires.
- **Resolution does not override the contract.** `list-plugins-command_test.ts` "plugin list renders
  package-backed source truth deliberately" configures `@example/plugin-chat` mapped through
  `deno.json` imports to a local `./plugin.ts` and still asserts `package:@example/plugin-chat`. A
  workspace/import-map resolution to a local file does not silently become a local-workdir install.
- **Local plugin with a missing directory still warns.** `checkPluginSource`'s local branch is
  unchanged in substance: `status: exists ? 'healthy' : 'warning'`,
  `message: … ${plugin.source.workdir} does not exist`. The regression the fix could have caused —
  silencing the local warning — did not happen. Additionally a genuinely dangling module is still an
  **error** with exit 1 via the pre-existing `configured-module-resolves` check, so deleting a local
  plugin directory cannot pass doctor.
- Fail-closed on the package path: `normalizePluginSpecMetadata` throws on any non-`resolved` probe
  status, and the caller records it as `manifestError`. A package that cannot be imported does not
  quietly become "healthy".

## Item 3 — Permission precedence. **Matches the locked chain exactly; the `pluginService` slot is not elided in code.** (One non-blocking finding, F-1.)

One helper, one order, in `deploy-config-resolvers.ts`:

```ts
export function resolveEffectivePluginPermissions(
  explicit, contribution, plugin, globalDefaults,
): string[] {
  return [...(explicit ?? contribution ?? plugin ?? globalDefaults)];
}
```

Call sites, all four consistent with the LOCKED chain
`cfg.Permissions > pluginService.permissions > plugin.permissions > global defaults`:

| Site | Arguments |
| --- | --- |
| `resolvePlugins` (service runtime) | `cfg.Permissions`, `pluginService?.permissions`, `plugin?.permissions`, `[...defaultPermissions, '--allow-write']` |
| `resolveBackgroundProcessor` | `raw?.Permissions`, `undefined`, `plugin?.permissions`, `['--allow-all','--unstable-kv']` |
| doctor `checkPermissions` | appsettings entry, `plugin.service?.permissions`, `plugin.permissions`, appsettings `Defaults.Deno.Permissions` |
| `workspace-mutator.applyRegisteredPluginPermissions` | appsettings entry, `plugin.service?.permissions`, `plugin.permissions`, appsettings defaults |

The background site's `undefined` contribution slot is the plan's explicit "absent slot is skipped /
retain existing background behaviour". `plugin-permission-precedence_test.ts` asserts all four slots
independently. Doctor additionally emits the required divergence warning
(`… (explicit override differs from published default: …)`) while keeping the explicit override
effective — covered by a new invariants test.

## Item 4 — Published-surface claim. **VERIFIED. No new manifest field, permission field, or export.**

```text
git diff --stat fc312f211..HEAD -- '*deno.json' '*deno.lock' 'plugins/**'    # empty
```

Zero plugin files, zero package manifests, zero lockfiles changed. The whole diff is confined to
`packages/cli/**` plus two run-artifact Markdown files and one `arch-debt.md` row.

Independent check that the breaking `RegisteredPluginConfig` migration is internal:

```text
deno doc --unstable-kv packages/cli/mod.ts packages/cli/testing.ts packages/cli/scaffolding.ts
  # rc=0, 1210 lines
grep -c "RegisteredPluginConfig\|RegisteredPluginSource"   # 0
```

1210 lines and zero hits — identical to the PLAN-EVAL pre-implementation baseline, so the CLI's
published surface has no delta. `packages/cli/deno.json` exports remain `.`, `./scaffolding`,
`./testing`.

The workers doctor contribution is consumed through the **already-published** `./doctor` subpath:
`resolvePackageDoctorSpecifier` simply appends `/doctor` to the configured specifier. Nothing was
added to the plugin to make this work — which is precisely the plan's claim.

## Item 5 — Internal consistency of the reported runtime evidence. **Consistent, and the one apparent anomaly is legitimate.** (Two non-blocking findings, F-4 and F-5.)

The retained raw log `logs/scaffold-runtime.log` and the `evidence.md` transcript agree exactly: 88
`> <gate>` lines each, 88 `PASSED` lines each, same `Summary: passed=89 failed=0 skipped=0`. The
transcript is a faithful copy, not a reconstruction.

**The 88-printed vs 89-counted gap is real tool behaviour, not padding.** In
`packages/cli/e2e/src/application/runner/suite-runner.ts:107-120`, the Docker prune step is pushed
into `steps` — and therefore into `summary.passed` — **without** emitting `gate-start`/`gate-end`, so
`PrettyReporter` never prints it:

```ts
steps.push({
  id: GATE.CLEANUP_DOCKER_CREATED_CONTAINERS,
  title: 'Prune suite-created Docker containers',
  verdict: 'passed' as const, …
});
```

88 printed + 1 silent prune = 89. I verified this in the runner source rather than assuming it.

Other consistency checks that hold: `skipped=0` matches an empty `deferredGates` list (deferrals are
the only source of `skipped`); `behavior.package-backed-plugin-doctor: PASSED 3250ms` appears at
exactly the position `capability-suites.ts` registers it (immediately after
`behavior.plugins-health`); `cleanup.aspire-stop` ran; and `commandGate` marks the new gate
`critical: true` in both suites, so a red there would have aborted the run rather than been absorbed.

## Item 6 — PLAN-EVAL findings folded in? **PLAN-EVAL F-1 yes. PLAN-EVAL F-2 yes. PLAN-EVAL F-3 partially.**

> Naming: in this section `F-n` means the **PLAN-EVAL verdict's** findings. This verdict's own
> findings are the `F-n` entries under "## Findings" below and are always written as "finding F-n"
> with a section link, never bare.

**F-1 (production `rootDir` reader at `doctor-plugin-use-case.ts:564`) — FOLDED.** The evidence's
"Slice 1 caller inventory" names it explicitly ("guards both the workdir reader and the local doctor
`rootDir` reader"), and the code guards it:

```ts
const moduleUrl = isModuleSpecifier(plugin.doctor) || plugin.source.kind === 'package'
  ? plugin.doctor
  : toFileUrl(resolve(plugin.source.rootDir, plugin.doctor)).href;
```

The two doctor test fixtures F-1 also named (`doctor-plugin-command_test.ts`,
`doctor-plugin-invariants_test.ts`) were migrated to explicit `local-workdir` sources, as was the
auth doctor fixture.

**F-2 (`plugin list` Workdir column decided deliberately) — FOLDED, and deliberately.** Rendering is
`package:${configuredSpecifier}`; there is a dedicated test asserting column 4 equals
`package:@example/plugin-chat`; the command description was reworded to "List configured plugins and
their local or package-backed source"; and the choice is documented in both `packages/cli/README.md`
and the new `packages/cli/CHANGELOG.md`. This is the opposite of "decided implicitly during
implementation".

**F-3 (restate the re-baseline claim accurately) — PARTIAL.** Details, and the reason it is not
blocking, are in this verdict's finding F-3 below.

## Item 7 — No fabricated fixture directories. **VERIFIED.**

Nine files were added; none is a fake plugin tree:

```text
.llm/runs/.../evidence.md, .llm/runs/.../plan.md, packages/cli/CHANGELOG.md,
packages/cli/e2e/src/application/gates/scaffold/package-backed-plugin-doctor-fixture.ts,
packages/cli/src/kernel/adapters/config/configured-plugin-manifest-summary.ts (+ _test),
packages/cli/src/kernel/adapters/config/plugin-permission-precedence_test.ts,
packages/cli/src/kernel/application/plugin/registered-plugin-source.ts (+ _test)
```

The fixture's only `mkdir` calls are `workers/jobs` (a real worker job input — explicitly permitted
by the plan as runtime input, not a plugin installation), `aspire`, and `dotnet/AppHost`. It creates
no `plugins/workers`, no `plugins/streams`, and it **actively fails if either exists**:

```ts
for (const forbidden of ['plugins/workers', 'plugins/streams']) {
  if (await exists(join(options.projectRoot, forbidden))) {
    failures.push(`fixture fabricated forbidden local plugin workdir: ${forbidden}`);
  }
}
```

No permission duplication either: the fixture's `appsettings.json` declares only
`Defaults.Deno.Permissions: ['--allow-net']` — deliberately narrow, so the asserted workers/streams
arrays cannot be satisfied by the fixture's own metadata — and no per-plugin `Permissions` key
anywhere. Both negative controls were made by (1) committing the gate before the fix and (2) setting
one assignment to `undefined`; neither added or deleted a directory. The exact behaviour #1454 exists
to stop is what the gate now enforces.

---

## Findings

All ten are **non-blocking**. F-6 needs an owner outside this PR.

### F-1 — non-blocking: the `pluginService.permissions` slot is structurally unreachable

The chain preserves the slot, as the plan demanded. But nothing in the codebase can ever populate it.
`packages/plugin/src/config/domain/service-contribution.ts` is:

```ts
export interface ServiceContribution {
  readonly name: string;
  readonly entrypoint: string;
  readonly port?: number;
}
```

There is no `permissions`. Every producer of `RegisteredPluginConfig.service` — `resolveRegisteredPluginSnapshot`,
`normalizeScaffoldPluginMetadata`, and the new `summarizeConfiguredPluginManifest` — sets only
`entrypoint` and `port`. So `plugin.service?.permissions` is always `undefined` in production and the
four-slot chain is a three-slot chain in practice.

This is **pre-existing** (the base code's `cfg.Permissions ?? pluginService?.permissions ?? defaults`
had the identical dead slot) and the plan's requirement was "do not elide the slot", which the
implementation satisfies literally. Not blocking.

**Failure scenario if ignored:** `packages/cli/README.md` now tells users that
"contribution-specific permissions" sit between the appsettings override and the plugin-wide manifest
permissions. A plugin author who adds permissions to a service contribution will find they have no
effect, with no diagnostic, because the field does not exist on the contribution type. The second
assertion in `plugin-permission-precedence_test.ts` also exercises an input no production caller can
construct, so it protects nothing today.

### F-2 — non-blocking: doctor's global-default tail differs from the runtime's

Doctor's last slot is appsettings `NetScript.Defaults.Deno.Permissions` (or `[]` when appsettings is
absent or unparseable). The runtime's last slot is `[...defaultPermissions, '--allow-write']` for
services and `['--allow-all', '--unstable-kv']` for background processors. When *both* the explicit
override and the manifest permissions are absent, doctor reports a set the runtime will not use. The
plan required doctor to report "the exact effective set selected by that same precedence".

Not hit by the new gate, because workers and streams both declare manifest permissions.

**Failure scenario if ignored:** a plugin with no manifest permissions and no appsettings override
makes doctor print `Permission metadata — No plugin permissions declared` (warning) while the
generated background helper actually receives `--allow-all --unstable-kv`. Doctor understates the
real grant, which is the wrong direction for a permission diagnostic.

### F-3 — non-blocking: PLAN-EVAL F-3's re-baseline restatement did not reach `plan.md`

`plan.md` line 10 at the evaluated head still reads verbatim:

> `origin/main` has advanced, but the intervening changes are unrelated Fresh work; the relevant
> CLI/plugin files have not moved.

PLAN-EVAL F-3.1 established that this is over-broad: `main` had added exact-version JSR parsing in
`plugins/install/plugin-package-resolver.ts` and `install-plugin.ts`, which is neither Fresh work nor
irrelevant — the new fixture depends on it to pin `jsr:@netscript/plugin-workers@0.0.5`. The accurate
restatement exists **only** in the PR body's Drift section ("Main added exact-version JSR parsing
through #1456 before implementation; the E2E uses that additive capability to pin the published
fixture"), which is correct and sufficient for a reader of the PR. PLAN-EVAL F-3.2 (the §1 sentence
that omits `cfg.Permissions` from the description of current service resolution) was not corrected at
all. `git log --follow` confirms `plan.md` has not been touched since `b6a320ff8`.

**Failure scenario if ignored:** the archived `plan.md` — the artifact a future run reads first —
records a re-baseline that overstates how quiet `main` was, and the correction lives only in PR prose
that is not in the run directory.

### F-4 — non-blocking: the reported `~5m34s` runtime wall time is contradicted by its own transcript

The printed per-gate durations sum to **382,151 ms = 6 m 22 s**:

```text
python3 -c "…re.findall(r'PASSED (\d+)ms', log)…"  ->  88 gates, 382151 ms, max 74542 ms
```

`suite-runner.ts` executes gates strictly serially (`for (const gate of mainGates) { … await runGate(…) }`);
there is no gate-level concurrency anywhere in the runner. Wall time therefore cannot be less than
the sum of the parts, so the run took **at least** 6 m 22 s plus scaffold setup and prune — not
5 m 34 s.

The error direction is harmless: the run was longer, i.e. more substantive, than claimed, which
strengthens rather than weakens the "not a seconds-long classifier short-circuit" argument. But the
number is not derived from the evidence and should not be quoted as fact. (`deno task test` in the
same evidence reports `3m34s`; `5m34s` may be a transcription artifact of that.)

### F-5 — non-blocking: "all 89 named gates executed" overstates by one

Only 88 gates are named. The 89th passed step is the unprinted `cleanup.docker-created-containers`
prune (see Item 5). The same phrasing has been written into the now-closed `arch-debt.md` row
("executed 89 named gates with 0 failures and 0 skips"), where it will outlive the PR.

**Failure scenario if ignored:** a future auditor reconciling the debt row against the transcript
finds 88 named gates and cannot account for the 89th without reading the runner source, which is
exactly the kind of unexplained gap that makes closed-debt evidence untrustworthy.

### F-6 — non-blocking for this merge, but the 0.0.6 release lane must handle it

The new gate hard-pins published JSR packages at `NETSCRIPT_RELEASE_VERSION`:

```ts
// behavior-plugins-health-gate.ts:96
'--package-version', NETSCRIPT_RELEASE_VERSION,
// jsr-specifiers.ts:35
export const NETSCRIPT_RELEASE_VERSION: string = CLI_PACKAGE_VERSION;   // publish-assets.generated.ts -> '0.0.5'
```

The fixture then builds `jsr:@netscript/plugin-workers@<that>` and
`jsr:@netscript/plugin-streams@<that>`. `commandGate` sets `critical: true`, and the gate is
registered in **both** `scaffold.plugins` and `scaffold.runtime`.

The nearest existing precedent is weaker: `plugin-install-gates.ts:13-18` derives the version from
the CLI entrypoint first (`/^jsr:@netscript\/cli@([^/]+)/`) and only falls back to the constant, and
it is reached only on the published-source branch. The new gate is therefore the **first
unconditional dependency on published JSR artifacts inside the local-source `scaffold.runtime`
path**.

**Failure scenario:** the moment the 0.0.6 release cut regenerates `publish-assets.generated.ts` to
`'0.0.6'` and before `@netscript/plugin-workers@0.0.6` / `@netscript/plugin-streams@0.0.6` are
published, `behavior.package-backed-plugin-doctor` resolves a nonexistent JSR version, exits
non-zero, and — being critical — aborts both `scaffold.plugins` and `scaffold.runtime`. The
merge-readiness gate goes red for the entire bump→publish window, with a JSR 404 rather than an
obvious cause. Recommended follow-up (not required for this merge): pin the fixture to the last
*published* version, or derive it the way `publishedPluginCliUrl` does, or skip the gate when the
pinned version is not yet on the registry.

### F-7 — informational: the quoted root `lint` / `fmt:check` evidence does not cover `packages/cli`

Both root tasks carry `--exclude "^(packages/(cli)|…)"`. The `filesSelected=2019` lint and fmt
results in `evidence.md` therefore cover **zero** changed files. This is the repo's task definition,
not an authoring error, but the evidence should not be read as lint/fmt coverage of this change.

I closed the hole myself — see "What I executed": scoped `packages/cli` lint (867 files, 0 findings)
and scoped `packages/cli` fmt-check (867 files, 0 findings) both pass at this head.

### F-8 — informational: the fabricated-workdir helper survives as dead code

`resolvePluginWorkdir` (`packages/cli/src/kernel/adapters/config/plugin-registry.ts:99`) is the
"manufacture `plugins/<name>`" logic at the heart of #1454:

```ts
export function resolvePluginWorkdir(pluginName: string, paths?: Pick<PathsConfig, 'plugins'>): string {
  return normalizePath(join(paths?.plugins ?? 'plugins', resolvePluginLocalName(pluginName)));
}
```

Its sibling `resolvePluginWorkdirFromSpec` was correctly deleted by the fix, but this one was left
behind, and it now has **zero** consumers:

```text
grep -rn "resolvePluginWorkdir" --include=*.ts packages plugins   # only the definition itself
```

It is an internal export (absent from `deno doc` of the published surface), so this is cleanliness,
not surface drift.

**Failure scenario if ignored:** the exact function this fix exists to remove remains callable and
exported inside `plugin-registry.ts`. A future contributor filling in a missing `workdir` reaches for
the helper that is already there and silently reintroduces the fabricated-directory behaviour, with
no compile error and no test to catch it — the new gate only covers the doctor/list/runtime paths, not
a new caller.

### F-9 — informational: the quoted full-suite test evidence predates the final rebase (now supplied)

`evidence.md` reports `ok | 3260 passed (622 steps) | 0 failed | 17 ignored (3m34s)`, and the
retained `logs/gate-test.log` confirms that string with 774 test files. **I ran `deno task test`
myself at the evaluated head and got 3268 passed — eight more.**

The gap is explained and benign, not a discrepancy in the change. `evidence.md`'s own "Final
synchronization" section states that the branch was rebased onto `origin/main@fc312f211` *after* the
gate block, and that post-rebase revalidation covered only the scoped `packages/cli` check and the
focused E2E gate. The eight extra tests are `main`'s, pulled in by that rebase. The PR therefore had
**no full-suite evidence at its own head** until now.

```text
rtk proxy deno task test   ->   ok | 3268 passed (622 steps) | 0 failed | 17 ignored (5m56s)   EXIT 0
```

Same 622 steps, same 17 ignored, zero failures. The missing evidence is now supplied by this
evaluation; treat the 3260 figure as pre-rebase and 3268 as the head-of-branch figure.

### F-10 — informational: the evaluated head is one commit behind `main`

```text
gh api /repos/rickylabs/netscript/compare/main...7bbccf514
  -> {"ahead":10,"behind":1,"base":"fc312f2116f9b463e5a049b5e70d8152e448463c","status":"diverged"}
```

The missing commit is `eb373db29` "docs(doctrine): restore verdict measurement and repo gate
(#1585)", which touches `.llm/harness/debt/arch-debt.md` — the same file this PR edits — and
`.llm/tools/fitness/check-doctrine.ts`, the implementation behind the `arch:check` half of
`quality:gate`. GitHub reports the PR `MERGEABLE`. Re-run `quality:gate` after the rebase/merge, and
expect the `arch-debt.md` edit to sit near, though not necessarily in, a region `#1585` also touched.

---

## What I executed, verbatim

All commands were run in `/home/codex/repos/ns006-w2h-impleval` unless noted.

```text
git rev-parse HEAD                                   # 7bbccf51455f01aa424bb7a1669e1250973adc97
git rev-parse --is-shallow-repository                # true
git status --porcelain                               # empty, before and after
git log --oneline -15
git diff --stat fc312f211..HEAD
git diff --name-only fc312f211..HEAD
git diff --diff-filter=A --name-only fc312f211..HEAD
git diff --stat fc312f211..HEAD -- '*deno.json' '*deno.lock' 'plugins/**'    # empty
git show --stat --oneline 5addf89bd
git rev-parse fc312f211:<path> / 5addf89bd:<path>    # blob-identity comparison, 4 product files
git show fc312f211:packages/cli/src/kernel/adapters/config/plugin-registry.ts
git log --oneline --follow -- .llm/runs/.../w2-h-1454/plan.md
git diff fc312f211..HEAD -- <each changed source and test file>

gh pr view 1574 --repo rickylabs/netscript --json …          # read-only
gh api /repos/rickylabs/netscript/compare/main...7bbccf514   # read-only
gh api /repos/rickylabs/netscript/compare/fc312f211...main   # read-only

rtk proxy deno task check
  -> filesSelected=2891 batches=25 failedBatches=0 occurrences=0        EXIT 0
rtk proxy deno task lint
  -> filesSelected=2019 batches=11 occurrences=0                        EXIT 0   (excludes packages/cli — see F-7)
rtk proxy deno task fmt:check
  -> filesSelected=2019 batches=11 failedBatches=0 findings=0           EXIT 0   (excludes packages/cli — see F-7)
deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/cli --ext ts,tsx
  -> filesSelected=867 batches=8 failedBatches=0 occurrences=0          EXIT 0
deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/cli --ext ts,tsx
  -> filesSelected=867 batches=5 occurrences=0                          EXIT 0
deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/cli --ext ts,tsx --ignore-line-endings
  -> filesSelected=867 batches=5 failedBatches=0 findings=0             EXIT 0
rtk proxy deno task quality:gate
  -> quality:scan {"ok":true,"findings":[],"allowCount":7}              EXIT 0
  -> arch:check FAIL=0 across 36 packages (36 "FAIL=0" lines, zero "FAIL=[1-9]")
deno doc --unstable-kv packages/cli/mod.ts packages/cli/testing.ts packages/cli/scaffolding.ts
  -> rc=0, 1210 lines; grep -c "RegisteredPluginConfig\|RegisteredPluginSource" -> 0
rtk proxy deno task test
  -> ok | 3268 passed (622 steps) | 0 failed | 17 ignored (5m56s)        EXIT 0

python3 (re) over logs/scaffold-runtime.log
  -> 88 PASSED gates, 382151 ms total, max 74542 ms
grep -c '^> ' logs/scaffold-runtime.log            -> 88
tail -1  logs/scaffold-runtime.log                 -> Summary: passed=89 failed=0 skipped=0
```

The seven quality allowances reported by `quality:scan` are all pre-existing and none is in a file
this PR touches. `deno task check` emits a pre-existing warning about ignored `npm:lmdb` /
`npm:msgpackr-extract` build scripts; it is unrelated to this change.

## What I could NOT verify

- **The `scaffold.runtime` result itself.** Not re-run, per the brief. I verified the retained raw
  log against the `evidence.md` transcript and against the runner source; I did not re-execute a
  single one of the 88 gates. If the raw log were fabricated, nothing in this verdict would catch it —
  though its 17:30 mtime sits correctly after the 17:20 restored-green log, and its 88/89 off-by-one
  matches a real code path that a fabricator would have had to know about.
- **The baseline red at `5addf89bd` by execution.** Verified structurally and causally instead (Item 1).
- **Network-dependent behaviour of the package probe.** `loadRegisteredPluginMetadata` now spawns a
  bounded child per package-backed plugin and requires the module to import. With a cold Deno cache
  and no network, that probe fails and the plugin gets a `manifestError` where the old name-only
  fallback would have succeeded silently. `plugin list`, `generate aspire`, and doctor all traverse
  this path. I did not test the offline case. It is arguably the correct fail-closed behaviour and
  the plan endorses fail-closed resolution, so I am recording it here rather than as a finding.
- **The published `@netscript/plugin-streams@0.0.5` manifest permission array as shipped.** The
  fixture asserts it and the gate passed in a run I did not perform; I verified the declaration in
  source only.
- **Whether `#1585` (the one commit `main` is ahead) conflicts in `arch-debt.md`.** GitHub reports
  `MERGEABLE`; I did not attempt the merge.

## Route and independence

Evaluated by **Claude Opus 5, medium effort**, native Anthropic session, **opposite-family** to
Codex-authored implementation. Generator ≠ evaluator and opposite-family review both hold, so this
verdict is authoritative under the harness invariants rather than a degraded substitute for the
hung open-model lane.

The PASS rests on: blob-level proof that the gate preceded the fix; a causal derivation of the
baseline red from the pre-fix code path; a code-level explanation of the transcript's only numeric
anomaly; an independent `deno doc` measurement of the published surface; seven gates I ran myself —
including the full test suite at the evaluated head, which the PR did not have (F-9), and the two
scoped `packages/cli` gates the repo's root tasks exclude (F-7); and ten recorded findings — not on
the PR's own assurances. Three of the findings (F-4, F-5, F-9) are corrections to the evidence's own
claims, and F-6 and F-8 are risks the slice did not surface.

**PASS WITH FINDINGS. #1574 may merge on the orchestrator's authority. F-6 should be carried to the
0.0.6 release lane before the version bump. F-3's plan-artifact correction, F-8's dead helper, and
F-1/F-2's permission gaps are follow-ups, not merge conditions.**
