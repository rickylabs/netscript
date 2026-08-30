use harness

You are the implementation agent for docs leaf **#1723 slice A** (closes **#1000**) on branch
`docs/aspire-terminology-sweep`, worktree `/home/agent/projects/netscript/worktrees/007-leaf-1723a`,
based on `origin/main` `13878a80`. Direct-to-main leaf. Push only by explicit refspec. Do not open or
modify any PR or issue.

## SKILL

1. Repo `AGENTS.md`.
2. `.agents/skills/netscript-harness/SKILL.md`, `.agents/skills/netscript-tools/SKILL.md`.
3. `.agents/skills/netscript-pr/SKILL.md` — commit taxonomy only; you do not author the PR.
4. This run dir: `research.md` and `plan.md`, in full. `research.md` is the authority for what is
   shippable and what is deferred, and every claim in it was read from `origin/main`.

## The task

Rename **".NET Aspire" → "Aspire"** in published surfaces, and repoint Microsoft Learn links to
`aspire.dev`. That is all. This is the version-independent slice of a much larger Aspire 13.5 docs
issue whose remaining rows would be **false** if written today, because main still pins Aspire 13.4.6
and no 13.5 slice has merged.

Locations (18 occurrences, 14 files) — re-verify with
`git grep -n '\.NET Aspire' -- docs/site README.md CONTRIBUTING.md | grep -v '_plan/'` before editing:

```
README.md:16,31,317
docs/site/cli-reference.md:122
docs/site/explanation/aspire.md:101
docs/site/glossary.md:40
docs/site/index.vto:9
docs/site/orchestration-runtime/how-to/deploy-local-aspire.md:11,33
docs/site/orchestration-runtime/how-to/deploy.md:373
docs/site/quickstart/aspire.md:36
docs/site/tutorials/erp-sync/index.md:112
docs/site/tutorials/index.md:33,90
docs/site/tutorials/workspace/01-scaffold.md:46
docs/site/why.vto:68,91
docs/site/_diagrams/aspire-resource-graph.mmd:2
```

Four also carry a `https://learn.microsoft.com/dotnet/aspire/` link — `README.md:31`,
`docs/site/quickstart/aspire.md:36`, `docs/site/tutorials/erp-sync/index.md:112`,
`docs/site/tutorials/index.md:90`. Repoint those to `https://aspire.dev`. That is already the
convention on main (`explanation/aspire.md`, `quickstart.vto`, three tutorial scaffold chapters), so
match how those pages phrase it.

Read each sentence before changing it. "Aspire" must still read naturally — if dropping ".NET" leaves
a sentence awkward or ambiguous about what Aspire is, fix the sentence, don't leave a scar.

## Hard boundaries — violating any of these fails the slice

- **Do not touch any version literal.** `docs/site/explanation/aspire.md:83` and
  `docs/site/orchestration-runtime/how-to/deploy-local-aspire.md:58` say `13.4.6`. Main pins `13.4.6`.
  They are **correct**. Changing them to 13.5.x would make the public docs false.
- **Do not document any Aspire 13.5 behaviour** — no health checks, no resource commands, no
  `excludeFromMcp`, no detached-start how-to, no `aspire otel --search` or `aspire export` changes.
  None of it has merged.
- **Do not edit `docs/site/_plan/**`** — unpublished research archives.
- **Do not touch** `.agents/skills/codex-wsl-remote/SKILL.md`, its `.claude` mirror,
  `packages/cli/.../render-ts-apphost.ts`, or any telemetry resolver. Those belong to another slice.
- **No `packages/`/`plugins/` source.** The only permitted `packages/` diff is a regenerated
  `agent-docs.generated.ts`.
- Do not add or restore any "AI Assistant" mention. There are currently zero and that is correct.

If you believe a row outside this list needs changing, **stop and write it in `drift.md`** instead of
changing it.

## Generated assets — unconditional, no judgement calls

This leaf edits `docs/site`, so the agent-docs corpus moves, and that corpus's provenance is embedded
downstream. Run all three, always:

```
deno task gen:agent-docs-prose
deno task gen:assets-barrel
deno task gen:publish-assets
```

Commit whatever they rewrite as one separate commit. The immediately preceding docs leaf shipped a
red CI job because its brief reasoned about which generator "should" fire from a remembered list, the
list was wrong, and two independent review passes re-ran the same wrong list. Do not repeat that:
run the generators, then trust the check gates.

## Gates — every one, paste real output

```
deno task --cwd docs/site check:source-format
deno task --cwd docs/site build
deno task --cwd docs/site check:links
deno task --cwd docs/site check:caveats
deno task --cwd docs/site diagrams:check
deno task docs:links
deno task docs:accuracy
deno task doc:lint
deno task check:agent-docs-prose
deno task check:assets-barrel
deno task check:publish-assets
```

Root `fmt:check`/`lint` do not govern these files — root `fmt.include` is `packages/**`+`plugins/**`
TS/TSX and `docs/site` excludes `*.md`/`*.vto`. Do not run or cite them, and never run the mutating
`deno task fmt`.

Infrastructure note: this host's PID 1 is not reaping processes, so any gate asserting "no surviving
child process" is a false red right now. Classify that as infra in `drift.md` and continue; do not
chase it.

## Deliverable beyond the code

In `worklog.md`, produce a **manifest accounting table** the PR body will carry. For the Aspire
surface manifest's S11 `doc:public-page` rows, every row must land in exactly one bucket:

1. **edited** — with the change made,
2. **no change needed** — with the exact grep that proves it,
3. **deferred** — with the named blocking slice (S1 #1727, S6 #1718, S8 #1720, S3 #1741, S10 #1722)
   or issue (#1642) and one line of reason.

The manifest is on branch `research/aspire-13.5-0.0.7` at
`.llm/runs/research-aspire-13.5-adoption--0.0.7/aspire-surface-manifest.tsv`; read it with
`git show`, do not check that branch out. This accounting is not paperwork: when S13 lands, parity
phase 2 fails on every unaccounted non-archival row.

## Commits and push

1. `docs(aspire): normalise .NET Aspire to Aspire across public surfaces`
2. `chore(docs): regenerate derived assets after the terminology sweep`

```
git push origin HEAD:refs/heads/docs/aspire-terminology-sweep
```

No upstream is configured by design; a bare `git push` must fail. Keep `worklog.md` and `drift.md`
current. Report the head sha and stop — the supervisor runs Tier-A and a separate session runs
IMPL-EVAL. You do not self-certify.
