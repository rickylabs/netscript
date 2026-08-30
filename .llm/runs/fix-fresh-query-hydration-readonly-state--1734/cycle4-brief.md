use harness

# #1734 cycle 4 — OWNER-APPROVED total private reviver (PR #1736). This is the LAST cycle.

## SKILL

Activate the harness workflow per `.agents/skills/netscript-harness` and `.llm/harness/`. Also load
`.agents/skills/netscript-doctrine` (`packages/fresh` is framework code — archetype, public surface,
fitness gates govern this), `.agents/skills/deno-fresh` (Fresh runtime, TanStack Query hydration),
`.agents/skills/netscript-tools` (structured wrappers, gate receipts, lock hygiene),
`.agents/skills/netscript-cli` (the `e2e:cli` / `scaffold.runtime` surface), and
`.agents/skills/netscript-pr`.

Follow `AGENTS.md`: doctrine first for `packages/`, contract before implementation before tests, wrap
rather than reinvent, record drift explicitly.

## You are a FRESH thread

The previous sender `01a0515b` was terminated after a 14-minute futex stall (PID proof taken, stale
lock removed); `01a04fa4` has no rollout. Neither is resumable. You inherit the leaf from its
committed artifacts, which are complete.

**Read first, in order**, under `.llm/runs/fix-fresh-query-hydration-readonly-state--1734/`:
`context-pack.md`, `plan.md`, `impl-eval.md` (cycle 1), `impl-eval-cycle-2.md`,
`impl-eval-cycle-3.md` (the verdict that produced this ruling), `drift.md`, `worklog.md`.
**All three prior verdict artifacts stay bit-identical.**

- Worktree `/home/agent/projects/netscript/worktrees/007-leaf-1736`
- Branch `fix/fresh-query-hydration-readonly-state` @ `069913e7…`, local == remote == PR #1736 (draft)
- Closes exactly **#1734**
- Push: explicit refspec only — `git push origin HEAD:refs/heads/fix/fresh-query-hydration-readonly-state`

## The owner ruling — this is option 2, and it is the last cycle

**Replace the rejection-value allowlist with a TOTAL private reviver.**

Three cycles failed with one shape: `reviveSerializedError` enumerates an **open** value domain —
anything a `mutationFn` can reject with — inside an allowlist guard. Each cycle fixed the member it
was shown; the next member surfaced. Cycle 1: green only pre-serialization. Cycle 2:
non-`Error`/non-record. Cycle 3: `undefined` from a bare `Promise.reject()`, symbols, functions, plus
`String(value)` throwing past the guard on a hostile array.

**A total reviver removes the question instead of answering it a fourth time.** No rejected domain
means "which values are accepted" stops being answerable wrongly. Do not reintroduce a rejection
branch anywhere in it.

Requirements:

- The reviver is **total**: every input yields an `Error`, never `{ valid: false }`, never a throw.
- **Message construction must not throw** — a hostile `toString` / `Symbol.toPrimitive` must not
  escape. Build the message defensively; do not call bare `String(value)` on an arbitrary value.
- Preserve the original value losslessly (`cause`), and keep the existing `message`/`name`/`stack`
  handling for plain records.
- It stays **private**. No public type, no export, no dependency-range change, no wider hydration
  scope. If you believe any of those must change, **stop and report** — that is a rescope.

## RED first, real transport, three authorized cases

Commit the RED as its own commit, visible in history, before the fix:

1. **Omitted mutation `failureReason`** — a bare `Promise.reject()` / absent key across the wire.
2. **Query error twins** — the query-side path as well as the mutation-side, since they are separate
   code paths and cycle 3 showed the mutation default path is where sibling loss bites.
3. **Non-throwing message construction** — a value whose `toString`/`Symbol.toPrimitive` throws.

Drive them through the real `renderToString(<QueryHydrationScript/>)` transport, **not** hand-built
payloads — cycle-1's F1 was a check green only pre-serialization, and a synthetic payload reproduces
that mistake.

**Both directions, explicitly.** Values that hydrate on `main` must still hydrate; the cycle-2
guard-attack suite (`hydrateFromDehydrated rejects the evaluator guard-attack cases without
mutation`) must still pass — a total reviver must not become an excuse for partial hydration or input
mutation. Say in your PR comment which assertion covers which direction.

## Rebase, then gates

**Rebase onto current `main` `24f6642f040617de573c7cef1140eed1ac0efd6d`.** It touches **zero** files
under `packages/fresh`, so the product surface cannot conflict — verify that yourself rather than
trusting it.

Then, at the exact rebased head, with **raw exit codes**:

- focused repair suites, scoped `check`/`lint`/`fmt` over `packages/fresh`
- root `deno task test` — usable and green on this host (PID 1 `tini`, 0 zombies); the old
  ~7.7k-zombie waiver is **retired**, do not cite it
- `check:assets-barrel`, `quality:scan`, `arch:check`
- **`scaffold.runtime`** — the coordinator has granted the runtime lease for this leaf. Run it as the
  single one-pass command, **not split**:
  `~/.local/bin/mise exec -- deno task e2e:cli run scaffold.runtime --cleanup --format pretty`
  (`mise` is a broken shell function in non-interactive bash; use the binary path). Capture the raw
  exit and suite/test names. Afterwards **prove owned cleanup back to `aspire ps` empty, Docker 0
  containers / 0 volumes**, and remove any `.llm/tmp/cli-e2e` scratch you create.

Note: `scaffold.runtime` previously failed at `generated.quality-negative` on **this very defect** —
`TS2345` at `packages/fresh/src/application/query/hydration.ts:43`. If your repair is right, that
failure should be gone. If it is still red, report exactly what and where; do not explain it away.

## Then stop

Commit per slice, push with the explicit refspec, post the per-slice PR comment, and **stop**. I run
Tier-A and dispatch **exactly one** final IMPL-EVAL cycle 4. Do not launch or simulate an evaluator.

**If cycle 4's evaluation fails, the leaf is parked or rescoped — it does not recurse.** Write the
repair as if it will not get another attempt, because it will not.

PR stays draft. No merge, ready-flip, issue relabel, close, or milestone change. Do not touch
`#1747`/`#1758`. Copy SHAs from `git log`, never retype — this leaf failed a gate on a fabricated SHA
suffix in cycle 1.

Report the RED SHA, the fix SHA, the rebased head, and your full gate table with raw exit codes.
