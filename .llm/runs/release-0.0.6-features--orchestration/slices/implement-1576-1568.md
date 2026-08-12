use harness

# Slice brief — #1576 + #1568: make generated route references bind at runtime

**Codex · GPT-5.6 Sol · medium** (`normal_implementation`). **#1576 is P0.** Two issues, one PR:
#1568 extends the exact mechanism #1576 repairs, so they are technically inseparable — do the P0
first and make the partial binding reuse it rather than parallel it.

| Field | Value |
| --- | --- |
| Issues | **#1576** (`priority:p0`, `type:fix`) and **#1568** (`priority:p1`, `type:feat`) |
| Worktree | `/home/codex/repos/ns006-1576` |
| Branch | `fix/1576-form-c-route-path-binding` |
| Base | `main@e85d8d28c` — already checked out |

## SKILL

- `deno-fresh` — Fresh routing, params, partials.
- `netscript-doctrine` — `packages/fresh` is framework code; the builder surface is published.
- `netscript-tools`, `netscript-pr`, `netscript-harness`.

## The #1576 mechanism — already located, do not re-derive

`packages/fresh/src/application/builders/define-page/runtime/context.ts:73-78`:

```ts
export function resolvePathParams<TPath extends object>(
  schema: PathParamSchema<TPath> | undefined,
  params: Record<string, string | undefined>,
): TPath {
  if (!schema) {
    return {} as TPath;   // <-- Form-C references land here, always
  }
  ...
```

`runtime/handlers.ts:33` calls it as `resolvePathParams(config.pathSchema, ctx.params)`.

On `PageRouteTarget` (`page-compat/route-types.ts:169-185`) `pathSchema` is **optional**. But
`PageRouteReference` (`:187-205`) — what `withRoute()` actually receives — declares `parsePath`
and `safeParsePath` as **required** members. So a generated Form-C reference always carries the
means to parse its own params, and the runtime never asks it to.

The reference is already in scope at the call site: `handlers.ts:49` passes `config.route` to
`withRouteContext`. **This is a wiring gap, not a missing capability.**

## What to build

1. **#1576 — resolve `ctx.path` from the reference.** When `config.pathSchema` is absent and
   `config.route` exposes `safeParsePath`, resolve typed path params through it. Preserve the
   documented failure path: `resolvePathParams` currently throws `new Response(null, {status: 404})`
   on a failed parse, and an invalid or missing param must keep doing exactly that.
   Order of precedence must be explicit and stated — an author-supplied `pathSchema` should not be
   silently overridden by a reference, or vice versa. Say which wins and why.
2. **#1568 — bind `definePartial` to a generated reference.** `definePartial` lives at
   `packages/fresh/src/application/builders/define-partial.tsx` (re-exported through
   `builders/mod.ts:28`) and today takes an unconstrained consumer-supplied `TContext` generic.
   Add a native route-binding surface — a `route` option or a fluent `withRoute`, your call, argued
   — that accepts a generated reference and exposes parsed `path` and contract-parsed `search` to
   loaders and handlers. **Reuse the resolution built for #1576**; a second parallel implementation of
   the same parsing is the failure mode to avoid here.
   Dynamic, catch-all, optional catch-all, and search-schema behaviour must match
   `definePage().withRoute(...)`, and invalid route state must follow **one** documented deterministic
   failure path — the same one, not a second convention.

## The acceptance item that needs real thought

Both issues ask that **compile-time inference and runtime behaviour cannot diverge silently.** That is
the actual defect class here: `withRoute` inferred `{project, channel}` while the runtime handed back
`{}`, and nothing complained. A fix that only adds parsing leaves the next divergence just as silent.

Propose a mechanical guard — a type-level constraint that a reference carrying `$types.path` must
also carry runtime parsing, a test that asserts inferred keys equal resolved keys for a generated
fixture, or something better. **State what your guard would and would not have caught for #1576.**
If you conclude no mechanical guard is worthwhile, argue it explicitly rather than omitting it.

## Boundaries

- **Do not touch** `packages/fresh/src/application/form/**` — a sibling leaf owns #1569 there.
- **Do not touch** `packages/fresh/src/runtime/ai/**` or `src/internal/**` — #1583 is landing there.
- `packages/fresh/src/application/defer/**` is out of scope. **Never** suppress a cache read or seed
  because a request is a partial — Fresh client navigation *is* a partial, and that idea is closed as
  invalid (#1550). Not relevant to this file set today; keep it that way.
- The builder surface is **published**. Any public shape change must be stated and justified.

## Required tests

- `ctx.path` populated from a generated dynamic reference **without a sidecar** — the exact
  consumer-reported case, `definePage().withRoute(createRouteReference('/orders/[id]'))`.
- Path values asserted **inside resources, layers, partial URL callbacks, forms, layouts, and
  metadata** — #1576 lists these explicitly because the bug surfaced through a loader and then again
  through `makeHref`.
- Dynamic, catch-all, and optional catch-all references.
- Invalid/missing params take the documented 404 path.
- Partial route binding matches page binding across the same matrix (#1568).
- Compile-time mutation coverage: a generated route rename/add/remove propagates to partial consumers.

Each test must fail without your change. State which.

## Gates

```bash
deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/fresh --ext ts,tsx
deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts  --root packages/fresh --ext ts,tsx
deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts   --root packages/fresh --ext ts,tsx
deno task --cwd packages/fresh test
deno task quality:gate
```

`arch:check` does **not** cover `packages/fresh` — run an explicit target quality scan over
`packages/fresh/src` and state that the package verdict rests on it. Use `deno task --cwd <pkg> test`,
never a bare `deno test <path>`. **Do not run `e2e:cli`.**

**`deno.lock`:** if it moves and you added no dependency, **stop and report**. If you added one, the
delta is whatever Deno deterministically generates — never hand-reduced. Incomplete lock closures cost
this lane a canary cycle and two P0 issues.

## Commit trail

Commit by slice — #1576 first, then #1568 — and open **one draft PR** against `main`. Title:
`fix(fresh): bind generated route references to runtime path and search state`.
Body per `netscript-pr` with **`Closes #1576`** and **`Closes #1568`** in `## Scope`. Map both
issues' acceptance with `box-index` entries; **no empty `acceptance-evidence` entry list** (#1561).
Labels `type:fix`, `area:fresh`, `priority:p0`, `status:impl`, milestone `0.0.6`.
Push by explicit refspec; post `[PHASE: IMPL]` with commit hashes and real gate output.

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

Report the precedence rule you chose and why, the divergence guard you propose (or your argument
against one), exact test names with what each catches, verbatim gate output, and **anything you could
not verify**.
