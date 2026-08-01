use harness

## SKILL

netscript-harness, netscript-cli, netscript-tools, netscript-doctrine, netscript-pr, aspire, deno

## Evaluator waiver — read this first

The Plan-Gate open-model evaluator is waived by the owner (2026-08-01); the supervisor performs
PLAN-EVAL and IMPL-EVAL. Do not attempt `claude-print`, `provider-canary`, OpenRouter, Qwen or
OpenHands, do not stop at the Plan-Gate, and do not fabricate a `plan-eval.md`. Write your plan,
then proceed directly to implementation.

## Assignment — rebase PR #1030 onto `main`, then treat two Augment review threads

Branch: `fix/1026-aspire-agent-wiring`, already checked out at `/home/codex/repos/fix-1026`.
**Reuse that worktree. Never delete or recreate it.**
Run dir: `.llm/runs/fix-1026-aspire-agent-wiring--discoverability/`
PR: #1030, currently open (not draft), head `20f3f73c7`.

Three units of work, in this order. **Do not push** — the supervisor pushes and verifies SHAs.

---

## Unit 1 — rebase onto current `main`

Sibling PR **#1034 has merged to `main`** as `67cf5963d`. It rewrote the *same* surface this branch
touches: `skills/aspire/SKILL.md`, `skills/deno/SKILL.md`, `skills/help.md`, `skills/manifest.json`,
`skills/netscript/SKILL.md`, `init-agent.ts`, `init-agent_test.ts`.

```sh
git fetch origin
git rebase origin/main
```

### Conflict doctrine — read before resolving a single hunk

**Do not resolve by taking either side wholesale.** Each slice authored its own version of that
surface; `--ours`/`--theirs` on any of those files silently drops half the intended content. For
each conflicting file, read *both* sides, and produce a union that keeps every distinct section from
each. Specifically:

- **`skills/help.md`** — `main` is a strict superset here. This branch's S5 commit `20f3f73c7`
  already converged our two cleanup sections onto #1034's wording. `main` additionally carries the
  `0.0.3` version strings (ours still say `0.0.2`), the `## A plugin install succeeded, but nothing
  is wired` / `netscript plugin doctor` section, and `_emphasis_` normalisation. **Take `main`'s
  `skills/help.md` in full**, then diff it against ours and confirm by inspection that our side
  contributed nothing `main` lacks. If it did, add that back.
- **`skills/manifest.json`** — `main` is at `"version": "0.2.0"` with the same `skills` and `files`
  arrays as ours (ours is `0.1.0`, differing only in JSON formatting of the `skills` array). Take
  `main`'s.
- **`skills/aspire/SKILL.md`, `skills/deno/SKILL.md`, `skills/netscript/SKILL.md`** — union merge.
  Read `git show origin/main:<path>` and `git show 20f3f73c7:<path>` side by side. Keep every
  routing-table row, every hand-off row, and every symptom section present on **either** side.
- **`init-agent.ts` / `init-agent_test.ts`** — `main` has **no** Aspire delegation at all: no
  `AspireAgentInitializer`, no `aspireTimeoutMs`, no `messages` field, and `writeHostConfig` writes
  only the `netscript` MCP entry. **All of that is this PR's payload and must survive the rebase.**
  Keep our `aspire` MCP server entry in `writeHostConfig`, our `messages` result field, our bounded
  delegation, and our `AGENTS_SECTION` text (ours routes symptoms to `netscript plugin doctor`,
  `aspire logs`, `aspire otel logs|spans|traces`, `deno info`; `main`'s is the older, thinner
  wording — keep ours). Files `aspire-agent-initializer.ts` and
  `deno-aspire-agent-initializer.ts` exist only on our side; they must remain.

**Never reintroduce `docker ps -aq | xargs -r docker rm -f`, `docker rm`, `docker kill`, or
`docker prune` guidance into any shipped skill.** That destructive text is exactly what #1034
removed. After the rebase, this must print nothing:

```sh
grep -rnE 'docker (rm|kill|prune)|xargs .*docker' skills/
```

### `skills.generated.ts` is generated — never hand-merge it

