# Tier-A review — #1466 slice 2 (SDK declaration propagation + G-1), PR #1731

| Field | Value |
| --- | --- |
| Reviewer | features topic supervisor, native Claude Opus 5 · high (PID `5495`) |
| Author | Codex `gpt-5.6-sol` · **high** (`complex_implementation`), thread `01a051f8-ab0a-7443-921f-17e48be6bc35` |
| Content head | `2863d29e` — `feat(sdk): preserve procedure metadata through declarations` |
| Review worktree | `/home/agent/projects/netscript/worktrees/ns1466-tiera-c4`, detached — **never** the author's (D-19) |
| Status | **PART 1 — substance.** The author's turn was still open when this was written: 4 of 8 receipts cut, nothing pushed. Receipt-set verification is Part 2 and gates the verdict. |

Every number below was re-measured in my own worktree at `2863d29e`.

## G-1 — closed, and I broke it myself rather than trusting the audit file

The pin moved from a file-wide count to a declaration-anchored pattern:

```
/export\s+const\s+baseContract\s*:[^=;]+?=\s*oc\.\$meta<NetScriptProcedureMeta>\(\{\}\)\.errors\(commonErrorMap\);/g
```

I reproduced the evaluator's exact forgery — perturbation B2 (`NetScriptProcedureMeta &
{ readonly extra?: string }` on the real initializer) **plus** the dead decoy
`const _legacyBase = oc.$meta<NetScriptProcedureMeta>({}).errors(commonErrorMap); void _legacyBase;`:

| Probe | Old pin (slice 1) | New pin (slice 2) |
| --- | --- | --- |
| `deno check --unstable-kv` on the forged file | exit 0 | **exit 0** — still passes, which is the point |
| The pin test | **GREEN** (forgery succeeded) | **RED** — `4 passed / 1 failed` |
| Unmodified head | 5/5 | **5/5** |

`check` passing on the forged file is what makes this finding real: type-checking alone cannot see the
substitution, so the pin is the only guard, and it now holds. Worktree reverted clean
(`git status --porcelain` → 0) after the perturbation.

The author's own `audit/g1-declaration-pin-slice2.txt` records the same two probes plus a
no-decoy B2 case and a restoration proof. My run agrees with it; I ran it because agreement between
an author's audit and a reviewer's measurement is worth something only when the reviewer measured.

**One residual worth stating (AF-1, low, not blocking).** The anchor uses `[^=;]+?` to span
`baseContract`'s type annotation. That works today, but it fails **on correct code** the moment the
annotation contains a `=` or `;` — a default type parameter (`<T = X>`) in the `ContractBuilder`
generics would do it. The failure mode is a false positive on a legitimate refactor, and the tempting
"fix" is to loosen the regex back toward the file-wide form G-1 just removed. Worth a comment in the
test naming that trap. Slice 3 can carry it; it does not warrant its own cycle.

## R-1's binding constraint — holds exactly at the new content head

Receipt argv, 16 entrypoints, run at `2863d29e` and at `origin/main` `13878a80a`:

- `main`: exit 1, **12** findings. Slice-2 head: exit 1, **12** findings.
- vs `main`: nine identical; `main`-only `{BaseContractRoute→BaseContractErrors,
  BaseContractOutputRoute→BaseContractErrors, baseContract→oc}`; head-only
  `{BaseContractErrors→MergedErrorMap, baseContract→ContractBuilder, baseContract→Schema}`.
- vs the **slice-1 head set**: `diff` reports **IDENTICAL**.

That is the strong result. Slice 2 adds public SDK surface (`ProcedureMeta`,
`ProcedureMetaFromNode`) and adds **zero** doc-lint findings — the count did not move and neither did
the set, so R-1's set-identity condition is satisfied by measurement rather than by a matching count.

## Substance

- **Suites**: `deno test --allow-all packages/sdk packages/contracts` → **94 passed / 0 failed**.
- **`docs:exports-drift`**: **PASS, exit 0** (R-3's named supplemental evidence).
- **No metadata-boundary casts or `any` introduced.** Grepping `+` lines of the SDK diff for
  `any` / `as unknown as` / `deno-lint-ignore` / `@ts-ignore` / ` as <Type>` returns only three hits,
  and all three are **inside the new scanner test's own fixture strings** — the assertion-budget
  scanner testing that it counts `const value = source as Target;` as 1 and a commented/quoted
  occurrence as 0. That is the scanner proving itself, not a boundary cast.
- **`ActionMethod`** is present and wired: declared `query-factory.ts:51`, applied at `:126`
  (`[K in ContractProcedureNames<TContract>]: ActionMethod<TContract, K>`), exported at
  `ports/mod.ts:32` — the plan's slice-2 marker obligation.
- **Public surface delta** is exactly two NetScript-owned type exports, `ProcedureMeta` and
  `ProcedureMetaFromNode`, added to `ports/mod.ts` and `query/mod.ts`. **No upstream oRPC type is
  re-exported** — AP-14 clear, consistent with the unchanged doc-lint set.
- **`procedure-meta-independence_test.ts`** covers the new symbols by name alongside the slice-1
  three, so the doc-JSON independence obligation extends to the SDK surface rather than stopping at
  contracts.
- **`commonErrorMap` stays private** — the slice-2 diff does not touch `public/mod.ts`.

## Part 2 — outstanding before a verdict

1. All eight receipts at content head `2863d29e` with `gitHead == actualGitHead`; four exist
   (`check`, `lint`, `fmt-check`, `test`), four pending (`public-doc-lint`, `quality-gate`,
   `arch-check`, `publish-dry-run`).
2. The slice-1 set archived to `receipts/frozen-42874803/` — **already verified**, 8 files, alongside
   `frozen-235482767/` and `frozen-c9a391811/`, all append-only.
3. Sufficiency recomputed over the eight named files.
4. `deno.lock` byte-unchanged.
5. The per-slice PR comment (the G-2 obligation this brief made explicit).
6. `context-pack.md` refreshed — and it must **not** carry forward the stale "inotify is 128 /
   watch-run dies" paragraph; that correction is queued for delivery and is now wrong on the facts
   (inotify is 1024, `watch-run` reaches its heartbeat exit 2).

**No verdict yet.** Substance is strong and nothing found so far blocks; the verdict waits on the
receipt set rather than being issued against a half-cut one.
