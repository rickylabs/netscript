# VERDICT: PASS

PLAN-EVAL (fallback) — Slice W2-H / PR #1574 / issue #1454

| Field | Value |
| --- | --- |
| Evaluator route | **Claude · Anthropic · Opus 5 · medium** (owner-directed fallback, drift D-8/D-9) |
| Family relation | **Opposite-family** — the plan is Codex-authored; this evaluator is Claude. Generator ≠ evaluator and opposite-family review invariants both hold. |
| Worktree | `/home/codex/repos/ns006-w2h-planeval`, detached at `ad7574bb70dbba8ad3de28ff699c484fd97583e6` |
| Plan evaluated | `.llm/runs/release-0.0.6-fixes--orchestration/slices/w2-h-1454/plan.md` at that head (21748 bytes, 285 lines; byte-identical to the orchestrator repo's copy) |
| Mode | Read-only. No commits, pushes, edits to the plan or any source file, label changes, PR operations, or publication. Worktree verified clean at exit (`git status --porcelain` → empty). |
| Scope | The four required amendments. Architecture not re-litigated per brief. |

The verdict is **PASS** on the assignment: all four amendments are present **and** adequate. Every
file/line citation I spot-checked resolves to the claimed code at the claimed lines — the plan is
amended, not stale. Three non-blocking findings are recorded below; none of them changes an
amendment's adequacy, and none of them is a risk without a mitigation or a decision resolved without
evidence.

---

## Amendment 1 — Risk register with mitigations and owning slices: **ADEQUATE**

The register is a four-row table (plan lines 219–224), each row carrying a named risk, a concrete
mitigation, and an owning slice. It is not a non-goals list; the non-goals live separately under
"What this plan will not do".

### 1a. Type-breaking `RegisteredPluginConfig` migration — enumeration verified CORRECT

The field shape the migration breaks is real. `packages/cli/src/kernel/domain/resolved-config.ts:153-170`:

```ts
export interface RegisteredPluginConfig {
  name: string;
  ...
  workdir: string;
  rootDir: string;
```

Both fields are required today, exactly as the plan states.

I independently enumerated every reader by grepping `RegisteredPluginConfig` and `.workdir` /
`.rootDir` across `packages/cli` and `plugins`, then read each hit. **Production readers of
`plugin.workdir` are exactly four, and the register cites all four, to the line:**

| Cited by plan | Verified content |
| --- | --- |
| `deploy-config-background.ts:99-103` | `const workdir = resolveWorkdir(raw?.Workdir, workspaceWorkdir ?? plugin?.workdir, getBackgroundProcessorPath(paths, name));` — lines 99–103 exactly. ✅ |
| `deploy-config-resolvers.ts:197-201` | `workdir: resolveWorkdir(cfg.Workdir, plugin?.workdir ?? workspaceWorkdir, join(paths.plugins, pluginName)),` — lines 197–201 exactly. ✅ |
| `doctor-plugin-use-case.ts:524-536` | `async function checkWorkdir(...)` at 524, `resolve(projectRoot, plugin.workdir)` at 529, closing `}` at 536. ✅ |
| `list-plugins-command.ts:47-60,110-115` | `toListEntry` at 47 with `workdir: plugin.workdir` at 59; the `Workdir` column header + `${plugin.workdir}` row print at 111–114. ✅ |
| `plugin-registry.test.ts:21-302` | Fixtures asserting the required-field shape, incl. `workers.rootDir !== resolve(projectRoot, 'plugins/workers')` at 68–69 and `plugins['service-less']?.rootDir !== pluginRoot` at 241. ✅ |
| `true-userland-install-suite.ts:122-155` | The required/forbidden generated-path topology list (`workers/mod.ts` … forbidden `plugins/workers/src`) — genuine E2E topology assumptions. ✅ |
| `prepare-flow-b-fixture.ts:20-145` | The published-vs-local mode split (`jsr:@netscript/plugin-workers@<v>/services` regex, `.netscript-source-root`, `workersCli` published/local branch at 143–145). ✅ |

I found **no unenumerated production `workdir` reader.** The Aspire register generators
(`generate-register-{apps,services,background,plugins,tools}.ts`) read `entry.Workdir` from the
*deploy* config, i.e. downstream of `deploy-config-resolvers.ts`, not `RegisteredPluginConfig`, so
they are correctly out of the register's scope.

The mitigation is real, not a gesture: Slice 1 must enumerate every reader, select one guarded
representation, and add a test that fails when the package variant flows through a local-only
caller, with **type-check named as the migration gate before Slice 4 consumes the source**. Because
both fields are required today, making them local-only breaks compilation at every unguarded
dereference — the named gate mechanically catches the whole set, including the ones the row does not
list by name (see Finding F-1).

### 1b. Runtime permission behaviour change — **ADEQUATE**

Row 2 treats it as user-visible, not metadata plumbing, and names three concrete artifacts: the
locked §3 chain with precedence tests for every occupied/absent slot, a `packages/cli/CHANGELOG.md`
0.0.6 entry, and a doctor warning when the effective manifest/contribution set diverges from a
user-overridden `cfg.Permissions` while preserving that override as highest precedence. Owning
slices are named (4 and 5). This is exactly the trio the brief required.

The underlying claim is verified: `deploy-config-resolvers.ts:206-207` currently resolves
`cfg.Permissions ?? pluginService?.permissions ?? [...defaultPermissions, '--allow-write']` — the
plugin-wide manifest permissions genuinely never reach service resolution today, while
`deploy-config-background.ts:111` already does `raw?.Permissions ?? plugin?.permissions ?? [...]`.
Adding the manifest slot therefore does change what users receive. Treating it as behavioural is
correct.

### 1c. Package beats incidental local directory — **ADEQUATE**

Row 3 requires both directory-present and directory-absent test cases, the explicit-filesystem
opt-in documented in CLI help and `packages/cli/README.md`, a package-backed/no-local-workdir
message in doctor output, and the behaviour in the 0.0.6 CHANGELOG/release notes — i.e. help/doctor
output **and** release notes, as required. Owning slices named (4 and 5). §2 lines 103–106
independently require that presence/absence of the incidental directory must not change the result.

### 1d. Precedence contradiction carried as a resolved risk — **ADEQUATE**

Row 4 names the original defect honestly ("the original plan's prose retained
`pluginService.permissions` while sequence step 5 elided it"), records the resolution as the single
canonical §3 chain, and adds a live enforcement clause — "Any different ordering is plan drift and
stops the slice" — with enforcement assigned to Slices 4 and 5. It is carried as a resolved risk
rather than silently patched, which is what was asked.

---

## Amendment 2 — Open-decision sweep: **ADEQUATE** (including the "no safe-defer" claim)

Three decisions (plan lines 228–232), each with an explicit **must-resolve-in-slice-N** marker and
required evidence. None is marked resolved without evidence.

| Decision | Marker | Evidence required — and whether it is checkable |
| --- | --- | --- |
| Bounded-probe surface contract | must-resolve-in-slice-2 | One versioned/internal result union covering resolved metadata, missing/ambiguous manifest, import failure, timeout, non-zero exit, malformed payload; **parser/child parity tests must fail on an invalid envelope before Slice 3 consumes it.** Checkable, and it maps onto real code: `configured-plugin-manifest-probe.ts:9-16` already carries a six-member union (`resolved`/`missing`/`ambiguous`/`import-failure`/`non-zero`/`timeout`), so the slice is an extension of an existing contract, not an invention. |
| `RegisteredPluginConfig.workdir` migration | must-resolve-in-slice-1 (and before slice 4) | Caller inventory from the risk register, one selected representation, and a package-variant test **plus scoped type-check that fail if any local-only caller dereferences an unguarded field.** Checkable and mechanically enforced. |
| #1022 debt close-out | must-resolve-in-slice-7 | Named closing gate `behavior.package-backed-plugin-doctor` registered in both suites; untruncated focused red → green logs and the granted one-pass `scaffold.runtime` result in `evidence.md`, linked in the PR Phase 2 comment; **only then** may the `cli-plugin-doctor-published-module` row be updated. Checkable. |

I verified the debt row is real and open — `.llm/harness/debt/arch-debt.md:2117-2123`, id
`cli-plugin-doctor-published-module`, reason: "a compiled CLI consuming a remotely published JSR
plugin may not have a filesystem-backed `.ts` path at that root", target "Before claiming
published-binary parity for plugin-contributed doctor checks." The plan's close-out condition
(published module resolution + adapter execution + consumer truth demonstrated) matches the debt's
own stated acceptance rather than a weaker substitute.

**I ran my own open-decision sweep rather than accepting the claim.** The candidates I tested:

- *What `plugin list` prints in the `Workdir` column for a package-backed plugin.* Not named in the
  sweep. I checked whether it can force rework: the `GATE.SCAFFOLD_PLUGIN_LIST` gate
  (`scaffold-gates.ts:100-105`) only executes `plugin list --project-root <root>` and asserts the
  command result; it makes no column assertion. The rendering choice is subsumed by Slice 1's
  representation decision, which the register already binds to `list-plugins-command.ts:47-60,110-115`.
  Advisory only — recorded as Finding F-2, not a missing must-resolve.
- *Whether the background path needs a `pluginService` slot.* Not open: §3 states "an absent slot is
  skipped" and step 5 says "retain the existing background behaviour for absent slots", which matches
  the code (background has no service contribution to read).
- *Whether the doctor divergence signal is a warning or an error.* Decided (warning) in risk row 2;
  the harder case — a doctor contribution with no resolvable public export — is decided as an
  **error, not a skipped check** (§3 line 140).
- *Whether a new public manifest field/export might be needed.* Explicitly classified as rescope, not
  an implementation choice (lines 148–150, 234–236).

I found **no open decision that would force rework if deferred and that the plan failed to flag.**
The claim "there are no remaining safe-defer decisions for #1454" survives scrutiny.

---

## Amendment 3 — One canonical permission precedence chain: **ADEQUATE**

Stated once, at plan lines 125–130, under a heading explicitly marked **(LOCKED)**:

```text
explicit appsettings/service cfg.Permissions
  > pluginService.permissions
    > plugin.permissions
      > global defaults
```

The `pluginService.permissions` slot is preserved, matching the required chain exactly.

**I read the whole plan for a second ordering, not just the LOCKED section.** Every other mention of
permission precedence resolves to a *reference* to that chain, never an independent ordering:

- §3 line 122: "every later reference to 'permission precedence' means exactly" — the chain is
  declared canonical up front.
- §3 lines 132–134: manifest permissions become the package default "without displacing either an
  explicit user override or a contribution-specific permission declaration" — consistent.
- §3 line 136: doctor reports "the exact effective set selected by that same precedence" — reference.
- Risk row 2: "preserving that override as highest precedence" — consistent.
- Risk row 4: points at §3 as the single chain.
- **Sequence step 5 (lines 248–250)** — the original defect site — now reads: "Implement the
  canonical §3 chain … explicitly preserving the `pluginService.permissions` slot between explicit
  `cfg.Permissions` and `plugin.permissions`; retain the existing background behaviour for absent
  slots." The elision is repaired in the place it originally occurred.

The one remaining permission-ordering passage is §1 lines 69–72, which describes **current**
behaviour, not intended behaviour, and is correctly labelled as the inconsistency being fixed. It is
imprecise in one respect (see Finding F-3) but it is not a competing prescription.

**No contradicting ordering exists anywhere in the plan.**

---

## Amendment 4 — ARCHETYPE-5 and jsr-audit cited by name and load-bearing: **ADEQUATE**

Both authorities are cited by name (Research baseline lines 21–26; §3 lines 152–158), and both
citations are **load-bearing**, not decorative. Three tests:

**(a) The named gate IDs are real and really required for this archetype.** I read
`.llm/harness/gates/archetype-gate-matrix.md`. For the `Arch 5` column: F-5 Public surface audit
`required`, F-6 JSR publishability gate `required`, F-7 Doc-score gate `required`, F-9 Permission
declaration check `required`; and in "Other Gate Families", Runtime/Aspire validation `required` and
Consumer import validation `required`. The plan's claim that "the composite consumer E2E supplies the
matrix's required runtime and consumer validation" therefore lands on the two rows that are actually
required, and the archetype file is `archetypes/ARCHETYPE-5-plugin.md`. Nothing invented.

**(b) The jsr-audit rubric the plan names exists verbatim.**
`.agents/skills/jsr-audit/SKILL.md:40` — "### The 9 Scoring Factors";
`.agents/skills/jsr-audit/SKILL.md:59` — "## Audit Checklist". The plan cites the rubric by its own
section names and then enumerates the specific dimensions it is claiming zero delta on (export map,
module/symbol documentation, slow types, publish contents, description, runtime compatibility).

**(c) The published-surface claim actually measures against the rubric — and the measurement is
independently true.** The plan asserts a no-delta published surface: no new `PluginManifest` field,
no new permission field, no new workers/streams export, and `RegisteredPluginSource` internal. I
verified each:

- **`RegisteredPluginConfig` is not on the CLI's published surface.** `packages/cli/deno.json`
  exports `.` → `./mod.ts`, `./scaffolding`, `./testing`. Running
  `deno doc --unstable-kv packages/cli/mod.ts packages/cli/testing.ts packages/cli/scaffolding.ts`
  produced 1210 lines of documented surface with **zero** occurrences of `RegisteredPluginConfig`
  (`grep -c` → `0`). The type-breaking migration is therefore genuinely internal, and the
  no-delta claim is verified rather than asserted.
- **Workers already publishes `./doctor` — in the actually published artifact, not just locally.**
  `https://jsr.io/@netscript/plugin-workers/0.0.5_meta.json` returns an export map containing
  `"./doctor": "./doctor.ts"`, and `plugins/workers/deno.json` lists `doctor.ts` in `publish.include`.
  `plugins/workers/doctor.ts` re-exports `workersAdapterPlugin` from `./src/adapter/plugin.ts`, and
  the manifest declares `.withDoctor('./src/adapter/plugin.ts')` at `mod.ts:110` — i.e. a relative
  path that must be normalised to the published `./doctor` subpath, which is precisely what §3
  requires. The plan's design consumes an already-published export instead of adding one.
- **Permissions are already in the published manifests.** `plugins/workers/src/public/mod.ts:26-33`
  declares six flags and `.withPermissions(WORKERS_SERVICE_PERMISSIONS)` at line 61;
  `plugins/streams/src/public/mod.ts:19-26` declares six and `.withPermissions(...)` at line 45.
  `plugin-registry.ts:494-518` already copies `definition.permissions` into the snapshot. The
  "missing truth is lost inside the CLI, not absent from the published packages" framing is correct.

The citation also creates a live obligation rather than decorating the plan: if Phase 2 touches a
plugin public file, the slice **must** run the rubric over the full affected export map with
doc-lint, JSR audit, and publish dry-run evidence, or stop for rescope. That clause changes what the
implementer is permitted to do, which is the definition of load-bearing.

---

## Factual errors found in cycle 1's architectural findings

**None found.** I did not re-derive the architecture, per the brief. In the course of spot-checking
amendment evidence I independently confirmed the load-bearing architectural claims cycle 1 verified —
the source/workdir conflation (`plugin-registry.ts:241`, `273-279`, `354-367`, `390-404`), the
dropped manifest data in the bounded probe (`configured-plugin-manifest-probe.ts:9-16`,
`configured-plugin-manifest-probe-child.ts:30-33`), the false "No plugin permissions declared"
warning (`doctor-plugin-use-case.ts:539-546`), and the published-surface answer — and found no
factual error in any of them.

---

## Findings

### F-1 — non-blocking: the register's reader list omits the single production `rootDir` reader

`doctor-plugin-use-case.ts:564` is the only production dereference of `plugin.rootDir`:

```ts
const moduleUrl = isModuleSpecifier(plugin.doctor)
  ? plugin.doctor
  : toFileUrl(resolve(plugin.rootDir, plugin.doctor)).href;
```

The register's row cites `doctor-plugin-use-case.ts:524-536`, which is `checkWorkdir` — a `workdir`
reader — so line 564 is not cited by line anywhere in the register. Two further fixture files that
construct required-field-shaped configs (`doctor-plugin-invariants_test.ts:192`,
`doctor-plugin-command_test.ts`) are likewise uncited, where only `plugin-registry.test.ts` is named.

**Why non-blocking.** The row says "Direct readers **include**" and assigns exhaustive enumeration to
Slice 1 under a type-check migration gate, which cannot miss a required-to-optional field break. More
importantly this is not a knowledge gap: line 564 is the exact code the `cli-plugin-doctor-published-module`
debt describes, and §3 line 138 plus sequence step 3 both address it explicitly ("normalized to its
already-published, versioned JSR `./doctor` export"; "resolve a package doctor contribution through
its public JSR export"). The consequence of leaving it uncited is only that Slice 1's inventory must
not treat the register's list as complete — which the mitigation already says.

**Consequence if ignored:** Slice 1 could migrate the four `workdir` sites and consider the inventory
done, leaving the `rootDir` dereference to surface as a type error mid-slice rather than as a planned
representation decision. Recommend Slice 1's inventory explicitly capture `doctor-plugin-use-case.ts:564`
and the two doctor test fixtures.

### F-2 — non-blocking: `plugin list` rendering for package-backed plugins is undecided

`list-plugins-command.ts` prints a `Workdir` column unconditionally (`Name\tDisplayName\tType\tEnabled\tWorkdir\t…`).
The plan binds Slice 1 to those exact lines but never states what the column shows once `workdir` is
local-only — the resolved package specifier, a `-`, or the conventional path.

**Consequence if ignored:** a user-visible CLI output shape decided implicitly during implementation.
I confirmed it cannot break the gate — `GATE.SCAFFOLD_PLUGIN_LIST` (`scaffold-gates.ts:100-105`) only
runs `plugin list` and asserts the command result, with no column assertion — so this does not force
rework and is not a missing must-resolve entry. Recommend Slice 1 record the rendering choice
alongside the representation choice.

### F-3 — non-blocking: two small accuracy slips in descriptive prose

Neither touches an amendment; both are stated for the record.

1. **Re-baseline claim is slightly over-broad.** The plan says "`origin/main` has advanced, but the
   intervening changes are unrelated Fresh work; the relevant CLI/plugin files have not moved."
   `git diff --stat 3c9dc1f39...origin/main` over the plugin surface shows six changed files, of
   which `plugins/install/plugin-package-resolver.ts` (+24) and `plugins/install/install-plugin.ts`
   (+9) are *not* Fresh work: `main` added exact-version parsing to JSR plugin package specs
   (`@scope/pkg@version`, semver-validated) and threads `packageSpecifier`/`version` into
   `ensureRootImportsForPluginKind`. That is adjacent to the plan's shared configured-specifier
   classifier and to §4's "exact published JSR package specifiers (or generated bare aliases whose
   resolved targets are asserted to be JSR)" fixture. The drift is **additive and helpful** — it makes
   the fixture easier — and the plan already commits to re-syncing with `main` before draft → ready.
   Crucially, the actual fix surface is untouched on `main`: `plugin-registry.ts`,
   `doctor-plugin-use-case.ts`, `deploy-config-background.ts`, `deploy-config-resolvers.ts`,
   `plugins/workers`, and `plugins/streams` show zero changes since the pinned base.
2. **§1's description of current service resolution** ("service/plugin resolution only consults
   `plugin.service.permissions` and otherwise falls back to global defaults") omits that
   `cfg.Permissions` is consulted first (`deploy-config-resolvers.ts:206-207`). The point being made
   — that plugin-wide manifest permissions are skipped — is correct; the sentence is just incomplete.

### F-4 — non-blocking, process: no `research.md` artifact

Neither `.llm/runs/release-0.0.6-fixes--orchestration/slices/w2-h-1454/` at the pinned head (which
contains only `plan.md`) nor the orchestrator's copy of that directory contains a `research.md`. The
plan carries a `## Research baseline` section instead, which does re-baseline against `main` and is
substantively accurate modulo F-3.1. Plan-Gate box 1 nominally asks for the artifact. I record this
as a process finding rather than a blocker because my assignment was scoped to the four amendments
and the substance the box exists to protect is present in the plan.

I also note, without treating it as a blocker for the same scoping reason, that Plan-Gate box 4 is
the weakest remaining box: §6's seven steps are ordered and well under 30, but per-slice **files** and
**proving gate** are distributed across §1, §4, §5, the risk register's "Owning slice" column, and the
open-decision table rather than tabulated per slice. The mapping is derivable in every case; it is
not tabulated.

---

## What I executed, verbatim

```text
git rev-parse HEAD                                     # ad7574bb70dbba8ad3de28ff699c484fd97583e6
git status --porcelain                                 # empty, before and after
git log --oneline -1 3c9dc1f39                         # fix(release): restore release-cut truth (#1539)
git diff --stat 3c9dc1f39...origin/main -- packages/cli/src/kernel/adapters/config \
    packages/cli/src/public/features/plugins plugins/workers plugins/streams packages/cli/e2e
git diff 3c9dc1f39...origin/main -- .../plugin-package-resolver.ts .../install-plugin.ts
grep -rn "RegisteredPluginConfig" --include=*.ts packages plugins
grep -rn "workdir\|rootDir" --include=*.ts --include=*.tsx packages/cli plugins
grep -rn "\.rootDir" --include=*.ts packages/cli/src plugins
grep -n "workdir\|rootDir\|RegisteredPluginConfig" \
    packages/cli/src/kernel/templates/aspire/helpers/register/generate-register-*.ts
sed -n over every cited range in: resolved-config.ts, plugin-registry.ts, doctor-plugin-use-case.ts,
    deploy-config-background.ts, deploy-config-resolvers.ts, list-plugins-command.ts,
    configured-plugin-manifest-probe.ts, configured-plugin-manifest-probe-child.ts,
    plugins/workers/src/public/mod.ts, plugins/streams/src/public/mod.ts,
    plugins/workers/src/adapter/plugin.ts, plugins/workers/deno.json, plugins/workers/doctor.ts,
    packages/cli/e2e/README.md, capability-suites.ts, true-userland-install-suite.ts,
    prepare-flow-b-fixture.ts, scaffold-gates.ts
deno doc --unstable-kv packages/cli/mod.ts packages/cli/testing.ts packages/cli/scaffolding.ts
    # rc=0, 1210 lines, grep -c "RegisteredPluginConfig" -> 0
curl -s https://jsr.io/@netscript/plugin-workers/0.0.5_meta.json
    # exports include "./doctor": "./doctor.ts"
grep -n "ARCHETYPE-5|F-5|F-6|F-7|F-9" .llm/harness/gates/archetype-gate-matrix.md
grep -rn "Scoring Factor|Audit Checklist" .agents/skills/jsr-audit/SKILL.md
grep -n "cli-plugin-doctor-published-module" -A 6 .llm/harness/debt/arch-debt.md
wc -c on both copies of plan.md                        # 21748 == 21748, identical
```

Everything I asserted above came from that output. No claim in this verdict is relayed from a prior
evaluation cycle.

## What I could NOT verify

- **Runtime behaviour of any kind.** No gate was executed. Per the brief the expensive
  `scaffold.runtime` suite was not run, and neither was `deno task test`, `check`, `lint`, or the
  focused E2E — this is a plan evaluation, and the plan's red → green evidence does not exist yet.
  Whether `behavior.package-backed-plugin-doctor` can actually be made red against the current
  baseline is unproven and is Slice 6's burden, exactly as the plan states.
- **The published streams 0.0.5 manifest permission array as shipped.** I verified the workers
  published export map over the network and both plugins' permission declarations in source at the
  pinned head; I did not fetch and evaluate the published streams manifest's runtime value.
- **Whether the E2E fixture can disable workspace substitution as §4 step 1 requires.** The mechanism
  exists in `prepare-flow-b-fixture.ts`'s published/local split, but I did not prove the new fixture
  can be built that way without the local source root.
- **The `~30–90s warm / ~2min cold` cost estimate** for the new gate. Unverifiable without running it.
- **Cycle 1's verdict text.** It is not in the run directory at either location, so I could not read
  the prior findings directly; my "no factual error found" statement rests on independently
  re-confirming the architectural claims the brief attributes to it, not on reading it.

## Route and independence

Evaluated by **Claude Opus 5, medium effort**, native Anthropic session, **opposite-family** to a
Codex-authored plan. Generator ≠ evaluator and opposite-family review both hold, so this verdict is
authoritative under the harness invariants rather than a degraded stand-in. I was told three prior
attempts produced no verdict and that the temptation to wave the plan through is what this pass exists
to resist; the PASS is grounded in ~30 citation checks resolved to the line, two independent
verifications of the published-surface claim (`deno doc` and the JSR registry), and my own open-decision
sweep — not in the plan's own assurances.

**PASS. Implementation may proceed against this plan, subject to the orchestrator's explicit
authorization, with F-1 folded into Slice 1's caller inventory and F-2 recorded as part of Slice 1's
representation decision.**
