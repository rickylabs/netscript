use harness

# Implementation slice — #1589, after PLAN-EVAL PASS

**Codex · GPT-5.6 Sol · medium**. **P0.** You wrote the plan; PLAN-EVAL returned **PASS** with
findings, and the plan has been **amended**. Implement the amended plan.

| Field | Value |
| --- | --- |
| Issue | **#1589** · PR **#1595** |
| Worktree | `/home/codex/repos/ns006-1589` |
| Branch | `fix/1589-sdk-provider-closure` |
| Head | `ff2c18149` — plan amendments already committed, clean |

**Read `.llm/runs/release-0.0.6-features--orchestration/slices/plan-1589.md` in full, including the
`# Amendments after fallback PLAN-EVAL` section at the end.** The amendments are binding. Also read
the `[PHASE: FALLBACK PLAN-EVAL]` comment on PR #1595 — it verified your mechanism analysis and
found that `packages/fresh/deno.json` maps **only** `@netscript/sdk/desktop`, leaving `/cache`
and the bare root unmapped, which is exactly why the hazard exists.

## A4 first — this is a prerequisite, not a step

**Before you lock the task shape, run the `catalog:` probe against a real generated workspace.**

The generated app manifest contains `'zod': 'catalog:'`, which resolves from the **workspace root**.
Your research probe ran under a standalone scratch config, **not** a member config inside a generated
workspace, so whether `deno run --config apps/<app>/deno.json` performs workspace-root discovery for
`catalog:` is **unverified**. If it does not, binding the verifier to the member config makes the
gate fail on a perfectly coherent workspace — a false positive in the gate itself.

Prefer `--cwd apps/<app>` (normal upward config discovery) over passing the member config
explicitly. **If the probe shows member-config isolation breaks `catalog:`, that is plan drift:
record it in the run dir and report it — do not quietly reshape the plan around it.**

Report the probe result verbatim either way. A gate that false-positives on a valid workspace is
worse than no gate.

## The other binding amendments

- **A1 —** `@netscript/fresh-ui` stays **out** of the closure, and the reason is recorded: its
  pinned SDK subpaths (`src/desktop`, `src/auto-update`) contain no cache or query imports, so a
  split `fresh-ui` cannot produce a second cache-provider instance. Keep the closure list and its
  parity test consistent with that decision.
- **A3 —** a **non-exact** specifier for any closure member (e.g. `^0.0.5`) **fails closed**, with a
  diagnostic naming the member and instructing an exact pin. A range's locked version is invisible to
  `import.meta.resolve()`, so accepting one would report coherence the check cannot verify.
- **A2 —** version-equality is a **proxy** for the real Fresh→SDK graph edge and holds only under
  lockstep publishing. It is recorded as a limitation; **do not** try to close it in this slice.

## Non-negotiable

- **Never** suppress a cache read or seed because a request is a partial. #1589's symptom appears on
  partial navigation and is **unrelated** to that closed-invalid class. If anything you write starts
  to resemble it, stop.
- **Do not touch** `packages/fresh/src/application/{defer,builders/define-page}/**` or
  `packages/fresh/src/runtime/ai/**` — sibling slices own both subtrees.
- **Preserve the verified workaround:** pinning the full coherent closure together must remain valid.
- The failure message must **name the incoherent closure and the versions involved**. A runtime
  "Cache provider not initialized" is precisely the outcome being eliminated.
- **Tests must include the negative case:** an incoherent closure is rejected, a coherent one is not.

## Gates

```bash
deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/cli --ext ts,tsx
deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts  --root packages/cli --ext ts,tsx
deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts   --root packages/cli --ext ts,tsx
deno task --cwd packages/cli test
deno task quality:gate
```

Use `deno task --cwd <pkg> test`, never a bare `deno test <path>`. **Do not run `e2e:cli`.**

**`deno.lock`:** if it moves and you added no dependency, **stop and report**. If you added one, the
delta is whatever Deno deterministically generates — never hand-reduced. Incomplete lock closures
cost this lane a canary cycle and two P0 issues.

Commit by slice onto the same branch, push by explicit refspec, and post `[PHASE: IMPL]` on #1595
with commit hashes and verbatim gate output. Update the PR body's Definition of Done and map #1589's
acceptance with `box-index` entries; **no empty `acceptance-evidence` entry list** (#1561).

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

Report the A4 probe result verbatim, the enforcement point, the exact diagnostic text an operator
sees, the negative-case test evidence, verbatim gate output, and anything you could not verify —
especially any legitimate multi-version scenario the check would break.
