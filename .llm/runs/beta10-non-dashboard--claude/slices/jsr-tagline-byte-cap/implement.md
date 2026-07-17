use harness

## SKILL

Run under `netscript-harness` + `netscript-tools` + `jsr-audit`. Read `AGENTS.md` first. If a skill
is not mirrored into `.claude/skills/`, read `.agents/skills/<name>/SKILL.md` directly.

You are a **Tier-D implementation lane**. You do not self-certify: a separate opposite-family session
reviews this slice. Commit and push your branch; do **not** open a PR and do **not** merge.

# Slice brief — JSR package descriptions are truncated mid-sentence on jsr.io

**Worktree:** `/home/codex/repos/b10-taglines`
**Branch:** `docs/jsr-tagline-byte-cap` (base: `feat/beta10-integration` @ `6c0dd587`)
**Milestone:** `0.0.1-beta.10`

## The problem (already diagnosed — do not re-derive)

The package description shown on **jsr.io is not read from `deno.json`.** It is derived from each
package README's **bold tagline** — the first prose paragraph after the H1 and badge block — by
`.llm/tools/release/jsr-set-package-settings.ts`, and PATCHed onto JSR after publish.

JSR validates that description in **BYTES** (Rust `String::len`), not characters, and caps it at
**250**. An em-dash (`—`) costs **3 bytes**. Over the cap, it is silently truncated at a word
boundary. That is why live descriptions read like this today:

> `@netscript/telemetry`: "…and a telemetry query read model — all linking sched" ← cut mid-word

**16 packages are over the cap.** This is the public shop window on jsr.io.

## The gate (already written for you — use it)

`.llm/tools/validation/check-jsr-tagline-length.ts` is committed in this worktree, and wired as
`deno task docs:tagline:check`. It extracts the tagline **exactly** the way
`jsr-set-package-settings.ts` does and measures it in bytes.

```bash
deno task docs:tagline:check     # pretty; exit 1 while any tagline is over
```

Current: `checked=35 over=16`. **Target: `over=0`.**

| README | Bytes | Over by |
| --- | --- | --- |
| `plugins/ai` | 760 | 510 |
| `packages/ai` | 403 | 153 |
| `packages/plugin-ai-core` | 369 | 119 |
| `packages/plugin-auth-core` | 321 | 71 |
| `packages/telemetry` | 319 | 69 |
| `packages/plugin-triggers-core` | 315 | 65 |
| `packages/bench` | 294 | 44 |
| `plugins/sagas` | 271 | 21 |
| `packages/plugin-sagas-core` | 270 | 20 |
| `plugins/workers` | 267 | 17 |
| `plugins/triggers` | 266 | 16 |
| `packages/contracts` | 266 | 16 |
| `packages/database` | 260 | 10 |
| `packages/plugin` | 259 | 9 |
| `packages/service` | 256 | 6 |
| `packages/auth-kv-oauth` | 255 | 5 |

(`packages/cli` and `packages/mcp` already pass — they were fixed on the #715 branch. Use them as the
worked example of the technique.)

## The technique

**Do not just chop words off the end.** The tagline must remain a **complete, well-formed sentence**
that reads as a deliberate one-line pitch — it is the first thing a person sees on jsr.io.

The extractor **stops at the first blank line**. So the move is: tighten the bold tagline until it
fits, and push the surplus into a **second paragraph** right after it. The second paragraph stays in
the README for human readers and never reaches JSR.

Worked example (`packages/cli`, was 328 chars → now 213 bytes):

```markdown
**The NetScript command surface: scaffold a workspace, then grow it — contracts, services, databases,
plugins, Fresh UI, deployment — with verbs that regenerate the Aspire host and the plugin registries
for you.**

Ships as the `netscript` binary, and as an embeddable command tree you can mount inside your own CLI.
```

Rules:

- Aim for **≤ 240 bytes**, not 250 — leave headroom. Em-dashes are 3 bytes; count with the gate, not
  by eye.
- Preserve each package's existing voice and its actual claims. **Do not invent capabilities** to
  make a sentence scan, and do not drop a load-bearing qualifier to save bytes — move it to the
  second paragraph instead.
- Keep the `**bold**` formatting on the tagline (that is the house convention).
- `plugins/ai` at 760 bytes is the outlier: its lead paragraph is far too long to be a tagline. Give
  it a real one-sentence tagline and demote the rest to following prose.

## Hard boundary — do NOT touch the JSR registry

**Do not run `.llm/tools/release/jsr-set-package-settings.ts`**, `jsr-provision-packages.ts`, or any
command that writes to jsr.io. Pushing settings to JSR is an outward-facing publish action against a
public registry and is inside tonight's no-publish stop-line.

This slice prepares the README fixes **only**. The registry re-sync happens later, under owner
supervision, at the next publish. The descriptions on jsr.io will **not** change when this merges —
say so explicitly in your report so nobody assumes the registry updates itself.

## Other boundaries

- README prose + `deno.json` (the `docs:tagline:check` task) only. **No `packages/**` or
  `plugins/**` source changes.**
- Do not touch `plugins/dashboard` or `tools/design-sync/`.
- Do not restructure the READMEs beyond the tagline/second-paragraph split. This is not a rewrite.

## Gates (run before you report)

```bash
deno task docs:tagline:check     # must be over=0
deno fmt --check <each README you touched>
deno task docs:links
```

## Report back

Commit (one commit is fine; group logically if you prefer), push the branch, and report: the
before/after byte count for every README you touched, any tagline where fitting the cap forced you to
drop a real claim (say which), and confirmation that you did **not** touch the JSR registry. Do not
open a PR, do not merge, do not self-certify.
