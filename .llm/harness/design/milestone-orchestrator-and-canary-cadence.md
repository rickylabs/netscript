# Design — agent milestone orchestrator and rolling canary cadence

Design document for epic **#1120**, for owner ratification via draft PR (decision **D1**: internal
doctrine ships as a draft PR, not an RFC — RFCs govern product surface, and the precedent for a
run-shape doc in this repo is `workflow/supervisor.md`, promoted from PR #96, and
`workflow/seed-run.md`, promoted from draft PR #397).

## Evidence base, and what is _not_ evidenced

Every rule below is marked **[observed]** or **[asserted]**.

**[observed]** means it is derived from the
[archived 0.0.4 cut trace](https://github.com/rickylabs/netscript/blob/d8187e5a8656de8f9443f4e33f0a91ece56a7dd2/.llm/runs/release-0.0.4--orchestration/cut-trace.md)
— the instrumented trace of the 0.0.3 → 0.0.4 orchestration, captured from `git log` during the run
rather than reconstructed from an agent's recollection. 11 PRs, 42 issues, 10:19 → 14:59 on
2026-08-03.

**[asserted]** means it is a reasoned proposal with no supporting observation yet. Asserted rules
are the ones most likely to be wrong, and are called out so they can be attacked rather than
absorbed.

This distinction exists because 0.0.4 shipped **two guards whose condition could never become true**
— a PR watcher requiring `non-draft` when every PR was a draft, and a merged-branch check using
commit ancestry under a squash-merge workflow. Both silently did nothing and reported nothing.
Designing a cadence from first principles is exactly how a third one gets shipped.

## The gap this closes

We publish canaries only to smoke-test an actual JSR release. There is today no answer to: _when
does a canary go out, what does it contain, what merge order produced it, and where can anyone see
that in GitHub?_

`.agents/skills/netscript-release` already owns **how to publish one safely** — `release:canary`,
`publish:readiness`, `release:preflight`, OIDC, the mandatory green canary pair, the
import-attribute ban and its incident lineage, same-semver republish, rollback. Verified: 50 canary
references, every heading publish/recovery/rollback. **The gap is cadence and orchestration, not
publishing.** Nothing in this design restates publish mechanics.

## Three artifacts, and the line between them

The main failure mode of this work is duplication. The rule: if a paragraph would appear in two
places, it belongs in one and is referenced from the other.

| Artifact                                                       | Owns                                                                                                                                                 | Never contains                                      |
| -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| **Slice A** — `.llm/tools/release/canary-label.ts` + reference | The **mechanism**: label derivation, payload computation, application, drift gating                                                                  | Judgement, run shape, publish mechanics             |
| **Slice B** — `.llm/harness/workflow/milestone-run.md`         | The **run**: stage contracts, run artifacts, gates, evaluator protocol, definition of done for a milestone run                                       | Role judgement, routing tables, the label mechanism |
| **Slice C** — `.agents/skills/agent-milestone-orchestrator`    | The **role**: clustering a milestone into PR-sized groups, wave sequencing, delegation and effort tiering, merge authority, _when_ a canary goes out | Run artifacts, gate lists, the label mechanism      |

Placement finding: the profile belongs in `.llm/harness/workflow/`, **not** `archetypes/`.
Archetypes are per-package design shapes; this is a run shape, and `seed-run.md` and `supervisor.md`
are the precedent.

### Separability is a hard constraint (owner amendment, 2026-08-03)

Slice A must land and be **exercised on real canaries before B and C exist**. The test: if the
canary surface cannot be used without the orchestrator skill, the split is wrong.

It passes — the owner cuts a canary with existing `release:canary` mechanics, and Slice A labels
what actually shipped. No role judgement is required for that to work.

Slice A lands first, which makes it the magnet for everything. Anything not needed to **label,
publish-link and observe** a canary is out of it, by construction.

## Canary cadence

### Trigger point **[observed]**

Merge times in the 0.0.4 trace self-cluster into three groups — 21 min, 42 min, 2h01m — and the
clusters _are_ the dispatch waves. No new vocabulary is needed: **the natural canary boundary is the
wave boundary**, the point at which a dispatched group of supervisors has all landed.

### Membership is content-derived, not plan-derived **[observed]**

This is the rule the trace _falsified_ before it could be shipped.

PR #1086 was not part of wave 2. It was dispatched mid-wave because #1089 blocked the owner's
docs-audit lane, and it merged **between two wave-2 PRs**. A cadence defining a canary as "the PRs
dispatched in wave N" would have mislabelled it.

So membership is **what actually landed between the previous canary point and this one**, computed
from merge history. A PR that landed out of plan order is still in the payload. The wave is a
_dispatch_ unit; the canary is a _content_ unit; they usually coincide and must not be assumed to.

### Flexibility — the re-planning events that actually happened **[observed]**

Three inside one milestone, none of which broke the wave structure:

- **#1089 jumped the entire queue** — it blocked an external lane, was folded into an already-open
  PR rather than given its own, and shipped ~1h after being filed.
- **#1013 was deliberately deferred** behind #1075 despite sharing a surface, to avoid a five-issue
  PR on the release's most critical code.
- **#1024/#1061 were split out of #1078 mid-flight** when close-gate revealed 15 unchecked boxes
  across issues with no implementation.

A cadence that treats the plan as the contract breaks on all three. One that treats **merge
history** as the contract absorbs all three without special handling.

### Label identity (**D3**)

The label **is** the published prerelease version: `canary:<version>-canary.<n>`, e.g.
`canary:0.0.4-canary.1`. Derived by a generator from the publish result, never typed.

**The concrete trap, found while scoping [observed]:** `deno.json` reads `0.0.3`. `release:canary`
takes a **stable target** (`0.0.4`) and derives `0.0.4-canary.N`; `validateStableTarget` refuses a
prerelease target. A generator reading the repo's `version` field would emit `canary:0.0.3-canary.1`
— silently wrong, in precisely the way D3 exists to prevent.

**Source of truth is the publish result, not the repo version field.** This is the single most
important line in the design.

### Proof-of-firing

Every gate must be demonstrated **capable of firing, with the negative case shown**, and **a pass
must be distinguishable from a did-not-run**. Silence is a failure, not a pass.

This is not a style preference. It is the direct lesson of the two dead 0.0.4 guards, and of #1022
(a `plugin doctor` that reported healthy because no check could fail) and #1012 (a resource reported
`Healthy` with no readiness probe) — both fixed in 0.0.4, both the same defect class.

