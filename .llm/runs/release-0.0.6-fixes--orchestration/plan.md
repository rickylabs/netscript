# Wave plan — 0.0.6 fixes lane

Intent record. `cut-trace.md` is the record of what actually happened; neither is rewritten to
match the other.

## PR clusters

Clustered by **shared file surface + shared acceptance**, then checked both ways per the
`agent-milestone-orchestrator` too-big / mislabelled / unimplementable tests.

### PR A — release tooling truth (`#1438` + `#1430`)

| | |
| --- | --- |
| Surface | `.llm/tools/release/github-release.ts` (both issues, one file) |
| Branch | `fix/1438-release-cut-canary-pair-inheritance` |
| Lane | `normal_implementation` — Codex · Sol · **medium** |
| IMPL-EVAL | **Required**, focused, separate session (Fable 5 · medium) |
| Closes | `Closes #1438`, `Closes #1430` |

**#1438** — `isVersionOnlyReleaseDiff` (line ~132) allows only `deno.json` manifests, but a real
`release:cut` writes 62 files (38 manifests **plus** `deno.lock`, `.llm/assets/agent-docs/*`,
`*.generated.ts` barrels, six `plugins/*/scaffold.plugin.json` pins). The documented inheritance
path is therefore dead code and 0.0.5 paid an extra canary cycle for it. Fix: derive the allowed
set from the **same code that writes the bump**, so generator and verifier cannot disagree by
construction. `isExactVersionReplacement` (line ~151) is the per-file byte check that keeps a
widened path set honest — it must stay in force.

**#1430** — at line ~522, `--prev-tag` sets `since: ''`, which is falsy, so `fetchClosedIssues` is
never called and the closed-issues list is silently always empty. Fix: resolve the tag's release
(or tag commit) date into `since`, and make "previous tag known but `since` empty" a loud failure
rather than a plausible zero.

*Clustering justification:* one file, one contract family (release-notes/identity truth), and the
two edits are in disjoint functions. Splitting would force a rebase of the second PR onto the first
for no reviewer benefit. Not "too big": neither issue touches framework source.

### PR B — publish dry-run tree integrity (`#1417`)

| | |
| --- | --- |
| Surface | `.llm/tools/release/run-publish-dry-run.ts` + root `publish:dry-run` task |
| Branch | `fix/1417-publish-dry-run-no-mutation` |
| Lane | `normal_implementation` — Codex · Sol · **medium** (approach choice is real) |
| IMPL-EVAL | **Required**, focused, separate session (Fable 5 · medium) |
| Closes | `Closes #1417` |

Root `deno task publish:dry-run` exits 0 while rewriting 18–19 manifests, expanding `catalog:` to
pinned `npm:` specifiers and opting those packages out of central version control. The issue ranks
three approaches (throwaway copy **preferred**, snapshot/restore, fail-loud). Five acceptance boxes,
including a proven clean-tree assertion and a regression check.

*Kept separate from PR A* despite both being "release tooling": different file, different failure
class, and both are p1 — pairing them would put two release-critical changes behind one review.

### PR C — E2E gate-set truth (`#1397` then `#1399`)

| | |
| --- | --- |
| Surface | `packages/cli/e2e/` — `suites/scaffold/capability-suites.ts`, `src/domain/`, `tests/presentation/suite-registry_test.ts` |
| Branch | `fix/1397-1399-e2e-gate-set-truth` |
| Lane | `light_implementation` — Codex · Sol · **low** |
| IMPL-EVAL | Owner-waiver candidate, conditional on strong negative tests |
| Closes | `Closes #1397`, `Closes #1399` |

**#1397** (first) — `GATE.BEHAVIOR_SERVICE_HEALTH` sits in `POSTGRES_ONLY_RUNTIME_GATES`
(`capability-suites.ts:155-161`), so `runtimeGateIds` (line ~299) drops it for mysql/mssql while the
aggregate still reports green. Four acceptance boxes; the postgres set must be unchanged.

**#1399** (second, depends on #1397's final gate sets) — only the two runtime tiers pin their
deferred-gate set in `suite-registry_test.ts`; a deferral added to any other suite fails no test.
Four acceptance boxes; every suite pinned, empty set pinned explicitly, each deferral naming its
owning issue.

*Owner-given ordering.* Same worktree, two commits, #1397 first so #1399's pins are written against
the corrected sets rather than against sets that change under them.

### PR D — DB-backed island emitted-import guard (`#1428`)

