use harness

## SKILL

Load `netscript-harness`, `netscript-doctrine`, `netscript-tools`, `netscript-deno-toolchain`,
`netscript-pr`, and `rtk`. Read `.llm/harness/gates/static-gates.md`.

# Brief — #1734 / PR #1736 bounded IMPL-EVAL repair (FAIL_FIX class)

## Standing

- Worktree `/home/agent/projects/netscript/worktrees/007-leaf-1736` (NAS path — the old
  `/home/codex/repos/...` path no longer exists).
- Branch `fix/fresh-query-hydration-readonly-state`, HEAD **`ed8a8e9ca9be2e72da4a00bff830caf260ee94ea`**.
  Base for scope diff: `21d516224fe35e92957f0998ee848bbf2024eda0`.
- The branch has **no upstream by design**. Push only with an explicit refspec:
  `git push origin HEAD:refs/heads/fix/fresh-query-hydration-readonly-state`. Never a bare `git push`.
- Draft **PR #1736**, `Closes #1734`, milestone `0.0.7`, labels `type:fix` / `area:fresh` /
  `priority:p1` / `status:impl`. **Leave it draft and do not change any label** — marking it ready is
  this repo's IMPL-EVAL dispatch trigger and is not yours to fire.
- `ed8a8e9ca` is the *evaluator-only* verdict commit on top of the product head `e537b2c1f`. It adds
  exactly `.llm/runs/fix-fresh-query-hydration-readonly-state--1734/impl-eval.md` and nothing else.
  **Build on `ed8a8e9ca`. Never reset, rebase away, or force over it** — it is the verdict artifact.

## What happened

IMPL-EVAL (Claude · Fable 5 · medium, opposite family, separate session) returned **`FAIL_IMPL`,
`FAIL_FIX` class** against `e537b2c1f`. Read the full verdict first:
`.llm/runs/fix-fresh-query-hydration-readonly-state--1734/impl-eval.md`.

Items 1–4 and 6 of the acceptance hold. The type-level design is **not** reopened. One finding
blocks: **F1**.

## F1 — the boundary guard rejects the package's own serialized state

`toMutableDehydratedState` in `packages/fresh/src/application/query/hydration.ts` validates the
**in-memory** shape returned by `dehydrateQueryClient()`. The package's own transport is JSON:
`QueryHydrationScript` → `JSON.stringify` → `readDehydratedState` → `JSON.parse` →
`hydrateFromDehydrated` (`src/application/query/hydration-script.tsx:64-66`). `JSON.stringify` drops
keys whose value is `undefined`, so `Object.hasOwn` checks that pass in memory fail on the wire.

Pre-fix this state hydrated. Post-fix it throws inside `HydrationBoundary`'s `useEffect`. That is a
runtime behaviour regression on the shipped server→island path.

## Supervisor verification — do not re-derive, but do read this, it extends the verdict

I reproduced the wire shape myself at this head with a throwaway test inside the worktree (deleted;
worktree left clean). A mutation paused while offline **after one failed attempt** — built through
the package's own `dehydrateQueryClient()` with its default `shouldDehydrateMutation`
(`mutation.state.isPaused`) — dehydrates and serializes to:

```text
PROBE isPaused=true status=pending failureCount=1
PROBE failureReasonIsError=true          (in memory)
PROBE dehydratedMutations=1
PROBE wireKeys=error|failureCount|failureReason|isPaused|status|variables|submittedAt
PROBE wireFailureReason={}
PROBE hasOwn(context|data|variables)=false|false|true
```

Two independent rejections on that one wire object:

1. `context` and `data` are gone → `isMutationState`'s `Object.hasOwn` requirements fail. This is F1
   as the evaluator stated it.
2. **`failureReason` survives as `{}`** → `isErrorOrNull(value.failureReason)` is **false**, so the
   guard *still* throws even after (1) is fixed.

The evaluator recorded the error-shape problem as an *observation* "outside the package's default
API", reached only by bypassing `dehydrateQueryClient`. **That scoping is too narrow and my probe
disproves it**: a paused mutation with a prior failure is squarely inside the default API and hits
it. Fixing only the `hasOwn` checks would leave the leaf still broken and would burn the next
IMPL-EVAL cycle. Both are therefore in your envelope.

Verify this yourself before you code — do not take my probe on faith. If you cannot reproduce
`wireFailureReason={}` reachable through `dehydrateQueryClient`, say so explicitly in `worklog.md`
and treat item 2 as unproven rather than silently dropping or silently keeping it.

## Authorized repair — this is the whole envelope

**R1 (required).** Validate the JSON-serializable shape, not the in-memory shape.

- Drop the `Object.hasOwn` requirements for `context`, `data`, and `variables` in `isMutationState`;
  absent means `undefined`, which is exactly what the field can legitimately be.
- Apply the same reasoning to `Object.hasOwn(value, 'data')` in `isQueryState` and state your call.
  Leaving one `hasOwn` on a JSON-dropped-`undefined` field while removing its twins is the
  inconsistency that produced this finding; if you keep it, justify why it is load-bearing there.
