# Phase Group Registry: <supervisor>

The group map for a supervisor run. One row/section per **phase group** (a capability-scoped
deliverable = one branch + worktree + nested run + sub-PR + evaluator passes: PLAN-EVAL before
implementation, IMPL-EVAL after). See `workflow/supervisor.md`.

## Run Metadata

| Field              | Value                 |
| ------------------ | --------------------- |
| Supervisor run ID  | `<supervisor-run-id>` |
| Integration branch | `feat/<supervisor>`   |
| Base branch        | `<base>`              |

## Status Legend

| Status            | Meaning                                                      |
| ----------------- | ------------------------------------------------------------ |
| `planned`         | In the map, not started                                      |
| `active`          | Group branch/worktree launched; implementation in progress   |
| `plan-evaluating` | Handed to a separate PLAN-EVAL session                       |
| `evaluating`      | Handed to a separate IMPL-EVAL session                       |
| `merged`          | Evaluator `PASS` (or accepted `FAIL_DEBT`); merged `--no-ff` |
| `blocked`         | Waiting on a dependency or a user decision                   |
| `rescope`         | Under rescope (see `escalations/`)                           |

## Group <X> — <name>

| Field         | Value                            |
| ------------- | -------------------------------- |
| Group branch  | `feat/<supervisor>/<group>`      |
| Nested run ID | `<supervisor>-<group>--<suffix>` |
| Archetype(s)  | `<N - name>` + overlays          |
| Status        | `<planned/active/…>`             |
| Merge commit  | `<sha or —>`                     |

### Pre-conditions

- <what must be true / which prior group must be `merged` first>

### Inherited debt

- <open entries from prior groups this group must respect or close>

### Phase 0 reading

- <specific plan/research/decision files the group agent must read>

### Surfaces touched

- <packages / plugins / apps / services this group changes>

### Success criteria

- <the gate(s) that prove this group is done>

### Notes

- <parallel decision, risks, sequencing notes>

---

## Summary Table

| Group | Status     | Depends on     | Surfaces     | Merge commit |
| ----- | ---------- | -------------- | ------------ | ------------ |
| `<X>` | `<status>` | `<group/none>` | `<surfaces>` | `<sha/—>`    |

## Base-Sync Log

| Date           | Base sha merged | Result              | Notes     |
| -------------- | --------------- | ------------------- | --------- |
| `<YYYY-MM-DD>` | `<sha>`         | `<clean/conflicts>` | `<notes>` |
