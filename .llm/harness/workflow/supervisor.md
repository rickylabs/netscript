# Supervisor Workflow

Operating protocol for **supervisor runs** — harness runs that aggregate several
capability-scoped **phase groups**, where each group is its own branch +
worktree + nested harness sub-run + sub-PR + evaluator pass, merged into one
integration branch that PRs to the base branch.

> **Provenance.** Promoted from the plugin-platform supervisor run
> (`feat/plugin-platform-impl`, PR #96), which proved this model across 8 groups
> (sub-PRs #86–#95) and satisfied its own § 8 promotion criteria. The original
> lives at `.llm/tmp/run/feat-plugin-platform-impl--supervisor/` for history.

## When to use a supervisor run

Use a supervisor run when one deliverable is too large for a single harness run
and splits into **two or more phase groups** with dependency ordering (a
multi-wave package program, a platform rewrite, a release program). A **phase
group** is sized to *one reviewable PR with its own evaluator pass* — never a
single command or file. Single-surface changes use the normal `run-loop.md`.

## Run layout

- **Integration branch**: `feat/<supervisor>` (off the base branch).
- **Supervisor run dir** `.llm/tmp/run/<supervisor-run-id>/`:
  - base templates — `plan.md`, `worklog.md`, `context-pack.md`, `drift.md`,
    `commits.md`;
  - **`phase-registry.md`** from `templates/phase-registry.md` — the group map,
    ordering, and live status;
  - `final-pr-handoff.md` + `escalations/` — produced as groups merge.
- **Each phase group**: branch `feat/<supervisor>/<group>`, a worktree, and a
  nested run dir `<supervisor>-<group>--<suffix>/` with the standard run
  artifacts (its own Design checkpoint + evaluator pass).

## 1. Pre-group checklist

Before launching a phase group:

- [ ] Previous group has evaluator verdict `PASS` (or `FAIL_DEBT` with accepted
      entries in `debt/arch-debt.md`).
- [ ] Integration branch is clean (`git status` shows no uncommitted changes).
- [ ] Base-branch sync is current (see § 5).
- [ ] `drift.md` reviewed — no unresolved `architectural` drift blocking the
      next group.
- [ ] `phase-registry.md` updated with the new group's status → `active`.

## 2. Group launch protocol

```bash
# 1. From the integration worktree, branch the group off the integration branch
git checkout feat/<supervisor>
git pull
git checkout -b feat/<supervisor>/<group>

# 2. Create the group worktree under the gitignored .worktrees/ root
git worktree add .worktrees/<group> feat/<supervisor>/<group>

# 3. Scaffold the group's nested harness run dir from templates/
#    .llm/tmp/run/<supervisor>-<group>--<suffix>/

# 4. Push the group branch and open a DRAFT sub-PR against the integration branch
git push -u origin feat/<supervisor>/<group>
#    base = feat/<supervisor>, head = feat/<supervisor>/<group>
```

**Every phase group is its own draft PR against the integration branch**
(`feat/<supervisor>/<group>` → `feat/<supervisor>`), exactly like the PR #96
group sub-PRs (#86–#95) and the S0 supervisor (PR #98). All actual implementation
— each package refactor — happens **only** in the group's worktree on its own
branch, never directly on the integration branch.

Brief the group agent with `templates/agent-briefing.md`. The group agent then
runs the normal `run-loop.md` (Design checkpoint → sliced implementation →
gates), produces its run artifacts, and hands off to a **separate evaluator
session**. On `PASS`, the integration owner merges the draft sub-PR `--no-ff`
(§ 3) and it closes.

## 3. Merge protocol

After a group's evaluator returns `PASS`:

1. **Pre-merge** — verify the integration branch is current and the group's
   `evaluate.md` shows `PASS`.
2. **Merge (preserve history):**
   ```bash
   git checkout feat/<supervisor>
   git merge feat/<supervisor>/<group> --no-ff \
     -m "merge(supervisor): <group> (<phases>)"
   ```
   On conflict: **stop, do not force-resolve.** Take the group version for
   generated artifacts and re-generate; merge both entries for `deno.json`
   workspace members; analyze source conflicts manually. Log conflict +
   resolution in `drift.md` as `significant`.
3. **Post-merge verification** — `deno check` (with project unstable flags) on
   affected surfaces; forbidden-import check; affected tests.
4. **Update supervisor state** — `phase-registry.md` group → `merged` (record
   merge commit); `context-pack.md` group → Completed; `worklog.md` progress;
   append `commits.md`.

## 4. Escalation review

After every group merge, run the escalation review in
[`escalation.md`](./escalation.md): collect the merged group's drift/decisions/
open questions, classify, assess impact on pending groups, and **stop to brief
the user** if any escalation changes a pending group's plan, the group ordering,
the dependency graph, or needs a user decision.

## 5. Base-branch sync schedule

| Trigger | Action |
|---------|--------|
| Before starting each new group | merge base branch into integration |
| Base branch gets a significant commit to a touched surface | immediate sync |
| Never during an active group | wait for group close |

After sync: verify `deno check` passes, log the sync in `worklog.md`, log any
conflicts in `drift.md`.

## 6. Final integration merge / PR

After the last group passes evaluation:

- [ ] All groups `merged` in `phase-registry.md`.
- [ ] No unresolved `architectural` drift.
- [ ] No open `FAIL_*` verdicts in any group's `evaluate.md`.
- [ ] Workspace `deno check` + affected tests pass on the integration branch.
- [ ] End-to-end / parity gate for the program passes.
- [ ] `deno fmt --check` + `deno lint` pass on changed files.

Then open the supervisor PR to the base branch (the PR #96 shape): summary,
merged group/sub-PR list, validation snapshot, and links to
`final-pr-handoff.md` + `context-pack.md` + `phase-registry.md` + `drift.md`.

## 7. Close

1. Write `final-pr-handoff.md` (what merged, validation snapshot, follow-ups).
2. Update `debt/arch-debt.md` — close resolved, carry forward open.
3. Promote repeated lessons to `lessons/` when the promotion rule is met.
4. Write a dated `.llm/YYYY-MM-DD-*.md` session record.
5. Delete worktrees (keep branches for history).
