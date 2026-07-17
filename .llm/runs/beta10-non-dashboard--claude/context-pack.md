# Context pack — beta.10 non-dashboard stream

Read this first on a cold start. `worklog.md` has the evidence, `drift.md` the deviations,
`evaluate.md` the IMPL-EVAL verdict.

---

# ⛔ START HERE — #769 is a p0 release blocker you have not seen

**Every project NetScript scaffolds inherits a config that cannot run.**

## What it is

A bare `jsr:@netscript/cli` specifier carries no version constraint, so Deno resolves it as `*` —
and **semver `*` does not match pre-releases**. Every `@netscript/*` package is `0.0.1-beta.x`, so
JSR reports `"latest": null` and resolution fails outright:

```text
$ deno run -A jsr:@netscript/cli --version
error: Could not find version of '@netscript/cli' that matches specified version constraint '*'
```

## How far it reaches

| Surface                                                                                                    | Consequence                                                                                                                                           |
| ---------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Scaffolded GitHub Actions** (`deploy-bare-metal`, `deploy-compose-ghcr`, `deploy-deno-deploy` templates) | Every scaffolded project ships a deploy pipeline that **fails on first run**. The user did nothing wrong; it fails with an error about _our_ package. |
| **`netscript agent init`**                                                                                 | Writes an unversioned specifier into `.mcp.json` / `.vscode/mcp.json`. **The MCP server never starts.**                                               |
| **MCP `DEFAULT_CLI_COMMAND`**                                                                              | The default executor behind `execute_command`.                                                                                                        |
| **Scaffold packages + `plugins/workers` init**                                                             | Emitted specifiers.                                                                                                                                   |

## Why it escaped every gate

**It is invisible locally.** The workspace import map short-circuits JSR entirely, so nothing in the
monorepo ever resolves these specifiers against the registry. It only appears once the artifact is
consumed _from_ JSR. Same class as the beta.6 telemetry-graph and beta.7 root-map prod-only defects.

It was found by an **opposite-family IMPL-EVAL** — not by CI, and not by the author.

## Why it was called release-blocking

beta.10's headline is the agentic combo (MCP + skills + agent CLI). Shipping a release whose
scaffolder produces projects with a broken deploy pipeline, and whose flagship agent command
produces a dead MCP config, is the thing that would define it.

**You can overturn this call.** The argument against blocking: it is a pre-release line, and the fix
is one line per site, so it could ship in beta.11. The argument for: the scaffolder is the front
door, and a first-run failure is the worst possible first impression.

## What is already fixed vs. what remains

|                                                | Status                                                                   |
| ---------------------------------------------- | ------------------------------------------------------------------------ |
| E2E gate + `resolvePluginCliSpecifier()`       | ✅ fixed — **PR #770** (`Closes #763`)                                   |
| `agent init` + `DEFAULT_CLI_COMMAND`           | ✅ fixed — `fix/715-f4-pin-agent-specifiers`                             |
| Scaffold + GitHub-workflow templates           | ⏳ in flight — same branch                                               |
| **Repo-wide, CI-blocking version-drift guard** | ⏳ in flight — `.llm/tools/validation/check-netscript-jsr-specifiers.ts` |

**The guard is the actual fix.** Pinning five call sites is five fixes waiting for a sixth. The
prior guard covered only CLI _command_ sources — which is exactly why `agent init`, the templates,
and `DEFAULT_CLI_COMMAND` all survived it. A guard scoped to one directory is a coincidence, not a
guard.

Acceptance requires the guard to be **proven to fail** on a seeded violation. A guard never seen to
fail is not a guard.

---

# Open PRs — none merged, all await you

| PR       | What                                                        | State                                                                                         |
| -------- | ----------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| **#715** | MCP + skills + CLI umbrella (`Closes #725…#733`)            | **`FAIL_FIX`** from cycle-1 IMPL-EVAL — remediated, **cycle-2 re-eval required before merge** |
| **#770** | `Closes #763` — pin plugin CLI JSR specifiers               | Reviewed                                                                                      |
| **#771** | JSR taglines fit the 250-byte cap + CI gate                 | Reviewed                                                                                      |
| **#772** | `Closes #762` — 36 → 0 suppressions; repo-drift CI blocking | Reviewed                                                                                      |

