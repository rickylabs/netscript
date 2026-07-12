# Context pack — beta.10 non-dashboard stream

Resumable summary. Read this first on a cold start; `worklog.md` has the evidence, `drift.md` the
deviations, `evaluate.md` the IMPL-EVAL verdict.

## What this stream owns

Milestone 12, **non-dashboard only**. Brief of record:
`.llm/runs/beta10--orchestrator/briefs/non-dashboard.md`.

Out of scope (parallel design stream): `plugins/dashboard`, DDX issues #410–#432 / #551–#557, #507,
#509, the Claude Design project, `tools/design-sync/`.

## Where things stand

| Item | State |
| --- | --- |
| **PR #715** | CI green. **IMPL-EVAL returned `FAIL_FIX`** (8 findings, all reproduced, all real). F1/F2/F3/F5/F7/F8 fixed in `d81bb2bd`. **F4 delegated** to a Codex slice. **Needs a re-eval, then owner merge.** |
| **#763** | Done, pushed, reviewed. Branch `fix/763-pin-plugin-cli-specifier` @ `40ecc87c`. **No PR yet.** |
| **JSR taglines** | Done, pushed, reviewed. Branch `docs/jsr-tagline-byte-cap` @ `458879fb`. **No PR yet.** |
| **#762** | Codex slice running (3/5 packages). |
| **#695** | Deferred → `Backlog / Triage`. |
| **#767, #768** | Filed (dead readme gate; OpenHands runtime broken). |

## The two things that matter most

**1. The `quality` CI failure was two silent-failure bugs, not one.** `run-deno-lint.ts` and
`run-deno-fmt.ts` both exited non-zero while swallowing the real error. What both were hiding:
`packages/mcp/tests/fixtures/doctor/broken/deno.json` is an intentionally malformed
`{"workspace":"packages/*"}` fixture, and `deno lint`/`deno fmt` both walk up from each file for a
config, hit it, and abort. Fixed in both wrappers, per-batch, regression-tested (10 tests). The
fixture tree is excluded from both selections.

**2. An unversioned `jsr:@netscript/*` specifier cannot resolve on a pre-release line.** Semver `*`
excludes pre-releases; every `@netscript/*` package is `0.0.1-beta.x`, so JSR reports `latest: null`
and resolution fails outright. This one root cause explains **three** separate defects:

- **#763** — the E2E gate and `resolvePluginCliSpecifier()` (fixed, `40ecc87c`);
- **F4** — `netscript agent init` writes an unversioned specifier into `.mcp.json`, so **the config
  the flagship agent-tooling command generates is broken as written**; and `DEFAULT_CLI_COMMAND` in
  the MCP spawn executor has the same defect (slice in flight, thread `019f58b4`).

The durable fix is the **version-drift guard test** — every `jsr:@netscript/*` specifier the
framework emits or spawns must carry a version. Without it this regresses in a fourth place.

## Live agent threads

| Slice | Branch / worktree | Thread | Route |
| --- | --- | --- | --- |
| **#762** | `quality/762-ts-ignore-sweep` @ `/home/codex/repos/b10-762-tssweep` | `019f5891-881b-77d1-b348-9556bb76e4fa` | openai · gpt-5.6-sol · medium |
| **F4** | `fix/715-f4-pin-agent-specifiers` @ `/home/codex/repos/b10-715-f4` | `019f58b4-6bea-7113-817a-5010409c0fab` | openai · gpt-5.6-sol · high |

Steering (same thread only — never a second `send-message-v2` at the same worktree):

```bash
codex exec resume <thread-id> -- "<follow-up>"
```

## Hard-won gotchas (do not relearn these)

- **JSR descriptions are not read from `deno.json`.** They are derived from the README's **bold
  tagline** and capped at **250 bytes** (em-dashes cost 3). Over-cap taglines are silently truncated
  mid-sentence — which is how several published packages read on jsr.io today. Gate:
  `deno task docs:tagline:check` (lives on `docs/jsr-tagline-byte-cap`, **not** on #715).
- **Never write to the JSR registry casually.** `jsr-set-package-settings.ts` /
  `jsr-provision-packages.ts` push to a public registry. jsr.io descriptions do **not** change when
  the tagline branch merges — that re-sync is a separate, owner-supervised publish action.
- **A `luna`/`max` Codex thread stalled** (1 MB of reasoning, zero edits, 15 min). Distinguish stalled
  from slow by comparing rollout write times across live threads, not by launcher-process death — a
  SIGTERM'd launcher does **not** kill a daemon-attached thread.
- **OpenHands is down** (`No module named 'fastapi'`, #768). Use the Codex GPT route for evaluation;
  the invariant is opposite-family, not any particular transport.
- **`git add -A` in the run dir swept a separate slice's tool + task + lockfile into #715** (F5).
  Stage deliberately.

## Next actions, in order

1. **Re-run IMPL-EVAL on #715** once the F4 slice lands — the prior verdict is `FAIL_FIX` and a
   verdict does not clear itself. Route: opposite-family (Codex GPT), per `lane-policy.md`.
2. Review the F4 slice diff (read it; do not trust the verdict).
3. Let **#762** finish, then review the same way: grep every `+` line for new suppressions. The bar
   is **typed, not laundered**.
4. Raise PRs for `#763` and the tagline branch — with `Closes #763`, namespaced labels, milestone.
   Both are pushed but deliberately have **no PR**.
5. Owner merges #715 only after a clean re-eval.

## Standing invariants

Nothing merges without owner sign-off. No lane self-certifies. No publish, no release, no milestone
close, no writes to the JSR registry.
