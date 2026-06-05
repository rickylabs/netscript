# Escalation Protocol

Companion to `supervisor.md` § 4. Run this review after **every** phase-group
merge in a supervisor run. Its job is to catch cross-cutting consequences of a
merged group before the next group launches.

## 1. Collect sub-group artifacts

Read from the merged group's run dir:

- `drift.md` — entries with severity `significant` or `architectural`.
- `worklog.md` § Decisions — decisions not already in the supervisor plan.
- `evaluate.md` — evaluator notes or conditions.
- `context-pack.md` § Open Questions — anything unresolved.

## 2. Classify each escalation

| Category | Action |
|----------|--------|
| **New locked decision** | Add to supervisor `drift.md` + update `plan.md` |
| **Dependency-graph change** | Update the dependency reference, log in `drift.md`, assess impact on pending groups |
| **Public-surface change** | Log in `drift.md`; update the relevant design/research doc if needed |
| **Rescope needed** | Create `escalations/<group>-rescope.md`, update `phase-registry.md`, notify the user (§ 4) |
| **Debt accepted** | Add to `debt/arch-debt.md`, log in `drift.md` |
| **No escalation** | Record "clean merge, no escalations" in `worklog.md` |

## 3. Impact assessment

For each escalation, answer:

1. Does this affect any pending group's plan?
2. Does this change the group ordering?
3. Does this change the dependency graph?
4. Does the user need to make a decision?

If any answer is **yes**, **stop and brief the user** before launching the next
group.

## 4. Rescope protocol

When a group's evaluator returns `FAIL_RESCOPE`, or the escalation review finds
a blocking cross-cutting concern:

1. Create `escalations/<group>-rescope.md` with:
   - what triggered the rescope,
   - which groups are affected,
   - proposed resolution (split, reorder, defer, absorb),
   - impact on timeline.
2. Update `phase-registry.md` with the rescope status.
3. **Stop and consult the user.** Do not proceed to the next group.
