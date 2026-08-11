use harness

You are an **independent third-opinion adjudicator** for NetScript PR #1444. You are not the plan's
author (native Claude Opus 5) and not the plan evaluator (Codex GPT-5.6 Sol, which has run five
cycles). You were brought in by the repository owner to answer **one question**, and only that one.

## The question

**Is PR #1444 too big to land as a single PR, and if so, exactly where should it be split?**

Answer with one of:

- `VERDICT: SINGLE_PR` — land it as one PR. Say why the coupling makes splitting worse.
- `VERDICT: SPLIT` — name the **exact** boundary: which slices go in PR 1, which in PR 2+, what each
  PR closes, and how each PR is independently green at merge time.
- `VERDICT: RESCOPE` — the work as planned is the wrong shape. Say what should be cut, deferred, or
  restructured, and what the resulting PRs are.

You are **not** asked to re-run the plan-gate, re-litigate architecture decisions, or find new
implementation defects. Five evaluator cycles have already done that. Scope shape only.

## Context you need

Repository: `/home/codex/repos/ns-1443-plugin-ai-orchestrator`, branch
`orchestrator/1443-plugin-ai-next-canary`.

Read:

- `.llm/runs/orchestrator-1443-plugin-ai-next-canary--supervisor/plan.md` — plan **v6**, thirteen
  slices, the authoritative description.
- `research.md` (§1–5 for #1443, addendum A-1…A-5 for #1445) — the evidence base.
- `plan-eval.md`, `plan-eval-cycle2.md`, `plan-eval-cycle3.md`, `plan-eval-cycle4.md`,
  `plan-eval-cycle5.md` — the five evaluator verdicts.
- `escalations/E-1-configured-module-contract.md` — the owner decision that widened the scope.
- `drift.md` — D-6 records the owner-authorized rescope.
- Live: issues **#1443** and **#1445**, PR **#1444**.

## What the PR does

Two issues, one branch:

- **#1443** — `plugin install ai` emits an AppHost executable for a package with no `/services`
  export, registers a `netscript.config.ts` module it never creates, and generates an AI UI namespace
  that does not type-check, while `plugin doctor` reports healthy through all of it. P0, blocking
  the downstream consumer `rickylabs/eis-chat#157`.
- **#1445** — the shared configured-module contract: every first-party plugin writes a
  `<name>/mod.ts` barrel into `netscript.config.ts`, but `loadRegisteredPlugins` imports that module
  and requires a `PluginManifest` export. None of the six provides one, so `generate runtime-schemas`
  fails for every plugin. Proven empirically, not inferred.

Thirteen slices span `packages/plugin` (published manifest protocol), `packages/cli` (install,
registry, doctor, maintainer sync, E2E), and all six `plugins/*` packages.

## The argument for one PR, which you should attack

The supervisor's position: the doctor check and the six plugin fixes are **the same change**. The
moment `configured-module-exports-manifest` lands, every plugin must satisfy it. Split it, and PR 1
either ships a doctor that goes red for five unfixed plugins, or scopes the check to the AI plugin —
the narrow special-case the owner's brief explicitly forbids, and the false-green pattern #1443
exists to kill.

The Codex evaluator was asked directly for a split boundary and declined:

> "The rescope is not too large for one PR: the shared loader/import contract is one defect class,
> the canonical suite already installs all six kinds, and twelve ordered slices remain below the
> harness limit. No split boundary is required."

**Test that reasoning; do not defer to it.** Specifically consider:

1. Is there a boundary where PR 1 is genuinely green — every gate passing, no narrowed check — while
   PR 2 is still outstanding? If yes, name it precisely; that defeats the coupling argument.
2. #1443 is a **P0 blocking a downstream consumer**. Does shipping the AI fix sooner outweigh
   carrying a doctor check that is temporarily scoped, or a second release with the contract still
   broken for five plugins? Weigh delivery against correctness explicitly rather than assuming one.
3. Thirteen slices across three package families in one review — is that reviewable in practice, or
   is review quality itself the thing that breaks?
4. Would splitting create a *worse* problem: two PRs touching the same published manifest protocol
   and the same host files, racing to a shared canary?

## Output

Write a concise verdict to
`.llm/runs/orchestrator-1443-plugin-ai-next-canary--supervisor/escalations/E-2-scope-verdict.md`:

- the verdict token above, first line;
- your reasoning in a few tight paragraphs, citing files/slices;
- if `SPLIT` or `RESCOPE`, the exact PR boundaries with what each closes and how each is
  independently green at merge;
- the strongest argument **against** your own verdict, and why you rejected it.

No praise, no restating the plan back. Judgement and reasoning only. If the single-PR argument is
sound, say so plainly and briefly — a short correct answer is the best outcome here.
