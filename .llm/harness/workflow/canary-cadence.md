# Rolling Canary Cadence

The **schedule** contract of epic #1120: _when_ a release canary goes out, _what_ it contains, and
_where_ anyone can see that in GitHub. It is one of three artifacts with a deliberate division of
labour — the `agent-milestone-orchestrator` skill is the **role** (who decides), the
[`milestone-run.md`](./milestone-run.md) profile is the **run** (what a milestone run must prove),
and this document is the **schedule**. A paragraph that would appear in two of them lives in one and
is referenced from the others.

What this document does **not** own:

- **Publish mechanics.** Everything about executing, verifying, recovering, or rolling back a canary
  publish — and what a failed canary means — is owned by `.agents/skills/netscript-release`. This
  document says when a canary point occurs; that skill owns the rest, and none of it is repeated
  here.
- **The label/note mechanism.** Label derivation, payload computation, note rendering, and drift
  checking are implemented once in `.llm/tools/release/canary-label.ts`
  (`deno task release:canary-label`, shipped by #1121/#1122). This document states the contract that
  tool enforces; it does not restate the implementation.

**Disambiguation (#1119):** in this document "canary" always means a **release canary** — a JSR
prerelease of the workspace. The `agentic:provider-canary` / `agentic:rollout-canary` tasks are AI
provider/model rollout canaries and are unrelated; do not route release-cadence work through them,
and do not cite this document for them. The rename that resolves the collision is tracked as #1119
and is not attempted here.

## Evidence base

Every rule below is marked **[observed]** — recorded during the 0.0.4 execution, whether in the
instrumented merge trace
([`.llm/runs/release-0.0.4--orchestration/cut-trace.md`](../../runs/release-0.0.4--orchestration/cut-trace.md);
11 PRs, 42 issues, 2026-08-03), in the issues that run filed, or in the ratified design doc's dated
observations — with the specific source cited at the claim — or **[asserted]** — a reasoned proposal
with no supporting observation yet. Asserted rules are the ones most likely to be wrong; attack them
rather than absorb them. Do not promote an assertion into an earned rule when citing this document.

## Trigger: a meaningful wave checkpoint **[observed, refined by 0.0.6]**

Merge times in the 0.0.4 trace self-cluster into three groups — 21 min, 42 min, 2h01m — and the
clusters _are_ the orchestrator's dispatch waves. The 0.0.6 topic-cluster run refined the operating
shape: a canary is declared at a **meaningful checkpoint after one or more topological waves have
landed**, not after every leaf PR. The checkpoint must provide a coherent testable payload (for
example a public-surface capability or a release-blocking fix set), and its rationale is recorded in
the dependency DAG/cluster state before dispatch. This preserves continuous evidence without turning
publication into per-slice noise.

## Membership: content-derived, not plan-derived **[observed]**

This is the rule the trace _falsified_ before it could be shipped, and the single most important
constraint on the cadence:

PR #1086 was not part of wave 2. It was dispatched mid-wave because #1089 blocked the owner's
docs-audit lane, and it merged **between two wave-2 PRs**. A cadence defining a canary as "the PRs
dispatched in wave N" would have mislabelled it.

Membership is therefore **what actually landed between the previous canary point and this one**,
computed from first-parent merge history. A PR that landed out of plan order is still in the
payload. The wave is a _dispatch_ unit; the canary is a _content_ unit; they usually coincide and
must never be assumed to. `release:canary-label` computes the payload exactly this way — from merge
history, never from a dispatch plan.

## Identity: the label is the published version (D3)

The GitHub label **is** the published prerelease version string: `canary:<version>-canary.<n>` —
e.g. `canary:0.0.5-canary.1`. The label is applied to every PR in the payload and to the issues
those PRs closed, so anyone can see which canary an issue or PR shipped in without leaving GitHub.

Identity rules:

- **The label is derived from what was actually published, never typed by hand.** The canonical
  execution is the wiring inside `.github/workflows/release-canary.yml`, which passes the publish
  step's **own output version** to `deno task release:canary-label` — derivation, not transcription.
  The standalone CLI exists for re-runs and audits; it refuses a version JSR does not report as
  published, which bounds a manual invocation but does not make it derived — a hand-run naming the
  _wrong already-published_ version remains possible, which is exactly why the workflow integration
  is the canonical route and a bare CLI run is the exception.

- **The source of truth is the publish result, not the repo version field** (design finding, found
  while scoping #1121 — not a trace observation). At the time this cadence was designed, `deno.json`
  read `0.0.3` while the canary train was `0.0.4-canary.N` — `release:canary` takes a _stable
  target_ and derives the prerelease from it. A generator reading the repo's `version` field would
  have emitted `canary:0.0.3-canary.1`, silently wrong in precisely the way D3 exists to prevent.

## The canary note

A canary version string alone answers _that_ something shipped, never _what_. Each canary point
therefore publishes a GitHub release note, and **the payload is the note**: the same merge-history
derivation that selects the labelled PRs renders the note's content. One derivation, two views —
this is why the note lives in the same tool invocation as the label, and why a second rendering path
must never be added (two paths to the same fact is how a label and a note drift apart).

Contract (enforced by the tool):

- The note is a **GitHub release at tag `v<version>`, marked prerelease**. A canary never takes
  `Latest` — that belongs to stable. The tag itself is created by the canary cut, not by this tool,
  and the tool does not verify the tag exists before publishing the release — if the tag were
  absent, GitHub would create it at the default-branch HEAD, the wrong commit. Publishing a note
  therefore assumes the canary cut already created `v<version>`; the published-version refusal
  bounds _which_ versions can be named, not whether their tag exists.
- Re-running is **idempotent**: an existing canary release is updated, not duplicated or failed.
- An empty payload (nothing merged since the previous canary point) produces an **explicit
  empty-payload note**, not a silent success and not a crash.
- Publishing a note for a never-published version **fails**, under the same identity constraint as
  the label.

**Consequence for the cut [asserted]:** the canary notes are the cut's source material — but no
mechanism feeds them into the stable release note today. The stable note is composed by
`release:publish` from a hand-written intro plus independently generated lists (owned by
`netscript-release`); it does not read canary releases. What the canary notes do provide is
continuous visibility: each payload is recorded as it lands, so the #1083 class — a closed issue
whose deliverable _is_ a release note, invisible at cut time — can be read off the canary notes
instead of reconstructed at the cut, which is exactly where it was historically dropped. The
cut-time checklist in [`milestone-run.md`](./milestone-run.md) therefore reads the canary notes when
composing the stable intro; today that is a manual read-through, and whether it gains tooling is an
open implementation question.

## The drift gate

A non-dry run of `release:canary-label` ends with a drift verdict: a `canary:*` label with no
matching published version, or a published canary with no label, fails the run. A `--dry-run`
deliberately stops before any mutation — its label, note, and drift checks then report as not-run
rather than silently passing, so a dry run can never be mistaken for a real verdict.

Gate integrity, per the #1120 proof-of-firing bar:

- **Firing demonstrated, negative case shown.** #1121's acceptance recorded the drift gate failing
  on a fabricated mismatch before it was trusted — the negative case is on the record, not presumed.
- **Pass is distinguishable from did-not-run.** The tool reports an explicit per-check result for
  every check it defines, including the ones it did not reach — an early exit leaves visible not-run
  records instead of silence. Silence is a failure, not a pass. How that reporting is implemented is
  the tool's own concern: consult `canary-label.ts`, not this document.
- **Lineage note:** the drift check originally reported historical canaries from earlier trains as
  missing labels; that scoping defect was fixed under #1160 (closed). The doctrine it left behind
  stands: when the drift gate reports red, treat it as a finding — never hand-patch labels to green
  it, and never widen the gate's tolerance to silence it.

## Flexibility: what the cadence must absorb **[observed]**

Three re-planning events happened inside the single observed milestone, none of which broke the wave
structure:

- **#1089 jumped the entire queue** — folded into an already-open PR (#1086) because it blocked an
  external lane; shipped ~1h after being filed.
- **#1013 was deliberately deferred** behind #1075 despite sharing a surface, to avoid a five-issue
  PR on the release's most critical code.
- **#1024/#1061 were split out of #1078 mid-flight** when close-gate revealed 15 unchecked boxes
  across issues with no implementation.

A cadence that treats the _plan_ as the contract breaks on all three. This one treats **merge
history** as the contract and absorbs all three without special handling — which is the reason the
membership rule above is load-bearing and not a stylistic preference.

## Checkpoint rule and remaining open question

The 0.0.6 cluster ratified checkpoint density: publish at meaningful checkpoints rather than per
leaf. Public-surface changes and coherent release-blocker sets are strong candidates; an empty or
bookkeeping-only wave is not automatically a canary.

One question remains owner-undecided **[asserted]**: **does a failed canary block the next wave's
dispatch, or only the cut?** Asserted preference: only the cut — blocking dispatch serialises the
whole milestone on a publish step. (What a failed canary means, and what to do about one, is
`netscript-release` doctrine.)

## Reference

| Surface                                                                 | Owns                                                                                        |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `.llm/tools/release/canary-label.ts` (`deno task release:canary-label`) | label derivation, payload computation, note rendering, drift gate                           |
| `.agents/skills/netscript-release`                                      | all publish mechanics, the green canary pair, failed-canary doctrine, rollback              |
| [`milestone-run.md`](./milestone-run.md)                                | the run shape that consumes this cadence; its cut checklist reads the canary notes manually |
| `.agents/skills/agent-milestone-orchestrator`                           | the role that declares wave boundaries and decides when a canary goes out                   |
| [`cut-trace.md`](../../runs/release-0.0.4--orchestration/cut-trace.md)  | the observed evidence base                                                                  |
| #1149 · #1160 · #1119                                                   | live-canary exercise (0.0.5) · drift-scoping defect (fixed) · naming collision              |
