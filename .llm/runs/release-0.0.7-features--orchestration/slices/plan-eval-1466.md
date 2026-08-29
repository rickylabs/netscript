use harness

# #1466 / PR #1731 — PLAN-EVAL (fresh separate session)

You are the formal **PLAN-EVAL** evaluator for the `sdk-procedure-meta` leaf of the 0.0.7 features
lane — the **entry slice of `epic:sdk-client-contrib` (#1348)**. S1 (#1350) is closed; S3–S8 (#1349,
#1351, #1352, #1353, #1467, #1093) all sit behind this one and inherit whatever vocabulary it
defines. You are a fresh native Claude session, opposite-family to the Codex author thread
`01a04f84-e21d-77f3-863c-56ef2498d581`, dispatched by topic orchestrator `topic-features-0.0.7`
under coordinator `codex-root-0.0.7`. You did not write this plan and must not defer to the session
that did — nor to the Tier-A review whose requirements you are being asked to rule on.

This gate is required because the plan is decision-heavy and defines a **public cross-consumer
vocabulary** in two publishable packages. Implementation is blocked until you return.

## Identity to record first

Enable `/remote-control` immediately and record in `plan-eval.md`: session ID, non-empty bridge
session ID, Remote Control URL, PID, exact cwd, requested route, observed route. Read the observed
route from your job's `respawnFlags` (`/home/codex/.claude/jobs/<jobId>/state.json`), **not** process
argv — a bg session that claims a spare process carries neither `--model` nor `--effort` on its
command line. Report requested and observed distinctly; claim a match only if they match.

Requested route: **native Claude Fable 5 · medium · Remote Control** (`lane-policy.md:84`,
`review_codex_complex`, paired to Sol · high implementation).

## SKILL

Read `AGENTS.md`, then the task-relevant parts of:

- `.agents/skills/netscript-harness/SKILL.md` — the PLAN-EVAL protocol;
  `.llm/harness/evaluator/protocol.md`, `.llm/harness/evaluator/verdict-definitions.md`.
- `.agents/skills/netscript-doctrine/SKILL.md` — **Archetype 1 (contracts)** and **Archetype 2
  (integration)**, the ports/adapters layering, axioms and anti-patterns (the plan cites **AP-14**;
  check that citation rather than accept it).
- `.agents/skills/netscript-deno-toolchain/SKILL.md` + `.agents/skills/jsr-audit/SKILL.md` — the
  publish bar for two publishable members, isolated declarations, exact `@netscript/*` pins.
- `.agents/skills/netscript-tools/SKILL.md` — receipts, **sufficiency is always recomputed, never
  trusted**, lock hygiene.
- `rfcs/0001-sdk-client-contributions.md` — **Stage 1b** is this slice's boundary. Verify the plan's
  cited shape at `:347-369,1273-1278` and the stage line it draws against S3.

## Immutable identity — refuse on mismatch

| Field | Value |
| --- | --- |
| Your worktree | `/home/codex/worktrees/ns1466-planeval` (**detached**, deliberately not the author's worktree) |
| Author's worktree | `/home/codex/repos/netscript-007-features-1466` — **do not touch it** |
| Branch | `feat/sdk-procedure-meta` |
| **Plan head** | **`9e70b30a3fef798a02a376888603ef42ee3828b9`** |
| Base | `21d516224fe35e92957f0998ee848bbf2024eda0` — current `origin/main` |
| PR | **#1731**, open **draft**, milestone `0.0.7`, one `status:` label (`status:plan`) |
| Run dir | `.llm/runs/feat-sdk-procedure-meta--1466/` |
| Subject | `research.md` (235 lines) and `plan.md` (167 lines) at that head |

Resolve your `HEAD`, the explicit remote ref, and the live PR head independently; confirm a clean
tree. A head mismatch is a hard refusal.

## Already decided — check compliance, do not re-decide

- **PLAN-EVAL is required** (coordinator + Tier-A). You are not asked whether this gate should exist.
- **Expensive gates are not applicable.** Tier-A concurred with the plan: Stage 1b changes no CLI
  template, generated file, browser runtime, transport, service process, Aspire resource, or wire
  behaviour. **Do not run** `scaffold.runtime`, `fresh-browser`, Aspire, or Docker, and do not
  request a lease. If you believe this is wrong, say so as a finding — do not run one.
- **The split of ownership** — `NetScriptProcedureMeta` is NetScript-owned; oRPC is an adapter — is
  the RFC's, not the author's invention. Check fidelity to the RFC, not the idea.

## Tier-A carried three binding requirements to you — rule on each

I reviewed this plan and passed it with three precision requirements. They are yours to rule on, and
a `PASS` from you must state how each is discharged (or overrule it with reasoning).

**T-1 — "without casts or `any`" has no mechanical proof for the cast half.** #1466 acceptance point
3 requires metadata to reach all three consumers *"without casts or `any`"*. `any` **is** already
mechanically gated: `deno lint` runs the `recommended` tag, which includes `no-explicit-any`, and
neither `packages/sdk` nor `packages/contracts` appears in `deno.json`'s lint `exclude`. **Casts are
gated by nothing** — the plan's only verification is a "changed-line cast/`any` review", which is a
human review, not a receipt. This lane already paid for exactly that shape: in #1293 S1,
`performIO(query as SqlQuery)` silenced a real incompatibility, type-checked, skipped a conversion
path, and survived review. Rule on what mechanical, receipted evidence the implementation must
produce for the cast half.

**T-2 — the fourth generic must be pinned, not hedged.** L2 says the annotation's fourth generic is
`NetScriptProcedureMeta` "(including any upstream-required empty-record intersection produced by
`$meta`)". That is resolvable and I resolved it: `@orpc/contract@1.14.6/dist/index.d.mts:216` gives
`$meta<U extends Meta>(initialMeta: U): ContractBuilder<…, U & Record<never, never>>`. Verify that
yourself, then rule on whether `plan.md` must state position 4 exactly as
`NetScriptProcedureMeta & Record<never, never>`. The concern is not tidiness: a vague annotation that
then fails to match is the moment an implementer reaches for the `as` that L3 forbids.

**T-3 — the receipt set must be named in the plan.** The gate set lists ~10 gates; slice 3 defers the
receipt filenames to "the slice report". `.llm/tools/gates/evidence-set.ts` scores any repeated
`gateId` as duplicate-or-contradictory → INSUFFICIENT, and per-package gates sharing one id is the
usual way that fires. Rule on whether the exact receipt filenames and distinct per-package `gateId`s
must be fixed in `plan.md` before implementation.

## What to evaluate

### 1. The two open decisions the plan routes to you — RULE, do not hand back

`plan.md`'s open-decision sweep marks two as "must resolve now in PLAN-EVAL":

- **Runtime metadata reader/port in this slice.** The plan proposes *no* — declaration-level
  propagation only, with `ProcedureMetadataPort` deferred to Stage 2 (#1349). Rule on it. Weigh
  whether a declaration-only Stage 1b is actually verifiable end-to-end, or whether deferring all
  runtime reading makes the slice's own acceptance ("metadata reaches direct clients, generated
  clients, and query factories") provable only at the type level — and whether that is sufficient.
- **Exact name and location of the SDK metadata extractor.** The plan says "one documented public
  type adjacent to `ContractProcedureLike`". Name it, or state the rule that fixes it. Six slices
  will import whatever this is.

### 2. Does the error-channel preservation argument hold?

`research.md` Finding 1 traces a four-link chain: the annotated `baseContract`, the route aliases'
third generic, the SDK's `errorMap` inference at `packages/sdk/src/ports/service-client.ts:184-209`,
and `safe()`/`SafeFailure` narrowing at `packages/sdk/src/client/errors.ts:36-130,165-193`. Re-derive
it from source at this head. The claim to test is that changing **only generic position 4** cannot
disturb position 3 or the `isDefined` narrowing — I verified `.errors()` preserves `TMeta`
(`dist/index.d.mts:237`), but the converse (that `$meta` cannot perturb the merged error map) is the
half that protects #1350's repair. Check it.

### 3. Is the independence rule enforceable, and is it enforced?

`research.md:120-126` states a rule with explicit rejection examples. Judge whether it is checkable
mechanically or only by reading, and whether the plan's gates would actually catch a violation — in
particular whether `NetScriptProcedureMeta`'s emitted declaration could acquire an `@orpc/*` type
transitively without any source file naming one.

### 4. The versioning commitment — the part six slices inherit

Additive-only optional readonly fields under package semver; no `version` discriminant, because a
required one contradicts the RFC's `{}` normalization. Rule on whether that is right, and whether
"S3–S8 may add optional fields but may not rename/reinterpret" is enforceable or merely stated.
State what the choice costs.

### 5. Scope, publish surface, and the fixture bar

Two publishable members. Judge whether the public-surface delta is stated precisely enough to
implement and audit, and whether JSR obligations are discharged **per member** rather than in
aggregate. On L5: fixtures must import real specifiers, never `src/**` — confirm that resolves
(workspace is `packages/*`; precedent is `packages/sdk/tests/readme-doctest_test.ts` importing
`@netscript/contracts`) and that the negative fixtures **can actually fail** — a `@ts-expect-error`
that would still be satisfied by a differently-wrong type is not a guard.

### 6. Slices and honesty

Three slices, each ending at a Tier-A stop, expensive work absent. Judge whether the slice
boundaries are real (each independently reviewable) and whether anything in the plan **claims** a
property the listed gates do not prove.

## Verdict — and you must commit and push it yourself

Write `plan-eval.md` in `.llm/runs/feat-sdk-procedure-meta--1466/` containing exactly one of `PASS`,
`FAIL_PLAN`, or another verdict from `.llm/harness/evaluator/verdict-definitions.md`. Ground every
finding in something checkable — file and line, command output, or a named plan section. Do not pad
with praise. **Rule on T-1…T-3 and on both open decisions**; handing any of them back is a failure of
this gate.

**Your verdict is not terminal until it is an immutable pushed commit.** Do this yourself:

```
git add .llm/runs/feat-sdk-procedure-meta--1466/plan-eval.md
git commit    # message naming this as the #1466 PLAN-EVAL verdict and your model identity
git push origin HEAD:refs/heads/feat/sdk-procedure-meta
```

You are on a **detached HEAD** at the plan head; that refspec is correct and required. Then post one
structured `[PHASE: PLAN-EVAL] [VERDICT: …]` comment on PR #1731 recording the verdict, the evaluated
plan head, your evaluator commit, and your Remote Control identity — and note that your commit moves
the branch head past `9e70b30a3` and the delta is your artifact only, so no reader mistakes it for a
plan change. Do not leave the verdict uncommitted for the supervisor to sign; the supervisor will not
sign it.

## Authority — narrow

You may change **only** `.llm/runs/feat-sdk-procedure-meta--1466/plan-eval.md`, commit it, push it
with the explicit refspec above, and post the one PR comment.

You must **not**: implement any part of the plan; edit `packages/**`, `plugins/**`, `docs/**`, or
`rfcs/**`; touch `deno.lock`; repair any defect you find; write into the author's worktree; resume or
steer the Codex author thread; merge; publish; relabel; change milestone; flip readiness; close or
file issues; mutate `#1348` or central cluster state; take an expensive-gate lease; or run
`scaffold.runtime`, `fresh-browser`, Aspire, or Docker. Do not launch another agent.

Report the terminal verdict, your rulings on T-1…T-3 and the two open decisions, your evaluator
commit, the PR comment URL, and your recorded attachment identity.