| | |
| --- | --- |
| Surface | `packages/cli/src/public/features/root/public-command-tree_test.ts` |
| Branch | `fix/1428-db-island-emitted-imports` |
| Lane | `light_implementation` — Codex · Sol · **low** |
| IMPL-EVAL | Owner-waiver candidate, conditional on strong negative tests |
| Closes | `Closes #1428` |

The fixture scaffolds `--db none` (lines 166-167), emitting only the memory island, so a broken
specifier in `ServiceShowcaseLab.tsx.template` leaves the suite green. Also: the guard's regex only
matches `./` and `../` forms, so a broken non-relative specifier evades it.

*Independent:* different source tree from PR C (`packages/cli/src/**` vs `packages/cli/e2e/**`), so
C and D can run concurrently without conflict.

## Wave sequence

Waves are **dispatch** units and are kept small — a wide fan-out is what froze the host in 0.0.4.

| Wave | PRs | Concurrency | Rationale |
| --- | --- | --- | --- |
| **1** | A (#1438+#1430), B (#1417) | 2 Codex slices | The two release blockers, per the owner's priority. Disjoint files, no shared surface. |
| **2** | C (#1397+#1399), D (#1428) | 2 Codex slices | CLI/E2E truth. Disjoint trees. Dispatched at the wave-1 boundary. |

No dependency runs *inside* a wave; the only ordering constraint (#1397 → #1399) is internal to
PR C and is expressed as commit order, not as a wave edge.

## Canary points

**None declared by this lane.** Root owns canary cadence and the stable cut (`supervisor.md`
§ Scope). This lane's obligation is to preserve canary evidence, immutable versions, and lock
hygiene so that root's cadence is not corrupted — and to report each landing immediately so root
can compute payload from merge history.

## Pre-merge gate

`milestone-run.md`'s seven-check gate, run per PR, recorded per PR in `worklog.md`. Two checks are
load-bearing for this lane in particular:

- **Check 4 (named expensive gates report SUCCESS, not SKIPPED)** — this lane's entire subject
  matter *is* the did-not-run failure class. A gate record for PR C or D that cannot distinguish
  pass from did-not-run is self-refuting.
- **Check 3 (no new `deno-lint-ignore` / `as unknown as` / `@ts-ignore`, excluding `.llm/runs/**`)**
  — PR C and D add test machinery, the usual site for these.

Serialisation: any slice needing `scaffold.runtime` waits for exclusive use. No two runs concurrent.

## Dispatch preconditions (stage B)

Recorded in `worklog.md` before wave 1 dispatch — quota and paid-transport verification are
procedural gates whose proof is the recorded check output, not a claim.

---

# Scope extension — wave 3 / wave 4 (owner triage, 2026-08-12)

Milestone triage added **#1540, #1456, #1460, #1454** to 0.0.6 and assigned them to this lane, in
that priority order, to start **after #1539 lands**. This is a definition-of-done move recorded as
an explicit checkpoint (`milestone-run.md` cut-time item 3), not absorbed silently. The original
six-issue scope and its wave plan above are **not rewritten**; this section extends them.

Lane scope: **6 → 10 issues.**

## Live re-baseline

| Issue | Priority | Labels | Acceptance boxes | Surface |
| --- | --- | --- | --- | --- |
| #1540 | p2 | `type:fix,area:tooling,area:release` | **4** | `.llm/tools/release/publish-workspace.ts` |
| #1456 | p1 | `type:fix,area:cli` | **0** | CLI plugin-install JSR spec resolver |
| #1460 | p1 | `type:fix,area:cli,area:agentic` | **5** | `netscript agent init` generated MCP config |
| #1454 | p1 | `type:fix,area:plugins,area:tooling` | **0** | plugin doctor package-backed detection + scaffold E2E |

Two carry no checkboxes (#1456, #1454), so — per this run's corrected finding — their close-gate
signal reduces to the PR-body checklist with no issue-side cross-check, and pre-merge checks 5 and 7
carry the weight. Their briefs must state acceptance explicitly in the PR body.

**#1540 is this lane's own filing.** It came out of the #1417 IMPL-EVAL as a non-blocking,
out-of-scope finding and was routed to `Backlog / Triage` rather than ticked; triage has now
promoted it into the milestone. That round trip is the #1090 pattern working as intended.

## PR clusters — four separate connected groups

Clustered per the owner's instruction. Each is a single connected concern; none is bundled for
convenience.

### PR E — interrupted publish/preflight tree safety (#1540)

Branch `fix/1540-publish-interrupt-tree-safety`. **Directly continues PR B (#1417)**, same file,
same mechanism: #1417 removed the *routine* path to an expanded-`catalog:` tree; this closes the
*interrupted* path. The `finally` restores only on normal completion, so a hard kill, CI timeout, or
runner eviction still strands ~19 manifests opted out of central version control.

Acceptance box 2 demands the interruption be **executed**, not reasoned about — kill the process
between materialization and restore, then assert a clean tree and an intact `catalog:` sentinel.
That is the deliverable.

### PR F — exact canary plugin install (#1456)

Branch `fix/1456-plugin-install-exact-jsr-version`. `--jsr-url` rejects both exact JSR spellings
(`jsr:@scope/pkg@version` and `@scope/pkg@version`), and the accepted unversioned form silently
resolves the registry's stable `latest` — `0.0.5` where `0.0.6-canary.1` was requested.

This is a **release-verification blocker in disguise**: it prevents a consumer from validating a
coordinated canary without silently mixing plugin generations, which is exactly what the canary
process exists to prove.

### PR G — agent-init MCP lock neutrality (#1460)

Branch `fix/1460-agent-init-mcp-lock-neutrality`. Merely starting the generated MCP server mutates
the consumer's `deno.lock` (+87/−5 observed), so a read-only evaluation session dirties an
application worktree and can contaminate a migration PR. The consumer proved a workaround
(`--no-lock --minimum-dependency-age=0`); the fix is to make the generated config do that by
construction. **The CLI is tooling, not a workspace dependency.**

Same failure family as #1417/#1540 — a read-only-sounding operation mutating a tree — now on the
consumer side.

### PR H — package-backed plugin doctor truth (#1454)

Branch `fix/1454-plugin-doctor-package-backed`. Doctor conflates in-process package installs with
local plugin workdirs, so consumers are pushed to create **fake `workers/` / `streams/`
directories** and duplicate framework permission metadata to satisfy diagnostics. Acceptance
requires a **scaffold E2E** over published workers + streams packages, generated registries,
permission metadata, and doctor output/exit code.

Kept separate from PR F despite both being plugin-subsystem: F is the install resolver, H is
diagnostics plus a new expensive E2E over framework code. Bundling them would put the release's
plugin-critical path behind one review — the "too big" test.

## Wave sequence

| Wave | PRs | Rationale |
| --- | --- | --- |
| **3** | E (#1540), F (#1456) | Owner's top two. Disjoint surfaces — release tooling vs CLI resolver. |
| **4** | G (#1460), H (#1454) | Disjoint — agent-init template vs plugin doctor. H holds the serialized `scaffold.runtime`-class gate. |

Dispatch begins **only after #1539 lands**, per the owner instruction.

## Two binding changes from waves 1–2

1. **Branch from current `main`, never from the old baseline.** #1539's `dispatch` failure was
   caused by a base SHA predating the trusted evaluator prompt. Every wave-3/4 branch is cut from
   `main` at dispatch time so the automatic evaluator can resolve its prompt.
2. **Automatic evaluation only — no locally spawned evaluators.** Per owner policy (2026-08-12):
   initial IMPL-EVAL triggers on **draft → ready** (escape hatch `impl-eval:skip`); rerun only by
   moving away from and re-adding `status:impl-eval`; PLAN-EVAL by the `openhands` +
   `status:plan-eval` pair; `eval:model:minimax|deepseek|qwen` is one-shot. **Never manually
   dispatch OpenHands, and never duplicate a running evaluation.** Waves 1–2 used local Fable 5
   sessions because that transport did not exist yet; that route is now closed.

---

# Wave 2 — dispatch record (owner correction, 2026-08-12)

**The lane was closed prematurely.** The closing record above documents wave 1 only; the owner's
board-coverage correction establishes that remaining 0.0.6 fixes ownership is exactly **#1540,
#1456, #1460, #1454**. The lane is reopened; the closing record is retained as the wave-1 record and
is **not rewritten**, per the standing rule that the plan records intent and the trace records what
happened.

Renumbered to the owner's scheme: what this file earlier called waves 3–4 is **wave 2**.

Base for every branch: **`3c9dc1f39`** (current `origin/main`, the #1539 merge). All four worktrees
cut from it with `upstream=NONE` — verified, so no bare push can reach `main`.

## One issue per PR

Four separate draft PRs. None of these four is genuinely connected to another: #1540 is release
tooling, #1456 is the plugin-install resolver, #1460 is agent-init config generation, #1454 is
plugin doctor plus a new E2E. Grouping any of them would fail the "genuinely connected" test.

| Slice | Issue | Branch | Worktree | Lane |
| --- | --- | --- | --- | --- |
| W2-E | #1540 p2 | `fix/1540-publish-interrupt-tree-safety` | `ns006-w2-1540` | `complex_implementation` Sol · high |
| W2-F | #1456 p1 | `fix/1456-plugin-install-exact-jsr-version` | `ns006-w2-1456` | `normal_implementation` Sol · medium |
| W2-G | #1460 p1 | `fix/1460-agent-init-mcp-lock-neutrality` | `ns006-w2-1460` | `light_implementation` Sol · low |
| W2-H | #1454 p1 | `fix/1454-plugin-doctor-package-backed` | `ns006-w2-1454` | `complex_implementation` Sol · high |

## PLAN-EVAL decision, per issue

The owner's rule: **skip only where fully deterministic.** Applied per issue rather than blanket —
wave 1's blanket `N/A` is not carried forward.

| Issue | PLAN-EVAL | Why |
| --- | --- | --- |
| #1540 | **REQUIRED** | Not deterministic. #1417 could use a throwaway workspace because a dry-run needs no real registry; a **real** publish cannot. Making an interrupted publish leave a clean tree is a genuine design choice (signal handling, atomic restore, or restructuring so the live tree is never materialized), and the issue names none. |
| #1456 | **N/A — deterministic** | The issue states expected behaviour exactly: preserve `jsr:@scope/pkg@version` and the prefixless form through validation and scaffold dispatch, and never substitute registry `latest` for an explicit version. No design freedom. |
| #1460 | **N/A — deterministic** | Consumer-proven fix (`--no-lock --minimum-dependency-age=0`), five acceptance boxes, and a stated principle: the CLI is tooling, not a workspace dependency. |
| #1454 | **REQUIRED** | Not deterministic. Requires deciding how doctor distinguishes package-backed from local-workdir manifests, what permission metadata published packages must carry, **and** a new scaffold E2E over published workers + streams — a new expensive gate whose shape is a design decision. |

PLAN-EVAL runs through the **automatic** label mechanism (`openhands` + `status:plan-eval`), never a
manual dispatch and never Fable (drift D-7).

## IMPL-EVAL

**Normal automatic IMPL-EVAL for all four** — draft → ready triggers it; the documented small
deterministic waiver is **not** pre-applied to any of them. If a slice's evidence later earns that
waiver it is recorded explicitly at that point, never assumed in advance. Wave 1's conditional
waiver for C/D is not precedent here: those were guard tests, these are p1/p2 correctness fixes in
shipped surfaces.

## Binding constraints carried from wave 1

1. **Branch from current `main` and re-sync immediately before draft → ready.** #1539's stale base
   broke evaluator prompt resolution *and* poisoned the quality scan's changed-file range.
2. **No Fable** (D-7). Implementation Codex; ordinary review substitutes Opus at the paired effort.
3. **No manual OpenHands dispatch.** Automatic label-driven phases only.
4. **Never wrap the launcher in `timeout`** — it kills the turn ~25s later (cut-trace F-2).
5. **`scaffold.runtime` is serialised and contended by five lanes.** W2-H is the only slice that
   needs it; it asks before taking it.
6. **Verify a slice's liveness by a fresh growing rollout**, never by absence from the bounded
   status list (F-1).

---

# Wave 3 — #1594, the final fixes-lane leaf (owner assignment, 2026-08-12)

**Accepted, to start only after #1454 is terminal.** Unclaimed at time of writing: `#1594` OPEN,
`type:fix`, `area:tooling`, `priority:p0`, `status:plan`, **no assignees**.

`fix(agentic): fallback evaluator comments recursively trigger duplicate paid OpenHands runs`

## What happened

Two **paid** OpenHands runs fired from `issue_comment` on `main`, one second apart, after the
originals hung:

```
31615108125  2026-08-12T15:57:30Z  [issue_comment]  cancelled by owner
31615110254  2026-08-12T15:57:31Z  [issue_comment]  cancelled by owner
```

This is a **cost** defect, not merely a correctness one — the recursion spends real money per
iteration, and it fires precisely when something has already gone wrong (an original run hanging),
so it compounds an incident rather than reporting it.

## Not caused by this lane's provenance comment — checked, not assumed

I posted a fallback-provenance comment on #1574 shortly before these fired, so the first thing I
checked was whether I caused it:

```
'@openhands-agent' occurrences in the fixes-lane provenance comment: 0
```

Zero. It cannot satisfy the trigger predicate. Recorded because "my comment was nearby and something
expensive happened" is exactly the kind of coincidence that should be settled with a grep rather than
a disclaimer.

## Mechanism, scoped from the workflow rather than guessed

`.github/workflows/openhands-agent.yml` fires on:

```yaml
github.event_name == 'issue_comment' &&
  contains(github.event.comment.body, '@openhands-agent') &&
  contains(fromJson('["OWNER","MEMBER","COLLABORATOR"]'), github.event.comment.author_association)
```

Measured on #1574's own comments:

| Comment kind | `@openhands-agent` occurrences | Triggers? |
| --- | --- | --- |
| `openhands-phase-eval` **trigger** comment | **3** | yes — by design |
| `openhands-agent-summary` **status** comment | **0** | no |

So the plain status comment is *not* self-triggering today. The defect therefore lives in one of:
a status/failure variant that **echoes or quotes the trigger line** (the hang path emits a different
shape than the healthy summary I measured), a re-post/edit of the trigger comment, or any
human/agent comment that quotes a trigger body verbatim. **The slice diagnoses which; it does not
assume.**

## Required invariant (owner-specified, non-negotiable)

1. **Trigger comments, status comments, and provenance comments are trigger-immune.** A comment the
   automation itself authored must never be able to start a run — regardless of what text it
   contains, including a verbatim quote of a trigger line.
2. **A duplicate `(generation, phase, head)` is rejected *before spend*.** Not deduplicated after
   launch, not cancelled by concurrency after the model has been billed — refused before the paid
   work starts.

Point 2 is the one that must not be weakened into a concurrency group: `cancel-in-progress` stops a
*running* job, which is already spend. The rejection has to happen at the predicate.

## Shape

One focused PR, `area:tooling`, p0. Not bundled with anything. Branch from current `main`, re-sync
before draft → ready, automatic IMPL-EVAL only — **no manual OpenHands, no Fable**.

Note the reflexivity and design the test around it: this fix changes the machinery that evaluates
it. Its regression evidence must demonstrate a duplicate `(generation, phase, head)` being
**refused**, and must not be a test that merely passes because no second trigger happened to be
emitted during the run.

## Wave 3 — owner decisions recorded (2026-08-12)

1. **#1597 stays in this lane through merge.** Release-critical and a **prerequisite for the stable
   cut**, so it is not handed to the release lane despite that lane owning the cut sequence it
   protects. Priority is **p0** on the live issue; the slice brief's `priority:p1` was an
   orchestrator transcription error, corrected in the artifact (`8d4e3bf92`) and armed for correction
   on the PR label without disturbing the attached session.
2. **#1594 stays narrowly scoped** to atomic pre-spend evaluator claiming and its recovery semantics.
   Nothing else folds in.
3. **The mirror-throw sibling goes to #1561, not #1594.** Recorded as a concrete repro
   (comment 5269853965) rather than absorbed into the cost fix.

### Why the split is the right one, recorded so it is not re-litigated

Both defects live in evaluator machinery and it would have been easy to bundle them. They are
different failure classes with different blast radii:

- **#1594** is a **cost** defect — a non-atomic read-then-write between `listComments` and
  `createComment` lets two runs both claim one logical phase transition and **spend twice**.
- **#1561** is a **legibility** defect — a reportable condition raised as an uncaught throw, so the
  PR shows `close-gate FAILURE` with the real cause visible only in the job log.

Bundling would have widened a p0 cost fix into general evaluator robustness, which is the scope creep
this lane has refused three times already (#1540's signal handler, #1454's F-8 dead helper, #1454's
F-6 release sequencing).

### What the sibling repro cost, and what it says about the convention

Three `close-gate` cycles on #1574, each presenting identically as `FAILURE`: mirror skipped for a
missing label, a stale read predating the label and box tick, and the throw. **Only the third was a
defect in the PR's content.**

The throw's input was not a malformed hand-edit — it arose from following the **better** convention.
`box-index` keys are recommended precisely because exact-text matching is brittle against issue line
wrapping the author never sees. This orchestrator instructed the slice to use `box-index` without
first checking whether #1454 had any boxes; it had zero. So a well-formed block pointed at boxes that
do not exist, and the tool crashed rather than reporting it.

**Rule adopted for the remaining slices:** check the issue's checkbox count *before* requiring a
structured evidence block, and require none where the issue is box-less — the PR-body checklist is
the acceptance record there, which `check-close-gate` validates directly. Already written into both
wave-3 briefs.
