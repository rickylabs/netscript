# Plan — docs(agentic): canonical cross-host skill installation (#1745)

**PLAN-EVAL: N/A.** Coordinator ruling: bounded three-page correction, authoritative current-main
behavior, explicit acceptance in the issue. Recorded per the 2026-08-08 owner decision on conditional
PLAN-EVAL. IMPL-EVAL is **not** waived and runs in a separate session.

## Locked decisions

1. **`.agents/skills/` is the canonical tree; `.claude/skills/` is a Claude-only mirror.** Every page
   leads with the canonical tree. The mirror is described as derived, never as the location.
2. **The canonical bundle and the managed `AGENTS.md` section are host-independent.** They are not
   attributes of the Claude row. The host/editor tables list only what is genuinely host- or
   editor-specific on top of that shared baseline.
3. **Host ≠ editor.** `--host claude|vscode|all` selects agent hosts; `--editor none|zed|vscode`
   selects editor wiring. Zed is an editor. Where a table mixes them, say which axis a row is on.
4. **No behavior claim ships without source backing.** Every statement must be checkable against
   `packages/cli/src/public/features/agent/init/init-agent.ts` at this leaf's base.
5. **Three files of product surface, plus generated assets.** No fourth page, no `packages/` source,
   no skill-body edits (#1737's), no Aspire docs (#1723's).
6. **`three` → `five`** at `docs/site/reference/ai/skills.md:19-21`, that word only, declared in
   `drift.md`.

## Slices

- **S1** — the three pages. One commit.
- **S2** — regenerate `.llm/assets/agent-docs/{prose.json.gz,provenance.json}` and
  `packages/cli/src/kernel/assets/agent-docs.generated.ts`. Separate commit so the prose diff stays
  reviewable.

## Gate set (run at the exact pushed head)

| Gate                                            | Command                                          |
| ----------------------------------------------- | ------------------------------------------------ |
| Lume source format                              | `deno task --cwd docs/site check:source-format`  |
| Site build + rendered output                    | `deno task --cwd docs/site build`                |
| Internal site links                             | `deno task --cwd docs/site check:links`          |
| Caveat refs                                     | `deno task --cwd docs/site check:caveats`        |
| Internal doc links (repo)                       | `deno task docs:links`                           |
| Docs accuracy / discoverability                 | `deno task docs:accuracy`                        |
| Agent-docs corpus freshness                     | `deno task check:agent-docs-prose`               |
| Generated asset freshness                       | `deno task check:assets-barrel`                  |

`deno task --cwd docs/site verify` runs build + links + caveats in one pass. Root `fmt:check` and
`lint` do **not** govern these files (see `research.md` §6) — do not cite them as evidence.

## Definition of done

- The three pages agree with `init-agent.ts` at this leaf's base, on every claim they make.
- A VS Code or Zed reader can find `.agents/skills/` from any of the three pages.
- No `packages/` source or runtime behavior change; the only `packages/` diff is
  `agent-docs.generated.ts`.
- Every gate above green at the exact pushed head, with pasted output.
- PR body carries `Closes #1745`, targets `main` directly.
