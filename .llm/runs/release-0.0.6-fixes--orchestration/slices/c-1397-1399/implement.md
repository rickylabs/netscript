use harness

# Slice C — E2E gate-set truth (#1397 then #1399)

You are the implementation agent for PR C of the NetScript 0.0.6 **fixes lane**. Two issues, one
surface (`packages/cli/e2e/`), in a **required order**: #1397 first, then #1399.

| Field | Value |
| --- | --- |
| Worktree | `/home/codex/repos/ns006-f-c-e2e-gates` |
| Branch | `fix/1397-1399-e2e-gate-set-truth` |
| Base | `origin/main@01aa12b67` |
| Route | Codex · OpenAI · GPT-5.6 Sol · **low** (`light_implementation`) |
| Slice dir | `/home/codex/repos/netscript-006-fixes/.llm/runs/release-0.0.6-fixes--orchestration/slices/c-1397-1399/` |
| PLAN-EVAL | **N/A** — both fixes are specified in their issues (run `drift.md` D-2) |
| IMPL-EVAL | **Owner waiver — conditional.** The waiver holds only if you demonstrate strong negative tests (guard red before the fix, green after, by real execution). Weak or absent demonstration ⇒ the waiver does not apply and a separate Fable 5 · medium IMPL-EVAL runs. This is in your hands. |

**Read `/home/codex/repos/netscript-006-fixes/.llm/runs/release-0.0.6-fixes--orchestration/context-pack.md` first.**

## SKILL

- `netscript-harness` — evidence discipline, evaluator separation, run artifacts.
- `netscript-cli` — **canonical on the CLI/E2E suites, gates, and what each suite proves.**
- `netscript-tools` — scoped validation wrappers, gate evidence, git ground truth.
- `netscript-doctrine` — required before changing anything under `packages/**`.
- `netscript-pr` — branch/PR lifecycle, labels, milestone, closing keywords.
- `rtk` — prefix read-heavy `git`/`gh`/`grep`; `rtk proxy` for `deno task`.

## Order matters

Do **#1397 first**, as a self-contained commit. #1399 pins every suite's deferred-gate set, and
those sets are exactly what #1397 changes. Pinning first and fixing second would mean writing
expectations against sets you are about to change. One commit per issue.

## Issue 1 — #1397: mysql/mssql silently drop `behavior.service-health`

**Root cause, already located — verify it, do not re-derive it from scratch:**

```
packages/cli/e2e/suites/scaffold/capability-suites.ts:155-161
  const POSTGRES_ONLY_RUNTIME_GATES = new Set<GateId>([
    GATE.DATABASE_MIGRATION_ARTIFACTS,
    GATE.RUNTIME_CAPTURE_DB_ALLOCATION_FIRST,
    GATE.RUNTIME_CAPTURE_DB_ALLOCATION_SECOND,
    GATE.BEHAVIOR_SERVICE_HEALTH,      // ← this one
    GATE.BEHAVIOR_LIVE_DB_ENDPOINT,
  ]);

packages/cli/e2e/suites/scaffold/capability-suites.ts:~299  runtimeGateIds()
  if (POSTGRES_ONLY_RUNTIME_GATES.has(id)) return database === 'postgres';
```

So selecting `mysql` or `mssql` removes `behavior.service-health` from the executed set while the
run still reports a green aggregate. A green `scaffold.runtime` on mysql/mssql currently asserts
strictly less than the same green on postgres, and nothing in the output says so.

**The decision you must make and justify:** is `behavior.service-health` genuinely
postgres-specific, or was it swept into that set by proximity? Look at what the gate actually
asserts. If it checks the scaffolded app's service health endpoint, it is very likely
engine-agnostic and belongs in the executed set for all engines — that is the better fix. If it
genuinely depends on postgres, then per acceptance it must be a **stated exclusion** with a named
reason, not an absence.

### Acceptance (verbatim from #1397)

- [ ] Selecting `mysql` or `mssql` either keeps `behavior.service-health` in the executed set, or
      reports its removal explicitly in the suite output rather than dropping it silently
- [ ] If the gate genuinely cannot run on those engines, the reason is named in the suite definition
      and the run reports it as a stated exclusion rather than an absence
- [ ] A test asserts the executed gate set for each database override, so a future silent drop fails
- [ ] The postgres set is unchanged

