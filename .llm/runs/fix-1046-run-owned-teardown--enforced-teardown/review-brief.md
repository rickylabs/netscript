use harness

# Slice — PR #1047 Augment review remediation (issue #1046)

Worktree `/home/codex/repos/fix-1046`, branch `fix/1046-run-owned-teardown`.
The PR is **green and clean today**. Your job is five surgical fixes. **Do not regress the gates.**
Push explicitly: `git push origin HEAD:refs/heads/fix/1046-run-owned-teardown` (no upstream by design).

## Plan-Gate

The Plan-Gate open-model evaluator is waived by the owner (2026-08-01); the supervisor performs
PLAN-EVAL and IMPL-EVAL. Do not attempt `claude-print`, `provider-canary`, OpenRouter, Qwen or
OpenHands, do not stop at the Plan-Gate, and do not fabricate a `plan-eval.md`. Write your plan,
then proceed directly to implementation.

## SKILL

- `netscript-harness` — gates, run artefacts, commit discipline.
- `netscript-doctrine` — ports/adapters boundaries, fail-closed authorization.
- `aspire` — use `aspire` CLI verbs (`aspire ps`, `aspire stop --apphost <path>`) and
  `netscript plugin doctor`; do not hand-roll shell equivalents.
- `deno` — `deno doc` / `deno info` before guessing an export surface.

## Teardown obligation (yours, not a courtesy)

- If you start an AppHost, **you** stop it before returning: `aspire stop --apphost <path> --non-interactive --nologo`.
- **Never** kill `aspire mcp start` — those are session MCP servers, not AppHosts.
- **Never** run a blanket `docker rm -f`, `docker ps -aq | xargs`, `docker container prune`, or
  `docker system prune`. Those exact strings are guarded by
  `.llm/tools/agentic/teardown/forbidden-commands_test.ts` and will turn CI red.
- Remove only containers **your own run** created, scoped by name.
- Prefer `deno task e2e:cli run scaffold.runtime --cleanup --format pretty`.
- Two **foreign** postgres containers (`postgres-bc75ea00`, `postgres-dda83380`) are already running
  from other worktrees. **Leave them alone.** They are not yours and not mine.
- Before you return, run `docker ps -a` and `aspire ps` and state in your worklog what you found.

## Context — what these files are

`.llm/tools/agentic/teardown/` is the run-owned teardown machinery this PR adds: `probes.ts`
(read-only discovery via `aspire ps` + `docker inspect`), `ownership.ts` (fail-closed
authorization), `leak-check.ts` (report), `teardown.ts` (the only mutation path).
`.llm/tools/agentic/codex/run-codex-slice.ts` is the supervisor loop that enforces it.

**Load-bearing invariant, do not break:** only `ownership === 'owned'` authorizes mutation, and
`classify()` proves `owned` via `pathContained(evidencePath, worktreeRoot)` or `registryMatches()`.
`pathContained` uses `relative()` so that `/home/codex/repos/fix-104` does **not** contain
`/home/codex/repos/fix-1046`. There is a test proving exactly this
(`ownership_test.ts`: 'path containment compares segments rather than string prefixes').
**Attribution for reporting and proof for killing are different bars. Keep the kill bar exactly
where it is.**

---

## Fix 1 (HIGHEST VALUE) — `run-codex-slice.ts:152` must not fail a slice because tooling is absent

**Verified defect.** On `DONE`, `run-codex-slice.ts:152` calls `runLeakCheck()` →
`probeResources()` → `probeAppHosts()` / `probeContainers()`. Those `throw` on non-zero exit
(`probes.ts:49-51`, `:80`, `:84-86`), and `systemCommands.run` (`ports.ts`) throws
`Deno.errors.NotFound` when the binary does not exist. Nothing catches it. **A slice that did its
job correctly fails anyway, in the exact code path meant to prevent outages.**

Required behaviour:

1. **Absent tooling means 'nothing to check', not 'fail'.** `runLeakCheck()` must never throw
   because `aspire` or `docker` is missing or the probe errored.
2. **Distinguish _cannot probe_ from _probed and found leaks_.** Add explicit probe status to
   `LeakReport` — per probe (aspire, docker), one of `ok` / `unavailable` (binary absent) /
   `failed` (binary present, probe errored, include the message). Render it in
   `renderLeakReport()` so a human reading `leak-report.md` can tell which it was. A report that
   could not probe must **not** look like a clean report.
3. **Only `probed and found leaks` may downgrade `done` to `blocked`.** `enforceTeardown()`
   (`run-codex-slice-lib.ts:32`) already downgrades solely on `ownership === 'owned'` survivors —
   keep that. An unprobeable environment yields zero survivors, therefore `done`. Do **not** add a
   downgrade on probe failure; a supervisor that cannot probe must not fail a correct slice.
4. **Make the two probes independent.** A missing `docker` must not discard AppHost results, and
   vice versa. `probeResources()` currently `Promise.all`s them, so one rejection loses both.
5. **New test, required:** with an injected `CommandPort` that throws `Deno.errors.NotFound` for
   both binaries, assert `runLeakCheck`/`buildLeakReport` returns a report with zero survivors and
   both probes marked `unavailable`, and that `enforceTeardown({ state: 'done' }, report)` stays
   `{ state: 'done' }`. Add the mixed case too (aspire ok, docker unavailable).

