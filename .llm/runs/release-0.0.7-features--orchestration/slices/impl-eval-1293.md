use harness

# #1293 / PR #1662 — IMPL-EVAL (fresh separate session)

You are the formal **IMPL-EVAL** evaluator for the `prisma-mysql-adapter-surface` product leaf of the
0.0.7 features lane. You are a fresh native Claude session, opposite-family to the Codex author
thread `01a0048f-8d95-7682-a3ce-1c1926aba75c`, dispatched under a formal evaluator lease from
coordinator `codex-root-0.0.7`. You did not write this work and must not defer to the sessions that
did — including the PLAN-EVAL whose rulings you are checking compliance against, not re-deciding.

This is the lane's **first framework-source leaf** in this milestone. Everything before it was a
document. A published package surface changed, so the publish and surface evidence is the substance
of the review, not paperwork after it.

## SKILL

Read `AGENTS.md`, then the task-relevant parts of:

- `.agents/skills/netscript-harness/SKILL.md` — the IMPL-EVAL protocol;
  `.llm/harness/evaluator/protocol.md` and `.llm/harness/evaluator/verdict-definitions.md`.
- `.agents/skills/netscript-tools/SKILL.md` — durable receipt semantics; **sufficiency is always
  recomputed and never trusted as written**; lock hygiene; git ground truth.
- `.agents/skills/netscript-doctrine/SKILL.md` — **Archetype 2 (integration)**, axioms and
  anti-patterns, the fitness-gate matrix this leaf claims.
- `.agents/skills/netscript-deno-toolchain/SKILL.md` and `.agents/skills/jsr-audit/SKILL.md` — the
  publish bar, slow types, isolated declarations, and why raw `deno publish --dry-run` output is
  authoritative over helper summaries.
- `.agents/skills/netscript-pr/SKILL.md` — close-gate law, `acceptance-evidence` semantics, closing
  keywords, single-`status:` law.

## Identity and lease — record before any mutation

Enable `/remote-control` immediately and record in `evaluate.md`, **before you change anything**:
session ID, non-empty bridge session ID, Remote Control URL, PID, exact cwd, requested route,
observed route, and this lease (coordinator `codex-root-0.0.7`, one evaluator, PR #1662 / #1293, at
immutable head `d8d255bdc`). Read the observed route from your job's `respawnFlags`
(`/home/codex/.claude/jobs/<jobId>/state.json`), **not** from process argv — a bg session that claims
a spare process carries neither `--model` nor `--effort` on its command line. Report requested and
observed distinctly; claim a match only if they match.

Requested route: **native Claude Fable 5 · medium · Remote Control** (`lane-policy.md:46`, local
IMPL-EVAL of Codex work, opposite-family).

## Immutable identity — refuse on mismatch

- Worktree: `/home/codex/repos/netscript-007-features-1293`
- Branch: `feat/prisma-mysql-adapter-surface`
- Base: `284dda90a17a13a7e5e8e9834e5411b58887131b` (live `origin/main` at dispatch)
- **Content head (what every receipt attests): `3dee41263e5e34a9f59972edb43a345c8d4494c0`**
- **Final evidence head (evaluate this): `d8d255bdc103eb120cc7b8835dfe3ce870017c32`**
- PR: **#1662**, open **draft**, milestone `0.0.7`, exactly one lifecycle label `status:impl`
- Run dir: `.llm/runs/feat-prisma-mysql-adapter-surface--1293/`

Resolve local `HEAD`, the explicit remote ref, and the live PR head independently; confirm a clean
tree. Confirm the content head is an ancestor of the evidence head and that the delta between them
is **only** receipts and run journals — verify that by diff, not by reading the claim. A head
mismatch is a hard refusal, not permission to evaluate a nearby commit.

## Already decided — check compliance, do not re-decide

These are coordinator rulings and PLAN-EVAL rulings from verdict commit `7780ba49e`. Reopening one is
a finding against you.

- **Coordinator:** preserve and wire `onConnectionError` (removal off the table); docs-owned #1112
  and `docs/site/reference/prisma-adapter-mysql/` stay out of this leaf; **split-close** — the PR
  carries `Part of #1293` with no closing keyword, #1293 stays open, box 4 is checked only after
  #1112 lands.
- **Owner-only:** #1293 acceptance **box 1** wording is unchanged and its remaining unticked state
  **does not block this product evaluation**. Do not treat it as an outstanding defect.
- **PLAN-EVAL R1–R3** are the design contract. Your job is whether the implementation *matches* them.

## What to evaluate

Judge the work, not the paperwork. Where you accept a claim, say what you read or ran.

### 1. R1–R3 compliance

- **R1.1 classifier.** `isConnectionError` in `src/errors.ts`: driver-error gated, true iff
  `fatal === true`, `errno ∈ {1040, 1203}`, or `code` in the closed transport/pool set. `MySqlError`
  gained `fatal?: boolean`. It must be **module-internal** — absent from `src/mod.ts` and from the
  root surface.
- **R1.2.** 1045 / 1044 / 1049 fire **only when driver-fatal**; mid-session they are ordinary mapped
  errors and must not fire. 1040 / 1203 always fire. Mapping to `DriverAdapterError` is unchanged.
- **R1.6 single choke point.** Exactly one code path may call `options.onConnectionError`. For
  `startTransaction`, only the outer `connectionLifecycle.catch` notifies; the inner catch rejects
  and rethrows **without** notifying. Test the duplicate-notification property yourself — one
  acquisition failure must produce exactly one callback.
