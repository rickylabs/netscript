# Drift — topic-docs-0.0.7

Append-only.

## 2026-08-15 — Sonnet-canary journal superseded by the Opus 5/high supervisor (resolved)

The topic-local record committed at `f6ee57afa` was written by the reconciliation-only Sonnet 5/low
replacement canary. It recorded this lane's supervisor route as "native Claude Sonnet 5, low effort"
and dispatch order 6's evaluator route as "Claude Sonnet 5, `claude-sonnet-5`, effort low".

Both values are superseded. The owner override recorded at `2026-08-14T22:41:15Z` in
`briefs/reset-gates/dispatch.json` (`ownerOverride.supersedes`) restores native Claude Opus 5/high
for every topic orchestrator and sets order 6's evaluator to native Claude Opus 5 at **low** effort.
The coordinator's `supervisor.md` and `context-pack.md` classify the Sonnet canaries as historical
evidence that dispatched no leaf or evaluator, not as active controllers.

Disposition: rewrote `supervisor.md` and `context-pack.md` in this turn to the current central
values and added the missing attachment proof. No live repository, PR, issue, label, or
cluster-state fact was changed. This is a stale local-artifact correction, not a divergence between
reality and the central dispatch set.

## 2026-08-15 — no reality-vs-dispatch drift found

Every fact checked against the coordinator's central record matched exactly: `main`
`01e0960494c95ce56eb35892c211a095eb13e6ed`; topic worktree clean on
`orchestrator/release-0.0.7-docs`; leaf worktree clean at `d35cbca30`; PR #1652 open/draft/mergeable
at head `d35cbca30872d1f55118d63437638e93270c2ac3` with milestone `0.0.7` and exactly one `status:`
label (`status:plan-eval`); `agentic:pr-checks` reports PASS with zero current failures; no Docker
containers, no resource lease, no live evaluator, and no rival controller at either worktree.

## 2026-08-15 — leaf `context-pack.md` records a stale label (noted, not corrected)

The leaf's own `context-pack.md` states PR #1652 carries "exactly one `status:plan`". The live label
is `status:plan-eval` — the coordinator restored it when it interrupted the advisory-PASS S1 resume
(coordinator `supervisor.md`, drift entries `2026-08-13T23:55` and `2026-08-14T00:02`). The live
label is correct and the lifecycle invariant of exactly one `status:` holds.

Disposition: left unmodified. The leaf run dir belongs to the leaf generator, and `d35cbca30` is the
immutable head the pending PLAN-EVAL evaluates; a supervisor edit there would move the evaluation
surface. Fold the correction into the leaf's next authorized commit after the gate.

## 2026-08-15 — evaluator serialization scope corrected by the coordinator (accepted)

The reset dispatch this lane reconciled against encoded `concurrency: 1` as a cluster-wide evaluator
mutex, and the topic record repeated it. Coordinator head `168715e27` corrects it: `concurrency: 4`
with `concurrencyScope: per-topic-orchestrator` and `perOrchestratorConcurrency: 1`, so docs order 6
runs alongside the other topics and formal evaluator leases no longer consume `expensiveGates`.

Disposition: accepted from the coordinator. This lane still runs exactly one evaluator at a time.

## 2026-08-15 — the orchestrator's wrapper brief never reached the evaluator

`claude --bg` was invoked with the positional brief placed after the variadic `--add-dir` flag, so
the CLI consumed the 6143-character brief as a second `--add-dir` value
(`~/.claude/jobs/40a06314/state.json` → `respawnFlags[9]`; job `intent` empty). The session started
idle with zero user messages. The evaluator was started instead by a single human-typed Remote
Control message at `2026-08-14T23:18:40Z` (`origin.kind: human`, `promptSource: typed`) that binds
it to the coordinator's authoritative brief, the exact source head, and the same output/boundary
constraints.

Disposition: the gate remains valid — `briefs/reset-gates/comparison-docs-programme.md` is the
binding contract and already mandates the identity recording, Plan-Gate coverage, verdict token,
commit/push/comment shape, and boundaries. The running evaluation was not interrupted to re-deliver
a supplementary wrapper. Recorded so no artifact claims the orchestrator's brief was delivered.
Launcher rule for this lane: pass the prompt before any variadic flag, then verify `respawnFlags`
and the transcript's first user record before reporting a launch.

## 2026-08-15 — approved S1 acceptance was unsatisfiable from its own file list (corrected)

