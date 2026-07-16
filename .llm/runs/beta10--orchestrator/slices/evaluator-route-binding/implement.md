use harness

# Slice — bind the evaluator lanes into `routing-policy.ts` (make the route data, not prose)

## SKILL

Activate all of these — under-listing is the failure mode:

- **`netscript-harness`** — the evaluator protocol you are encoding; know the invariant before you
  touch the data.
- **`netscript-tools`** — the scoped `run-deno-check` / `run-deno-lint` / `run-deno-fmt` wrappers and
  what counts as trustworthy gate evidence.
- **`netscript-doctrine`** — `.llm/tools/agentic/` is tier-2 repo tooling, held to the framework's bar.
- **`netscript-deno-toolchain`** — `deno doc` to learn a surface cheaply instead of reading broadly.
- **`rtk`** — prefix read-heavy `git`/`grep`/`ls`; wrap `deno task` runs in `rtk proxy`.
- **`codex-wsl-remote`** — you are a mobile-visible daemon-attached session; one active send per
  worktree.
- **`netscript-pr`** — only if you need to file a follow-up issue. You do **not** open a PR.

Read `AGENTS.md` first.

## Context

Owner decision **OD-7** (2026-07-13): *"default for Claude vs Codex for adversarial review — no
OpenHands."* Adversarial/evaluator review is now **opposite-family Claude ⇄ Codex, directly**.
OpenHands is dropped as the evaluator transport.

**The finding that makes this slice necessary.** Every other lane in this repo is *data*:
`.llm/tools/agentic/runtime/routing-policy.ts` holds `CANONICAL_ROUTE_POLICY`, `lane-policy.md` is
merely its rendered view, and `config/no-hardcoded-volatile_test.ts` fails the suite if a volatile
value is hardcoded elsewhere. But **the evaluator lane is not in `routing-policy.ts` at all** — grep
it: zero matches for `evaluator` / `impl-eval` / `openhands`. It existed only as prose scattered
across a dozen markdown files. That is precisely why "OpenHands = evaluator" persisted as an
unexamined assumption rather than a decision anyone re-ratified. A documentation sweep alone would
set us up to repeat it.

A parallel **Claude** agent owns the `.md` doctrine sweep (harness workflow docs, evaluator protocol,
skills, `AGENTS.md`/`CLAUDE.md`). **You own the code.** Do not touch any `.md` file — you will collide
with it.

Worktree: cut your own, upstream-free:

```
git worktree add -b feat/evaluator-route-binding /home/codex/repos/b10-evalroute feat/beta10-integration
cd /home/codex/repos/b10-evalroute && git branch --unset-upstream
```

## What to do

1. **Add the evaluator lanes to `CANONICAL_ROUTE_POLICY`** in
   `.llm/tools/agentic/runtime/routing-policy.ts`, in the same shape as the existing lanes:

   | Lane | Route |
   | --- | --- |
   | Review / adversarial evaluation of **Claude-authored** work | Codex · OpenAI · `gpt-5.6-sol` · **xhigh** |
   | Review / adversarial evaluation of **Codex-authored** work | Claude · Anthropic · `opus-4.8` · **high** |

   Mixed authorship = per-slice opposite-family, or dual review. Model ids come from
   `config/models.ts` constants — **never hardcode a model-id string** (the guard test will fail you,
   correctly).

   Note two review lanes already exist in the policy view ("Review of Claude implementation" →
   Codex · Sol · xhigh; "Documentation … review of GPT implementation" → Claude · Opus 4.8 · high).
   **Read them first.** If they already express this and are simply not reachable as an *evaluator*
   lane, then the right change may be to expose/alias them rather than add duplicates — decide by
   reading the code, and say which you chose and why. Do not create a second source of truth.

2. **Encode the invariant, don't just add a row.** The non-negotiable is: *the generator session is
   never the evaluator session; no lane self-certifies.* If the contract can express "evaluator must
   be opposite-family to the generator" as a checkable property rather than a naming convention,
   do that — that is the whole point of routing being data.

3. **Guard test.** Add a test that pins the evaluator lanes and, if you implemented (2), that a
   same-family generator/evaluator pairing is rejected. Tests live next to what they test
   (`*_test.ts`).

4. **Do not delete the OpenHands tooling** (`.llm/tools/agentic/openhands/`). OD-7 removes it as the
   *default evaluator*, not necessarily as a CI runner; the parallel doc agent is deciding that
   boundary. Your scope is the routing data only. If the policy currently *binds* OpenHands as an
   evaluator route, unbind it and say so.

## Validation

```
deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root .llm/tools/agentic --ext ts
deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts  --root .llm/tools/agentic --ext ts
deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts   --root .llm/tools/agentic --ext ts
deno test .llm/tools/agentic/
rtk proxy deno task agentic:routing-state    # the rendered policy must show the evaluator lanes
```

The `config/no-hardcoded-volatile_test.ts` guard must stay green.

## Rules

- **Do not make improvements outside this brief. If you see one, report it — do not implement it.**
  (A prior slice on this run made every gate green while writing literal NUL bytes into a `.ts` file,
  because it "improved" a hash separator nobody asked it to touch.)
- No `.md` files. No `packages/`/`plugins/` source.
- No lock-file deletion; no `deno cache --reload` without approval.
- **Do not open a PR, do not merge.** Commit on `feat/evaluator-route-binding`, push only via an
  explicit refspec, and report back. You do not self-certify — a Claude-family review is required
  (that is now the doctrine).
- Record divergence in `.llm/runs/beta10--orchestrator/drift.md`.

## Report back

Whether you added lanes or exposed the existing ones (and why), whether the opposite-family invariant
is now a checkable property or still a convention, the guard test you added, and the validation
results.
