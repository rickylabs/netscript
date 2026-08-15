use harness

# #1355 + #1360 / PR #1664 — PLAN-EVAL (fresh separate session)

You are the formal **PLAN-EVAL** evaluator for the `app-service-client-wiring` leaf of the 0.0.7
features lane. You are a fresh native Claude session, opposite-family to the Codex author thread
`01a004f9-f033-7592-a0bc-63927753fb43`, dispatched by topic orchestrator `topic-features-0.0.7`
under a grant from coordinator `codex-root-0.0.7`. You did not write this plan and must not defer to
the sessions that did.

This gate is required because the plan is **decision-heavy**, and it leaves one genuine architectural
fork open for you to rule on. Ruling is the output; listing options and handing them back is not.

## SKILL

Read `AGENTS.md`, then the task-relevant parts of:

- `.agents/skills/netscript-harness/SKILL.md` — the PLAN-EVAL protocol;
  `.llm/harness/evaluator/protocol.md`, `.llm/harness/evaluator/verdict-definitions.md`.
- `.agents/skills/netscript-doctrine/SKILL.md` — **Archetype 2 (integration)** plus the **frontend
  overlay**; check the plan's axiom/anti-pattern citations rather than accepting them.
- `.agents/skills/netscript-cli/SKILL.md` — the scaffold/template and generator-command surface.
- `.agents/skills/netscript-deno-toolchain/SKILL.md` + `.agents/skills/jsr-audit/SKILL.md` — the
  publish bar across three publishable members.
- `.agents/skills/netscript-tools/SKILL.md` — receipts, sufficiency recomputation, lock hygiene.
- `.llm/harness/gates/release-gates.md` and `.llm/tools/gates/catalog.ts` — **read both**; the
  gate-class distinction is load-bearing in this plan and was already repaired once.

## Identity to record first

Enable `/remote-control` immediately and record in `plan-eval.md`: session ID, non-empty bridge
session ID, Remote Control URL, PID, exact cwd, requested route, observed route. Read the observed
route from your job's `respawnFlags` (`/home/codex/.claude/jobs/<jobId>/state.json`), **not** process
argv — a bg session claiming a spare process carries neither `--model` nor `--effort` on its command
line. Report requested and observed distinctly; claim a match only if they match.

Requested route: **native Claude Fable 5 · medium · Remote Control** (`lane-policy.md:45`,
opposite-family for a Codex plan).

## Immutable identity — refuse on mismatch

- Worktree: `/home/codex/repos/netscript-007-features-1355`
- Branch: `feat/app-service-client-wiring`
- Base: `3fc0f2f9221a8246f0d26a26189bafb2647be08a` (live `origin/main` at dispatch)
- **Repaired plan head: `7f20a34fee4e99ac17edb6ed4de06a3ec9c1934b`**
- PR: **#1664**, open **draft**, body carries `Closes #1355` and `Closes #1360`
- Run dir: `.llm/runs/feat-app-service-client-wiring--1355/`
- Subject: `research.md` and `plan.md` at that head

Resolve local `HEAD`, the explicit remote ref, and the live PR head independently; confirm a clean
tree. A head mismatch is a hard refusal.

## Already decided — check compliance, do not re-decide

1. **PLAN-EVAL is required** (coordinator determination). You are not asked whether this gate should
   exist.
2. **Both expensive gates are load-bearing, only after cheap convergence.** `scaffold.runtime`
   because this leaf changes generated scaffold/client output *and* generator command behaviour;
   `fresh-browser` because hydration timing cannot be observed without a real browser. **No lease
   now**; they run serially under one coordinator-granted lease after all cheap gates and a pre-gate
   Tier-A. Do not run either.
3. **Gate class is settled.** `scaffold.runtime` is deliberately **not** in
   `.llm/tools/gates/catalog.ts`; it is a separate release-gate class owned by
   `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` per `release-gates.md:22`. Its
   evidence is suite-owned exact-head output plus the central lease/cleanup record — **no catalog
   entry, no hand-authored run-gate receipt**. `fresh-browser` stays a catalog gate
   (`catalog.ts:55`). The plan was repaired to this shape at `7f20a34fe`; verify the repair is
   complete and consistent, and treat any residue as a finding.

## What to evaluate

### 1. The open architectural fork — RULE on it

`plan.md` leaves open: accept an **additive `bridgeInvalidation(queryKey)` overload** on
`@netscript/sdk` (retaining the existing string overload), so the generated constant calls it with
`<service>Queries.list.clientKey()` and a renamed procedure fails `deno check` — **or** leave the SDK
surface unchanged and emit `{ queryKey: queries.list.clientKey() }` directly in the template.

