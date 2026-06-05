# Run Loop

Harness v2 has five phases: Bootstrap, Execute, Gate, Evaluate, Close.

## 1. Bootstrap

1. Identify the scope and affected package/plugin surfaces.
2. Select the smallest doctrine archetype that fits.
3. Apply any scope overlay for frontend, service, or docs work.
4. Read `debt/arch-debt.md` for relevant open debt.
5. Read the current doctrine verdict in
   `doctrine/10-codebase-verdict-and-handoff.md`.
6. Produce or update `plan.md`.

The plan must name the archetype, the current doctrine verdict, the expected
gates, and any debt implications.

## 2. Execute

Execute has two mandatory stages: **Design** then **Sliced implementation**.
Skipping Design or merging all slices into one commit is a process failure the
evaluator will flag.

### 2a. Design Checkpoint

Before creating implementation files, record a `### Design` section in
`worklog.md` with:

1. **Public surface** — exported functions, entry points, CLI commands.
2. **Domain vocabulary** — types, interfaces, and discriminated unions the
   implementation needs today (not speculatively).
3. **Ports** — consumed abstractions. Only create a port when the plan names a
   real external dependency or a testability seam the slice exercises.
4. **Constants** — finite domain values as constants with derived union types.
   If the domain has known IDs (suites, gates, phases, plugins), name them here
   before creating files.
5. **Commit slices** — ordered list. Each slice names:
   - what it introduces,
   - which gate proves it works,
   - which files it creates or changes.
6. **Deferred scope** — capabilities intentionally left out and why.
7. **Contributor path** — how a new developer navigates the result to add a
   feature (e.g., "copy an existing gate definition, add it to the composition
   file, run the gates command").

The design checkpoint proves the generator understood the domain before
expanding files. Every file created during implementation must trace back to a
concept named here. Files that exist only to satisfy a folder template without
a design-checkpoint entry are speculative seams — remove them before committing.

### 2b. Sliced Implementation

1. Implement one commit slice at a time in the order defined in Design.
2. After each slice:
   - run the slice's named gate,
   - commit with a message that names what the slice proves,
   - append `commits.md`,
   - update `context-pack.md`.
3. Update `worklog.md` after significant steps.
4. Append `drift.md` when facts diverge from the plan, RFC, or doctrine.

### Concept of Done (per slice)

A slice is done when:

- every file in the slice is reachable from the public surface or a test,
- no file exists to satisfy a folder shape without being used,
- constants replace string literals for finite domain vocabularies,
- public functions have a JSDoc one-liner (what it does, not implementation),
- a contributor can extend the slice by reading one file and copying a pattern,
- the slice's gate passes.

## 3. Gate

Before handing off, the generator runs the full gate set required by the
archetype matrix and scope overlays:

- static gates,
- fitness gates when implemented or explicitly pending for Phase A,
- runtime gates when the run touches runtime behavior,
- consumer gates when exports or downstream contracts change.

Record results as tables in `worklog.md`.

## 4. Evaluate

Evaluation is a separate session. The evaluator's operating instructions live
in `evaluator/protocol.md`.

1. Read `evaluator/protocol.md` and `evaluator/verdict-definitions.md`.
2. Read the archetype profile, overlays, plan, worklog, context pack, drift, and
   commits.
3. Verify the Design checkpoint exists in `worklog.md` and was followed.
4. Verify commit slices match the Design checkpoint plan.
5. Run the applicable gate set independently.
6. Fill `evaluate.md` from `templates/evaluate.md`.
7. Emit `PASS`, `FAIL_FIX`, `FAIL_RESCOPE`, or `FAIL_DEBT`.

Two `FAIL_FIX` cycles are allowed. After the second, escalate to the user.

## 5. Close

1. Update `context-pack.md`.
2. Update `debt/arch-debt.md` for any created or closed debt entries.
3. Promote repeated lessons to `lessons/` only when the promotion rule is met.
4. Write a dated `.llm/YYYY-MM-DD-description.md` session record after
   significant work.