The Codex leaf stopped mid-S1 with
`BLOCKED: /migration/ cannot render under Concepts without a page
excluded by the exact six-file S1 boundary`.
The report is correct and the stop was the right call.

`plan.md` S3 owns `docs/site/migration/index.md` and `docs/site/migration/nextjs.md`, so S1 cannot
create a migration page; yet S1's manual assertion requires **both** roots to appear in rendered
navigation. The approved plan therefore contradicts itself, and formal PLAN-EVAL cycle 1 (`PASS` at
`d35cbca30`) did not catch it — its `Commit slices` row enumerated file lists and gates without
cross-checking that each slice's acceptance is satisfiable from that slice's own files. The topic
orchestrator's S1 brief then propagated the defective assertion verbatim.

Disposition (topic-orchestrator ruling, severity `significant`, **no rescope, no scope growth**): S1
asserts only `/comparisons/` and `/comparisons/methodology/`; the `/migration/` rendered-root
assertion moves to S3, which owns both migration files, and S3's gate must assert both roots. One
artifact file (`drift.md`) was authorized into the S1 commit so the correction and the PLAN-EVAL
miss are visible to the later IMPL-EVAL instead of buried.

## 2026-08-15 — Tier-A: S1 ships links to a section that does not exist, and its gate cannot detect that

Tier-A content review of the uncommitted S1 patch (distinct from the file-scope check, which passed)
found `/migration/` wired in four places while `docs/site/migration/` does not exist:

- `docs/site/_data/xref.ts:202` registers `"migration:index" → /migration/`;
- `docs/site/comparisons/index.md:41` renders that xref as body text;
- `docs/site/comparisons/methodology.md` ends with `comp.nextPrev(… next: "/migration/")`;
- `docs/site/_data.ts:103` adds `/migration/` to the Concepts `roots`.

All four are S3's wiring. Shipping them in S1 publishes links into a non-existent section.

The compounding defect is the gate. S1's gate runs `deno task --cwd docs/site build`, which is
`check:source-format && lume && check:rendered-output` — the rendered link checker `check:links`
lives only in `verify`, which the plan does not schedule until S3's `S3-docs-audit`. So S1's gate
set is structurally incapable of proving S1's own content contract ("stable xrefs", "links
resolve"), and this defect would have survived two slices undetected. PLAN-EVAL's
`Gate set selected — PASS` row mapped `docs-source-format` → `build` and noted `verify` only at S3
without flagging the gap.

Disposition: both returned to the leaf as blocking Tier-A findings for one bounded fix slice — strip
the `/migration/` wiring from S1, and add `check:links` to the S1 gate with its raw exit code
recorded. Both strictly reduce what S1 ships; neither changes scope. Recorded here because two
independent defects in one approved plan is a signal about the gate, not just about this leaf.

## 2026-08-15 — S2 requires a local checkout that no slice creates and research says was never made

The leaf stopped before writing any S2 code with
`BLOCKED: no authorized local EIS-Chat checkout exists at 5191de83f3da97559f21d8891c6c8afdf1cf473a`.
It committed nothing, read no consumer file contents, and did not fetch, clone, check out another
revision, or create a worktree. The report is accurate and the stop was correct.

Independently verified by the orchestrator. `git cat-file -t` returns `could not get object info`
for that commit in all three local checkouts, and `git branch -a --contains` returns
`no such commit`:

| Checkout                          | HEAD      | Has pinned object |
| --------------------------------- | --------- | ----------------- |
| `/home/codex/repos/eis-chat`      | `aeaf2df` | no                |
| `/home/codex/repos/refs/eis-chat` | `5fdff77` | no                |
| `/home/codex/eis-chat-ref`        | `a08ebe5` | no                |

**The revision is not lost.** `git ls-remote origin` on the same authorized remote
(`https://github.com/rickylabs/eis-chat.git`, configured identically in all three checkouts) reports
`5191de83f3da97559f21d8891c6c8afdf1cf473a` as both `HEAD` and `refs/heads/master` — it is the
current master tip, never rewritten. The three local clones are simply parked on other branches and
have never fetched it.

