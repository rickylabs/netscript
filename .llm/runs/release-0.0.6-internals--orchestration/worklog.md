# Worklog: 0.0.6 chores/internals lane

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `release-0.0.6-internals--orchestration` |
| Branch | `chore/release-0.0.6-internals-orchestration` |
| Archetype | N/A (repo tooling + doctrine documents; no `packages/**`/`plugins/**` authoring) |
| Scope overlays | none (`SCOPE-docs.md` on PR-C's doctrine half) |

---

## Stage A — Bootstrap (2026-08-12)

### Identity and worktree proof

Executed, not asserted:

```text
$ pwd
/home/codex/repos/netscript-006-internals
$ git rev-parse --abbrev-ref HEAD
chore/release-0.0.6-internals-orchestration
$ git rev-parse --short HEAD
01aa12b67
$ git status --porcelain=v1
(empty)
$ git rev-list --count origin/main..HEAD
0
$ git remote -v
origin  https://github.com/rickylabs/netscript.git (fetch/push)
$ gh auth status
✓ Logged in to github.com account rickylabs; scopes 'read:org', 'repo', 'workflow'
```

The worktree is a dedicated checkout (`git worktree list` confirms
`/home/codex/repos/netscript-006-internals  01aa12b67 [chore/release-0.0.6-internals-orchestration]`),
distinct from the three sibling 0.0.6 lanes (`netscript-006-docs`, `-features`, `-fixes`), all of
which also sit at `01aa12b67`. No sibling lane has created a `0.0.6` run dir yet, so no run-artifact
collision exists.

### Live milestone re-baseline

`gh issue list --milestone 0.0.6 --state all` returned 35 items; the five owned by this lane are all
**OPEN** at read time and all still carry milestone `0.0.6`:

| Issue | State | Labels (as read) |
| --- | --- | --- |
| #1436 | OPEN | `type:fix`, `area:tooling`, `priority:p2` |
| #1415 | OPEN | `type:fix`, `area:tooling`, `status:triage`, `priority:p1` |
| #1403 | OPEN | `type:fix`, `area:tooling`, `status:triage`, `priority:p0`, `area:packages` |
| #1380 | OPEN | `area:docs`, `type:docs`, `area:tooling`, `status:triage`, `priority:p2`, `area:packages` |
| #1378 | OPEN | `area:docs`, `area:tooling`, `type:chore`, `status:triage`, `priority:p1`, `area:packages` |

Every body was read in full, including all acceptance boxes. **Acceptance box inventory** (this is
the denominator the pre-merge gate's check 2 is measured against):

| Issue | Actionable `- [ ]` boxes | Note |
| --- | --- | --- |
| #1436 | **0** | No acceptance section at all — a prose defect report. Its "done" must therefore be defined by this lane and stated in the PR body, since there is no issue checklist for the close-gate to validate. |
| #1415 | 4 | incl. "Proven RED" and "Proven GREEN … with that case in the test fixtures" |
| #1403 | 5 | box 5 forbids fixing surfaced findings in the same PR |
| #1380 | 12 | incl. two `gate:` boxes and two "a test fails if …" boxes |
| #1378 | 9 | incl. one `gate:` box naming `quality:scan:repo` + `arch:check` |

**Mislabelling check** (skill § Reading a milestone into PR clusters — "read each issue's *acceptance*,
not its labels"): #1380 and #1378 both carry `type:docs`/`area:docs` but their acceptance requires
**tooling code** (`check-doctrine.ts` root iteration and A14 predicate; `scan-code-quality.ts` rule
engine). They are therefore **not** docs-lane PRs and are not eligible for the `ci:skip-e2e` docs
lane on the basis of their labels. This is the #1020/#1079 class exactly, caught before dispatch
rather than at merge. No label change is required for correctness, but the PR bodies must not present
these as docs changes.

**Unimplementable-as-scoped check:** none of the 30 boxes is observational ("a follow-up run
shows…"), so none needs routing to a verification issue at this point. #1380's engineering-reference
box is satisfiable as written because it asks for *a dated plan*, not the reference itself.

### Falsified assumption found during the re-baseline

See `drift.md` D-4 and `cut-trace.md` A-1: **#1436's prescribed fix is a no-op.** Executed evidence
in `evidence/probe-1436-baseline.ts`:

```text
"Exact pre-fix #1431 head"      -> [1431]   # the reported defect, reproduced at 01aa12b67
"un-fixed #555"                 -> [555]    # second instance, NOT in the issue
"hotfix #999 landed"            -> []       # issue predicts this breaks; it does not
"prefixes #888 there"           -> []       # ditto
"This is a bugfix #777"         -> []       # ditto
"Closes #1234 and fixes #4321"  -> [1234,4321]
"Refs #111" / "Part of #222"    -> []
"resolves https://github.com/rickylabs/netscript/issues/333" -> [333]
```

The word boundary the issue asks for is already at `acceptance-evidence.ts:43` (landed by #1303), and
`\b` is the *cause*: `-` is a non-word character, so `\bfix\b` matches inside `pre-fix`.

### Opening record

Stage A complete. Run dir `.llm/runs/release-0.0.6-internals--orchestration/` holds
`supervisor.md`, `plan.md`, `worklog.md`, `cut-trace.md`, `drift.md`, `context-pack.md`.
`phase-registry.md` is **not** used: this lane runs one sequential implementation thread, not two or
more concurrent capability-scoped phase groups.

---

## Stage B — Wave plan and dispatch preconditions (2026-08-12)

Wave plan committed as `plan.md`: four leaf PRs (PR-A gate trust; PR-B/C/D quality rail), strictly
sequential, six locked sequencing decisions (S-1…S-6), no canary declared by this lane.

### PLAN-EVAL decision for the wave plan

`milestone-run.md` marks "PLAN-EVAL of the wave plan" **[asserted]** and instructs applying the
standard harness rule until a trace shows otherwise, recording the choice either way.

**Decision: the wave plan itself is not separately PLAN-EVAL'd; the quality-rail plan it contains is.**
Reason: the wave plan's only real decisions are the sequencing locks S-1…S-6, and every one of them is
derived from a constraint written in the issues themselves (#1378 defers root scope to #1380; #1403 is
p0 and smallest; PR-A gates the merges of the rest). The substantive planning risk in this lane is
*inside* the rail — export-reachability strategy, allowance-registry design, rename-vs-deletion
policy — and that is what the single rail PLAN-EVAL evaluates, in a fresh Codex · Sol · high session
(opposite family to this Claude-authored plan). Recorded per `milestone-run.md` line 63.

### Dispatch preconditions — executed checks

`milestone-run.md` stage B requires provider quota and paid-transport verification, with the
**recorded check output** as the proof; a wave dispatched without that record is a did-not-run.

**1. Transport health** — `deno task agentic:runtime doctor` at 2026-08-12T07:44Z:

```text
Agentic runtime doctor: no_change (schema 1.0)
mode: inspect; changed: no
desired state: foundation-desired-1.0
observed state: foundation:4eba78f77027ba3c87123e4a29dabde020a161f44d37524ca8424b1b88060d0d
components: 18; sessions: 0
```

`deno task agentic:runtime status --json` → all 18 components `ready`; `auth`: `claude`
(provider-native) `ready`, `antigravity` (google-sign-in) `ready`; `capabilities`: claude
`available`, codex `available`, antigravity `available`. `worktrees: []`, `sessions: []`,
`checkpoints: []`.

**2. Codex app-server daemon** — `deno task agentic:codex-status` at 2026-08-12T07:44Z:

```text
daemon.status              running
daemon.managedCodexPath    /home/codex/.codex/packages/standalone/current/codex
daemon.managedCodexVersion 0.147.0   (cli 0.147.0, appServer 0.147.0)
daemon.socketPath          /home/codex/.codex/app-server-control/app-server-control.sock
appServerProcesses         3   (anchoredAppServerProcesses 2)
```

The daemon is **managed** (not the orphaned-control-socket state where `managedCodexPath` is absent),
so `agentic:runtime repair codex-remote` is not indicated.

**3. Provider quota / live-turn capability** — five live `gpt-5.6-sol` threads were observed
transacting at read time (four `working`, one `idle` at `turn complete`), with fresh
`lastActivityAt` timestamps inside the same minute and real tool activity
(`command finished`, `exec …`, file writes). A model that is quota-blocked does not produce
`turn complete` and file-write artifacts. This is a **live-call** verification, not a status-panel
read — the recovery-judgement rule from the skill ("treat the provider status panel as stale
afterwards — verify with a real call, not the display").

**4. No rival thread in this lane's surface.** All five Sol threads run with
`cwd=/home/codex/Documents/Codex/2026-08-05-i-have-these-4-sessions-that`; one wrote
`/tmp/ns006-features-orchestrator.md`, i.e. they are the **dispatcher's own** brief-authoring and
watcher sessions for the four 0.0.6 topical lanes, not implementation agents. **Zero** threads carry
a `cwd` under `/home/codex/repos/netscript-006-internals` or any `ns006-*` worktree, so this lane's
"one active thread/worktree" invariant starts satisfied. Ownership was established from the actual
`cwd` field, never by string-matching worktree paths quoted in brief text (skill § Supervision
pitfalls).

One observation worth recording rather than acting on: the idle thread
`019ff4df-d9e0-7a81-843a-068374e24e5a` shows `lastReasoning: "**Refining issue keyword boundary
matching**"` — that is the dispatcher drafting this lane's own brief text about #1436, not a second
agent implementing #1436. Its `cwd` is the dispatcher's conversation dir and it has written no file.
No steering or stop is warranted.

**Verdict: dispatch preconditions GREEN.** Wave 1 may dispatch.

---

## Stage C/D — per-PR dispatch and landing

*(appended per PR as it dispatches, lands, and passes the pre-merge gate)*

### PR-A (#1436 + #1415) — dispatch and slice review

**Dispatch, 2026-08-12T09:51Z.** Launched through `deno task agentic:launch-codex-slice` (never ad-hoc
`wsl.exe`). Mobile-visibility proof, from
`slices/pr-a-1436-1415/codex-thread-ids.md` written by the launcher:

| Field | Value |
| --- | --- |
| Thread id | `019ff4f4-1fce-7253-a7e0-d718c65b39cc` |
| Rollout | `/home/codex/.codex/sessions/2026/08/12/rollout-2026-08-12T09-51-07-019ff4f4-…jsonl` |
| Worktree | `/home/codex/repos/ns006-gatetrust` (no upstream, by design) |
| Branch @ base | `fix/1436-1415-close-gate-trust` @ `c2d8a8e4b` |
| Requested route | openai · gpt-5.6-sol · low |
| Observed route | openai · gpt-5.6-sol · low — **matched** |
| Runtime | approval=never · sandbox=dangerFullAccess |
| Steering | `codex exec resume 019ff4f4-1fce-7253-a7e0-d718c65b39cc -- "<follow-up>"` |

Draft PR **#1527** was opened by the orchestrator before dispatch (labels `type:fix`, `area:tooling`,
`priority:p1`, `ci:skip-e2e`, `ci:skip-scaffold`, `status:impl`; milestone `0.0.6`), so the agent had a
live reviewable surface from its first commit.

**Tooling hazard — see `drift.md` D-9.** The launch was wrapped in a shell `timeout 580`, which fired
and sent SIGTERM (exit 143). This slice's thread happened to survive (confirmed by
`agentic:codex-status` showing it `working` at that `cwd`, and by five subsequent commits), but the
practice is **prohibited**: wrapping an attached launch or resume in a shell `timeout` kills the
attached slice when the timeout expires. Attached launch/resume run unwrapped; bounded observation uses
`agentic:codex-watch --timeout-seconds` instead.

**Slices landed** (`git log --oneline origin/main..HEAD` in the worktree):

```text
c095303c8 fix(validation): reject not-yet-done acceptance evidence
0329acaf8 fix(validation): exclude pull requests from closing issues
4ca4cc421 fix(validation): reject hyphen-prefixed closing keywords
a927790eb test(validation): prove gate-trust contracts red
c2d8a8e4b chore(harness): bootstrap the PR-A gate-trust slice with its executed baseline
```

The RED-first commit (`a927790eb`) is committed as RED, so the record shows the tests failing before
the fixes rather than asserting that they would have.

**Orchestrator slice review — independent re-verification, not a claim relay.** The Tier-A review rule
says a green automated gate is not a sign-off, and #1436 has zero acceptance boxes, so this is the only
verification of its central claim. Re-ran the baseline probe **myself** against the patched parser at
`c095303c8`:

```text
"Exact pre-fix #1431 head" -> []          # was [1431] at 01aa12b67
"un-fixed #555"            -> []          # was [555]
"hotfix #999 landed"       -> []          # unchanged
"prefixes #888 there"      -> []          # unchanged
"This is a bugfix #777"    -> []          # unchanged
"Fixes #1434"              -> [1434]      # real form preserved
"Closes #1234 and fixes #4321" -> [1234,4321]
"resolves https://github.com/rickylabs/netscript/issues/333" -> [333]
"Refs #111" / "Part of #222" -> []
```

Predicate at `acceptance-evidence.ts:45` is `(?<![\w-])(?:close|closes|…|resolved)\s+…` — the locked
shape, not the no-op `\b` the issue prescribed. **#1436's substantive fix is accepted.**

**Findings raised back to the thread** (steered once, on the same thread, no rival send):

1. *Accepted the agent's escalation and amended my own brief* — Gate 1 needed `--allow-write`
   (`drift.md` D-8).
2. *Evidence-integrity defect:* the S2 and S4 PR comments contain the literal text
   `(git rev-parse --short=10 HEAD)` — an unexpanded command substitution — so the commit trail does not
   name the commits carrying the two central fixes. Required a single
   `[EVIDENCE CORRECTION: S2/S4 commit hashes]` comment with the real hashes, no history rewrite. This
   matters more than usual here: with #1436 carrying no acceptance boxes, the PR record *is* the record.
3. Proceed to S5 (acceptance-evidence block for #1415's four boxes, truthful DoD ticks, amended gates),
   with the note that the PR's own evidence must not contain a leading not-yet-done marker — it is the
   first thing the new predicate will judge.

The first steer attempt failed with `thread-store conflict: … already has an active writer`, i.e. the
thread was mid-turn. Correct interception point is the turn boundary, so
`agentic:codex-watch --mode turn --thread-id 019ff4f4-…` is armed in the background and the steer is
delivered on wake. Recorded because "wait for the turn boundary" is cheaper to read than to rediscover.

### Wave 2 — rail plan committed

`plan-quality-rail.md` written with nine locked rail decisions (R-1…R-9), three open decisions, and a
fully executed baseline table. Notable outputs of the re-baseline, all of which change the work:

- `quality:scan:repo` is **RED on `main`** (7 consecutive pushes) → **#1530** filed, inserted as PR-E
  before PR-D (`drift.md` D-5).
- `arch:check:repo` FAIL is **55**, not #1380's 53 — the A14 false-positive population grows with every
  new `@std/testing/bdd` test, which is the argument for fixing the predicate over enumerating residue.
- Five of #1380's six stale verdict rows name directories that **never existed** in this repo, so
  "renamed vs deleted" is a false dichotomy and a rename note would fabricate provenance.
- A cross-lane collision: **#1374** (docs lane, live at `/home/codex/repos/ns006-1374-compilegate`)
  needs the same `docs/site/**` fenced-TS extraction that #1378 needs. Two extractors with different
  fence rules would disagree invisibly. Flagged as a must-resolve-before-PR-D open decision.

---

## Design — quality rail (PR-E → PR-B → PR-C → PR-D)

Written to close `plan-eval.md` finding 5: `plan-gate.md:16-34` requires ordered, file-scoped commit
slices with a gate per slice, and cycle 1 offered four per-PR summary rows instead. Recorded before any
rail implementation file is created, per `run-loop.md` § 3b.

**Aligned to `plan-quality-rail.md` revision 3.** The table below holds **20** slices — E1–E4, B1–B2,
C1–C7, D1–D6, plus B3 — and every row names the files it touches. Cycle 2 finding 5 was correct that a
previous revision claimed 21; the count is stated here so the claim and the table cannot diverge again.
B1/B2 now perform the **single** transition to discovery per `R-6`; there is no interim root list.

### Public Surface

Repo-internal tooling; no `packages/**`/`plugins/**` published surface changes, so no archetype and no
`jsr-audit`.

- `.llm/tools/quality/scan-code-quality.ts` — adds `isTypeFixture(file)`, export-awareness, allowance
  registration, docs-fence intake. Existing exported `QualityRule` union gains members; `QualityFinding`
  gains an origin field.
- `.llm/tools/fitness/check-doctrine.ts` — adds `discoverDoctrineRoots()` and
  `resolveIdentifierOrigin()`; A14 becomes origin-aware.
- `deno.json` tasks — `arch:check` consumes `discoverDoctrineRoots()`; `quality:scan`/`quality:scan:repo`
  gain `--max-allow`.
- `docs/architecture/doctrine/{10-codebase-verdict-and-handoff,06-archetypes}.md`,
  `.llm/harness/debt/arch-debt.md`, `rfcs/README.md` — documents, not code.

### Domain Vocabulary

- **doctrine root** — a top-level `packages/*` or `plugins/*` workspace member that `check-doctrine.ts`
  evaluates as one package. *Not* every `deno.json` workspace member: root `deno.json:3-9` also lists
  `packages/cli/e2e`, `examples/*`, `apps/*`. **Locked:** the selector is expanded top-level
  `packages/*` + `plugins/*` only, and `packages/cli/e2e` is **excluded** with that exclusion stated in
  the doctrine (it is a nested e2e harness, not one of the 36 units #1380 enumerates).
- **identifier origin** — `imported` | `locally-bound` | `unresolved`. A14 fires **only** on
  `unresolved`. Three origins exist live; see `research.md`.
- **type fixture** — a `*_type.ts` file under a `tests/type-fixtures/` directory, whose
  `@ts-expect-error` lines are its assertions.
- **published reachability** — a declaration reachable from a package's `deno.json` `exports` map, as
  answered by `deno doc --json`.
- **registered allowance** — a `// quality-allow:` whose reason contains an open, milestoned `#<n>`.
- **snippet record** — one fenced TS block from `docs/site/**`, owned by #1374's extractor, carrying
  (source file, fence ordinal, start line).

### Ports

- `discoverDoctrineRoots(): string[]` — the single source of truth for doctrine root selection. Exists so
  the task string, `arch:check:repo`, and the coverage test read one function. Introduced in PR-B and
  **expanded** in PR-C; never duplicated into a checked-in list (this replaces the withdrawn R-6).
- `resolveIdentifierOrigin(file, ident)` — lexical import + top-level/local binding collection. No type
  checker; `check-doctrine.ts` stays a line/lexical scanner.
- **#1374's extractor** — consumed, not re-implemented. PR-D imports it; if its surface stays private,
  #1378's docs-fence box is blocked on a follow-up rather than forked (owner-confirmed).

### Constants

- `TYPE_FIXTURE_DIR = 'tests/type-fixtures'`, suffix `_type.ts`.
- `SANCTIONED_BDD_SPECIFIER` — `@std/testing/bdd` (matched by specifier, not by identifier).
- `MAX_ALLOW` — wired at the count **measured in the wiring PR**, not at a literal from an issue body.
  Measured today: 7 default / 10 repo-wide; PR-E lowers repo-wide to 8.

### Commit Slices

Ordered, file-scoped, one gate each. `deno test` roots take
`--allow-read --allow-env --allow-write --allow-run` (established by PR-A's escalation, `drift.md` D-8).

| # | PR | Slice | Files | Gate |
| --- | --- | --- | --- | --- |
| E1 | PR-E | RED fixture: `@ts-expect-error` in a type fixture is reported | `.llm/tools/quality/scan-code-quality_test.ts` | `deno test .llm/tools/quality/` fails |
| E2 | PR-E | `isTypeFixture` exemption (dir + suffix) | `scan-code-quality.ts` | test green; `quality:scan:repo` exit 0 |
| E3 | PR-E | leakage controls: ordinary source, and `_type.ts` outside the dir, stay red | `scan-code-quality_test.ts` | both negatives fail-on-removal |
| E4 | PR-E | drop the two redundant allowances | `desktop-consumer_type.ts`, `sdk-assignability_type.ts` | `quality:scan:repo` `allowCount` 10 → 8 |
| B1 | PR-B | `discoverDoctrineRoots()` returning the **final 36-unit selector** (expanded top-level `packages/*` + `plugins/*`, `packages/cli/e2e` excluded) + coverage test | `.llm/tools/fitness/check-doctrine.ts`, `.llm/tools/fitness/check-doctrine_test.ts` | coverage test fails when a publishable `plugin-*-core` leaves the selector |
| B2 | PR-B | `arch:check` repointed at `discoverDoctrineRoots()` in **one** step — no interim list, no data file | `deno.json:156`, `.llm/tools/fitness/check-doctrine.ts` | `deno task arch:check` exit 0 with `plugin-streams-core` covered |
| B3 | PR-B | run the repaired gate on `plugin-streams-core`; triage output to new issues | triage list in slice dir only | no `packages/**` source edit in the diff |
| C1 | PR-C | `resolveIdentifierOrigin()`; A14 fires only on `unresolved` | `check-doctrine.ts`, `check-doctrine_test.ts` | 3 fixtures: import (quiet), local binding (quiet), bare global (**red**) |
| C2 | PR-C | `arch:check:repo` iterates `discoverDoctrineRoots()`; stops walking `.llm/tmp`, `docs/`, `.llm/tools` | `deno.json:157`, `check-doctrine.ts` | `arch:check:repo` exit 0 or residue enumerated |
| C3 | PR-C | verdict table re-walked to 36 units; per-row git evidence incl. never-present rows | `10-…md` | existence + coverage tests fail on a fabricated row / an ungated unit |
| C4 | PR-C | `06-archetypes.md` synced; doctrine states which units are gated and why `packages/cli/e2e` is not | `06-archetypes.md`, `10-…md` | sync test |
| C5 | PR-C | `arch-debt.md` accepted-red entry closed or dated; dated engineering-reference plan | `arch-debt.md`, `10-…md` | content assertions |
| C6 | PR-C | `rfcs/README.md` records `rfcs/NNNN-*.md` as canonical; 5 `DECISION_PENDING` mapped | `rfcs/README.md`, `arch-debt.md` | mapping present for all five |
| C7 | PR-C | docs correction: `netscript-pr` + close-gate repair hint say "label, then push" | `.agents/skills/netscript-pr/SKILL.md`, `check-close-gate.ts`, mirrored `.claude/skills/` | `agentic:check-claude`; no workflow file touched |
| D1 | PR-D | export-awareness via `deno doc --json`, **fail-closed** on unresolved-type warnings | `scan-code-quality.ts` + test | exported `any` red, local `any` unchanged; re-export attribution fixture |
| D2 | PR-D | registered allowances (open milestoned `#n`) | `scan-code-quality.ts` + test | unlinked allowance red |
| D3 | PR-D | `--max-allow` wired at the measured count | `deno.json:50-51` | overflow red |
| D4 | PR-D | same-PR budget-link control | new check + test | raising the budget without a same-PR issue link is red |
| D5 | PR-D | docs fences via #1374's extractor | `scan-code-quality.ts` | `as any` in a `docs/site/**` fence red; 6 soundness files unchanged |
| D6 | PR-D | type the triggers reference and its executable twin | `docs/site/reference/triggers/index.md:310`, `examples_test.ts:65` | both compile without `any` |

### Deferred Scope

- #1530 box 7 (`code-quality-repo` green on `main`) — **observational**, already carries the
  `[post-merge]` marker in the issue, so it is excluded from the merge gate by the sanctioned mechanism
  and verified by comment after merge. This is a correction to `plan-eval.md` finding 4, which proposed
  routing it to a verification issue; the marker already discharges it.
- PR-D's D5 depends on #1537 landing. If it does not, D5 and #1378 box 3 move with the issue rather than
  being forked or ticked.

### Contributor Path

To add a doctrine-gated unit: create `packages/<name>/` with a `deno.json`; `discoverDoctrineRoots()`
picks it up and `arch:check` gates it with no task edit. To add a quality allowance: append
`// quality-allow: <reason> (#<open issue>)` on the offending line and raise `--max-allow` in the same PR
as the issue link — the budget can only fall otherwise.