# Issues filed by this stream

- **#769** — p0 release blocker (above).
- **#767** — `docs:readme:check` is a dead gate: wired into no CI, fails for nearly every README.
  Checker ⇄ template ⇄ house-style three-way divergence. Resolution recorded: **house style wins.**
- **#768** — OpenHands agent runtime cannot bootstrap (`No module named 'fastapi'`). The open-model
  evaluator lane is down; evaluation was re-routed to Codex GPT.
- **#695** — deferred to `Backlog / Triage` (tutorial checkpoint validation).

---

# The other thing worth knowing: the evaluator caught a false-green gate

Cycle-1 IMPL-EVAL returned **`FAIL_FIX`** with 8 findings. **All 8 were reproduced. All 8 were
real.**

The worst was **F1**: the `deno fmt` gate could **exit 0 with a crashed batch**. Crash-vs-finding
was classified _globally_, so a crash hid behind another batch's finding — and when the only
findings were line-ending ones the run filters, the gate passed. **The same author had already fixed
that exact bug class in the sibling lint wrapper, then reintroduced it one level up.** The fmt tests
were renderer-only, so they structurally could not catch it: green gates and passing tests were both
consistent with a broken gate.

**F6** — this stream had no Plan-Gate for its own new scope, and no retroactive `plan.md` was
manufactured to paper over it (that would be evidence-faking). Recorded as drift D5. The evaluator's
synthesis is the durable artifact: the missing Plan-Gate _is why_ the fmt invariant was never
stated, and therefore never tested. **The process gap and the F1 defect are one failure, not two.**

Lessons promoted to `.llm/harness/lessons/`:

- a gate that classifies globally will false-green — **prove a gate FAILS when it should**;
- a "fix-forward" that grows a tool, a CI gate, and a public-docs rewrite is new scope and needs its
  Plan-Gate;
- stage deliberately — `git add -A` swept a foreign slice's tool + task + lockfile into #715.

---

# Hard-won gotchas (do not relearn these)

- **JSR descriptions are not read from `deno.json`.** They come from the README's **bold tagline**,
  capped at **250 bytes** (em-dashes cost 3). Over-cap taglines are silently truncated mid-sentence
  — which is how ~16 published packages read on jsr.io today. Fixed in **#771**.
- **The JSR registry was never touched.** `jsr-set-package-settings.ts` /
  `jsr-provision-packages.ts` were not run. jsr.io descriptions do **not** change when #771 merges —
  that re-sync is a separate, owner-supervised publish action.
- **Codex threads end their turn mid-work.** They go idle with uncommitted files — not dead. Resume
  the _same_ thread (`codex exec resume <id>`); do not relaunch, which loses landed commits.
  Distinguish idle from _stalled_ by comparing rollout write times across live threads — a SIGTERM'd
  launcher does **not** kill a daemon-attached thread.
- **One `luna`/`max` thread stalled hard** — 1 MB of reasoning, zero edits, 15 min. Relaunched on
  `sol`/`high`, which delivered. Possible lane-policy signal.
- **`deno task` input caching** can make a gate print nothing and exit 0
  (`cached, inputs unchanged`). That is not a green run. Invoke the tool directly when you need a
  real verdict.

# Live agent thread

| Slice               | Worktree                       | Thread                                 |
| ------------------- | ------------------------------ | -------------------------------------- |
| **#769 / F4 guard** | `/home/codex/repos/b10-715-f4` | `019f58b4-6bea-7113-817a-5010409c0fab` |

# Next actions, in order

1. **Land the F4 guard**, proven to fail on a seeded violation.
2. **Cycle-2 IMPL-EVAL on #715** — open-model lane (`qwen/qwen3.7-max`, medium). Brief is staged at
   `slices/715-impl-eval-cycle2/implement.md`; it requires the evaluator to **break** the gates, not
   watch them pass. A `FAIL_FIX` does not clear itself.
3. **Decide #769's severity.** Everything else waits on that call.
4. Merge #770 / #771 / #772 at your discretion; merge #715 only after a clean cycle-2 verdict.

# Standing invariants

Nothing merges without owner sign-off. No lane self-certifies. No publish, no release, no milestone
close, no writes to the JSR registry.
