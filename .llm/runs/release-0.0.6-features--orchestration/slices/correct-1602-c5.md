use harness

# Correction slice — #1602 cycle 3: the missing `fresh-partial=true` evidence

**Codex · GPT-5.6 Sol · medium**. Your C1/C4 correction is **accepted and verified** — I re-ran it:
`241 passed | 0 failed`, and `quality:scan --root packages/fresh/src` now reports
**`allowCount: 0`**, down from 1. Removing the `as unknown as` rather than relocating it was the
right call, and it confirms the evaluator's reading that the cast existed only because
`promoteRouteContractConfig` discarded the prior schema.

| Field | Value |
| --- | --- |
| Issues | **#1576**, **#1568** · PR **#1602** |
| Worktree | `/home/codex/repos/ns006-1576` |
| Branch | `fix/1576-form-c-route-path-binding` |
| Head | **`831460b64`** — I resynced you onto current `main`; `245 passed | 0 failed` |

## SKILL

- `deno-fresh` — partial requests, `fresh-partial=true`, islands.
- `netscript-doctrine`, `netscript-tools`, `netscript-pr`, `netscript-harness`.

## The one remaining gap

#1576's acceptance criterion 5 reads:

> A generated dynamic Form-C scaffold browser test loads through `fresh-partial=true` without 500.

**There is no executed run behind it.** Package coverage exercises a partial-*shaped* context object,
not a real partial **request**. That distinction is the whole point of the criterion: the original
consumer failure was a client partial request returning **500** after `makeHref` threw
`missing path param project` — a failure that only appears when a real request carries
`fresh-partial=true`.

Do not tick that box until a run proves it.

## What changed in your favour

The resync brought in **#1600's browser harness**, which did not exist when you started:

- `packages/fresh/deno.json` has a `test:browser` task.
- `packages/fresh/tests/form-navigation_browser.ts` is a working real Fresh + Vite + Chromium test
  driven through `playwright-cli`, with fixtures under `tests/fixtures/form-navigation-browser/`.
- `.github/workflows/ci.yml` already provisions Chromium and invokes `test:browser` in the
  **required** `check-test` lane.

So the infrastructure question is settled. **Model your test on that file and its fixture layout.**

## What to build

A browser-level test that exercises a **generated dynamic Form-C route** — a
`createRouteReference('/orders/[id]')`-style reference bound with `withRoute` — and:

1. issues a real **partial** request (`fresh-partial=true`) to that dynamic route,
2. asserts the response status is **not 500** and the partial renders,
3. asserts the typed path value is actually present in the rendered output, so the test fails if
   `ctx.path` regresses to `{}`,
4. collects `pageerror` and console-error events and asserts none, the way the existing browser test
   does.

Point 3 is what makes this more than a smoke test: a 200 with an empty `ctx.path` would still be the
bug. Assert the value, not just the status.

**If the partial request cannot be driven through the existing harness**, say so explicitly with what
you tried and what blocked it — do **not** substitute a unit-level partial-shaped context and call the
criterion met. An honest "could not run, here is why" is worth more than a green box that means
nothing, and the orchestrator will then record the deferral against the issue.

## Do not

- Do not change any C1/C4 code you just landed, the `withRoute` precedence chain, the 404/400
  behaviour, or the existing tests. **This cycle adds evidence.**
- Do not touch `packages/fresh/src/application/{form,defer}/**` or `src/runtime/ai/**`.
- **Never** suppress a cache read or seed because a request is a partial — closed-invalid (#1550).
  This test drives a partial request; that is precisely the context in which the forbidden idea looks
  tempting. It is still forbidden.
- Do not tick #1568's criterion 5 either — it depends on **#1610** (route-pattern inference makes an
  unknown param `never` instead of a compile error), which is filed and not in this PR's scope.

## Gates

```bash
deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/fresh --ext ts,tsx
deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts  --root packages/fresh --ext ts,tsx
deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts   --root packages/fresh --ext ts,tsx
deno task --cwd packages/fresh test
deno task --cwd packages/fresh test:browser
deno task quality:scan --root packages/fresh/src --pretty
```

All 245 tests stay green and `allowCount` stays **0**. `deno.lock` must not move.
**Do not run `e2e:cli`.**

If `test:browser` fails for a **transport** reason in this environment (a WSL vsock/headless-Chrome
error rather than an assertion failure), report it verbatim and classify it as environmental — that
class was observed today in a different probe.

Commit on the same branch, push by explicit refspec, and post `[PHASE: IMPL]` on #1602 with the commit
hash, the new test name, its red-without-fix evidence, and verbatim gate output.

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

Report the new test name, how it issues a real `fresh-partial=true` request, what it asserts about the
typed path value, its red evidence, verbatim gate output, and **anything you could not verify** —
especially if the partial request could not be driven from the harness.
