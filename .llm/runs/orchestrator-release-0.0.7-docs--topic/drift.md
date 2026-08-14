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
