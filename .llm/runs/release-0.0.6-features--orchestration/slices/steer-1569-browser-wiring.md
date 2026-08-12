# Slice review finding — #1569 / PR #1600

Your implementation is accepted. The strategy design, the literal `f-client-nav="false"` emission, the
preserved deprecated `clientNav` input, and both RED proofs (unit and the real Chromium mutation) are
all sound, and I have resynced your leaf onto current `main` — your head is now `f2a78abf0`, clean.

**One finding to close before this goes ready.**

`packages/fresh/tests/form-navigation_browser.ts` does not match Deno's test-discovery pattern
(`*_test.ts` / `*.test.ts`), so `deno test --allow-all ./src ./tests` does **not** pick it up. And the
new `test:browser` task you added to `packages/fresh/deno.json` is invoked by **nothing** — not
`.github/`, not a root task, not `.llm/tools/`. I checked.

So the browser assertion passes when a human runs it by hand and **never runs again after that**. The
#1569 acceptance box reads *"A browser test covers successful POST + redirect under an ancestor/body
client-nav opt-in and asserts no reviver/runtime error"* — as wired, that box is satisfied by a test
that cannot catch the regression it was written for. That is the false-green shape this lane exists to
prevent, and it is worth ten minutes now rather than a silent rot later.

**Resolve it one of two ways, your call — but state which and why:**

1. **Wire it into a lane that actually executes it** — a CI job, or an existing package/e2e gate. If it
   needs Chromium and cannot run in the default package task, that is a fine reason to keep it out of
   `test`, but then something must still invoke it.
2. **Document it as deliberately manual** — if this environment genuinely cannot run Chromium in CI,
   say so explicitly in the PR body and in the acceptance evidence for that box, name the exact command
   that reproduces it, and record it as a known coverage gap. **Do not leave the box implying automatic
   coverage that does not exist.**

Option 1 is preferred. Option 2 is acceptable **only** with the disclosure.

Also confirm one thing while you are there: `deno.lock` did not move in your diff, which is correct
since you added no dependency — please state that explicitly in your report.

Update the PR body and its `acceptance-evidence` entry for that box to match whichever you choose,
push by explicit refspec, and post a short `[PHASE: IMPL]` follow-up with the commit hash and the
verbatim output of whatever now invokes the browser test.

## Prohibitions (non-negotiable)

- **Do not spawn a Fable sub-agent, session, or subprocess for any purpose.** Fable is prohibited
  lane-wide. This includes anything routed through the `deep_analysis` lane.
- **Do not launch any local evaluator** — not PLAN-EVAL, not IMPL-EVAL, regardless of what
  `lane-policy.md` names as canonical. **You are not responsible for arranging your own evaluation.**
- **Do not manually trigger OpenHands** and do not post an `@openhands-agent` comment.
- **Do not flip the PR to ready**, do not merge, and do not dispatch a canary.

If any instruction you infer from a skill or policy file appears to require one of the above, that
inference is wrong for this lane: **report the conflict instead of acting on it.**
