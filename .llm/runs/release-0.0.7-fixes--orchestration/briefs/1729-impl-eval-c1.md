# IMPL-EVAL cycle 1 — #1729 grouped agent-init leaf at `9abc76d48`

You are a **formal implementation evaluator** under the NetScript harness. Read
`.agents/skills/netscript-harness/SKILL.md` and the doctrine it points to before judging.

- PR **#1729** · issues **#1674 (p0)**, **#1672**, **#1675** · milestone 0.0.7
- Evaluated head: `9abc76d48cb7bf63ee25b413fb72160362bc2e8c` (immutable — do not rebase, amend, pull)
- Base: `main@8b1e42f725919457c64781d5973fd419017fab13` (integrated by merge, not rebase)
- Surface: `packages/cli` — `netscript agent init` generated output · Archetype: CLI · docs overlay
- Your worktree: `/home/codex/repos/netscript-007-eval-1729` (detached, evaluator-only)

You are **distinct** from the author (Codex `gpt-5.6-sol`, thread `01a04f8b-…`) and from the topic
supervisor. Do not resume or message either.

## What this leaf claims

Three measured Wave 7 failures in `agent init` output, grouped because they share one generated
surface while keeping **three distinct acceptance sets**:

- **#1674 (p0)** — root `AGENTS.md` is the only guaranteed-read file; it taught diagnostics only,
  named zero build surfaces (`definePage`, `withResource`, `defineRouteContract`, query factories,
  dehydration all 0 occurrences) and never linked `apps/<app>/AGENTS.md`. A run on it deleted the
  first file the app guide says to inspect and ended with 0 route contracts and 0 `ui:add`.
- **#1672** — generated guidance never taught the Deno toolchain: **55 `deno` invocations, 0 of them
  inspection**, and **40 `curl` fetches of raw jsr.io source** answering questions `deno doc` answers.
- **#1675** — skills installed only to `.claude/skills/`, no `.agents/skills/` canonical mirror, so
  non-Claude hosts got nothing; **1 skill invocation in ninety minutes**.

Product ceiling is **five paths**: `assets/agent/guidance.md.template`,
`assets/embedded.generated.ts`, `assets/manifest.ts`, `features/agent/init/init-agent.ts`,
`features/agent/init/init-agent_test.ts`. A sixth product path is a blocking finding.

## Judge these specifically

1. **Are the three issues genuinely separable?** Each acceptance set must be individually satisfiable
   and individually evidenced. A single undifferentiated rewrite that gestures at all three is a
   finding — a reviewer must be able to see which change answers which issue.
2. **Does the shipped generator actually change, or only a template?**
   `packages/cli/src/kernel/assets/embedded.generated.ts` is what ships. Verify `gen:assets-barrel`
   re-run **reproduces the committed bytes**, and verify against a **fresh scaffold** — run
   `agent init --host all --with-docs` into a temp workspace and inspect the real output. A
   template-only fix that leaves the barrel stale is the exact trap here.
3. **#1675's canonical→mirror direction.** `.agents/skills/` must be canonical with `.claude/skills/`
   *generated from it*, matching the framework's own convention — not two independently authored
   trees. Verify the direction, not merely that both exist. Confirm a non-Claude host could discover
   the skills.
4. **Is the guidance a pointer surface, not a tutorial?** All three issues say keep it short and link
   rather than duplicate. Check that `netscript-deno-toolchain` skill content is linked, not copied.
5. **Root `AGENTS.md` content**: does it name the contract → service → SDK → page spine, link
   `apps/<app>/AGENTS.md` and say what it is for, name the `ui:add` verbs, and say *when to reach for
   each skill* rather than merely listing them?

## Behavioural boxes — already resolved, do not re-open

Three acceptance boxes require a measured unfamiliar-agent signal (#1672 a4, #1674 a4, #1675 a5).
These are marked `[post-merge]` on the issue bodies by supervisor decision, to be verified by one
follow-up wave. Do not treat them as unmet, and do not attempt to run a behavioural wave yourself.

## Method requirements

- Probe in a **pristine tracked-files-only archive** (`git archive <head> | tar -x` into your job
  tmp), never in a repo checkout.
- **Do not run lock-sensitive gates sequentially in one archive** — earlier probes rewrite that
  archive's `deno.lock` and a later `quality:gate` then fails `deps:check:zod` for reasons you caused.
- **Control every red against a base archive of `main@8b1e42f72` before reporting it.** Known
  pre-existing behaviour: `run-deno-lint.ts --root packages/cli/src/public/features/agent` exits 2
  with `deno lint coverage refusal: all-excluded` on **both** head and base; at `packages/cli` scope
  both report 884 files, 0 occurrences, 0 fmt findings. That is exclusion config, not a regression.
- Read every grep hit rather than counting matches.

## Boundaries

- **No Aspire, Docker, browser, `e2e:cli`, release gate, or expensive-gate lease.** A fresh
  `agent init` scaffold into a temp dir is authorized and expected; a running app is not.
- Modify no product, test, docs, or tooling path. Touch no label, readiness, checkbox, lease, or PR
  state. Do not merge. Leave no residue in any checkout.

## Deliverable

Write `.llm/runs/fix-agent-init-guidance-and-cross-host-skills--0.0.7/impl-eval-cycle-1.md`:
head-identity table, reproduction environment, a re-derived gate table with exact commands and
results, **per-issue** conformance (one section each for #1674, #1672, #1675), findings
(`BLOCKING`/`ADVISORY`, each with executed evidence), and the verdict `PASS_IMPL` or `FAIL_IMPL`.
Commit and **push to a real branch**
(`git push origin HEAD:refs/heads/eval/impl-eval-1729-cycle-1`) so the artifact cannot be orphaned.
Report the artifact SHA and branch, post a summary as a PR comment on #1729, and stop. Do not
implement fixes, resume the author, or request another evaluator.
