use harness

# Slice brief — #1577 restore the default browser-log child for generated executable apps

**Codex · GPT-5.6 Sol · low** (`light_implementation`). **P1.** The mechanism is fully known; the
real work is reconciling three sources that currently contradict each other.

| Field | Value |
| --- | --- |
| Issue | **#1577** (`priority:p1`, `type:fix`, `area:aspire`) |
| Worktree | `/home/codex/repos/ns006-1577` |
| Branch | `fix/1577-aspire-browser-logs` |
| Base | `main@f542f31cb` — already checked out |

## SKILL

- `netscript-cli` — scaffold/generator surface, Aspire helper emission.
- `netscript-tools`, `netscript-pr`, `netscript-harness`.

## The contradiction — verified, do not re-derive

Three things on current `main` disagree:

1. `packages/cli/src/kernel/constants/scaffold/scaffold-aspire.ts:36` **pins**
   `Aspire.Hosting.Browsers`, and `generate-aspire-config_test.ts:83` asserts the pin is present.
2. `packages/cli/src/kernel/templates/aspire/helpers/tests/generators-background-app_test.ts:364`
   asserts the opposite of the fix: `assert(!output.includes('withBrowserLogs'))`.
3. The **shipped agent help text** (source for `kernel/assets/skills.generated.ts`) tells agents:
   *"Generated app resources emit `withBrowserLogs()` **by default**, so client-side failures … land
   in the Aspire dashboard"* — and then instructs them to run `aspire logs <app-resource>` instead of
   reaching for Playwright.

So NetScript **ships the package pin and documentation for a feature it does not emit**, and the
guidance actively sends agents to a log stream that does not exist. That is the strongest argument
that (2) is the stale artefact, not the intended contract.

**Provenance:** #218/#231 added it; #781/#791 removed the emitted call because the then-generated
Aspire API did not expose it on `ExecutableResourcePromise`. The pinned
`Aspire.Hosting.Browsers@13.4.6-preview.1.26319.6` now exposes `withBrowserLogs()` on
`ExecutableResource`, so the limitation that justified removal is gone.

## What to do

Emit `await <app>.withBrowserLogs();` **after endpoint binding** in the generated
`aspire/.helpers/register-apps.mts`, for an enabled frontend `Type: 'app'` **that has an HTTP/HTTPS
endpoint**. Endpoint-less task/desktop resources must be unaffected — that condition is the fix's
whole safety boundary, so make it explicit in code and prove it with a negative test.

**Verify the API before emitting.** Confirm from the pinned package that `withBrowserLogs()` exists
on the generated executable resource type and whether it is awaitable. Do not emit a call you have
not confirmed resolves — that is exactly how #781 happened in reverse. State what you checked.

## The stale test — handle it explicitly, do not just flip it

`generators-background-app_test.ts:364` will go red. **Do not delete or skip it.** Decide what it
should now assert and say why in your report:

- if it is genuinely about **background/endpoint-less** resources, it should keep asserting the
  absence for that case — which means the negative case still needs a home;
- if it asserts the absence for an **endpoint-bearing app**, that assertion encodes the #781
  limitation and is now stale; replace it with the positive assertion and record the rationale.

A test edited to fit a change, without that rationale stated, is a review-blocking finding in this
lane. Quote the test's current setup in your report so the reader can judge which case it covers.

## Required tests

1. An enabled frontend `Type: 'app'` **with** an HTTP endpoint emits `withBrowserLogs()` after
   endpoint binding.
2. An endpoint-less task/desktop resource does **not**.
3. The `Aspire.Hosting.Browsers` pin remains asserted (`generate-aspire-config_test.ts`).
4. The reconciled `generators-background-app_test.ts` case, per your decision above.

Each must fail without your change. State which.

## Boundaries

- **Do not hand-edit `kernel/assets/skills.generated.ts`** — it is generated. If the help text needs
  a change, edit its **source** and regenerate through the documented task. If the text is already
  correct once the fix lands (it describes the restored behaviour), say so and change nothing.
- Do not alter unrelated Aspire generator behaviour, ports, or health checks.
- `packages/cli` is published surface.

## Gates

```bash
deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/cli --ext ts,tsx
deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts  --root packages/cli --ext ts,tsx
deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts   --root packages/cli --ext ts,tsx
deno task --cwd packages/cli test
deno task quality:gate
```

Use `deno task --cwd <pkg> test`, never a bare `deno test <path>`. **Do not run `e2e:cli`** — it is
expensive and serialised across this lane; the orchestrator decides if a runtime pass is needed.

**`deno.lock`:** if it moves and you added no dependency, **stop and report**.

## Commit trail

One draft PR against `main`. Title:
`fix(aspire): emit withBrowserLogs for endpoint-bearing generated app resources`.
Body per `netscript-pr` with **`Closes #1577`** in `## Scope`, the API confirmation, and your stale-test
rationale. Map #1577's acceptance with `box-index` entries; **no empty `acceptance-evidence` entry
list** (#1561). Labels `type:fix`, `area:aspire`, `priority:p1`, `status:impl`, milestone `0.0.6`.
Push by explicit refspec; post `[PHASE: IMPL]` with commit hash and real gate output.

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

Report how you confirmed `withBrowserLogs()` exists on the pinned type, the exact emission condition,
your decision on the contradicting test **with rationale**, whether the shipped help text needed a
source change, exact test names, verbatim gate output, and anything you could not verify.
