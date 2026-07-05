# Run Loop

Harness runs in nine phases: Bootstrap, Research, Plan & Design, Plan-Gate, Implement, Gate,
Evaluate, Release, Close.

The loop has **two evaluator passes**: a cheap **PLAN-EVAL** at the Plan-Gate, before any
implementation slice, and the full **IMPL-EVAL** at Evaluate. The Plan-Gate is a hard stop — see
§ 4. Both evaluator passes are separate sessions.

## 1. Bootstrap

1. Identify the scope and affected package/plugin surfaces.
2. Select the smallest doctrine archetype that fits.
3. Apply any scope overlay for frontend, service, or docs work.
4. Read `debt/arch-debt.md` for relevant open debt.
5. Read the current doctrine verdict in `docs/architecture/doctrine/10-codebase-verdict-and-handoff.md`.
6. Seed `plan.md`.

## 2. Research

Produce `research.md` before locking the plan. Research exists to make the plan true, not merely
plausible.

1. **Re-baseline** — if any plan, audit, or run was carried in from another branch or repo,
   re-derive its facts against the current `main`. A carried-in plan is a starting skeleton, never
   ground truth. Record what changed.
2. **Findings** — the concrete facts the plan depends on (existing dispatch infrastructure, real
   counts, stub depth, empty arrays, legacy config keys). State each finding so a reviewer can
   verify it.
3. **jsr-audit surface scan** (package/plugin waves) — apply the `jsr-audit` skill's publishability
   rubric to the _current_ public surface and record the slow-type / surface risks the plan must
   address.
4. **Open questions** — anything unresolved the plan must close.

## 3. Plan & Design

One phase, two artifacts; it ends by putting the draft PR into the **"Plan & Design — READY FOR
REVIEW"** state.

### 3a. plan.md

`plan.md` names:

- the archetype and the current doctrine verdict;
- the expected gate set (from the archetype matrix) and scope overlays;
- **architecture decisions LOCKED** with rationale;
- an **open-decision sweep** — every decision still open, each marked "safe to defer" or "must
  resolve now"; any decision that would force rework if deferred must be resolved before the
  Plan-Gate;
- a **risk register** with mitigations;
- debt implications;
- deferred scope.

### 3b. Design checkpoint (worklog.md)

Before creating implementation files, record a `## Design` section in `worklog.md` with:

1. **Public surface** — exported functions, entry points, CLI commands.
2. **Domain vocabulary** — types, interfaces, discriminated unions the implementation needs today
   (not speculatively).
3. **Ports** — consumed abstractions. Only create a port when the plan names a real external
   dependency or a testability seam the slice exercises.
4. **Constants** — finite domain values as constants with derived union types. Name known IDs
   (suites, gates, phases, plugins) here before creating files.
5. **Commit slices** — ordered list. Each slice names what it introduces, which gate proves it
   works, and which files it creates or changes. Target < 30.
6. **Deferred scope** — capabilities intentionally left out and why.
7. **Contributor path** — how a new developer navigates the result to add a feature.

Every file created during implementation must trace back to a concept named here. Files that exist
only to satisfy a folder template are speculative seams — they do not belong in the plan.

### 3c. Commit and open the plan PR

