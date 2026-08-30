use harness

# #1466 cycle-2 amendment — AF-2 widened, AF-3 frozen (coordinator decisions)

Same thread, same worktree, same branch. This **amends AF-2 and AF-3** of the cycle-2 message you are
already working from. AF-1 is unchanged, and you have already landed it (`64350c5a`).

## SKILL

No new reading. This changes one constraint and removes one prohibition.

## What changed

My cycle-2 message told you two things about `BaseContractErrors` that no longer bind:

1. It said the explicit `ContractBuilder<…>` annotation on `baseContract` was a free representation
   choice *only after* AF-1 lands. The coordinator has now ruled directly: **prefer inference or a
   NetScript-owned public boundary over the explicit private `ContractBuilder` annotation.** You do
   not need to wait for AF-1 to justify moving off it — though AF-1 still lands first, because the
   independent probe is what makes the move safe.
2. It listed "un-exporting `BaseContractErrors` to buy back findings" as **not authorized**. That
   prohibition is **lifted**. The coordinator's words: *remove or redesign `BaseContractErrors` if it
   cannot reach `public-doc-lint` delta ≤ 0 versus `main`.*

So the target is now firm rather than best-effort: **delta ≤ 0 versus base `13878a80a` = 12
findings.** Reaching it by redesigning or withdrawing `BaseContractErrors` from the public entrypoint
is an authorized outcome, not a retreat.

## What has not changed

- **Do not export or leak upstream/private oRPC types.** `ContractBuilder`, `Schema`,
  `MergedErrorMap`, `AnySchema`, `ContractProcedureBuilder*` — none of them, in any form, including a
  NetScript-named alias whose only purpose is to make an upstream type reachable. AP-14 is not lifted
  and this is the constraint the whole correction is bounded by.
- Generic position 3 stays exactly the base contract's error map; position 4 stays exactly
  `NetScriptProcedureMeta & Record<never, never>`; the #1350 error channel is untouched; no
  assertion, no `any`.
- Out of bounds and untouched: `QueryClient`, `StreamsInstrumentation`, `CrudRoute`, `AnySchema` —
  pre-existing baseline in other packages.
- `check`, every fixture, the assertion budget, `arch:check`, `publish-dry-run`, the contracts JSR
  audit and `isolatedDeclarations` emission all stay green. A delta win bought by breaking one of
  those is not a win.

## The ordering that makes this safe

AF-1 first, still. The independent unannotated probe is what pins position 4 *by measurement* rather
than by declaration — and it is exactly what lets you take the annotation off `baseContract` without
losing T-2. Moving the annotation before the probe exists would leave position 4 pinned by nothing at
all, which is the defect you are here to fix, made worse.

If `BaseContractErrors` changes shape or leaves the public surface, say in `drift.md` what now
carries the error-map contract for consumers and for the first-party `@netscript/plugin-*-core`
`BaseErrors` alias that mirrors it. A public type withdrawn without a named successor is a
compatibility question, not a cleanup.

## Report the arithmetic

Give the doc-lint counts as a single table over the exact 16-entrypoint argv: base `13878a80a`,
pre-repair `f9056f879`, cycle-1 `3c3f9b7c`, and your new head — with the per-symbol composition for
the new head so the delta is auditable rather than asserted.

If delta ≤ 0 is still unreachable **after** redesigning or removing `BaseContractErrors`, stop and
return a scoped blocker with the measured numbers and the specific declaration that blocks it. That
remains pre-authorized and remains better than a manufactured green.

## AF-3 is now frozen — stop retrying the root test

New coordinator evidence, which I confirmed on the host myself: there are **7,733 zombies** here,
**7,562 of them `sshd`**, all reparented to PID 1 and unreapable by any agent. Both of your root-`test`
failures reduce to that one condition, and I traced each mechanism rather than accepting the
correlation:

- **`hybrid-launcher_test.ts`** checks liveness with `Deno.kill(descendantPid, 0)` at `:167`, and
  `kill(pid, 0)` **succeeds on a zombie** — a zombie holds its PID until reaped. A worker descendant
  that exited exactly as designed still answers, so `alive` stays `true` and `:177` fires. **This
  assertion cannot pass on this host at any code state.**
- **`codex-follow_test.ts`** is not the fd rlimit — `ulimit -n` is `524288` and `/proc/sys/fs/file-nr`
  shows only `10,777` open. The exhausted resource is **`fs.inotify.max_user_instances = 128`**;
  `Deno.watchFs` takes one inotify instance per watcher and `inotify_init1` returns `EMFILE`, which
  Deno prints as "Too many open files". That is a **root-only sysctl**. Retrying cannot move it.

**Therefore:** finish the attempt you are on, and then **run no further root-`test` retries.** Record
the exact red as a host baseline, citing the two mechanisms above. The focused and product gates are
the product verdict — `check`, `lint`, `fmt-check`, `quality-gate`, `arch-check`,
`publish-dry-run`, the contracts suite, and the focused SDK doctest. Preserve all of them.

`test-final.json` stays a terminal FAIL and sufficiency stays `INSUFFICIENT`. That is the honest
record, and the IMPL-EVAL rules on whether a host-baseline red blocks the slice — not you, and not me.

**No product change in #1731 may target this infrastructure.** Do not touch, skip, ignore, retry,
de-catalog, or "harden" either test. They are correct code failing on a broken host; changing them
would weaken a real guard to fit a transient environment. If you have already modified either one,
revert that and say so.

Everything else in the cycle-2 message stands: recut all eight receipts at the new content head,
supplemental JSR audit, sufficiency over the named eight, `worklog.md` / `drift.md` /
`context-pack.md`, explicit-refspec push, structured PR comment, then stop. Land what exists before
you stop.
