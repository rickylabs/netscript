use harness

## SKILL

- netscript-harness — run loop, commit + push, run-dir artifacts; no self-certification.
- netscript-tools — `agentic:leak-check` / `agentic:teardown` semantics, raw git verification,
  gate-evidence rules.
- aspire — the internal diagnostic skill for Aspire lifecycle/inventory commands.

## D-189 — S7 (#1744) live runtime lease: the #1429 kill receipt and the foreign-AppHost control

The coordinator has **granted one narrow, serialized local runtime lease** for this exact head. Host
inventory was verified at **exact zero** immediately before this dispatch: `aspire ps` `[]`,
containers 0, volumes 0, custom networks 0. You are the only lease holder. No other lane may start
runtime while you hold it.

**Work at the exact head `be2c7a3b0` on `fix/aspire-13-5-s7-teardown-leak-check`. Do not rebase, do
not converge onto main, do not touch any other slice.**

Two untracked artifacts from the previous lease are already in the run dir
(`leak-report.md`, `run-resources.json`). Incorporate or supersede them; do not silently delete them.

## What this lease must produce

#1719 has exactly two unchecked live-runtime acceptance boxes. They have been **held** rather than
weakened into fixture-only claims, and this lease exists to satisfy them for real.

### Box 1(a) — the real 13.5 kill receipt

Reproduce #1429: start the AppHost, then **kill the launching CLI process** and observe what happens
to the AppHost tree.

Capture, as a structured JSON receipt:

- the exact `aspire start` invocation and its `--apphost` path;
- the launcher PID and the full descendant tree **before** the kill, with each process identified by
  reading **`/proc/<pid>/cwd` and `/proc/<pid>/cmdline`** — never by a `pgrep -f` / `pkill -f`
  pattern, which matches your own shell and has produced false identifications in this repo before;
- the kill signal and target;
- the process tree and `aspire ps --format Json` **after** the kill, at a stated settle interval;
- `docker ps -a` before and after.

**Report the observed fact; do not adjudicate the wording.** The box says "automatic cleanup / no
run-owned survivor". If anything survives, record **exactly what it is and why** — in particular
whether it is a container with a **Persistent lifetime annotation**, which by Aspire's design
survives `aspire stop` and has been observed surviving five times in this run (D-98, D-102, D-103,
D-141, D-176). Whether a documented Persistent-lifetime container counts as a "run-owned survivor"
is an **open coordinator question**. Your job is to make the answer decidable with evidence, not to
decide it. Do not rewrite, weaken, or tick the box.

### Box 1(b) — deterministic synthetic coverage

Prove, with deterministic (non-runtime) tests, the historical **re-parented, contained-`cwd` /
`--contentRoot` descendant** case: that `agentic:leak-check` **reports** it, and that
`agentic:teardown --apply` mutates **only positively-proven-owned** resources — age-guarded and
inactive-run-guarded, and **never by PPID alone**. If coverage for this already exists at this head,
say so precisely (file + test names) rather than duplicating it; if it is partial, complete it.

### Box 2 — the foreign-AppHost control

With your own AppHost running, stand up (or point at) an AppHost **owned by a different worktree**
and prove `agentic:leak-check` **reports it and never mutates it**, and that
`agentic:teardown --apply` leaves it untouched. Capture before/after evidence for the foreign
resource specifically. **Never mutate a foreign or unknown-owner resource** — that is the invariant
under test, and violating it fails the slice.

## Runtime environment — read this before you start anything

- Docker here is **dind**: `DOCKER_HOST=tcp://netscript-dind:2375`, daemon 28.5.2, resolvable as
  `netscript-dind` (10.4.12.22). Reach published service ports **via the `netscript-dind` hostname**,
  not `localhost`.
- **Known upstream limitation (D-146 / microsoft/aspire#14878):** Aspire 13.5.3 does not support
  remote/custom Docker hosts, and DCP 0.25.13 binds published ports to the **daemon-local**
  `127.0.0.1`. `AppHost__ContainerHostname` and `ASPIRE_ENABLE_CONTAINER_TUNNEL` do **not** rewrite
  host-facing endpoints.
  **This breaks published-port *reachability*, not AppHost *lifecycle*.** `aspire start`, `stop`,
  `ps`, the process tree, and container/volume cleanup all work. This lease is a **lifecycle and
  cleanup proof** — if a published port is unreachable from this container, that is the documented
  upstream limitation, **not a failure of this slice**. Record it and continue; do not chase it, and
  do not attempt to reconfigure the Docker topology.

## Hard runtime rules

- **Never** run `aspire stop --all`. Stop **only** by exact `--apphost <path>`.
- **Never** run `aspire agent mcp` during a reproduction.
- **Never** touch a foreign or unknown-owner container, volume, network, or process. If ownership is
  not positively proven by path containment, leave it and report it.
- If you start resources from a directory outside this worktree, declare it with `--owned-root <path>`
  on `leak-check`/`teardown`. A root shallow enough to cover other runs (`/tmp`, `/home`) is refused
  and must not be attempted.
- Run long suites **detached / in the background** and poll their log. A foreground tool timeout
  killed a suite mid-run earlier in this program and left live resources behind.

## Release the lease — required, and verified

Before you report back, return the host to **exact four-part zero** and prove it:

1. `aspire ps --format Json` → `[]`
2. `docker ps -aq` → 0 containers
3. `docker volume ls -q` → 0 volumes
4. `docker network ls` → no non-default networks (only `bridge`, `host`, `none`)

Paste all four outputs verbatim. If a resource refuses to clean up, **stop and report it** rather
than force-removing something whose ownership you have not proven.

Then run the read-only reporter as the independent check and paste its output:

```
deno task agentic:leak-check -- --slice-dir .llm/runs/fix-aspire-13-5-s7-teardown-leak-check--impl --worktree /home/agent/projects/netscript/worktrees/007-aspire-s7
```

## Commit and push

Commit the receipts under
`.llm/runs/fix-aspire-13-5-s7-teardown-leak-check--impl/receipts/` plus any test additions, on
`fix/aspire-13-5-s7-teardown-leak-check`. The branch has **no upstream configured** — push with an
explicit refspec to `origin fix/aspire-13-5-s7-teardown-leak-check`. Run
`git ls-remote origin refs/heads/fix/aspire-13-5-s7-teardown-leak-check` immediately beforehand; this
should be a fast-forward, so **no force is expected** — if a force would be required, stop and report.

## Out of scope

- No rebase, no convergence onto main, no PR base change, no label or lifecycle change.
- No product/behaviour redesign — this is an evidence-capture lease.
- **No self-dispatched evaluator.** Do not tick any acceptance box on #1719 or #1429.

## Report back

The exact `aspire start` invocation and `--apphost` path; the before/after process trees with
`/proc/<pid>/cwd` identification; the kill receipt and precisely what (if anything) survived, with its
lifetime annotation; the box-1(b) test file/test names and their result; the foreign-AppHost
before/after evidence; all four zero proofs verbatim; the `leak-check` output; the new head; and
confirmation the worktree is clean and the push landed.