`0.0.4-canary.1` and `0.0.4-canary.2` provide two live executions with genuinely different payloads.
If a label and its published JSR version ever diverge during that exercise, that is a **finding to
record, not a nuisance to hand-patch**.

### Canary release notes **[observed gap, owner-identified 2026-08-03]**

A canary today publishes to JSR and creates a git tag `v<version>`, and **that is all**. There is no
GitHub release and no note: `gh release list` returns only `v0.0.3`, `v0.0.2`, `v0.0.1-beta.11` —
**zero canaries**. A canary is therefore an opaque version string. You can see _that_ one shipped,
never _what is in it_.

This design initially covered the **label** (which canary) and the **stable cut-time note** (the
#1083 class), and omitted the canary's own note. That is the "what does it contain" half of this
epic's own question, and the omission was the owner's find, not the author's.

**The payload is already the note.** Slice A computes the PRs merged between canary points and the
issues they closed, in order to apply the label. The same derivation renders the note — and it must
be _the same_ derivation, not a second path, because two paths to the same fact is how a label and a
note drift apart.

Rules:

- The note is published as a **GitHub release on the existing `v<version>` tag, marked prerelease**.
  A canary must never take `Latest` — that belongs to stable.
- Re-running is **idempotent**: it updates an existing canary release rather than failing or
  duplicating.
- An empty payload (nothing merged since the last canary) produces an **explicit empty-payload
  note**, not a silent success and not a crash.
- Publishing a note for a version that was never published **fails**, under the same identity
  constraint as the label.

**Consequence for the cadence:** the canary note is what accumulates into the stable release note.
The #1083 obligation — breaking changes surfaced from closed issues must reach the notes — is
satisfied continuously at each canary rather than reconstructed at the cut, which is the point in
the process where it was historically dropped.

### Reviewer substitution is a legitimate waiver **[observed 2026-08-03]**

The slice review gate says **no lane self-certifies**. It does _not_ say the reviewer must be an
agent. When the owner reviews the work directly, the invariant is satisfied — he is not the
generator — and the opposite-family pass can be dropped for that slice.

This matters on a critical path: during the canary exercise, several implementation turns were
consumed by opposite-family re-review passes and by recording their verdicts, while a p0 release
blocker waited. The waiver is a **substitution of reviewer, not an absence of review**, and it is
recorded as such in the run's `drift.md` rather than silently applied.

Unchanged by the waiver: the automated gates. They are evidence, not sign-off, and a green gate was
never a substitute for review in either direction.

**The waiver is scoped by what the review is catching, not by convenience.** On this slice the
opposite-family pass found _non-failing inline `jq` substitutions_ — a check that could not fail,
silence reported as a pass — in a tool whose whole purpose is proving gates can fire. A review
finding defects of the class the work exists to prevent has earned its cost; a review of prose has
not. So: **keep opposite-family review for code, drop it for run artifacts and evidence prose.**
Before waiving a review, look at what it last found.

## Cut-time checklist **[observed]**

Derived from what was actually missed or nearly missed in 0.0.4:

1. **Breaking changes surfaced from closed issues reach the notes.** #1083 closed
   `ServiceStreamProducerOptions.assertResolvable`'s removal, but its _deliverable is a release
   note_, which does not exist until the cut. A closed issue whose payload is a note is invisible at
   cut time unless something carries it forward. This is the class of item dropped when a cut is
   busy.
2. **Issues moved out of the milestone are reflected in the notes**, not just the closes — 0.0.4
   moved #1004, #1085, #1024, #829, #742, #734 and PRs #778/#775, each with a written reason.
3. **Scope drift is an explicit checkpoint.** 0.0.4 began at 31 items; six defects were filed _by
   the orchestration itself_ (#1074, #1080, #1083, #1084, #1085, #1087), two of them p0/p1 blockers
   for the release's own stated purpose. The definition of done moved during the run. That was
   correct and it should be a decision, not a discovery.

## Pre-merge gate **[observed]**

The empirical checklist the 0.0.4 orchestrator converged on. Items 6 and 7 were added _after_ being
burned, which is why they are here rather than inferred:

1. `close-gate` result — the only automated proof that issue acceptance was verified.
2. Unticked `- [ ]` count on every issue the PR closes.
3. New `deno-lint-ignore` / `as unknown as` / `@ts-ignore` in the diff, **excluding `.llm/runs/**`**
   — run artifacts quote those strings, and so does the quality scanner's own embedded source. Both
   produce false positives.
4. Named expensive gates reported `SUCCESS`, not `SKIPPED`/`CANCELLED` — **"clean" repeatedly meant
   "nothing ran"** (PRs #778/#775 looked mergeable with every substantive check skipped and a base
   branch dead since 17 July).
5. The single decisive claim per issue, re-verified independently.
6. **After #1079:** changed-file audit for `packages/**` and `plugins/**` on a docs-lane PR — a docs
   slice landed framework source, and the root cause was upstream: #1020 was labelled `type:docs`
   but its acceptance required code.
7. **After #1088:** the PR body's own checklist matches what shipped. `close-gate` validates _issue_
   checkboxes, not _PR-body_ checklists, so a merged PR can assert "implementation hard stop in
   force" while the change ships (filed as #1105).

## Orchestration rules worth freezing **[observed]**

- **Launch app-server-attached, never ad-hoc `codex exec`** — an attached thread takes further turns
  via `turn/start` with its `threadId`; a plain exec is one-shot and unreachable.
- **Liveness is not progress.** Verify a growing artifact, a new commit, or a live session — not an
  open socket. Artifacts are not always where you launched: check across the repo root.
- **Supervisors go idle at a red gate rather than escalating** — 4 occurrences in 0.0.4, plus 3
  slices that hard-stopped on a credential-blocked PLAN-EVAL. Brief the gate as a **deliverable**,
  and pre-empt known environmental blocks in the _initial_ brief, not after the stall.
- **Never establish ownership by string match.** A "is a turn live here" check matched worktree
  paths quoted inside _other agents' brief text_. Match the actual `--cwd` argument. Inverted, this
  deletes a live agent's worktree.
- **Never steer from a truncated log.** A `head -14` excerpt led to telling a supervisor two issues
  were satisfied; acting on it would have auto-closed two issues with zero implementation. The
  supervisor pulled the raw log and caught it.
- **Squash-merge breaks ancestry-based "is it merged".** Use PR state, not `origin/main..HEAD`.
- **Quota exhaustion is a first-class failure mode**, with a concrete recovery: redeem the
  soonest-expiring reset, and note the status panel is **stale afterwards** — verify with a real
  call, not the display.
- **Observational acceptance criteria cannot be closed by a PR.** Criteria of the form _"a follow-up
  agent run shows…"_ move to a verification issue in the next milestone (#1090 is the precedent).
- **Expensive gates are serialised across slices** — three concurrent `scaffold.runtime` runs
  produced two failures that were contention, not defects.

## Open questions for the owner — not decided here

1. **Does a canary publish at every wave boundary, or only at boundaries crossing a public-surface
   change?** Every-boundary is simpler and more observable; surface-gated is cheaper. **[asserted]**
   preference: every boundary, because the trace shows only three per milestone.
2. **Does a failed canary block the next wave's dispatch, or only the cut?** **[asserted]**
   preference: only the cut — blocking dispatch serialises the whole milestone on a publish step.
3. **Naming collision.** `agentic:provider-canary` and `agentic:rollout-canary` are **AI
   provider/model rollout** canaries, unrelated to release canaries. Recommend renaming to
   `agentic:model-rollout-*` as a separate issue. Two things called "canary" in one release system
   will cost someone an hour.