**Root cause is a fourth plan defect of the same family.** `research.md:51` records that P0
inspected the private repository "only through existing authorized GitHub access at immutable commit
`5191de83…`. **No checkout**, consumer code copy, or business-data extraction occurred." The
approved S2 tool contract then requires the tool to read "authorized **local** roots" and to
"require the immutable repository revision before reading files". So S2 depends on a local checkout
at that revision which no prior slice creates and which the plan's own research states was never
made. The slice cannot satisfy its contract from its own inputs, and formal PLAN-EVAL cycle 1 passed
over it — the same per-slice self-consistency gap as the three defects found in S1.

Disposition: **escalated to the coordinator, not resolved by this lane.** Provisioning the input
means fetching private consumer source onto disk from an external remote. That is outside the
docs-authoring boundary this orchestrator was granted, even though the coordinator's own
`leaf-contracts.json` lists `external:EIS-Chat@5191de83f3da97559f21d8891c6c8afdf1cf473a` as an
authorized file surface for this leaf. No fetch, clone, or checkout was performed. S2 remains
un-started and the leaf holds at `98fc58997`.

## 2026-08-15 — orchestrator tooling defect delayed the blocker by ~75 minutes

The S2 watcher's turn-ended branch matched `codex exec resume …` against `ps` output, which also
matches this session's own shell wrapper carrying that literal string in its command line. The
branch therefore could never fire, and the blocker — reported by the leaf at `02:05` — surfaced only
when the watcher hit its 75-minute timeout at `03:20`. The commit-detection branch was exact and
unaffected.

This is the same string-match trap already recorded twice in this run. The correct liveness test is
the exact PID (`[ -d /proc/<pid> ]`) or the rollout's last record, never a pattern match against a
command line that may contain the pattern as data. Cost: ~75 minutes of idle lane time. No work was
lost and no wrong action was taken.

## 2026-08-15 — S2's mandatory lint row targets paths the repo excludes from lint by design

The leaf reached the end of S2 implementation and blocked on the approved gate's lint command, which
exits `2`. It did not substitute another config, modify root configuration, or add a config file,
and it committed nothing. Correct on all counts.

Reproduced independently by the orchestrator. The exact mandated invocation returns exit `2` with
`"filesSelected":2` and `"excludedBatches":1`: the wrapper selected both files, Deno excluded them,
and the wrapper refused a false green — which is `run-deno-lint.ts` behaving as designed.

Root `deno.json` sets
`lint.exclude: [".llm/", "tools/", "packages/cli/",
"packages/mcp/tests/fixtures/doctor/"]`. There
is no `.llm/deno.json`, and CI does not lint `.llm/tools`. `.llm/**` is therefore outside lint
coverage by deliberate repo-wide configuration, so the approved `S2-evidence-repro` gate mandated
linting two paths the repository excludes by design. Note `fmt.exclude` does **not** list `.llm/`,
which is why the fmt row is legitimate and passes.

The remaining rows, all executed by the orchestrator rather than accepted from the leaf:

| Row                 | Raw exit | Result                           |
| ------------------- | -------- | -------------------------------- |
| `run-deno-check.ts` | `0`      | 2 files, 0 occurrences           |
| `run-deno-lint.ts`  | `2`      | unsatisfiable — `.llm/` excluded |
| `run-deno-fmt.ts`   | `0`      | 2 files, 0 findings              |
| `run-deno-test.ts`  | `0`      | 5 passed, 0 failed               |
| `git diff --check`  | `0`      | clean                            |

Disposition (topic-orchestrator ruling, severity `significant`, no rescope, no scope growth): the
lint row is recorded **N/A — not applicable**, in the same category as the leaf contract's
`jsrAudit.applicable: false`, never as passed, skipped, or waived. Two corrections were explicitly
refused: borrowing `docs/site/deno.json` to lint repo tooling would apply unrelated rules and
manufacture a meaningless green, and editing root `deno.json` is repo-wide tooling configuration
outside a docs leaf that would surface findings across other `.llm` tools.

This is the **fifth** defect of one family inside a plan that formal PLAN-EVAL cycle 1 passed: a
slice whose acceptance, gate, or inputs cannot be satisfied from that slice's own file list and the
repository's actual configuration. The four previous instances were S1's unsatisfiable rendered-nav
assertion, S1's four links into a later slice's section, S1's gate being unable to prove its own
link contract, and S2's local-roots contract with no slice creating the root.

## 2026-08-15 — owner-priority rewrite blocked: no accessible EIS-Chat revision is newer than the pin