`packages/cli/src/kernel/assets/skills.generated.ts` embeds the skill bundle and its SHA-256 hash.
If it conflicts, resolve the **sources** first, then:

```sh
deno task gen:assets-barrel
git add packages/cli/src/kernel/assets/skills.generated.ts
```

A stale hash makes `verifyBundle` throw at runtime, so this regeneration is load-bearing, not
cosmetic.

---

## Unit 2 — Augment thread `3696780356`: gate the Aspire delegation on the selected host

`packages/cli/src/public/features/agent/init/init-agent.ts:84`. **The supervisor verified this
lead; it is a real defect, not a bot false positive.** The delegation block is:

```ts
if (!await dependencies.fs.exists(join(input.projectRoot, PLAYWRIGHT_SKILL_PATH))) {
```

It is outside both `hosts.includes(...)` branches, so on a **VS Code-only** run — `--host vscode`,
or auto-detection finding only `.vscode/` — the probe still misses `.claude/skills/playwright-cli/
SKILL.md` and `aspire agent init` still runs, creating a `.claude/` tree for a user who never
selected the Claude host.

**Fix:** gate the delegation on the resolved host set as well as on file absence, e.g.

```ts
if (hosts.includes("claude") && !await dependencies.fs.exists(...)) {
```

Keep the existing bounded-timeout, non-fatal, message-emitting behaviour exactly as it is — only the
entry condition changes. `PLAYWRIGHT_SKILL_PATH` is a Claude-host path, so the guard belongs with
the Claude branch; place it so the reading is obvious.

**Required test** in `init-agent_test.ts`: a VS Code-only run must not touch `.claude`.

- Fresh temp root, `initAgent({ projectRoot: root, host: "vscode" }, …)` with a spy initializer that
  increments a counter.
- Assert the initializer was called **0** times.
- Assert `.claude/skills` does **not** exist (`assertFalse(await fs.exists(join(root, ".claude")))`).
- Assert `.vscode/mcp.json` was still written, so the fix does not regress the VS Code path.
- Add the auto-detection variant too: a root containing only a `.vscode/` directory and **no**
  `host` input resolves to `["vscode"]` and must likewise not create `.claude`.

Confirm the test **fails before your fix and passes after** — run it against the pre-fix code and
record both outputs in the worklog. A test that passes on the unfixed code proves nothing.

---

## Unit 3 — Augment thread `3696780357`: the routing-integrity matcher misses linked targets

`packages/cli/src/public/features/agent/init/init-agent_test.ts:163`:

```ts
const target = line.match(/^\|[^|]+\|\s*`([^` ]+)`\s*\|$/)?.[1];
```

This only recognises a table target written as a bare backticked token (`` `aspire` ``). Real
routing rows in `skills/netscript/SKILL.md` write the help target as a markdown link —
``[`help.md`](../help.md)`` — in **both** the `## Routing` table and the `## Hand-offs` table, and
those rows are therefore never validated. **The supervisor verified this; it is real.**

This matters more than an ordinary test gap: this assertion is the *evidence* for the
"no dangling skill routes" acceptance criterion on #1026 and the PR's Definition of Done. A hole in
the assertion weakens the box that is already ticked.

**Fix:** extend the matcher so a table target is recognised when written as

- a bare backticked token — `` `aspire` ``
- a markdown link with a backticked label — ``[`help.md`](../help.md)``
- a markdown link with a plain label — `[help.md](../help.md)`

Validate the **route target** (the skill name or `help.md`), and — since the link form carries a
path — also assert that the link's href resolves to a file that actually exists under the installed
`.claude/skills` tree. A link can dangle two ways: an unknown target name, and a correct name with a
wrong relative path. Cover both. Keep the existing `` `x` skill `` prose matcher working.

**Proof obligation — do not skip this.** Before you call it fixed, demonstrate the extended matcher
actually catches a dangling linked route:

1. Temporarily inject a deliberately dangling linked row into a routing table — e.g.
   `` | Something imaginary | [`nope.md`](../nope.md) | `` — in the source skill, regenerate, and run
   the test.
2. Record in the worklog that the test **failed** with a `routes to missing` message naming
   `nope.md`.
3. Also inject a *wrong-path* variant — correct target name, href pointing at a nonexistent
   location — and record that it failed too.
4. Revert both injections, regenerate, and confirm the suite is green on the real content.

Paste the failing output into the worklog. "I extended the regex" is not evidence; a red test on a
seeded defect is.

---

## Validation — re-run, do not quote the previous run

From `/home/codex/repos/fix-1026`:

```sh
deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/cli --ext ts,tsx
deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts  --root packages/cli --ext ts,tsx
deno test -A packages/cli/src/public/features/agent/init/init-agent_test.ts
deno task gen:assets-barrel   # must leave the tree clean; if it changes a file, commit it
deno task check
deno task lint
deno task fmt:check
```

**Do not pass `--unstable-kv` to `.llm/tools/run-deno-check.ts`** — it emits that flag by default
and rejects it on the command line (exit 1).

`deno task gen:assets-barrel` must reproduce the committed barrel byte-for-byte on a clean tree.
Verify with `git status --porcelain` after running it, not by trusting exit 0.

**Verify the artefact, never the exit code.** A piped command reports the exit status of the last
stage in the pipe. Read the output.

## Formatting note

`skills/help.md` previously carried `deno fmt --check` findings because this branch adopted #1034's
wording byte-for-byte ahead of the merge. After the rebase that reason is gone — the file *is*
#1034's. Run `deno fmt` over `skills/**.md` and commit the normalisation if it produces changes,
**except** for `skills/netscript-build/SKILL.md` and `skills/netscript-operate/SKILL.md`, which
carry pre-existing drift owned by `main`; leave those alone and say so in the worklog.

## Commits

Small, reviewable, conventional commits:

1. the rebase itself (it rewrites existing commits — that is expected; do not squash them)
2. `fix(cli): gate Aspire delegation on the selected agent host`
3. `test(cli): validate linked routing targets for dangling routes`

**Do not push.** The supervisor pushes to
`refs/heads/fix/1026-aspire-agent-wiring` and verifies local and remote SHAs match. A previous run
left six good commits unpushed while CI graded a stale head — that is why this is the supervisor's
job. Just leave the worktree clean with the commits in place, and report the SHAs.

## Teardown — this is part of the job, not a courtesy

Dangling Aspire AppHosts and Docker containers from agent runs have cost this project real time.
**If you start an AppHost, you own stopping it before you return.**

- Stop AppHosts with `aspire stop --all --non-interactive --nologo`.
- **Never kill `aspire mcp start`** — those are the session's MCP servers, not AppHosts.
- **Never run a blanket `docker rm -f` or `docker ps -aq | xargs`.** That is precisely the
  destructive shortcut being deleted from the shipped skills in this very PR. Remove only containers
  your own run created, scoped by name and status.
- Prefer `deno task e2e:cli run scaffold.runtime --cleanup --format pretty`; `--cleanup` exists for
  exactly this. You should not need the runtime E2E for this slice — do not run it speculatively.
- Before returning, verify with `docker ps -a` and `aspire ps --format Json --non-interactive
  --nologo` that you left nothing behind, and state what you found.

## Use the tooling we ship

Reach for `aspire` CLI verbs, `netscript plugin doctor`, `deno doc` / `deno info`, and the
`.llm/tools/` wrappers before hand-rolling a command. Prefix read-heavy `git`/`grep`/`ls` with
`rtk`. **And read the logs you generate** — an unread log is the same waste as an unstopped
container.

## Out of scope

- Do not re-plan the PR or touch its scope.
- Do not modify the PR body, labels, or milestone — the supervisor owns those.
- Do not touch `#1023`'s remaining sibling scope.
- Do not open or close issues.

## Report back

- rebase result and, for **each** conflicted file, one line on how you unioned it
- the two fix commits, with the pre-fix failing test output for Unit 2 and the seeded-dangling-route
  failure for Unit 3
- full validation output
- teardown verification
- anything you could not do, stated plainly rather than worked around
