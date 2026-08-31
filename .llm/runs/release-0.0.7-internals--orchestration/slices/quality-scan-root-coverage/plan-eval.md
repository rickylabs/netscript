# PLAN-EVAL — release-0.0.7-internals--orchestration/slices/quality-scan-root-coverage

- Plan evaluator session: `97ef1950-cda3-450e-9451-052a15015b3a` — 2026-08-15
- Run: `release-0.0.7-internals--orchestration/slices/quality-scan-root-coverage`
- Surface / archetype: repository quality-gate root coverage; `6 — CLI / Tooling`
- Scope overlays: `service`, `docs`
- Cycle: **1**
- **Evaluated plan SHA: `da76d9d8440a969f0715ca035ea6304bbf039efd`**

## Evaluator identity and route

| Field | Value |
| --- | --- |
| Session ID | `97ef1950-cda3-450e-9451-052a15015b3a` |
| `bridgeSessionId` | `cse_01BA2jJuyVsFhRJkVKoTMihe` |
| `daemonShort` | `97ef1950` |
| PID | `145718` |
| cwd | `/home/codex/repos/netscript-007-quality-root-coverage` |
| Requested route | native Claude Opus 5, effort `medium`, Remote Control enabled |
| Observed route | `respawnFlags` = `--effort medium --permission-mode bypassPermissions --remote-control --name "NetScript 0.0.7 #1656 PLAN-EVAL cycle 1" --model claude-opus-5` |
| Route match | **matched** — `claude-opus-5` / `medium` / `--remote-control` |
| Family opposition | Claude vs. Codex `gpt-5.6-sol` planner (`context-pack.md:97`) — opposite-family satisfied |
| Session separation | Distinct session from the planner Codex thread `01a003d2-61ee-7ec0-8c74-075b3d631168` |

Observed route read from `~/.claude/jobs/97ef1950/state.json` `respawnFlags`, per the brief, because
a spare-claimed background session's own argv omits `--model`/`--effort`.

## Immutable-target verification (executed)

| Check | Required | Observed | Result |
| --- | --- | --- | --- |
| Local branch head | `f5a726c4f` | `git rev-parse fix/quality-scan-root-coverage` → `f5a726c4f0d0fe69120b30663af251a8875ede9e` | match |
| Remote head | `f5a726c4f` | `git rev-parse origin/fix/quality-scan-root-coverage` → `f5a726c4f0d0fe69120b30663af251a8875ede9e` | match |
| PR #1656 head | `f5a726c4f` | `gh pr view 1656 --json headRefOid` → `f5a726c4f0d0fe69120b30663af251a8875ede9e` | match |
| Immutable base | `473e8d75b` | `git merge-base HEAD origin/main` → `473e8d75b5281c93dc4729d99f3358a34f2bd687` | match |
| Files changed `da76d9d84..f5a726c4f` | only the leaf `drift.md` | `git diff --name-only` → exactly `.llm/runs/release-0.0.7-internals--orchestration/slices/quality-scan-root-coverage/drift.md` (1 file, +44/-8) | **clean** |
| `plan.md` changed in that range | zero bytes | `git diff da76d9d84..f5a726c4f -- <plan.md>` → `0` bytes | **byte-identical** |
| PR metadata | draft, `status:plan-eval`, milestone `0.0.7`, closes #1542 | draft `true`; labels `type:fix`, `area:tooling`, `status:plan-eval`; milestone `0.0.7`; body `Closes #1542` | match |

No supervisor commit altered the plan under evaluation. No refusal condition triggered.

## Checklist results