The coordinator relayed an owner correction stating both canonical #1551 example comments
(`5265826161`, `5265971722`) "have been significantly improved in EIS-Chat" and must be rewritten in
place from a newly fetched immutable head. The premise does not hold against the repository this
machine can reach. Nothing was edited.

Evidence, after `git fetch --all --tags --prune` against the authorized remote:

1. `origin/HEAD` and `origin/master` are **`5191de83f3da97559f21d8891c6c8afdf1cf473a`** — identical
   to the existing pin. There is no newer master.
2. The only ref with a newer commit date is `origin/agent/netscript-0.0.6-stable` @
   `834a2b36a5c9ef4acf82f8f1f400522d8dab234b` (+30 seconds). It is **not** a descendant
   (`merge-base --is-ancestor` false, `rev-list --count` 0) and `git diff` against the pin is
   **empty for the whole tree** — identical content, different commit object.
3. Across **all** remote refs, the newest commit touching either example path is `aeee408`
   (`fix(fresh): preserve cache seeds on partial navigation`, 2026-08-12 16:51:16), and its blobs
   are **byte-identical to the pinned blobs**: `cc2cf0f9d8491f8dc974c478d4a7b08673bab125` for the
   Session route and `d2e1e781250f6c12bc4ab28e337d5f8ea425f3d1` for the Channel route.
4. All three local clones report **zero** unpushed commits (`log @{u}..HEAD`) and **zero** dirty
   files. Their differing working-tree blobs belong to older divergent checkouts (`aeaf2df`,
   `5fdff77`, `a08ebe5`), not to improvements.

The pinned revision therefore already carries the newest accessible version of both example files.
The described improvements are unpushed, in another location, or not yet committed.

Disposition: **stop, do not edit.** The instruction is to replace two canonical bodies (28,481 and
25,976 characters of owner-authored baseline) entirely in place, with no follow-up comment and no
addendum. Executing that without a genuinely improved implementation would either re-publish the
same analysis as though it were recomputed, or fabricate improvements — both destroy canonical
evidence irreversibly and produce exactly the false-done the harness exists to prevent.
Authorization to edit is not in question; there is simply nothing truthful to edit the comments to.
No fetch beyond read-only ref updates was performed, no worktree was created, and
`/home/codex/repos/eis-chat-007-input` remains untouched at the pin.

## 2026-08-15 — PLAN-EVAL validity determination (asked explicitly by the coordinator)

**No fresh PLAN-EVAL is required now, because no evidence-baseline change has actually occurred.**
The pin is unchanged and remains the newest accessible content, so every locked decision — the
equivalence contract, evidence vocabulary, matrix columns, presentation-held-constant rule,
script-only numbers, exact version pins, and `Part of #1551` closure — stands untouched. S1 and S2
sign-offs remain valid at `4e6d52b3d`.

The conditional ruling, for when an improved revision does become available:

- **Evidence refresh within the locked contract** — if the change alters only counts, hashes, and
  aggregates, the approved methodology already provides for it: the S1 methodology page carries an
  explicit freshness policy ("a refresh updates the inspection date, manifest hashes, evidence
  labels, and affected matrix rows"). Journal the drift, regenerate S2's manifest and measurements
  at the new pin, and require fresh Tier-A plus IMPL-EVAL on the eventual committed head. No new
  PLAN-EVAL.
- **Fresh PLAN-EVAL required** — if the change alters the equivalence contract itself, adds
  framework surfaces that change the mechanism matrix's shape, or breaks the
  presentation/domain-held-constant premise. Those are locked architecture, not evidence.
- **Out of scope either way** — case study 2 (Channel dashboard + create-session form) is already
  deferred to **#1649** by the approved plan's deferred-acceptance map and is not 0.0.7 docs scope.
  Rewriting its issue comment is issue-level evidence work that needs no PLAN-EVAL, but it is
  equally unrecomputable without the improved source.

S3 is held rather than resumed. Its case-study content consumes the same evidence baseline, so
starting it before the baseline question is settled risks discarding the work.

## 2026-08-15 — correction: the stale artifacts are the comments, not the pin

The preceding entry framed this as "no improved EIS-Chat revision exists" and held the lane. That
framing was wrong, and the coordinator's correction plus the owner's direct statement are right.

The error was in the comparison, not the data. This orchestrator searched for refs **newer than the
pin** and correctly found none. The right comparison is the pin against **what the comments
describe**. The two comments were authored 2026-08-12 at `11:02:26Z` and `11:17:48Z`; the
improvements landed later the same day and over the following day, and every one of them is an
**ancestor of** `5191de83f3da97559f21d8891c6c8afdf1cf473a`. The improved code has been inside the
immutable input all along.

Re-verified before dispatch:

| Claim                                     | Verification                                                                           |
| ----------------------------------------- | -------------------------------------------------------------------------------------- |
| `d838cfca` route-bound partials           | ancestor of pin — `refactor(fresh): bind partials to generated routes`, 08-13 17:42    |
| `b261f463` typed document form navigation | ancestor of pin — `refactor(fresh): adopt typed document form navigation`, 08-13 17:27 |
| `834a2b36` evidence-only                  | tree identical to pin; `docs(harness): pass umbrella implementation reevaluation`      |
| no newer product commit                   | `origin/master` == `5191de83…`                                                         |

Commits touching the two example routes after the comments and ancestral to the pin: `16b822c`,
`3332be2`, `f231ecb`, `0d00c28`, `0acf521`, `aeee408`.

Measured staleness of the comments against the pinned source:

| Route                           | Comment claims | At comment time | At pin        | Delta      |
| ------------------------------- | -------------- | --------------- | ------------- | ---------- |
| `…/session/[session]/index.tsx` | 119 / 117      | 121             | **94 / 92**   | −25 (−21%) |
| `…/channel/[channel]/index.tsx` | 208 / 204      | 208             | **181 / 178** | −27 (−13%) |

Disposition: **no fresh PLAN-EVAL required.** This is an evidence/publication correction inside the
approved architecture and the unchanged baseline — the pin, the equivalence contract, the evidence
vocabulary, the matrix columns, and every other locked decision are untouched, so S1 and S2
sign-offs stand at `4e6d52b3d`. The leaf was instructed to stop and report if the current
implementation actually breaks the equivalence contract, changes the mechanism-matrix shape, or
invalidates the presentation/domain-held-constant premise, since those would be locked-plan changes
needing a gate.

Dispatched to the preserved thread `019ffcc9-16c2-7573-b7f6-d627172408e8` (PID `60595`); no
replacement sender. The brief also warns that the coordinator's "obsolete pin" wording does not
apply: the S2 manifest, procedure, and measurements are correct at this pin and must not be edited
to manufacture a change. S3 remains held until the rewrites are verified.

## 2026-08-15 — the agent-docs refresh cascades into a `packages/**` generated asset

The authorized CI repair fixed its target and exposed a dependent staleness one layer down. Both
facts are established by execution, not inference.

**The authorized repair worked.** `d4a0a8340` refreshed `.llm/assets/agent-docs/prose.json.gz` and
`provenance.json`. Verified by the orchestrator at that head: `check:agent-docs-prose` raw exit `0`,
`"fresh":true`, `"stalePaths":[]`. The regenerated bundle's `sha256`
`6f25560210cae276a3a5149e7315b1e9682406acdfe342cadbe1c7f35c629efb` and `uncompressedBytes` `4783855`
match exactly the values the pre-fix checker had computed as expected, confirming this was purely a
stale-asset problem and the regeneration is the precise fix. The CI step that previously failed —
`quality` → **"Agent docs corpus freshness"** — is no longer the failing step.

**A different step now fails.** At `d4a0a8340`, run `31870102809` job `94977326331`, `quality` fails
at step **#14 "Generated asset freshness"**, which runs gate `assets-barrel`
(`.github/workflows/ci.yml:376-381`), i.e. `check:assets-barrel`.

**Root cause, established by reading the generator and running it.**
`.llm/tools/generate-cli-assets-barrel.ts` reads `.llm/assets/agent-docs/provenance.json` at line
382 and `.llm/assets/agent-docs/prose.json.gz` at line 389, and emits
`packages/cli/src/kernel/assets/agent-docs.generated.ts`. Refreshing the agent-docs bundle therefore
_necessarily_ invalidates that embedded copy. Running `deno task gen:assets-barrel` in the leaf
worktree modifies exactly one tracked file —
`packages/cli/src/kernel/assets/agent-docs.generated.ts` — an 11-insertion/6-deletion delta carrying
`sourceCommit` `6f9620c0c` → `c8e3f26d8` and the new byte counts. The orchestrator restored that
file immediately both times; the leaf worktree is clean.

**This is not a leaf error.** The repair brief forbade `packages/**` changes, and the leaf obeyed
exactly. The dependency is structural: the docs bundle is an input to a CLI-embedded generated
asset, so the two cannot be refreshed independently.

Disposition: **escalated, not resolved.** Completing this repair requires regenerating one file
under `packages/**`, which sits outside this docs lane's authorized surface and outside the boundary
this orchestrator set. It is generated output rather than hand-written product code, and its only
change is the provenance/byte-count triple that follows mechanically from the already-authorized
bundle refresh — but the authorization is the coordinator's to give, not this lane's to assume. No
`packages/**` file was committed.

Recommendation: authorize one bounded follow-up running `deno task gen:assets-barrel`, committing
only `packages/cli/src/kernel/assets/agent-docs.generated.ts`, and proving `check:assets-barrel`
through the structured gate wrapper. Leaving the two assets refreshed while the embedded copy stays
stale is the one outcome to avoid — it keeps CI red and leaves the CLI shipping a bundle that no
longer matches the published docs.

## 2026-08-15 — correction: this lane's "CI green 20/20" readiness conclusion was wrong

**The claim.** After the `assets-barrel` amendment this orchestrator reported `pr-checks PASS` at
`d24c3fa03` — "20 checks, 0 current failures" — and offered it as a readiness signal in both the
topic journal and PR comment `5301061539`.

**The contradiction.** GitHub Actions run `31870831715`, job `94979108152`, at that exact head, is a
terminal `quality` **failure** at step **#15 "Publish asset freshness"**. The job completed at
`2026-08-15T07:01:10Z`; this lane's `agentic:pr-checks` snapshot was taken at `07:01:11Z` — **one
second later** — and did not reflect it. The tool was not wrong so much as raced; the error was this
orchestrator's, for treating a single tool snapshot as a terminal CI verdict instead of confirming
against the authoritative Actions run.

**Why it matters beyond this instance.** The same mistake pattern has now appeared three times in
this run: relaying a normalized digest without reproducing it, signing off cycle-1 Tier-A without
tracing a `Measured` label to a published input, and now reporting CI green from a snapshot that a
completed run contradicts. Each time the failure was accepting a convenient positive signal rather
than confirming the underlying fact. The correction is not "distrust `pr-checks`" — it is that a
readiness claim requires the terminal state of the specific workflow run at the exact head, read
from Actions, and a snapshot taken within seconds of a job completing is not that.

**Disposition.** Recorded append-only, correcting the record rather than editing the earlier claim.
No readiness was ticked on the strength of the wrong conclusion: no Definition-of-Done box was
checked, nothing was readied further, merged, relabelled, or started as a next leaf. The PR comment
carrying the claim stays as posted; this entry is its correction.

## 2026-08-15 — third cascade layer, and the full freshness closure enumerated

`.llm/tools/generate-publish-assets.ts:34-43` lists `.llm/assets/agent-docs/prose.json.gz`,
`provenance.json`, and `packages/cli/src/kernel/assets/agent-docs.generated.ts` among its inputs and
emits `packages/mcp/src/publish-assets.generated.ts`. The two authorized amendments therefore
invalidated a third derived asset. Reproduced locally: `deno task gen:publish-assets --check` exits
`1` with "publish assets are stale: packages/mcp/src/publish-assets.generated.ts".

Rather than fix one layer and wait to discover another, this lane enumerated and executed **every**
freshness check in the repository before dispatching:

| Check                     | Exit | State                 |
| ------------------------- | ---- | --------------------- |
| `check:agent-docs-prose`  | `0`  | closed at `d4a0a8340` |
| `check:assets-barrel`     | `0`  | closed at `d24c3fa03` |
| `check:publish-assets`    | `1`  | the remaining layer   |
| `check:mcp-export-corpus` | `0`  | clean, not implicated |

`publish-assets.generated.ts` is consumed by runtime code, not by another generator, so nothing
regenerates from it. This is expected to be the terminal layer — stated as an evidence-backed
expectation, not a guarantee; a fifth layer would be reportable information.

The brief also declines to prescribe exact scoped fmt/lint invocations for `packages/mcp`. This lane
has twice prescribed scoped wrappers on paths root `deno.json` excludes, and the author correctly
refused both. The author is instead asked to check `fmt.exclude`/`lint.exclude` against
`packages/mcp/**` first and record what actually applies.