Weigh at least: which one actually fixes the *dead invalidation* rather than routing around it; the
cost of widening a published SDK surface against the cost of leaving a discoverable-but-wrong API in
place; whether the direct-emit option leaves `bridgeInvalidation` a trap for the next caller; and
type-level rename safety. Rule, and state what your choice costs.

### 2. Do the diagnoses hold?

Re-derive from source at this head rather than trusting `research.md`:

- The key-shape mismatch. `research.md:39-48` claims generated queries produce
  `['service','list',{input:…}]` and client keys `['service','list','{"limit":3,…}']`, while
  `bridgeInvalidation()` returns exactly `[resource, action]` or `[resource]`. Confirm against
  `packages/sdk/src/query/query-factory.ts` and `packages/sdk/src/query-client/key-bridge.ts`.
- The `'service'` collision: `createQueryFactories` passing the **object key** as `resource`, so two
  services share both cache namespaces.
- #1360: that the canonical island never passes `initialDataUpdatedAt`, and what
  `packages/fresh/src/application/query/query-types.ts` says the option does.
- The citation drift the plan records (`research.md:50`, `:93`, `:203`) — is the re-derivation at
  `3fc0f2f92` honest, and did it miss any citation that also moved?

### 3. Scope across three publishable members

`packages/cli`, `packages/fresh`, `packages/sdk` are all touched and all publishable. Judge whether
the public-surface delta is stated precisely enough to implement and audit, whether the JSR
obligations (export audit, **exact `@netscript/*` pins**, isolated-declaration dry-run, no runtime
asset/`import.meta` reads) are discharged per member rather than in aggregate, and whether the
generator's result/overwrite contract is specified as public behaviour rather than left implicit.

### 4. Compatibility

D6 states existing apps change only when newly generated or explicitly regenerated. Test that claim:
is anything here breaking for **generated-but-not-regenerated** apps? Does the additive overload (if
you rule for it) preserve every existing call? Is the stated pre-#1424 migration concrete enough to
act on?

### 5. The pre-lease scenario assertions — are they falsifiable?

`plan.md` § "Exact `scaffold.runtime` scenarios" and § "Exact `fresh-browser` hydration scenarios"
were added on Tier-A instruction. Judge whether they are assertions an implementer could write and a
reviewer could check, or restatements of intent:

- the two-service command sequence, the byte-identical second `generate`, and cross-module
  type-checking without aliases;
- the server/client key pairs that must differ **only at index 0** with a shared input;
- the invalidation proof — a *second* `users.list` request plus server-confirmed DOM value, with the
  plan explicitly rejecting `invalidateQueries` spying as insufficient. Is that observable actually
  sufficient, and can it fail?
- the hydration comparison under a controlled clock — `hydrationNow - 60_000` versus `hydrationNow`,
  with query-function counts `1` versus `0`.

Critically: the plan must **not** claim the existing suite already proves two-service key isolation
or invalidation. Confirm it does not, and that the extension is framed as a precondition to achieve.

### 6. Slice plan and evidence set

Are the slices bounded, each ending at a Tier-A stop, with the expensive work isolated to the leased
slice? Is the binding receipt set — **five files**: four cheap `run-gate` receipts plus one
`fresh-browser` receipt, with `scaffold.runtime` evidence recorded by class — honest scoping or does
it leave a required gate unproven?

## Verdict

Write `plan-eval.md` in the leaf run dir containing exactly one of `PASS`, `FAIL_PLAN`, or another
verdict from `.llm/harness/evaluator/verdict-definitions.md`. Ground every finding in something
checkable — file and line, command output, or a named plan section. Do not pad with praise. **Rule on
the fork in § 1**; do not hand it back.

## Authority — narrow

You may change **only evaluator artifacts** (`plan-eval.md`), commit them, push with
`git push origin HEAD:refs/heads/feat/app-service-client-wiring`, and post one structured
`[PHASE: PLAN-EVAL] [VERDICT: …]` comment on PR #1664.

You must **not**: implement any part of the plan, edit `packages/**`, `plugins/**`, or `docs/**`,
touch `deno.lock`, add a `catalog.ts` entry, run `scaffold.runtime` or `fresh-browser`, take an
expensive-gate lease, flip the PR ready, relabel, merge, publish, close or file issues, mutate
central cluster state, or resume the Codex author thread. Do not launch another evaluator.

Report the terminal verdict, your ruling on the fork, your evaluator commit, the PR comment URL, and
your recorded attachment identity.