| Plan-Gate item | Result | Evidence / location |
| --- | --- | --- |
| Research present and current | PASS | `research.md` present; re-baselined at `473e8d75b` (`research.md:7`). Independently re-checked against live `origin/main` = `da574111a`: the only commit landed since base is `da574111a fix(cli): correct generated scaffold output (#1654)`, and `git diff --name-only 473e8d75b..origin/main` filtered to `deno.json`, `.llm/tools/{quality,deps,fitness,gates}`, and `code-quality` returns **zero** files. No re-baseline debt. Drift entry at `drift.md:19-32` correctly retires the stale `#1405` claim that `arch:check` hand-maintains a root list omitting `packages/plugin-streams-core`. |
| Decisions locked | PASS | D1–D9 (`plan.md:50-58`), each with rationale. Every load-bearing factual premise re-derived below. |
| Open-decision sweep | PASS | Five rows (`plan.md:62-68`); two resolved now, three deferred. Evaluator-run sweep below finds none that force rework. |
| Commit slices (< 30, gate + files each) | PASS | S1/S2/S3 (`plan.md:72-103`) — 3 slices, ordered, each naming files, what it proves, and the proving gate. S1 states a red proof before a green proof. |
| Risk register | PASS | Eight rows with mitigations (`plan.md:154-162`). One unlisted risk recorded as advisory finding A below — it does not defeat an acceptance criterion or force design rework. |
| Gate set selected | PASS | Validation table (`plan.md:111-119`) covers all six frozen contract proving gates plus scoped wrappers. All named gates verified present in `.llm/tools/gates/catalog.ts:28-66`. Cost boundary honored (`plan.md:121`). |
| Deferred scope explicit | PASS | Six bullets (`plan.md:165-172`), each traceable to a research finding or the frozen contract. |
| jsr-audit surface scan (pkg/plugin) | PASS | `plan.md:123-137` + `research.md:122-135`. Applicable, empty touched-member denominator declared explicitly with a rescope tripwire — not silently converted to a no-op. Detail at item 6 below. |

## Independently derived facts

Everything below was executed in this worktree at the evaluated tree; the plan's numbers were not
taken on trust.

### 1. The 35/37 census — plan claim confirmed exactly

Executed `discoverWorkspaceMembers(Deno.cwd())` from `.llm/tools/deps/workspace.ts`:

```
TOTAL MEMBERS: 37
under packages/|plugins/: 37
publishable: 35
NON-publishable: [ "packages/bench", "packages/cli/e2e" ]
OUTSIDE packages/|plugins/: []
pkgs: 29   plugins: 6
```

Every element of the claim holds: 37 members, 35 publishable, 29 + 6, all under
`packages/**`/`plugins/**`, non-published exactly `packages/bench` and `packages/cli/e2e`.

**Is `publish !== false` the right publishability predicate?** Yes. Verified at
`.llm/tools/deps/workspace.ts:139`. It is the same authority the release/JSR lane already uses, so
the coverage denominator and the publish denominator cannot drift apart by construction — which is
the whole point of D1/A7. A bespoke predicate would reintroduce exactly the two-authority divergence
this issue exists to close. Default-publishable (absent key ⇒ publishable) is also the fail-safe
direction: a new member that forgets to declare `publish` is *included* in the gate denominator
rather than silently dropped.

**Is the 35-vs-36 reconciliation sound?** Yes, and it is a real reconciliation, not a rounding
story. Executed `discoverDoctrineRoots()`:

```
doctrine roots: 36
published members NOT covered by doctrine roots: []
doctrine roots that are not publishable members: [ "packages/bench" ]
```

The two sets differ by exactly one element, and in the safe direction: doctrine is a strict superset
(35 ⊂ 36), the extra unit being non-published `packages/bench`. D4's assertion — published members ⊆
doctrine roots — is therefore satisfiable today without touching doctrine discovery, and preserves
the documented 36-unit contract (`check-doctrine_test.ts` requires exactly 36) unchanged. The
open-decision row at `plan.md:65` resolving "Bench stays a doctrine root: yes" is the correct call;
the alternative (shrinking doctrine to 35) would delete real coverage to make two numbers match.

### 2. Current gap and task-root parsing — confirmed

Applying D3's equal-or-ancestor rule to the live task strings:

```
quality:scan       roots=[packages/cli/src, plugins, docs/site]                      uncovered=29
quality:scan:repo  roots=[packages, plugins, .llm/tools/fitness, .llm/tools/quality, docs/site]  uncovered=0
```

Confirms `research.md:55-67` (29 uncovered packages, 6 covered plugins) and F1. D3's ancestry
direction is the correct semantics: `packages/cli/src` is a *descendant* of the published member
`packages/cli` and leaves that member's `mod.ts`, bin entry, and config outside the scan, so counting
it as coverage is precisely the false-green this issue reports.

