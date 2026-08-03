use harness

# Slice: Aspire and CLI lifecycle (#1011, #1012)

Worktree: `/home/codex/repos/ns004-aspire` · branch `fix/1011-aspire-lifecycle` · base `origin/main`
@ `ab0fa13fe`.

## SKILL

- `.agents/skills/netscript-harness` — run loop, slice contract, commit trail.
- `.agents/skills/netscript-cli` — `netscript db` commands, AppHost interaction, scaffold output.
- `.agents/skills/aspire` — Aspire CLI, resource lifecycle, health/readiness.
- `.agents/skills/netscript-pr` — `Closes #N` in the PR **body**; every `gh` call passes
  `--repo rickylabs/netscript`.
- `.agents/skills/netscript-tools` — scoped check/lint/fmt wrappers, `quality:scan`, `arch:check`.
- `.agents/skills/rtk` — prefix read-heavy `git`/`gh`/`grep` with `rtk`.

## Scope

Read both issue bodies in full.

- **#1011 (p1)** a **read-only** `netscript db` command terminates the resident AppHost. A command
  that reads must not kill the thing it read from. Establish why the lifecycle is coupled before
  changing it — do not guess at the ownership model.
- **#1012 (p1)** executable resources report `Healthy` without an endpoint readiness check. A
  resource that is "healthy" before it can serve is worse than one reporting nothing, because
  everything downstream trusts it. This is the same class of defect as #1022 (`plugin doctor`
  reporting healthy on a project that cannot run), which landed in #1076 — read that fix first; the
  `AppHostInspector` it introduced is likely the right seam, and reusing it beats a parallel
  mechanism.

## Live environment facts you must respect

- **`aspire stop --all` does not reliably stop its child tree.** It reports "No running AppHost
  found" and exits 0 while processes rooted at the AppHost live on. Three independent agents hit this
  in one night. Re-probe `ps` for `apphost.mts` and resolve pids yourself.
- **Never kill an `aspire mcp` process.** Those are MCP servers owned by their client, not AppHosts.
- The machine is shared with live wave-four demo runs (`/home/codex/repos/wave4-*`) and other 0.0.4
  slices. Prove ownership by path containment before killing anything. `docker ps` and `ps` first.
- **Do not run `scaffold.runtime` concurrently with another slice.** Three slices ran it at once
  earlier in this release on a 15 GB box and two failed on contention, not on defects. Check
  `agentic:leak-check` for a foreign apphost or Postgres before you start, and wait if one is live.

## Rules

- Contract first: state what the lifecycle ownership and readiness contracts *are*, then implement,
  then test.
- A gate that has only ever run on this machine is not evidence. `Deno.Command` **throws** on a
  missing binary rather than returning non-zero — a check that passes locally because `aspire` is on
  PATH can fail on CI's deno-only lane. Test the missing-binary path.
- Verify the artefact, never the exit code. Read the actual error text; never infer a cause from the
  shape of a failure.

## close-gate is part of the work

`close-gate` reads the `- [ ]` acceptance boxes on #1011 and #1012 and fails the PR until each is
ticked. Four PRs in this release stalled by discovering that at the end. Verify each criterion as you
land it, tick it on the issue, and post the evidence — command, observed output, and for tests proof
they fail against pre-fix behaviour. **Tick nothing you cannot evidence**; an unmet criterion is a
legitimate outcome — drop that closing keyword and state the remaining scope.

## Gates

`deno task check` · `deno task test` for touched packages · scoped lint/fmt wrappers ·
`deno task quality:scan` · `deno task arch:check`. `scaffold.runtime` once at merge-readiness if the
change affects generated output — not per loop, and not concurrently with another slice.

## Deliverable

One draft PR closing #1011 and #1012, driven to ready-for-merge. Commit per slice; push and comment
commit hash + gate evidence before the next slice.
