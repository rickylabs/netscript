use harness

## SKILL

Load `netscript-harness`, `netscript-tools`, `netscript-deno-toolchain`, `netscript-doctrine`,
`netscript-cli`, and `rtk`. Read `.llm/harness/gates/static-gates.md` and
`.llm/harness/workflow/lane-policy.md`.

# Brief — #1371 IMPL-EVAL (independent, opposite-family)

You are the **independent implementation evaluator** for issue #1371 / draft PR #1728. You did not
author this work and you must not fix it. Your only output is a verdict.

- **Exact head:** `68482a13adf13c9e53bf49d335bd361305a284de` on `fix/aspire-declared-reference-fail-fast`
- **Worktree:** `/home/codex/repos/netscript-007-eval-1371` (already checked out at that head)
- **Base:** `3b32d1628584749af4dd6e97fd331c24e84f0b9e` (main)

**Assert head equality first.** `git rev-parse HEAD` == the remote branch head == PR #1728
`headRefOid` == the SHA above. A verdict against a different head is void. If they diverge, stop and
report only that.

## The admitted contract you are evaluating against

Issue #1371 "Admitted design" section, decided by the coordinator after a runtime verification:

> A declared `ServiceReferences` / `PluginReferences` entry is a **required** AppHost dependency. If
> `_services.get(ref)` / `_plugins.get(ref)` is absent, **or** its `http` endpoint cannot resolve,
> the emitted code throws a **deterministic configuration error** naming the background processor,
> the reference kind, and the reference name, **before the processor is registered**. The raw
> env-key contract `services__<ref>__http__0` is preserved verbatim. Background only.

Do not re-litigate that decision — generator-time validation and a warning were both explicitly
rejected. Evaluate whether the implementation *matches* it.

## What to check — execute, do not read and believe

1. **Scope.** `git diff --name-only 3b32d1628...HEAD` must be exactly
   `packages/cli/src/kernel/templates/aspire/helpers/register/generate-register-background.ts` and
   `packages/cli/src/kernel/templates/aspire/helpers/tests/generate-register-background_test.ts`,
   plus leaf run artifacts. A seventh path is an automatic `FAIL_IMPL`. No lock, cache, or workflow
   churn. Confirm **no pre-existing test was modified or deleted** to make anything pass.
2. **RED-first is real.** Check out the test-only commit `099370709` separately and run the focused
   suite there. It must genuinely fail. If it passes, the RED claim is false and that is a finding.
3. **Throw precedes registration.** In the emitted output, the throw must occur before
   `builder.addExecutable(...)` for that processor. Construct the emitted module and prove the
   processor is absent from the returned map when a reference is unresolved — do not infer it from
   source order alone.
4. **Both reference kinds.** Missing service, missing plugin, present-but-unresolvable service
   endpoint, and present-but-unresolvable plugin endpoint must each throw.
5. **Determinism.** The same inputs must produce the identical message. No timestamps, no ordering
   dependence, no interpolated object identity. Try a reference name containing quotes or a
   backslash and confirm the emitted source is still valid and correctly escaped.
6. **Key shape is untouched.** `services__<ref>__http__0` with hyphens verbatim, for a hyphenated
   name like `workers-api`. Nothing may normalize to underscores. Confirm the emitted key still
   matches what `packages/sdk/src/discovery/service-url.ts` reads.
7. **Positive paths still work.** Resolvable service and resolvable plugin references still set the
   env var and still register the processor.
8. **Identifier collisions.** The same name declared as *both* a service and a plugin reference must
   emit distinct identifiers and valid TypeScript. Push on this: try duplicate names within one
   list, and names differing only by a character `safeIdentifier` normalizes (`workers-api` vs
   `workers_api`).
9. **Gates at this head:** focused suite; `deno task check`; `deno task test`; `deno task lint`;
   `deno task fmt:check`; `deno task quality:scan` (**`allowCount` must be 7**); `deno task
   arch:check`; `deno task check:assets-barrel`; CLI publish dry run and per-member CLI JSR audit
   with the existing WARN baseline disclosed as baseline.

## Out of scope — do not run or request

**No runtime lease exists.** `scaffold.runtime`, `e2e:cli`, Aspire, Docker, browser/Playwright are
unavailable; keep Docker and Aspire empty. Do not merge, mark the PR ready for review (that is this
repo's IMPL-EVAL dispatch trigger), flip labels, close the issue, or push to the author's branch.

Apps registration, `#1365`, browser-side `build-vite-env-var-name.ts`, and `packages/sdk` discovery
are out of this leaf's envelope. If you find a defect there, report it as an observation and do not
fail the leaf for it.

## Output

Write `impl-eval.md` in `.llm/runs/fix-aspire-declared-reference-fail-fast--1371/`, commit it, push
with an explicit refspec, **and post one PR comment on #1728 opening with the exact marker line**:

**[PHASE: IMPL-EVAL] [VERDICT: PASS]**  (or `[VERDICT: CHANGES_REQUESTED]`)

The artifact must carry the verdict token `PASS_IMPL` or `FAIL_IMPL` on its own line, the exact
evaluated head, your head-equality assertion, and numbered findings each with severity, reproducing
evidence, and the contract clause violated. A finding without a reproduction is not a finding.

Report the executed command and its actual exit for every claim. Praise and quality adjectives are
not evaluation output — omit them. If it passes, say so plainly and stop.