**Parsing soundness.** The plan's parse target is the `--root` tokens in the `deno.json` task
strings. This is the same extraction the scanner itself performs
(`scan-code-quality.ts:1030`), so checker and scanner read the flag identically. D8 makes
missing/malformed/empty root sets a hard nonzero exit, which is the correct fail-closed direction and
is fixtured per the first risk row (`plan.md:155`).

**Runtime divergence risk — see advisory finding A.** The parse is sound against the configuration,
but there is one live path where configured roots are *not* what the scanner process operates on.

### 3. Broad-root future proofing vs. acceptance criterion 2 — satisfied

Criterion 2 reads, verbatim from live issue #1542: *"A test or gate fails when a published package is
absent from the configured roots, **so a newly added package cannot silently escape the scan**."*

Judged against both halves:

- **The failing gate exists and is non-vacuous where it must be.** S1's red proof
  (`plan.md:78-80`) fixtures a publishable `packages/missing` against a configured `packages/covered`
  and requires `ok:false`, the member named, and a nonzero exit. That tests the predicate itself, so
  the mechanism is proven independently of today's repository state. The `packages/cli/src`
  descendant fixture (`plan.md:156`) proves the pseudo-coverage case that caused this bug.
- **The live invariant is regression armor, not decoration.** D5 wires the checker into both scan
  tasks ahead of the scanner, so any future narrowing of `deno.json` roots — the exact edit that
  created this defect — fails closed at gate time rather than silently.
- **The purpose clause is met by construction.** With broad `packages`/`plugins` roots, a newly added
  member under either parent is scanned automatically, so it *cannot* silently escape. The criterion's
  stated goal is that escape be impossible, not that a gate fire.

So the honest characterization is: after D6 the live assertion is unfalsifiable *for new
packages/plugins members* — but that is the criterion being satisfied, not evaded, because the
denominator is derived from the live workspace rather than hand-maintained. This is strictly stronger
than the one-time list edit that would also satisfy criteria 1 and 3. The residual unproven case is
recorded as advisory finding B.

### 4. The three-path boundary — coherent

The frozen contract's outer bound is ten surfaces
(`netscript-007-internals/.llm/runs/release-0.0.7-internals--orchestration/context-pack.md:104-112`);
the plan narrows to three (`plan.md:35-44`) and forbids the rest pending rescope. Sufficiency per
criterion:

- **Criterion 1** (roots cover every published member, or exclusions are named): met by the `deno.json`
  edit plus the checker's `excludedMembers` naming `packages/bench` and `packages/cli/e2e` with their
  `publish:false` reason.
- **Criterion 2**: met by `check-root-coverage_test.ts` + the task binding, per item 3.
- **Criterion 3** (`quality:gate` reports roots scanned): met by the scanner's existing `scanned`
  field (verified emitted at `scan-code-quality.ts:1043`) plus the checker's `configuredRoots`, both
  streamed by `quality:gate` = `quality:scan && arch:check` (`deno.json:52`).

**Is asserting doctrine coverage while refusing to edit `check-doctrine.ts` coherent?** Yes, and I
verified it empirically rather than by inspection: my own evaluation script imported
`discoverDoctrineRoots` from `.llm/tools/fitness/check-doctrine.ts` and executed it read-only with no
`import.meta.main` side effect. The function is already exported, already dynamic, and already
tested. The plan consumes doctrine discovery as an authority and asserts a subset relation against
it; it does not need to change how doctrine discovers. Editing `check-doctrine.ts` would be the
incoherent move — it would make one checker both the authority and its own auditor, collapsing the
two independent censuses whose disagreement is the thing being detected (risk row
`plan.md:157`).

### 5. Fail-closed structured JSON — adequate

D8 (`plan.md:57`) requires nonzero exit on empty denominator, malformed/missing task roots, or any
uncovered member, with structured JSON on both pass and fail. The locked field set
(`plan.md:64`) — `ok`, `publishedMembers`, `excludedMembers`, per-gate `configuredRoots` /
`uncoveredMembers`, all path arrays lexically sorted — is adequate as receipt evidence:

- `ok` gives a machine verdict; lexical sort makes receipts byte-stable across runs and machines,
  which is what `run-gate.ts` receipts require to be comparable.
