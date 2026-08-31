use harness

You are the implementation agent for docs leaf **#1745** on branch
`docs/agentic-cross-host-skills`, worktree `/home/agent/projects/netscript/worktrees/007-leaf-1745`,
based on `origin/main` `13878a80`. Direct-to-main leaf; do not branch again, do not rebase, do not
merge, do not open or modify any PR or issue. Push only by explicit refspec.

## SKILL

Read, in this order:

1. Repo `AGENTS.md` (operating rules, validation wrappers, `rtk` usage).
2. `.agents/skills/netscript-harness/SKILL.md` — run artifacts, slice review gate, IMPL-EVAL.
3. `.agents/skills/netscript-tools/SKILL.md` — which command is a trustworthy verdict source.
4. `.agents/skills/netscript-pr/SKILL.md` — commit message taxonomy only; you do not author the PR.
5. This run dir in full: `.llm/runs/docs-cross-host-skills--1745/research.md` and `plan.md`.

`research.md` is the authority for what the code does. It was read from source at this exact base.
Re-verify anything you intend to write; do not soften a claim you cannot check.

## The task

PR #1729 changed the shipped `netscript agent init` contract. `.agents/skills/` is now the
**canonical** skill tree written for **every** host, the managed `AGENTS.md` section is written for
every host, and `.claude/skills/` is a **derived Claude-only mirror** copied from the canonical tree.
Three public pages still teach the previous Claude-only contract, so a VS Code or Zed reader is told
the skill bundle is a Claude artifact they cannot use. `docs/site` does not mention `.agents/skills/`
anywhere.

Fix exactly these three files:

- `docs/site/ai/agent-tooling.md` — the "Install into a project" section and its host table (`:68`).
  Every host must be shown receiving the canonical `.agents/skills/` bundle and the managed
  `AGENTS.md` section; the table should carry that shared baseline once rather than repeating it per
  row, with rows listing only what is genuinely host- or editor-specific. `.claude/skills/` appears
  as the Claude mirror.
- `docs/site/reference/cli/commands.md:57` — the `netscript agent init` row. It currently reads
  "Claude Code writes `.mcp.json` and installs the skill bundle". State the host-independent
  canonical install, then the per-host additions. Keep the row's existing flag documentation intact
  and keep it one table row.
- `docs/site/reference/ai/skills.md` — the "Installed NetScript skills" section (`:26`) and the
  help-path sentence (`:43`, currently `.claude/skills/help.md`). Lead with the canonical tree;
  describe the Claude mirror as optional and derived. **Also change the single word "three" to
  "five"** in the callout at `:19-21` ("a set of three ready-made skills") — the table directly below
  lists five and `skills/` on main ships five plus `help.md`. That word is the only edit authorized
  outside the two sections named above.

Preserve each page's existing voice, component syntax (`{{ comp … }}`, `{{ /comp }}`, `comp.apiTable`)
and heading structure. This is a correction, not a rewrite: change what is false, leave what is true.

## Ceilings

- **Exactly 3 product files**, plus the generated assets named below. A fourth product file is a
  scope violation — stop and write it in `drift.md` instead.
- No `packages/` or `plugins/` source. No `skills/` edits — the shipped skill bodies are #1737's.
- No Aspire 13.5 docs — #1723's.
- Do not document the unresolved background-reference error from #1728; it is deliberately parked.

## Generated assets

A `docs/site` edit invalidates the agent-docs prose corpus. After the prose commit, run:

```
deno task gen:agent-docs-prose
deno task gen:assets-barrel
```

Commit `.llm/assets/agent-docs/prose.json.gz`, `.llm/assets/agent-docs/provenance.json` and
`packages/cli/src/kernel/assets/agent-docs.generated.ts` as a **separate** commit. Do **not**
regenerate `publish-assets.generated.ts` or `embedded.generated.ts` — neither has a source in this
diff, and touching them is noise a reviewer has to disprove.

## Gates — run every one, paste real output

```
deno task --cwd docs/site check:source-format
deno task --cwd docs/site build
deno task --cwd docs/site check:links
deno task --cwd docs/site check:caveats
deno task docs:links
deno task docs:accuracy
deno task check:agent-docs-prose
deno task check:assets-barrel
```

Root `fmt:check`/`lint` do not govern these files (root `fmt.include` is `packages/**`+`plugins/**`
TS/TSX; `docs/site` excludes `*.md`/`*.vto`). Do not cite them as evidence and do not run the
mutating `deno task fmt`.

If a gate is red, fix the cause. If a gate is red for a reason that predates this leaf, do not fix it
— record it in `drift.md` with the evidence and continue.

## Commits and push

Two commits, conventional-commit style:

1. `docs(agentic): document canonical cross-host skill installation`
2. `chore(docs): regenerate the agent docs corpus for the cross-host skills edit`

Then push by explicit refspec only:

```
git push origin HEAD:refs/heads/docs/agentic-cross-host-skills
```

The worktree deliberately has no upstream; a bare `git push` must fail. Do not set one.

## Record as you go

Keep `.llm/runs/docs-cross-host-skills--1745/worklog.md` current after each commit (what you did,
gate results with exit codes, the head sha). Put every deviation, surprise, red-that-was-already-red,
and anything you wanted to change but did not, in
`.llm/runs/docs-cross-host-skills--1745/drift.md`. An undeclared deviation is the one thing that
fails this slice outright.

When the pushed head is green, stop and report. You do **not** open the PR, apply labels, or
self-certify: the supervisor performs Tier-A review and a separate session runs IMPL-EVAL.
