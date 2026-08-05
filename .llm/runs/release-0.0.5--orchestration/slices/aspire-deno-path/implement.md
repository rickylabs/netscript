use harness

# Slice: can the Deno-runtime path remove our NuGet dependency? (research, #1227-adjacent)

## SKILL

Activate `netscript-harness`, `netscript-doctrine`, `netscript-deno-toolchain`, and the internal
`aspire` skill. Per D6 no local PLAN-EVAL. Route: openai · gpt-5.6-sol · **xhigh**.

**This is a research slice. Its deliverable is a verdict with evidence, not a migration.** Do not
change scaffold output. If the answer is "not yet", that is a complete and valuable result.

## The question

`aspire restore` is a NuGet-shaped operation and it intermittently fails with
`Failed to prepare: A task was canceled` (#1227, p0, blocking the wave-6 pilot). If the Deno
orchestration path removes or shrinks that NuGet dependency, it may dissolve the failure class
rather than retry around it.

## What our own code already says — start here, it is the thread

`packages/cli/src/kernel/templates/aspire/generate-aspire-config.ts` carries this comment:

> ### Deno orchestration — intentionally no NuGet
> We deliberately do NOT emit `CommunityToolkit.Aspire.Hosting.Deno`. Its `addDenoApp(...)`
> extension is `[AspireExport]`-annotated, but in Aspire 13.2 the export decorator is only
> honoured for types declared inside the AppHost project itself — external NuGet packages are
> skipped. … Instead every generated `.helpers/register-*.ts` uses the SDK primitive
> `builder.addExecutable('deno', ...)`. **Revisit when Aspire 13.3 lands (GH aspire#15119 /
> aspire#16220).**

Established facts, do not re-derive:
- We are on **Aspire 13.4.6** — well past the 13.3 the comment waits for. **The version
  condition is met.**
- But **both referenced upstream issues are still OPEN**: aspire#15119 ("Bad error when
  integration doesn't support AspireExport") and aspire#16220 ("Complete polyglot integration
  host support and cross-language integration"). **So the dependency condition is NOT met** — at
  least not on their face. Verify that rather than trusting my summary: read both issues, their
  linked PRs, and whether the capability shipped under a different change.

## Answer these, with citations

1. Does `[AspireExport]` on external NuGet packages work in 13.4.6? Test it, do not infer.
2. Is `CommunityToolkit.Aspire.Hosting.Deno` viable now — version, support level, and does
   `addDenoApp(...)` surface in a TypeScript AppHost's generated `.aspire/modules/aspire.mts`?
3. **The load-bearing question: would adopting it reduce or increase the NuGet surface that
   `aspire restore` must fetch?** If it adds another NuGet, it makes #1227 *worse*, not better.
   Quantify what restore fetches today versus under that path.
4. Is there any AppHost configuration that avoids the NuGet restore entirely for a Deno-only
   graph (no Postgres/Redis container integrations)? What would we lose?
5. Do the two PRs the owner expects to land upstream against Aspire's next milestone change this
   answer, and on what timeline?

## Deliverable

A single artifact `research.md` in the slice dir plus a PR carrying it (`Refs #1227`, no
`Closes`): the verdict (adopt now / adopt when X / do not adopt), the evidence for each question
above, and — if the verdict is conditional — the exact upstream signal to watch. Include a
recommendation on whether it is worth a 0.0.6 epic.

Worktree `/home/codex/repos/ns005-denohost`, branch `research/aspire-deno-runtime-path`
(NO upstream; explicit-refspec push).