- `publishedMembers` publishes the **denominator**, so a receipt proves what the gate measured, not
  merely that it was green. This is the direct answer to the issue's core complaint ("a green gate is
  not proof they were scanned").
- `excludedMembers` discharges criterion 1's "or each deliberate exclusion is named".
- Per-gate `configuredRoots`/`uncoveredMembers` covers both scan tasks and the doctrine gate.

Empty denominator as exit-1 is the load-bearing clause: without it, a discovery regression returning
zero members would read as "nothing uncovered" and be the most dangerous possible false green.

One internal-consistency note checked and cleared: D8's phrase "any uncovered published member" does
not itself name the doctrine gate, but D4 (`plan.md:53`), the risk register (`plan.md:157`, "fail when
any published member is absent from doctrine roots"), and S2's proof (`plan.md:91-92`, "zero
uncovered members for both tasks and doctrine") all state it explicitly. Three consistent statements;
no ambiguity that would survive into implementation.

### 6. JSR empty-touched-member behavior — handled honestly

The frozen contract marks JSR audit applicable. The plan does **not** silently downgrade it:

- `plan.md:127-128` requires deriving changed paths from Git at each slice and the final head, and
  **stopping to rescope** if any `packages/**`/`plugins/**` member enters the diff.
- `plan.md:129-130` requires recording the per-member export/pin denominator as explicitly empty
  "rather than claiming package audits ran" — the exact distinction between an honest vacuous result
  and a no-op.
- `plan.md:131-132` keeps the canonical workspace `publish-dry-run` as a real, non-vacuous regression
  gate that still runs.
- `plan.md:133-136` retains the contract's runtime-asset / `import.meta` rejection as a diff review
  with a stated invalidation condition.

All four elements of the contract's JSR line are addressed. The audit is bounded, not skipped, and
the tripwire makes the bound self-invalidating if wrong.

### 7. Cost — within bounds

The contract's six proving gates are `check`, `test`, `publish-dry-run`, `quality-job`,
`docs-source-format`, `docs-accuracy`. All six appear in the validation table (`plan.md:111-119`,
rows 5–7) and in S3 (`plan.md:97-99`). All are allowlisted: `catalog.ts:30` (`check`), `:35` (`test`),
`:66` (`publish-dry-run`), `:29` (`quality-job`), `:56` (`docs-source-format`), `:59`
(`docs-accuracy`), plus `:34` (`quality-gate`), `:36/:37` (both scans), `:38` (`arch-check`).

Honesty about what each proves: row 3 separates coverage JSON from scanner compliance JSON; row 4
separates the 35-in-36 assertion from the composite exit code; `plan.md:160` states plainly that
"coverage proves execution, not compliance or debt closure". That is the correct claim boundary and
directly avoids the failure mode the issue describes.

No Aspire, Docker, `e2e:cli`, `scaffold.runtime`, runtime smoke, publish, or release cut is planned
(`plan.md:121`), matching the contract's "Not this leaf's to take" line. `plan.md:162` forbids
dependency commands and rejects `deno.lock` churn. No expensive-gate lease is smuggled in.

### 8. The supervisor corrections — both consistent, neither masking a defect

**Correction 1 — evaluator route.** `plan.md:180-181` nominates "a fresh native opposite-family Fable
5 medium session". Nominating a route is the coordinator's call, not the planner's
(`netscript-007-internals/...context-pack.md:123-126`: "Bind the route from `dispatch.json`, not from
the plan's prose"). The overreach was procedural. It masked no planning defect: the *substantive*
rationale offered for requiring PLAN-EVAL — denominator and ancestry semantics, the 35-vs-36
reconciliation, preserving the CLI E2E exclusion — is independently real, as items 1–4 above
establish by execution. An amendment was subsequently granted on that same rationale
(`drift.md:34-43`), attempted, and superseded for execution only (`drift.md:53-59`). Because `plan.md`
is the frozen evaluation target, correcting it via append-only `drift.md` rather than by amending the
evaluated SHA is the correct harness mechanism.

**D-1 accuracy — verified against the primary source, not the record.** Read
`~/.claude/jobs/fdfe4f7c/state.json` directly:

```
state       = 'failed'
detail      = "There's an issue with the selected model (fable-5). It may not exist or you may not have access to it. …"
tokens      = None
cliVersion  = None
sessionId   = 'fdfe4f7c-f2a7-4ed1-b605-3d28c59fac7a'
bridgeSessionId = 'cse_01DuK4jWPPEMMQmgLnqpknDA'
cwd         = '/home/codex/repos/netscript-007-quality-root-coverage'
respawnFlags= ['--effort','medium','--permission-mode','bypassPermissions','--remote-control','--name','NetScript 0.0.7 #1656 PLAN-EVAL','--model','fable-5']
```

Every field asserted in `drift.md:47` matches the source exactly: session ID, bridge ID, cwd, the
verbatim error, the requested route, and `tokens: null` / `cliVersion: null`. `tokens: null` with
`cliVersion: null` is genuine proof of failure **before inference** — no CLI ever reported a version
and no token was billed — so "zero tokens, no inference, no verdict, no artifact, no PR comment, no
repository mutation" is accurate. I independently confirm the no-mutation half: the only commits
between the plan head and the current head are the two bookkeeping commits touching `drift.md`, and
no `plan-eval.md` existed before this one. The classification as **transport/model-unavailable drift,
not a PLAN-EVAL cycle**, is correct — a gate cycle requires a verdict, and none was produced. The
record neither overstates nor understates: it does not claim the plan was reviewed, and it does not
inflate a transport failure into a substantive objection. **This pass is cycle 1**; the two-failure
loop counter is untouched.

**Correction 2 — label lag.** PR #1656 had posted RESEARCH and PLAN comments while still at
`status:research` (flagged at `...internals/...context-pack.md:127-129`). Live state now reads
`['type:fix','area:tooling','status:plan-eval']` — exactly one `status:` label, correct phase,
milestone `0.0.7`, draft, `Closes #1542`. Both structured comments are present and attributed. The
lag was bookkeeping only; the PLAN comment's content matches `plan.md` and no substantive gap was
concealed by it.

## Open-decision sweep (evaluator-run)

None that would force rework if deferred. Checked each of the three deferrals for rework pressure:

- *CLI E2E publishability / doctrine-root status* — inert either way. The checker reports it as a
  named `publish:false` exclusion under both outcomes; a later decision to publish it would add a
  member to the denominator that broad roots already cover.
- *Scanner duplicate diagnostics* (#1653 low) — detection-rule internals, outside the three-path
  surface, no interaction with root selection.
- *Scanner unknown-flag rejection* (#1653 low) — D9 (`plan.md:58`) forecloses the coupling by adding
  no scanner flag. Confirmed against `scan-code-quality.ts:1025-1034`: the plan introduces no new
  parsed token, so the pre-existing weakness is neither deepened nor inherited.

No additional open decision surfaced during independent derivation.

## Verdict

`PASS`

Implementation may begin. All eight Plan-Gate boxes are checked, every load-bearing factual premise
was re-derived by execution rather than accepted from the plan, and the immutable target verified
clean.

## Advisory findings (non-blocking — carry into implementation and IMPL-EVAL)

Neither finding unchecks a Plan-Gate box, defeats an acceptance criterion, or requires a plan
revision. Both are recorded so IMPL-EVAL can check them against real code.

**A. Configured roots and scanned paths diverge in the blocking PR gate; the risk register does not
name this path.**

- Observed: `scan-code-quality.ts:1035-1036` —
  `mode = changed.length > 0 ? 'changed-files' : 'repository'` and
  `scanned = changed.length > 0 ? changed : roots.length > 0 ? roots : DEFAULT_ROOTS`.
- Observed: `.github/workflows/code-quality.yml:47-55` — the **blocking** PR job invokes gate
  `quality-scan` (= `deno task quality:scan`, `catalog.ts:36`) with `--changed-file` arguments
  appended.
- Consequence: on every PR run, the configured `--root` values are ignored entirely and `scanned` is
  the changed-file list. The checker's `configuredRoots` will therefore report roots that the scanner
  in that same job did not traverse.
- Why non-blocking: D5 places the checker **before** the scanner in the task chain, and `deno task`
  appends trailing arguments to the last command in an `&&` chain, so the checker still executes and
  still fails closed in changed-files mode. The coverage invariant holds on both paths. Criterion 3
  is scoped to `quality:gate`, which runs without `--changed-file` and does emit configured roots.
- Gap in the plan: `research.md:71-80` cites lines 1025-1037 but describes only the roots branch and
  never mentions `--changed-file` or `mode`; `research.md:104-106` notes the PR workflow "scans
  changed files" without connecting the two. The risk register's first row (`plan.md:155`) covers
  malformed/empty parsing but not this divergence.
- Requested at implementation: verify that the checker actually runs when `--changed-file` arguments
  are appended (this is an argument-forwarding assumption, and it should be asserted, not assumed),
  and ensure the checker's JSON cannot be read as a claim that the scanner traversed
  `configuredRoots` in that run. IMPL-EVAL should confirm both.

**B. Publishable members outside `packages/**`/`plugins/**` are filtered out of the denominator
before the coverage check, and this is not listed as a deferral.**

- Observed: `deno.json:3-9` declares workspace patterns `packages/*`, `packages/cli/e2e`, `plugins/*`,
  **`examples/*`**, and **`apps/*`**. D2 (`plan.md:51`) restricts the denominator to members under
  `packages/**`/`plugins/**`.
- Today this filter is a no-op: my census returned `OUTSIDE packages/|plugins/: []` — both
  `examples/` and `apps/` are currently empty, so `discoverWorkspaceMembers()` yields no such member.
- Residual: a future publishable member declared under `examples/*` or `apps/*` would be dropped from
  the denominator silently, and `ok:true` would be reported while that member sat outside every
  configured root — the same shape as the defect #1542 reports, one directory up.
- Why non-blocking: D2 is faithful to the acceptance criterion, which scopes itself to "every
  published workspace package **under `packages/**` and `plugins/**`**". Closing the wider case is
  outside this issue's contract and would be scope expansion.
- Requested at implementation: state the packages/plugins restriction as an explicit, named exclusion
  in the checker's output or a comment, so the boundary is discoverable rather than implicit. If
  cheap, emitting the count of workspace members excluded by the parent-directory filter would make a
  future `examples/*` member visible instead of silent.

## Notes

- **Evidence limitation, disclosed.** No `leaf-contracts.json` exists in this worktree, in any sibling
  worktree under `/home/codex/repos`, or in any tracked JSON (`find`/`grep` both empty). The central
  leaf contract for `quality-scan-root-coverage` was read instead from its authoritative equivalent,
  the topic supervisor's frozen-contract block at
  `/home/codex/repos/netscript-007-internals/.llm/runs/release-0.0.7-internals--orchestration/context-pack.md:104-114`,
  read-only. Its ten surfaces and six proving gates are what items 4 and 7 were judged against. No
  central cluster state was mutated.
- Every plan number checked independently reproduced exactly: 37/35, 29+6, `packages/bench` +
  `packages/cli/e2e`, 36 doctrine roots, 35 ⊂ 36 with `packages/bench` the sole extra, 29 uncovered
  under `quality:scan`, 0 under `quality:scan:repo`. No overstatement found in `plan.md`,
  `research.md`, or `context-pack.md`.
- Verified `--max-allow 7` is currently 7 in both scan tasks (`deno.json:50-51`), so S2's
  "preserves `--max-allow 7` byte-for-byte" is checkable at implementation.
- After D6, `quality:scan` roots (`packages`, `plugins`, `docs/site`) become a strict subset of
  `quality:scan:repo` roots, which additionally carry `.llm/tools/fitness` and `.llm/tools/quality`.
  The new checker therefore lands under a root the repo scan already covers, so it is subject to the
  same quality rules it enforces.
- `.github/scripts/ci-receipt-policy.test.ts:50` asserts workflow text about `quality:scan:repo`; the
  plan touches no workflow, so that policy test is unaffected.
- Gates fired by this evaluation: none. PLAN-EVAL is read-only analysis; no Aspire, Docker, `e2e:cli`,
  `scaffold.runtime`, or global expensive gate was run, no label changed, no issue mutated, no agent
  launched. Scratch scripts were written to `.llm/tmp/` and are not committed.