`runLeakCheck` currently takes no port arguments — thread `CommandPort`/`FilePort` through with
defaults so the test can inject, consistent with how `probes.ts` already does it.

## Fix 2 — `scaffold-e2e-test.ts:1074` bare throw is a flake

**Verified defect.** `#startAspire()` calls `#registerStartedAppHost()` immediately after
`aspire start` returns; if `aspire ps` has not yet listed the process, line 1074 throws and kills
the whole E2E run. Resource contention has already been misdiagnosed as a product defect once in
this train (`behavior.service-health`). Do not add another.

Required: a **bounded** retry/settle window — poll until the AppHost with the matching resolved
path **and** a usable `appHostPid` + `appHostStartedAt` appears, or the budget expires. Roughly
10s total at ~250-500ms intervals; make the budget a parameter/constant, not a magic literal, so a
test can shrink it. Do **not** add an unconditional pre-sleep — the common case must stay fast.

The failure message must say **which** failure it was: "AppHost `<path>` did not appear in
`aspire ps` within <N>ms" versus "could not probe AppHosts: <reason>". Add a test for the
retry-then-succeed path (first poll empty, second returns the AppHost) and for the timeout path.

## Fix 3 — `scaffold-e2e-test.ts:1067` must not depend on Docker

**Verified defect.** `#registerStartedAppHost()` calls `probeResources()`, which probes Docker as
well as Aspire; a Docker probe failure therefore fails AppHost registry capture and the whole E2E
run, though only `aspire ps` is needed here.

Required: export the AppHost-only probe from `probes.ts` (it exists as the private
`probeAppHosts`) and call that. Narrow the dependency to exactly what is required. This composes
naturally with Fix 1 item 4 — do them together.

## Fix 4 — `leak-check.ts:39` hard-codes the repos root

**Verified defect.** `ownerFrom()` matches `/^(\/home\/codex\/repos\/[^/]+)/`, so a report
generated from any other worktree root attributes every resource as `unknown`, degrading the
`foreign` vs `unproven` escalation signal this PR exists to provide.

Required:

- Derive the root instead of hard-coding it: `ownerFrom` takes the report's `worktreeRoot` and
  attributes against `dirname(resolve(worktreeRoot))`, using the same **segment-boundary**
  logic as `pathContained` — not a string prefix. `/repos/fix-104` must not be attributed as the
  owner of `/repos/fix-1046`.
- `ownership.ts:41 WORKTREE_PREFIX` is the same hard-coding and feeds `foreignWorktree()`
  (the `foreign` vs `unproven` split). Derive it from the passed `worktreeRoot` the same way.
- **Do not touch the kill bar.** `classify()`'s `owned` branch — `pathContained(evidencePath,
  worktreeRoot)` and `registryMatches()` — must be behaviourally identical. `actionable()` must
  still return only `owned`. `foreign` and `unproven` must remain non-actionable.
- The existing segment-boundary test must stay green **unmodified**. Add a test that a report
  generated from a non-`/home/codex/repos` root (e.g. `/srv/ci/checkouts/wt-a`) attributes owners
  correctly, and a test that `fix-104` is not attributed as owner of a `fix-1046` path.

## Fix 5 — `forbidden-commands_test.ts:50` traverses `.git/` and `.llm/runs/`

**Verified defect.** `walk()` (lines 47-53) recurses into every directory and the
`.git/` / `.llm/runs/` filter is applied at line 30, *after* yielding — so the guard reads the
whole object store on CI checkouts.

Required: skip those directories **during traversal**. Keeping the post-filter as belt-and-braces
is fine.

**Prove the guard still goes RED.** Temporarily introduce one forbidden phrase into a tracked file
outside the skipped directories, run the test, confirm it **fails**, then revert. Paste the RED
output into your worklog. A guard that traverses less but also catches less is a regression, and
the `expectedAspireStopAllPaths` / `expectedDogfoodMirrorPaths` exact-equality assertions must
still hold — if skipping changes those lists, you have skipped too much.

---

## Gates — run all of these before you push

```
deno task ci:quality
deno test --allow-all .llm/tools/agentic/teardown/ .llm/tools/agentic/codex/
deno task test
deno task quality:gate
deno task docs:maintenance
deno task agentic:leak-check --slice-dir <this run dir> --worktree /home/codex/repos/fix-1046
```

**Do not pass `--unstable-kv` to `.llm/tools/run-deno-check.ts`** — it emits that flag by default
and rejects it explicitly (exit 1).

Read the logs you generate. An unread log is the same waste as an unstopped container.

## Commits

One commit per fix, conventional-commit subject naming the Augment comment id, e.g.
`fix(teardown): tolerate absent aspire/docker in the leak probe (#3696850088)`.
Do **not** amend or rebase the 21 existing commits.

## Definition of done

- All five fixes implemented with the tests named above, all green.
- `deno task ci:quality`, `deno task test`, `deno task quality:gate` green — paste real output.
- Pushed; local and remote SHAs match.
- No AppHost or container left behind by you; `docker ps -a` / `aspire ps` stated in the worklog.
- Final response ends with exactly `DONE` or `BLOCKED: <reason>`.
