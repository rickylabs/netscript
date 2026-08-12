use harness

# Correction slice — #1602 cycle 2: close the `withRouteContract` divergence

**Codex · GPT-5.6 Sol · medium**. IMPL-EVAL returned **FAIL_FIX** at head `f9e924d0b` with **one
blocking** finding and one advisory to fix alongside it. Your `withRoute` work is **accepted** — do
not redesign it.

| Field | Value |
| --- | --- |
| Issues | **#1576**, **#1568** · PR **#1602** |
| Worktree | `/home/codex/repos/ns006-1576` |
| Branch | `fix/1576-form-c-route-path-binding` |
| Head | `f9e924d0b` — the evaluated head, clean |

## SKILL

- `deno-fresh`, `netscript-doctrine` (`packages/fresh` builder surface is published),
  `netscript-tools`, `netscript-pr`, `netscript-harness`.

Read the `[PHASE: FALLBACK IMPL-EVAL]` comment on #1602 first. It confirmed, with executed evidence,
your precedence chain, the 404 path, the widened `isRouteReference`, the new `RouteParserTarget`
compile-time constraint, all seven pipeline stages, the four-pattern matrix, and `239 passed | 0
failed`. **None of that is in question.**

## C1 — the blocking finding

**The sibling promotion path in the same file still has the exact defect #1576 was filed for.**

`promoteRouteContractConfig` (`builder/route-support.ts:96-102`) writes
`pathSchema: contract.pathSchema` **unconditionally**, discarding any previously configured schema.
But `DefinePageWithRouteContract` (`types.ts:346-356`, via `ResolveSchemaOutput`) **preserves** the
prior path type when the contract omits `pathSchema`. The stored `BoundRouteContract.safeParsePath`
then returns `{ success: true, data: {} }` when no schema is present
(`route/_internal/contract-runtime.ts:76-78`) — so your new fallback resolves **successfully** to
`{}` instead of erroring.

Reproduced against your head:

```ts
definePage<{ requestId: string }>()
  .withPathParams(idSchema)                       // path inferred as { id: string }
  .withRouteContract({ $route: '/orders/[id]' })  // no pathSchema on the contract
  .withResource('capture', (ctx) => { ...ctx.path.id... })
```

`deno check` passes (`ctx.path.id` is `string`); at runtime with `params: { id: 'order-42' }`:

```text
RUNTIME_PATH= {} | TYPED_ID= undefined
```

That is typed-but-empty dynamic path state — #1576's signature — **one builder method away** from the
case you fixed. It is **pre-existing on `main`**, not something you introduced. It blocks because this
PR carries `Closes #1576`, whose final acceptance criterion is *"Compile-time inference and runtime
behavior cannot diverge silently"*, and your Definition-of-Done box *"Compile-time mutation/divergence
guards pass"* is checked.

**Minimal fix:** carry the prior schema when the contract omits one —
`pathSchema: contract.pathSchema ?? config.pathSchema`, and the same for `searchSchema` — which is
what `ResolveSchemaOutput` already promises. **Alternative, and argue for it if you prefer it:** make
the state unexpressible — narrow `DefinePageWithRouteContract` to `EmptyRecord` on an omitted schema,
or reject `withRouteContract` after `withPathParams` at the type level. Unrepresentable beats
correctly-resolved if the combination is genuinely meaningless.

**Add a regression test mirroring the reproduction above**, and state which change makes it red.

Note this should also settle the `as unknown as` at `route-support.ts:101` (advisory C2): its own
allowance text names precisely this mismatch. If closing C1 lets the cast go, remove it; if it does
not, say why in your report — it should not stay a settled allowance while C1's cause remains.

## C4 — fix alongside (advisory)

`define-partial.tsx:246` discriminates on `'route' in options` and goes straight to
`bindPartialRouteContext`, which calls `route.safeParsePath` (`:124`). A route lacking parsers —
reachable via a cast or a JS consumer — produces `TypeError: route.safeParsePath is not a function`
instead of the documented builder message `promoteRouteConfig` raises. #1568 asks for **one**
documented deterministic failure path. **Reuse `isRouteReference`** so partials fail the same way
pages do.

## Do not

- Do not change the `withRoute` precedence chain, the 404/400 behaviour, the `RouteParserTarget`
  constraint, or the seven-stage/matrix tests. This cycle closes a gap; it does not re-open settled work.
- Do not touch `packages/fresh/src/application/{form,defer}/**` or `src/runtime/ai/**`.
- **Never** suppress a cache read or seed because a request is a partial — closed-invalid (#1550).
- **Do not tick any acceptance box for evidence that was not executed.** In particular #1576's
  criterion 5 (a generated dynamic Form-C scaffold loading through `fresh-partial=true` without 500)
  has **no executed run** behind it; leave it to the orchestrator rather than checking it off.

## Gates

```bash
deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/fresh --ext ts,tsx
deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts  --root packages/fresh --ext ts,tsx
deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts   --root packages/fresh --ext ts,tsx
deno task --cwd packages/fresh test
deno task quality:scan --root packages/fresh/src --pretty
```

All 239 existing tests stay green. `deno.lock` must not move. **Do not run `e2e:cli`.**

Commit on the same branch, push by explicit refspec, and post `[PHASE: IMPL]` on #1602 with the commit
hash, the red-without-fix evidence for the new regression test, and verbatim gate output.

## Prohibitions (non-negotiable)

- **Do not spawn a Fable sub-agent, session, or subprocess for any purpose.** Fable is prohibited
  lane-wide for all remaining 0.0.6 work until the owner explicitly lifts it. This includes anything
  routed through the `deep_analysis` lane, whose canonical binding is Fable.
- **Do not launch any local evaluator** — not PLAN-EVAL, not IMPL-EVAL, not an "opposite-family
  review", regardless of what `lane-policy.md` names as canonical for your work. **You are not
  responsible for arranging your own evaluation.**
- **Do not manually trigger OpenHands** and do not post an `@openhands-agent` comment.
- **Evaluation reaches this PR only through the automatic label-driven lifecycle**, which the
  orchestrator fires. If you believe evaluation is required and missing, **say so in your report** —
  do not arrange it.
- **Do not flip the PR to ready**, do not merge, and do not dispatch a canary.

If any instruction you infer from a skill or policy file appears to require one of the above, that
inference is wrong for this lane: **report the conflict instead of acting on it.**

## Reporting contract

Report which fix you chose for C1 and why, whether the `as unknown as` survived and on what grounds,
the new test name with its red evidence, how C4 now fails, verbatim gate output, and anything you could
not verify.