- **Keep every check that is genuinely load-bearing for `hydrate()`**: arrays for `mutations` /
  `queries`, object entries, `queryHash` / `queryKey` on queries, `state` present and an object, the
  `status` / `fetchStatus` enums, and the numeric fields. The guard must still reject the eight
  attack cases the evaluator enumerated (check 4 of the verdict) — re-run them and prove it.

**R2 (required, decide explicitly).** Make the error-shaped fields (`error`, `failureReason`,
`fetchFailureReason`) survive the JSON round trip without lying about their type.

The tension is real and you must resolve it in the open, not with a cast: upstream declares these
`Error | null`, and the wire can only carry `{}` or a serialized record. Forbidden constructs stand —
no `any`, no `as unknown as`, no `@ts-ignore`, no `@ts-expect-error`.

My recommendation, which you may overrule with a stated reason: **revive** a serialized error record
into a real `Error` at the boundary (preserving `message` where present). It yields the type upstream
actually declares, needs no cast, and is the honest inverse of a lossy serialization. It is a
deliberate behaviour change versus pre-fix (which passed `{}` straight through), so it must be
stated in the plan and pinned by a test.

**Stop and report — do not proceed — if** the honest fix requires changing anything exported from
`packages/fresh/src/application/query/query-types.ts` or `query/mod.ts`, or widening the public
`DehydratedState` contract. That is a scope decision for this lane, not an author decision. Report
via `worklog.md` and stop the turn.

**R3 (required).** Tests that would have caught this, crossing the boundary the package really uses.

- Round-trip through `JSON.stringify` / `JSON.parse` — ideally through
  `serializeDehydratedState` / `readDehydratedState` themselves, so the test pins the real transport
  rather than a hand-rolled imitation.
- Cover at minimum: a paused mutation (default `shouldDehydrateMutation`), a paused mutation whose
  `mutate()` was called with **no** variables, a paused mutation with a **prior failure** (the
  `failureReason={}` case above), and the existing success-query path.
- RED first: record the failing output at `ed8a8e9ca` before the fix, in a slice commit, exactly as
  the leaf's earlier slices did.

## Explicitly out of envelope

Nothing else. No refactor, no new exported symbol, no new file outside `packages/fresh/**` and this
leaf's run dir, no dependency or range change (`^5.101.0` stays — decision D1 was upheld by the
evaluator), no `deno.lock` churn, no workflow edit, no touching another package. Do not modify or
delete any pre-existing test. Do not edit `impl-eval.md`.

## Gates — static only, no runtime lease

**Do not start Aspire, Docker, a browser, `scaffold.runtime`, or `e2e:cli`.** The bounded local
runtime proof for this leaf is queued behind another lane's host lease; its absence is **not** yours
to resolve and is **not** a finding.

Run and record, every one of them **at the final pushed head**:

- focused `packages/fresh` suites — the compat test, the hydration test, and your new round-trip test
- `deno task check`, `deno task test`, `deno task lint`, `deno task fmt:check`
- `deno task quality:scan` — **`allowCount` stays 7**
- `deno task arch:check`
- the evaluator's eight guard-attack cases, re-executed against your new guard

Prefer the structured wrappers (`.llm/tools/run-deno-check.ts`, `run-deno-test.ts`,
`run-deno-lint.ts`, `run-deno-fmt.ts`) over raw CLI. Wrap `deno task` runs in `rtk proxy`.

## Receipt discipline — this lane has been bitten twice

- **Every receipt at the final pushed head.** An exit code from an intermediate commit is not
  evidence for the head you ask to be evaluated.
- **Quote SHAs exactly as `git log` prints them — copy, never retype.** The previous cycle of this
  very leaf cited two commit SHAs whose first nine characters were right and whose remaining
  thirty-one were invented. That cost a Tier-A finding.
- A command that did not fire is **NOT FIRED**, not a pass. An empty-selection wrapper exit is a
  refusal, not a green.
- Never `deno fmt` across a directory containing `receipts/`.

## Delivery

1. Slice commits with RED visible, on top of `ed8a8e9ca`.
2. Update the leaf run dir
   (`.llm/runs/fix-fresh-query-hydration-readonly-state--1734/`): `plan.md` amendment recording the
   R2 decision and its rationale, `worklog.md`, `drift.md` if reality diverged from this brief.
3. Atomic, clean, explicit-refspec push.
4. Update the **PR #1736 body**: state that F1 is repaired, name the new head, and state head
   provenance (which commits are product and which are run artifacts). Keep `Closes #1734`. Keep it
   **draft**. Keep exactly one `status:` label, unchanged.
5. Post one structured PR comment for this phase per `netscript-pr` — `[PHASE: IMPL]` — with the
   gate table at the final head. Do **not** post or self-certify any IMPL-EVAL verdict; a separate
   opposite-family session owns that.

Report back in `worklog.md`: the final head, the R2 decision you took and why, whether you
reproduced the `failureReason={}` case, and the full gate table.