Commit the plan + design artifacts. Put the draft PR into the **"Plan & Design — READY FOR REVIEW"**
state with a body summarizing findings, locked decisions, commit slices, risk register, and selected
gates (the PR #95 shape). The body must say: _do not merge until the Plan-Gate and the final
evaluator pass are complete._

## 4. Plan-Gate (PLAN-EVAL)

The Plan-Gate is a **hard stop**. **No implementation slice may be committed until the Plan-Gate
verdict is `PASS`** — or the user explicitly waives it in writing.

PLAN-EVAL is a **separate session**. The plan evaluator:

1. reads `evaluator/plan-protocol.md` and `gates/plan-gate.md`;
2. reads `research.md`, `plan.md`, and the `## Design` section;
3. checks every box in `gates/plan-gate.md`;
4. writes `plan-eval.md` from `templates/plan-eval.md`;
5. emits `PASS` or `FAIL_PLAN`.

`FAIL_PLAN` returns the plan with the specific unchecked items. Two `FAIL_PLAN` cycles are allowed
before escalation to the user.

## 5. Implement

1. Implement one commit slice at a time in the Design order.
2. After each slice:
   - run the slice's named gate,
   - **Slice review gate (Amendment A1)** — before the sign-off commit, the Tier-A supervisor
     substantively reviews the landed slice (correctness, coherence with already-landed slices,
     doctrine-fit, gaps/overreach). No implementation lane (Tier B/C/D) self-certifies; passing
     automated gates is not a sign-off. See `workflow/lane-policy.md` §"Slice review gate (Amendment
     A1)" for the lane-agnostic invariant this step enforces.
   - commit (the **sign-off commit**, the supervisor's) with a message that names what the slice
     proves, not what it contains,
   - push, then comment on the draft PR with the slice scope, commit hash, and gate evidence — the
     draft-PR commit list + per-slice PR comments are the commit trail (there is no `commits.md`),
   - update `worklog.md` + `context-pack.md` as part of the same slice (a slice whose commit does not
     touch the run dir is incomplete),
   - run the **post-slice reconcile loop** (below) and write one reconcile note in `worklog.md`.
3. Append `drift.md` when facts diverge from the plan, RFC, or doctrine.

Before committing, inspect `git status --short` and do not fold in unrelated user changes. If an
unrelated change shares a file you must edit, work with the current content instead of reverting it.

### Concept of Done (per slice)

A slice is done when:

- every file in the slice is reachable from the public surface or a test,
- no file exists to satisfy a folder shape without being used,
- constants replace string literals for finite domain vocabularies,
- public functions have a JSDoc one-liner (what it does, not how),
- a contributor can extend the slice by reading one file and copying a pattern,
- the slice's gate passes.

### Post-slice reconcile loop

After each slice completes (and before starting the next), reconcile the GitHub surface with the
run:

1. **Sweep related issues** — check their state, any needed `status:`/`area:`/milestone moves, and
   that the resolving PR carries the right closing keyword (`Closes #N` for full resolution, a bare
   reference for partial work — see `netscript-pr`).
2. **Read new issue/PR comments** since the last sweep (evaluator verdicts, reviewer notes,
   OpenHands output).
3. **Record readjustments** — fold plan changes into `plan.md`; append `drift.md` when reality
   diverged from the plan or doctrine.

Write **one reconcile note per slice** in `worklog.md`.

## 6. Gate

Before handing off, the generator runs the full gate set required by the archetype matrix and scope
overlays:

- static gates,
- fitness gates when implemented or explicitly pending for Phase A,
- runtime gates when the run touches runtime behavior,
- consumer gates when exports or downstream contracts change,
- **jsr-audit** as a required gate for package/plugin waves.

Gate **evidence is wrapper-sourced and mandatory**: type-check / lint / format from the scoped
wrappers (`.llm/tools/run-deno-check|lint|fmt.ts`), doc-lint from `deno task doc:lint`, and
dependency / publishability from the `deno task deps:*` wrappers — raw root `deno check .` /
`deno fmt --check` and hand-rolled registry curls are non-verdicts. The full tool surface is indexed
in `workflow/tooling.md`; the command map and gotchas live in the **netscript-tools** and
**netscript-deno-toolchain** skills (do not restate them here).

Record results as tables in `worklog.md`.

## 7. Evaluate (IMPL-EVAL)

The final evaluation is a separate session, distinct from PLAN-EVAL. Operating instructions live in
`evaluator/protocol.md`.

1. Read `evaluator/protocol.md` and `evaluator/verdict-definitions.md`.
2. Read the archetype profile, overlays, research, plan, plan-eval, worklog, context pack, drift,
   and the draft-PR commit list + per-slice PR comments (the commit trail).
3. Verify the Design checkpoint exists and was followed.
4. Verify commit slices match the Design checkpoint.
5. Verify the Plan-Gate passed (`plan-eval.md` = `PASS`) before implementation began. Implementation
   that started without a Plan-Gate `PASS` is a process failure — record it.
6. Run the applicable gate set independently.
7. Fill `evaluate.md` from `templates/evaluate.md`.
8. Emit `PASS`, `FAIL_FIX`, `FAIL_RESCOPE`, or `FAIL_DEBT`.

Two `FAIL_FIX` cycles are allowed. After the second, escalate to the user.

## 8. Release (release-cutting runs only)

Runs that cut or gate a release call the hard release gates here — **`e2e-cli-prod`,
`scaffold.runtime`, and the release-gate class**. The harness-side single source for this class —
which gate is required when, and the evidence bar — is `gates/release-gates.md`. This phase does
**not** define the gates themselves: their definitions, sequencing, and race-free production
verification are owned by **#309's release engineering** (see the `netscript-release` skill).
Reference and call them here; do not redefine them. For a run that does not cut a release, this phase
is a no-op.

## 9. Close

1. Update `context-pack.md`.
2. Update `debt/arch-debt.md` for any created or closed debt entries.
3. Promote repeated lessons to `lessons/` only when the promotion rule is met.
4. Write a dated `.llm/YYYY-MM-DD-description.md` session record.