Box 4 is a real constraint: **do not change the postgres gate set at all.** Prove it — assert the
postgres set before and after.

## Issue 2 — #1399: only the runtime tiers pin their deferred-gate set

PR #1395 introduced deferred-gate machinery: a gate can be deferred out of a suite's critical
selection while remaining registered, reported as a non-critical `SKIPPED` step titled
`DEFERRED #<issue>`. `suite-registry_test.ts` pins the deferred set for `scaffold.runtime` and
`scaffold.runtime.sqlite` **exactly** — but **no equivalent pin exists for any other suite**, so a
deferral added elsewhere fails no test.

The pin is what makes a deferral a deliberate, reviewable act rather than a quiet coverage
reduction. Where it is absent, deferring a gate is a one-line change nothing objects to.

### Acceptance (verbatim from #1399)

- [ ] Every suite's deferred-gate set is pinned by a test, with the empty set pinned explicitly
      where nothing is deferred
- [ ] Adding a deferral to any suite fails that test until the expectation is updated with its
      owning issue
- [ ] The pin names the owning issue for each deferral, so a deferred gate always has a traceable
      reason
- [ ] The existing runtime-tier pins are unchanged

"**Every** suite" means enumerate the registry rather than hand-listing suites — a hand-written list
is itself the defect class (a new suite would be unpinned and nothing would say so). Prefer a test
that iterates every registered suite and asserts against an expectation map, failing on both a
missing expectation and an unexpected deferral.

## The negative tests are the deliverable

This lane exists because checks reported clean while not doing their job. **A test that passes both
before and after your fix proves nothing here.** For each issue, demonstrate by real execution:

1. **#1397** — with the fix in place, restore the old behaviour (put `BEHAVIOR_SERVICE_HEALTH` back
   into the postgres-only set, or otherwise re-drop it) and show your new test go **red**. Restore.
2. **#1399** — add a throwaway deferral to a suite that has none and show the pin test go **red**.
   Remove it. Also show that removing an expectation entry fails.

Paste both red outputs and the subsequent green into `evidence.md`. This is what earns the IMPL-EVAL
waiver; without it the waiver does not apply.

## Gates

```
rtk proxy deno task check
rtk proxy deno task test
rtk proxy deno task lint
rtk proxy deno task fmt:check
deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/cli --ext ts,tsx
rtk proxy deno task quality:gate
```

`quality:gate` is **required** — you are touching `packages/**`, and the framework-wave gate law
says the scoped check/lint/fmt wrappers are not gate-complete on their own. A green wrapper over
code containing `any` or `as unknown as` is a false pass (#745).

Also: `rtk proxy deno task e2e:cli suites` and `rtk proxy deno task e2e:cli gates scaffold.runtime`
to show the resulting gate sets — these are cheap and directly demonstrate the fix.

### Expensive gate — ask first

The full `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` is **serialised across
this lane**. Do **not** start it on your own initiative: another slice may hold it, and three
concurrent runs in 0.0.4 produced two failures that were contention, not defects. If you believe it
is needed, say so and wait for the orchestrator to grant it.

## Known hazards

- **`deno fmt` rewraps prose and can silently undo a scripted string edit.** Verify every edit
  after formatting.
- **`deno.lock`:** do not commit it; never `deno cache --reload`.
- Do not add `deno-lint-ignore`, `as unknown as`, or `@ts-ignore` — pre-merge check 3 scans the
  diff for exactly these, and test machinery is the usual place they creep in.

## Deliverables

1. Two commits on `fix/1397-1399-e2e-gate-set-truth` — #1397 first, then #1399.
2. `/home/codex/repos/netscript-006-fixes/.llm/runs/release-0.0.6-fixes--orchestration/slices/c-1397-1399/evidence.md`
   — every gate command with **real, untruncated** output, plus both negative-test demonstrations
   (red → green).
3. A **draft PR against `main`** via `netscript-pr` conventions:
   - `Closes #1397` and `Closes #1399` in the **body**.
   - Labels: `type:fix`, `type:test`, `area:cli`, `gate:e2e`, `priority:p2`, exactly one `status:`.
   - Milestone **`0.0.6`**.
   - Both issues' acceptance boxes reproduced, ticked **only** where truthfully done.
4. Report the PR number back. **Do not merge.**

If you hit a red gate you cannot turn green, **escalate rather than going idle** — write the blocker
into `evidence.md` and say so.
