# Research — docs(agentic): canonical cross-host skill installation (#1745)

Every fact below was read at `origin/main` `13878a80a50c55b9662099fed64555f2310ae4a3`, which is this
leaf's base.

## 1. The shipped contract, read from source

Authoritative file: **`packages/cli/src/public/features/agent/init/init-agent.ts`**.

> **Correction to the issue.** #1745's acceptance names `packages/cli/src/commands/init-agent.ts`.
> That path does not exist on main. The real path is the one above; it is what "agrees with current
> main" must mean. Recorded in `drift.md`.

`initAgent()` writes, in order:

| Target                                     | Condition                                        |
| ------------------------------------------ | ------------------------------------------------ |
| `.llm/tools/**` (agent tool bundle)        | always                                           |
| `.netscript/docs/**`                       | `--with-docs` only                               |
| editor config files                        | resolved editor (`zed` handled separately)       |
| **`.agents/skills/**` (canonical bundle)** | **always — outside every host branch**           |
| **`AGENTS.md` marked section**             | **always — outside every host branch**           |
| `.mcp.json`                                | `hosts.includes("claude")`                       |
| **`.claude/skills/**` (mirror)**           | `hosts.includes("claude")`, copied **from** the canonical tree — a missing canonical file is a hard error (`Canonical skill was not installed: …`) |
| `.vscode/mcp.json`                         | `editor === 'vscode'`                            |
| `.zed/settings.json`                       | `editor === 'zed'`                               |
| `playwright-cli` skill via Aspire init     | `hosts.includes("claude")` and skill absent      |

At the parent commit `8b1e42f7` the canonical write did not exist: skills went **only** to
`.claude/skills/` and `AGENTS.md` was upserted **inside** the `hosts.includes("claude")` block
(`:127`–`:143`). So the three pages were accurate before `13878a80` and are inaccurate after it.

Hosts are `["claude", "vscode"]` (`init-agent-input.ts:2`); `--host all` selects both. Zed is an
**editor**, not a host — the current pages already blur this and the rewrite must not deepen it.

## 2. What ships in the bundle

`skills/` on main contains exactly: `netscript`, `netscript-build`, `netscript-operate`, `aspire`,
`deno`, plus `help.md` and `manifest.json`. `packages/cli/src/kernel/assets/skills.generated.ts`
carries the same six content entries. **Five skills + one playbook.**

## 3. The three inaccurate locations

- `docs/site/ai/agent-tooling.md:68` — host table: Claude Code row claims skills live under
  `.claude/skills/` and that the `AGENTS.md` section is a Claude artifact. The VS Code (`:69`) and
  Zed (`:70`) rows list only their MCP/settings file, so the table under-reports what those users
  receive.
- `docs/site/reference/cli/commands.md:57` — "Claude Code writes `.mcp.json` and installs the skill
  bundle".
- `docs/site/reference/ai/skills.md:26` — "installs five first-party skills and a symptom playbook on
  the **Claude Code host path** (under `.claude/skills/`, alongside `.mcp.json` and the marked
  `AGENTS.md` section)"; `:43` sends the reader to `.claude/skills/help.md`.

`git grep '\.agents/skills' -- docs/site` returns **zero** occurrences on main. The canonical tree is
absent from the public documentation entirely.

## 4. Adjacent defect found while reading (declared, not smuggled)

`docs/site/reference/ai/skills.md:19-21` calls the bundle "a set of **three** ready-made skills",
directly above the table that lists **five**. Contradicted by §2. It sits inside the same section the
rewrite touches, so shipping the rewrite around a known-false count would be a deliberate
false-fact. Bounded correction authorized by the supervisor: **three → five**, that word only.

## 5. Ownership boundaries confirmed

- #1737 rewrites the `.claude/skills/help.md` reference **inside the shipped skill bodies** and is
  explicitly bounded to "prose plus barrel regeneration inside `skills/`". It does not touch
  `docs/site`. No overlap.
- #1723 owns Aspire 13.5 public docs. Out of scope.
- The undocumented #1728 unresolved-reference error stays parked (docs-lane observation D-2).

## 6. Derived assets and gates

A `docs/site` edit invalidates the agent-docs prose corpus, and nothing else here:

- `.llm/assets/agent-docs/{prose.json.gz,provenance.json}` ← `deno task gen:agent-docs-prose`
- `packages/cli/src/kernel/assets/agent-docs.generated.ts` ← `deno task gen:assets-barrel`
- **Not** `publish-assets.generated.ts` (embeds `packages/mcp/README.md` only) and **not**
  `embedded.generated.ts` (CLI scaffold assets). Do not regenerate them.

Verified for this leaf: root `fmt.include` is `packages/**` and `plugins/**` TS/TSX only, and
`docs/site/deno.json` excludes `**/*.md`, `**/*.mdx`, `**/*.vto` from `fmt`. **No formatter governs
these three files.** The governing checks are `docs/site` `check:source-format`, `check:links`,
`check:caveats`, plus root `docs:accuracy`, `check:agent-docs-prose`, `check:assets-barrel` — the
same set CI's `quality` job runs for `RUN_DOCS`.
