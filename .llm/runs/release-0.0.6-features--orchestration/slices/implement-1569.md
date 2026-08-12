use harness

# Slice brief — #1569 managed form redirects under inherited client navigation

**Codex · GPT-5.6 Sol · medium** (`normal_implementation`). **P1.**

| Field | Value |
| --- | --- |
| Issue | **#1569** (`priority:p1`, `type:fix`, `area:fresh`) |
| Worktree | `/home/codex/repos/ns006-1569` |
| Branch | `fix/1569-form-redirect-nav-strategy` |
| Base | `main@e85d8d28c` — already checked out |

## SKILL

- `deno-fresh` — Fresh client navigation, partials, and the reviver.
- `netscript-doctrine` — `packages/fresh` is framework code; the form surface is published.
- `netscript-tools`, `netscript-pr`, `netscript-harness`.

## The defect

NetScript managed forms render with client navigation enabled by default. In an app whose `<body>`
also opts into Fresh client navigation, a successful `withForm` mutation that redirects to a new
full-document URL is revived as a **partial** response and fails during client-side revival.

The consumer must currently write this raw literal on every redirecting managed form:

```tsx
<Form state={state} {...{ 'f-client-nav': 'false' }}>
```

Note what that workaround is doing: passing the **string** `'false'`, not the boolean.

## Start here — verify the mechanism before designing

`packages/fresh/src/application/form/_internal/prop-types.ts:218` types the prop as
`readonly 'f-client-nav'?: boolean`, and `components/enhancement.tsx:54` resolves it as
`'f-client-nav': strategy.clientNav ?? true`.

The issue states that **a boolean `false` is not sufficient** because the Fresh reviver checks the
literal attribute value. Establish with evidence what a JSX boolean `false` on a hyphenated
attribute actually renders as in this Preact/Fresh version — omitted entirely, `"false"`, or
something else — and what the reviver reads. **That determines whether the fix is a rendering
correction, a strategy addition, or both.** Cite `path:line` for the reviver check.

If the boolean genuinely cannot express the document strategy, say so plainly: that makes the current
public type a lie, which is a stronger finding than "add an option".

## What to build

An explicit, **typed** navigation strategy for successful redirects — `document` vs `client` or an
equivalent you argue for — exposed on the public form API. `enhancement.tsx:54` already resolves
through a `strategy` object, so there is an existing seam; prefer extending it over adding a parallel
prop.

Requirements from the issue, each of which is a test:

- The **document** strategy overrides an inherited `<body f-client-nav>` opt-in **reliably**.
- The **default** strategy stays backwards compatible.
- POST **validation errors** continue to render through managed form state **without** a document
  reload — this is the regression risk: a blunt "always full document" fix breaks the error path.
- A browser test covers successful POST + redirect **under an ancestor/body client-nav opt-in** and
  asserts no reviver or runtime error.

The workaround must become unnecessary, not merely documented. A consumer should not need to know the
attribute exists — that leak is the actual complaint.

## Boundaries

- **Do not touch** `packages/fresh/src/application/builders/**` or `src/application/route/**` — a
  sibling leaf owns #1576/#1568 there right now.
- **Do not touch** `packages/fresh/src/runtime/ai/**` or `src/internal/**` (#1583 is landing).
- `packages/fresh/src/application/defer/**` is out of scope. **Never** suppress a cache read or seed
  because a request is a partial — Fresh client navigation *is* a partial, and that idea is closed as
  invalid (#1550). `DeferIsland.tsx:222` sets `f-client-nav` from partial state; **do not change
  it** — it is a different concern that happens to touch the same attribute name.
- The form surface is **published**. State any public shape change and justify it.

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

If the browser-level assertion cannot run in this environment, **say so explicitly** and state what
you proved instead — do not silently downgrade it to a unit test and call the box satisfied.

**`deno.lock`:** if it moves and you added no dependency, **stop and report**. If you added one, the
delta is whatever Deno deterministically generates — never hand-reduced.

## Commit trail

One draft PR against `main`. Title:
`fix(fresh): give managed form redirects an explicit navigation strategy`.
Body per `netscript-pr` with **`Closes #1569`** in `## Scope`, your mechanism evidence, and pasted
per-test red evidence. Map #1569's acceptance with `box-index` entries; **no empty
`acceptance-evidence` entry list** (#1561). Labels `type:fix`, `area:fresh`, `priority:p1`,
`status:impl`, milestone `0.0.6`. Push by explicit refspec; post `[PHASE: IMPL]` with commit hash
and real gate output.

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

Report what a JSX boolean `false` actually renders as and what the reviver reads (with citations),
the strategy shape you chose and why, how you proved the document strategy beats an inherited body
opt-in, exact test names, verbatim gate output, and **anything you could not verify** — especially if
the browser-level assertion could not run here.
