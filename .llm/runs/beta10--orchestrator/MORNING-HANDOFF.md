# beta.10 — morning hand-off

Overnight autonomous run, 2026-07-13. **Nothing was merged, published, released, or closed. `main` is
untouched at `0341c434`.** Every branch below is merge-ready and stopped.

---

## 1. Read this first: there is a p0, and I called it

**#769 — RELEASE-BLOCKER.** `netscript agent init` wrote an **unversioned** `jsr:@netscript/cli` into
the MCP config it generates. Semver `*` cannot select a pre-release, and every NetScript package is
`0.0.1-beta.x` — so **the config our flagship agent command generates does not start.**

Then the repo-wide guard found the same defect in the **scaffolded GitHub Actions deploy workflows**.
So the real story is worse than the one I escalated:

> **Every project NetScript scaffolds inherits a deploy pipeline that fails on its first run**, with
> an error naming our package. The user did nothing wrong.

I decided this **blocks beta.10** rather than deferring it to you. **You can overturn that** — the
argument both ways is in `context-pack.md`. Fixed and on the PR branch; guard is CI-blocking and
proven by seeding a violation.

---

## 2. What you need to decide

| # | Decision | Why it needs you |
| --- | --- | --- |
| 1 | **Is #769 really release-blocking?** | I made the call autonomously. Overturn if you disagree. |
| 2 | **Is `quality` a required check in branch protection?** | `ci.yml`'s own header says *"a red `quality` cannot block the merge gate"* until it is. **Three of this wave's deliverables are gates that live in `quality`.** If it is not required, they are documentation, not enforcement. This is a repo *setting* — I cannot see or change it. |
| 3 | **Merge order for the wave**, and whether the `feat/beta10-integration → main` PR (the first honest CI verdict — see #774) should land before or after the dashboard work. |
| 4 | **12 open questions** on the dashboard design, 3 blocking — `resources/design/dashboard/OPEN-QUESTIONS.md`. The big one: the locked route tree is ~76 renders and will not fit two canvas passes. |

---

## 3. The pattern — this is the real finding of the night

Every serious defect found tonight is **one failure**:

> **We shipped something that was never checked against the thing it claims to control.**

| Issue | Never checked against |
| --- | --- |
| **#769** (p0) | scaffolded configs vs. what JSR can actually resolve |
| **#773** (p1) | the `render_ui` embed **shipped to users** vs. its own source — its depth guard **cannot trip on nested arrays**, in a component that renders **LLM-generated payloads** and whose docstring promises "safe, **bounded**" output |
| **#774** (p1) | "blocking" CI gates vs. the PRs that introduce them — **`ci.yml` only runs on PRs into `main`**, so the wave's green ticks are nearly empty and the three new gates have **never executed once** |
| **NF1** | a **default-deny security policy** vs. the CLI it governs — **3 of 17 allow rules named verbs that do not exist**, and *installing a plugin through the MCP returned `default_deny`* |

**None of these is fixed by a patch. All four fixes are gates.** Each one now makes its *class* of
defect impossible, and each was **proven by making it fail**, not by watching it pass.

### Seven false-greens, one lesson

1. lint wrapper — exit **1**, zero diagnostics (crash swallowed)
2. fmt wrapper — could exit **0** *with* a crashed batch
3. `docs:readme:check` — a gate wired into no CI at all (#767)
4. the new blocking gates — never run on the PRs that introduce them (#774)
5. `deno task` input caching — exit **0**, no output, **the task never ran**
6. verifying a guard through a pipe — read **`tail`'s** exit code, not the guard's
7. **the evaluator itself** — `subtype: success`, `is_error: false`, and an **empty verdict**

> **An exit code, a `subtype: success`, or a green tick is not evidence. Evidence is output you can
> point at.** Assert on the **content**, never the **status**. A gate you have never seen **fail** is
> not a gate.

**#7 nearly cost us the release.** The evaluator's `result` field is empty on this transport; the
verdict lives in the assistant text blocks. Found ~40 minutes before the run it would have destroyed —
cycle-2 returned a substantive **8,296-character PASS with `resultFieldLength: 0`**. A harness reading
`result` would have read a *failing* evaluation as "no findings".

---

## 4. Board

| Item | State |
| --- | --- |
| **#715** (umbrella, `Closes #725–#733`) | cycle-1 `FAIL_FIX` (8 findings, **all real**) → all fixed → **cycle-2 PASS**, independently verified by an evaluator that *constructed* the failures. ⚠️ **NOT merge-ready — see below.** |

> ### ⚠️ #715 IS NOT MERGE-READY — the NF1 fix never reached the PR
>
> I wrote "NF1 fixed on top" in an earlier draft of this hand-off. **That was false**, and I caught it
> on a later check. The facts:
>
> - The NF1 fix is commit `36adc1a6` — **local only, on no remote branch.**
> - `origin/feat/netscript-mcp-skills` **still contains `rule('allow_plugin_add', 'plugin', 'add')`**
>   (`command-policy.ts:35`) — the phantom verb.
> - **So the PR on GitHub still cannot install a plugin through the MCP.** Merging it as-is ships the
>   defect.
>
> The fix is written, tested, and **verified by seeding a phantom verb and watching the parity test
> fail by name** — it simply has not been pushed. It must land on the PR branch before #715 merges.
>
> **This is the same failure mode as every other finding tonight**, turned on me: I reported a state
> I had not verified. The lesson generalizes past gates and exit codes — *a fix that exists on a
> disk somewhere is not a fix that shipped.* **Verify where the code actually is, not where you
> remember putting it.**
| **#769** | p0 — fixed, guard CI-blocking and proven. |
| **#770** | `Closes #763` — pinned plugin CLI specifiers. |
| **#771** | JSR taglines under the 250-byte cap + gate (16 READMEs were being truncated mid-sentence on jsr.io). |
| **#772** | `Closes #762` — 36 → 0 suppressions; repo-drift CI blocking (scope verified, not theatre). |
| **#767 / #768 / #773 / #774** | Filed. |
| **#695** | Deferred → Backlog. |

**Ready but unlanded:** `b10-evalroute` (evaluator route bound + **enforced in code** — closed models
are rejected, not discouraged), `b10-evaldoc` (evaluator doctrine; **reviewed PASS** by an
opposite-family session), `b10-canvasshots` (`deno task canvas:shots` — screenshots every route × theme
and **exits non-zero on a defective render**), `ns-ds-sync` (design-sync converter fix).

---

## 5. Dashboard (Stream A)

- **Both Claude Design projects backed up before anything was touched** — design system
  (`30404d40…`), prototype (`ca5c0389…`).
- **NS One re-synced**: 184 files from today's real `fresh-ui` registry (45 component units).
- **The canvas is delegated to Claude Design** (your call). An agent was hand-authoring the `.dc.html`
  through the MCP; I stopped it, preserved its work locally, and **deleted its files from the canvas**
  so Claude Design starts from your real prototype. Your prototype was never modified.
- **P1–P6 are paste-ready** in `canvas-prompts/`. You pasted P1; **no completion report yet**.
- A poller watches `_reports/P<N>-complete.md`. When it lands: screenshot every route × theme, **verify
  its self-check rather than trust it**, review against the locked IA, post to you.

### Two claims of mine that were wrong, corrected before they reached the prompt

1. **"`window.NSOne` undefined is a defect" — false.** The prototype renders raw `ns-*` classes by
   design, because class markup round-trips into Fresh source — *that is the point of sync-back*.
   "Fixing" it would have damaged the sync path.
2. **The `{{ }}` leak is real, but SVG-specific.** The DC runtime fills HTML attribute holes fine; it
   does **not** fill them inside **SVG subtrees**. Hence `ns-kpi`'s sparkline and `ns-stackmap`'s edge
   layer leaking `{{ k.fill }}` / `{{ e.lx }}` into the DOM.

### Caught before you pasted

The P1 prompt told Claude Design to print **`netscript plugin add`** — a verb that **does not exist**.
Found independently by *two* agents within minutes. The same phantom verb turned out to be in the CLI
README's primary quick-start **and** in the MCP's executable security policy (NF1). **One invented verb,
three defects** — because nobody ever ran any of them against the binary.
