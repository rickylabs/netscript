use harness

# IMPLEMENT — FAI-7 MCP pooling primitive + `ui://` resource extraction (issue #463)

You are a **Tier-D (WSL Codex) implementation** agent for one slice of the
`beta6-nondash--supervisor` harness run. Implement issue **#463** (AI-stack FAI-7, part of epic
#238). Generator role only — a separate OpenHands session runs IMPL-EVAL afterward; do not
self-certify.

Branch: `feat/463-ai-mcp-pool` (worktree `/home/codex/repos/netscript-463-mcp`, based on
`origin/main`). This is the **upstream** AI-stack primitive — #257 (#550) and #379 merge AFTER it.

## SKILL (activate these)
- `netscript-harness` — run-loop, slice trackability, Concept of Done, IMPL-EVAL handoff.
- `netscript-doctrine` — ARCHETYPE-1 for `@netscript/ai`; contracts-in-core law; the AI-plugin
  flagship-quality mandate (`@netscript/ai` must meet-or-exceed reference plugins); public-surface
  gates. The pool is CORE (`@netscript/ai`), never re-hand-rolled in `plugins/ai`.
- `netscript-deno-toolchain` — `deno doc --lint` (the `gate:jsr` bar), `deno publish --dry-run`
  WITHOUT `--allow-slow-types`, `deno doc` for surface inspection, `deps:*` wrappers. **`deno doc`
  is your friend** — inspect existing transport surfaces before wiring the pool.
- `netscript-tools` — the scoped `run-deno-check.ts` / `run-deno-lint.ts` / `run-deno-fmt.ts` /
  `run-deno-doc-lint.ts` wrappers are the ONLY gate-evidence source; lock-hygiene rules.
- `netscript-pr` — branch/PR/issue process, taxonomy labels + milestone, the close-gate (#387):
  a fully-resolving PR carries `Closes #463` in its BODY; the epic #238 gets NO closing keyword.
- `netscript-cli` — only if the pool touches CLI wiring (likely not).
- `codex-wsl-remote` — native-worktree rule (run full gates from this ext4 worktree, never
  `/mnt/c`), explicit-refspec push, one-active-send-per-worktree.
- `rtk` — prefix read-heavy git/gh/grep with `rtk` to cut tokens.

## Pre-flight (do FIRST, before any edit)
```
cd /home/codex/repos/netscript-463-mcp
git fetch origin
git status --short --branch          # confirm branch feat/463-ai-mcp-pool, clean
git rev-parse --short HEAD           # confirm base == origin/main tip
```
If the branch/base is wrong, STOP and report — do not implement on the wrong base.

## Context to read (do not re-derive)
- **Issue #463** (`gh issue view 463 -R rickylabs/netscript`) — the authoritative acceptance.
- Run plan/research from the RUN branch (not this branch):
  `git show origin/chore/beta6-nondash-supervisor-run:.llm/runs/beta6-nondash--supervisor/plan.md`
  (row **AI-463**) and the same path for `research.md` (F-ai section) and `drift.md`.
- Current no-pool baseline: `createMcpTransport` in the ai package (`factory.ts:16-21`) builds a
  single transport with no pooling. Existing `StdioMcpTransport` / `StreamableHttpMcpTransport`
  ALREADY carry reconnect backoff + lifecycle state — **pool OVER them, do not rewrite them.**
- Reference pattern: eis-chat multi-server keyed pool with keep-alive + `ui://` extraction
  (`analysis/F-ai/02 §2` if present in the eis-chat worktree / research notes).

## Task — implement #463 acceptance
Contract-first (define/confirm the type contract, then implementation, then tests):
1. **Multi-server pool keyed by server id** over the existing transports, built in `@netscript/ai`
   core. Keep-alive across turns (do not tear down/rebuild per turn). Tool-name prefixing so tools
   from different servers don't collide.
2. **`ui://` resource extraction** surfaced to the render-ui seam (the shape #257's `McpUiWidget`
   and #379's app-call handler consume — a plain resource/`src` surface, keep the seam data-only).
3. Pool lives in core; `plugins/ai` must be able to consume it WITHOUT re-implementing pooling.
4. New public surface at the `@netscript/ai/mcp` export.

## Gates (evidence via scoped wrappers, from THIS native worktree)
- `gate:jsr`: `@netscript/ai/mcp` full export map `deno doc --lint` clean (use
  `run-deno-doc-lint.ts --root packages/ai`), and `deno publish --dry-run` green for `@netscript/ai`
  WITHOUT `--allow-slow-types` (a slow-types carve-out is a finding).
- `deno task check --unstable-kv`, scoped lint + fmt (source `--ext ts,tsx` only), and the ai test
  suite green (add tests for pool keying, keep-alive reuse, tool-name prefixing, and `ui://`
  extraction).
- **No new type casts** beyond the repo's 2 accepted casts.
- **NEVER mutate `deno.lock`** — `git checkout -- deno.lock` before any commit. No lock churn.

## Commit / PR discipline (per-slice trackability)
- Commit by slice; each commit message names what the slice PROVES.
- Push with an **explicit refspec** (`git push origin HEAD:refs/heads/feat/463-ai-mcp-pool`) — the
  worktree inherits `origin/main` upstream, so a bare `git push` would land on main. NEVER bare-push.
- Open a **draft PR** early (`gh pr create --draft`), body carries `Closes #463`, milestone
  `0.0.1-beta.6`, taxonomy labels (`type:feature`, `area:ai`, `priority:p2`, `status:impl`, plus the
  relevant `wave:`/`epic:238` labels). Comment each slice's scope + commit hash + gate evidence on
  the draft PR.
- When implementation is complete and gates are green, report READY (do not merge; the supervisor
  runs IMPL-EVAL and gates merge order behind nothing — #463 is upstream).

## Report back
Reply with: branch, base sha, files touched, commit hashes, gate results (raw pass/fail + counts),
draft PR number, and any drift from the plan (record material drift in a `## Drift` section of your
final message so the supervisor can log it). If you hit a blocker, report it — do not force a green.