- **R1.5 containment.** Callback in its own try/catch, failure to `debug`, never rethrown, never
  aggregated. The primary rejection must be the **same object** (`===`), not merely the same shape.
- **R1.4 / R3 probe.** `getCapabilities` still returns `{ supportsRelationJoins: false }` on any
  failure; the notifier fires once **before `connect()` resolves** when the classifier is true.
  `connect()` still resolving against a dead host is the **ruled and accepted** cost — not a finding.
- **R1.7.** `executeScript` notifies but is **not** normalised; it still rejects raw.
- **R2.1 / R2.3 / R2.4.** Choice B: the concrete class is **absent** from the root export map, but
  module-exported so tests can construct it with a fake client. No `PrismaMySqlAdapter` root export.

### 2. S1 query-contract compatibility

Tier-A found and returned a real defect here, and you should re-derive rather than trust it closed.
The public `PrismaMySqlQuery` was initially **wider** than upstream `ArgType` — `scalarType` as
`string` against a 12-member literal union, `arity` optional against required — and
`performIO(query as SqlQuery)` asserted the mismatch away, so a mis-cased `scalarType` type-checked
and then silently skipped `mapArg`'s BigInt/datetime/bytes conversion (`conversion.ts:161-205`).

Verify the fix is real, not cosmetic: the types should now be **mutually assignable** and the
`as SqlQuery` cast should be **gone**. The bidirectional guards in `tests/surface_test.ts`
(`_toUpstream` / `_fromUpstream`) are the mechanism — confirm they compile under `deno check` and
that they would actually fail if the types diverged. A guard that cannot fail is not a guard. Check
the same widening class across every other public type the leaf added, including
`PrismaMySqlTransactionOptions`.

### 3. S2 notifier and classifier behaviour

Are the tests **capable of failing**? The suite claims exact call counts, argument identity, primary
rejection identity with and without a throwing callback, and classifier-false negatives at each
firing boundary. A hook suite that only asserts "callback was called" would pass against a blanket
`onError()` override — the design R1 explicitly rejected. Determine which of these the suite would
actually catch. Check the boundary coverage against R1.8's table, and look for a boundary that fires
twice or not at all.

### 4. S3 public example and split-close boundaries

`examples/basic-usage.ts` must consume `../mod.ts`, advertise only shipped behaviour, and stay
outside the publish set. The PR body must carry `Part of #1293` with **no** closing keyword, reference
#1112 without one, and state the remaining scope explicitly. The `acceptance-evidence` block must
mirror only what this leaf discharges — box 1 "not discharged as worded", box 4 blocked on #1112,
neither ticked. **A box ticked without evidence is the #260 failure this gate exists to stop**; judge
whether the honest-undischarged framing is accurate or a way to avoid proving something provable.

### 5. The four exact-head receipts

The contracted set is exactly `prisma-mysql-1293-check`, `-test`, `-publish-dry-run`, `-arch-check`.
**Recompute sufficiency yourself.** Check each receipt's `outcome`, `exitCode`,
`gitHead == actualGitHead == 3dee41263…`, and the absence of `allowGitHeadMismatch`. Confirm the four
`gateId`s are distinct so `.llm/tools/gates/evidence-set.ts`'s duplicate rule does not fire. Judge
whether four gates is honest scoping for this contract or leaves a required gate unproven.

### 6. Raw D7 evidence

The PLAN-EVAL conditioned its acceptance of four-receipt scoping on the **raw**
`deno doc --lint packages/prisma-adapter-mysql/mod.ts` command, output and exit code, and the **raw**
`deno publish --dry-run` tail and file list being recorded at the content head — because acceptance
box 3 is otherwise proven only by an un-receipted check. Confirm they are present, raw rather than
summarised, and that re-running them at this head reproduces what was recorded.

### 7. Scope and lock hygiene

Across `284dda90a..d8d255bdc`: no `docs/**` path, no `deno.lock`, no other package, no issue filed or
closed, no central cluster state or `#1348` mutation, no expensive gate, and the PR never flipped
ready. `docs/site/reference/prisma-adapter-mysql/index.md:23` becomes false on merge — confirm it is
**named** in the PR and leaf `drift.md` and **left unedited**.

## Verdict

Write `evaluate.md` in the leaf run dir containing exactly one of `PASS`, `FAIL_FIX`,
`FAIL_RESCOPE`, or `FAIL_DEBT`. Ground every finding in something checkable — file and line, command
output, or receipt field. Do not pad with praise; a finding a reader cannot verify is not a finding.
Distinguish substantive findings from editorial notes explicitly.

## Authority — narrow

You may change **only evaluator artifacts** (`evaluate.md`), commit them, push with
`git push origin HEAD:refs/heads/feat/prisma-mysql-adapter-surface` — the verdict must be an
**immutable pushed commit** — and post one structured `[PHASE: IMPL-EVAL] [VERDICT: …]` comment on
PR #1662 recording the verdict, the evaluated content and evidence heads, your evaluator commit, and
your Remote Control identity.

You must **not**: edit `packages/**` or `plugins/**`, edit `docs/**`, touch `deno.lock`, flip the PR
ready, relabel, merge, publish, close or file issues, edit #1293's wording, mutate central cluster
state, take an expensive-gate lease, or run `scaffold.runtime`. Do not resume or steer the Codex
author thread. Do not launch another evaluator.

Report the terminal verdict, your evaluator commit, the PR comment URL, and your recorded attachment
identity and lease.
