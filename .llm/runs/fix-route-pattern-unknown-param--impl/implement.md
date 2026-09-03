use harness

## SKILL

Read `.agents/skills/netscript-harness/SKILL.md`, `.agents/skills/deno-fresh/SKILL.md`, and
`.agents/skills/netscript-pr/SKILL.md`.

You are the implementation lane (Codex · OpenAI · GPT-5.6 Sol · high, `complex_implementation`) for
**#1610**. Read it in full: `gh issue view 1610 --repo rickylabs/netscript`.

Worktree `/home/agent/projects/netscript/worktrees/007-leaf-1610`, branch
`fix/route-pattern-unknown-param-error`, based on current `origin/main`.

Scope: `packages/fresh/**` and the run-dir worklog. Nothing else.

## The defect

Pattern-inferred route path types let you read a param the route does not declare. It type-checks
and returns `undefined` at runtime, because the property resolves to `never` and `never` is
assignable to everything:

```ts
const ref = createRouteReference('/projects/[project]');
type P = ReturnType<typeof ref.parsePath>;
declare const path: P;
const bogus: string = path.channel;   // compiles today; undefined at runtime
```

Why it matters: rename `/projects/[project]` → `/projects/[workspace]` and every consumer reading
`ctx.path.project` still compiles clean while reading `undefined`. That is precisely the silent
compile/runtime divergence the route-reference work exists to eliminate.

## Task 1 — verify the mechanism before changing anything

The issue attributes the index signature to `EmptyRecord` being intersected in via static segments.
**Do not assume that is where it enters.** At `packages/fresh/src/application/route/types.ts` there
are two deliberately different types:

- `EmptyRecord = Record<string, never>` — carries `[k: string]: never`;
- `EmptySegment = {}` — deliberately index-signature-free, with a comment stating it exists so
  `InferRoutePatternPathSegments` intersections do not collapse to `never`.

So the segment path already avoids `EmptyRecord`. Locate where the `[x: string]: never` actually
reaches the inferred path type, reproduce the issue's snippet at the current head, and record the
mechanism in the worklog with file:line before proposing the fix. If the issue's stated cause is
wrong, say so — that is a finding, not a blocker.

## Task 2 — make unknown-key access a compile error

Fix it in the route-inference layer, not in consumers or builders.

**Hard constraint:** `EmptyRecord` is the default type parameter for `definePage`, `withLayer`,
`DefinePageRootBuilder`, catalog, and state across **18 files**. Do **not** change its meaning
globally to fix routing. If the routing path needs a different empty shape, introduce or reuse a
routing-local type. If you believe a shared change is genuinely correct, prove no ripple: scoped
check plus the full `packages/fresh` test suite, and say so explicitly.

## Task 3 — prove it at a consumer site

The carrier test is not the claim. `assertPartialRouteMutationInference` in `define-partial.test.tsx`
already proves `IsNever<...>` for an unknown key; that is the *type carrier*, not "a consumer site
fails to compile". Add a `@ts-expect-error` test on a **consumer** reading a param the pattern does
not declare — the renamed-away-param case from the issue.

Make it non-vacuous: a `@ts-expect-error` that would still be needed for an unrelated reason proves
nothing. Show the directive is required by the specific defect.

## Must not regress

The four-pattern inference matrix in `builder.test.tsx` (dynamic, catch-all, optional catch-all,
static) must still pass unchanged. Confirm `EmptySegment`'s intersection behaviour is preserved —
its comment documents a real hazard.

## Gates

- `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/fresh --ext ts,tsx`
- `deno task --cwd packages/fresh test`
- `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/fresh --ext ts,tsx`
- `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/fresh --ext ts,tsx`

RED-then-GREEN: commit a failing test first, then the fix. Record both SHAs in the worklog.

## PR rules

Open a **draft PR on the first commit** — note that a draft skips every runtime job, so mark it
ready when you want CI. Body carries `Closes #1610` only if all four acceptance boxes are genuinely
satisfied; otherwise `Refs #1610` with the remaining scope stated. Labels: `type:fix`, `area:fresh`,
`priority:p2`, `status:impl`, `orchestrator:fixes`; milestone `0.0.7`.

Record progress in `.llm/runs/fix-route-pattern-unknown-param--impl/worklog.md`; the supervisor
watches that file.
