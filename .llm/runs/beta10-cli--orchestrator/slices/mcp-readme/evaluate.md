# IMPL-EVAL — mcp-readme (PR #807)

**Verdict: PASS**

- Run: `docs-mcp-readme-standard--production-readme`
- Subject: worktree `/home/codex/repos/b10-mcpreadme`, branch `docs/mcp-readme-standard` @ `11c48482`, base `main`
- Diff: `packages/mcp/README.md` only (`+38 / -13`); run artifacts local-only, uncommitted
- Evaluator: Claude · Opus 4.8 · high (`review_codex_light`), separate session from the Codex Sol·low generator
- Skills: netscript-harness, netscript-tools, jsr-audit, rtk

## Rationale

The change migrates `@netscript/mcp`'s README to the production README standard by replacing the
`🚀 Quick Start / Installation / Usage` block with three standard H2 sections (`## Install`,
`## Quick example`, `## Docs`), leaving badges, tagline, and the deeper reference sections intact. It
is the **first** package in the tree to satisfy the standard; every claim in the new sections was
verified against live code and the doc site, and every applicable gate passes with executed
evidence. The one deviation from strict protocol — implementation landed while the separate-session
PLAN-EVAL is "Pending" — is an owner-authorized, documented override (Finding 1), non-blocking for a
single-file docs slice. No implementation defect, scope leak, or inaccuracy survived verification.

## Probe results (all executed by the evaluator)

| # | Probe | Result | Evidence |
| - | ----- | ------ | -------- |
| 1 | `docs:readme:check` — mcp absent + delta-vs-main | **PASS** | HEAD failing list = 35, mcp absent (`grep -c` = 0). origin/main list = 36 (fresh worktree of `origin/main`). `comm` delta: main∖HEAD = **exactly** `packages/mcp/README.md`; HEAD∖main = ∅. Only mcp changed. |
| 2 | `docs:tagline:check` — over=0 + byte-identical tagline | **PASS** | Task exit 0, `checked=36 over=0`. Tagline paragraph (README lines 7–12) byte-identical to `origin/main` (`git show origin/main:…` vs HEAD). |
| 3 | Accuracy of every new command/claim | **PASS** | See "Accuracy" below. |
| 4 | Three `## Docs` / `## Documentation` link targets exist in `docs/site` | **PASS** | `docs/site/reference/mcp/index.md`, `docs/site/capabilities/agent-tooling.md`, `docs/site/reference/telemetry/convention.md` all present. |
| 5 | JSR-render sanity (no Lume `{{ }}`, no relative links) | **PASS** | No `{{ }}`/`{% %}` mustache/Lume tokens. All 12 link targets are `https://…` (jsr.io, github.com, img.shields.io, rickylabs.github.io); zero relative or anchor-only paths. Standard is defined by the gate (no passing sibling exists yet); mcp complies. |
| 6 | No internal wording on changed lines; fmt clean | **PASS** | Internal-term grep clean (only false positives: substring "sol" inside "re**sol**ve"). `deno fmt --check packages/mcp/README.md` → "Checked 1 file", exit 0. |

## Accuracy verification (probe 3)

- **`netscript agent init` per-host behavior** — matches `packages/cli/src/public/features/agent/init/init-agent.ts`.
  `claude` host → writes `.mcp.json` (`mcpServers` key) + skills under `.claude/skills/` + upserts
  `AGENTS.md`; `vscode` host → writes `.vscode/mcp.json` (`servers` key) only. README line 50
  ("writes `.mcp.json` (Claude Code) and/or `.vscode/mcp.json` … installs the version-matched skills")
  is accurate; the AGENTS.md upsert is unmentioned but that is a permissible omission, not a false claim.
- **`.mcp.json` "equivalent to" JSON** — the args array
  `["run","-A","jsr:@netscript/cli@<version>","agent","mcp","--project-root","<project-root>"]`
  reproduces `writeHostConfig`'s output exactly. `netscriptJsrSpecifier("cli")`
  (`jsr-specifiers.ts`) = `jsr:@netscript/cli@<version>` where the tag is the CLI manifest version;
  the README's `<version>` placeholder is an honest abstraction of the concrete pin.
- **`deno add jsr:@netscript/mcp` unversioned** — satisfies the standard's required `deno add jsr:@netscript/`
  substring and follows the codified sibling convention (unversioned add → import-map pin at add-time).
- **`deno x -A jsr:@netscript/mcp@<version>/cli`** — `deno x` is a real subcommand ("Execute a binary
  from npm or jsr, like npx", verified via `deno x --help`). `@netscript/mcp` publishes a `./cli`
  export (Public-surface table), so the subpath resolves.
- **Prerelease pinning sentence** — accurate and consistent with line 61. The framework pins *every*
  runtime specifier (`NETSCRIPT_RELEASE_TAG` is always applied); a bare runtime `jsr:@netscript/*`
  specifier resolves to latest-stable and fails on a prerelease-only line, which is exactly why the
  generated config and `deno x` form carry `@<version>`. The unversioned `deno add` (add-time
  registry resolution) and the pinned runtime forms are both correct under that distinction — no
  internal contradiction.
- **"13 bounded tools"** — consistent with the 13-row tool catalog and the `assertEquals(…length, 13)`
  testing example (unchanged sections, cross-checked).

## Findings

1. **[process, non-blocking] PLAN-EVAL recorded as "Pending" while implementation commits landed.**
   Protocol rule #2 requires `plan-eval.md = PASS` before a slice is committed; here `plan-eval.md`
   and `evaluate.md` both read "Pending separate-session evaluator verdict," yet commits
   `e924e628`/`11c48482` exist. Per rule #2 this is recorded as a process observation. It is **not
   blocking**: `drift.md` and `pr-body.md` document explicit owner authorization to proceed after the
   local formal evaluator route was unavailable, harness commit `80e5637b` opened the plan gate,
   `plan.md` is complete with an in-worklog Design checkpoint, and the slice is a single-file,
   low-risk docs change. This IMPL-EVAL supplies the missing separate-session verdict.

2. **[nit, non-blocking] `## Docs` section carries two links; a third docs link
   (`reference/telemetry/convention/`) lives in the later, unchanged `## Documentation` section.** The
   dispatch brief referenced "three linked docs paths under `## Docs`"; the standard requires only
   ≥1 link and all three targets resolve, so this is a brief/artifact wording mismatch, not a defect.

## Gate ledger

| Gate | Verdict | Evidence |
| ---- | ------- | -------- |
| `docs:readme:check` (mcp absent) | PASS | mcp not in HEAD failure set; delta-vs-main = mcp only |
| `docs:tagline:check` | PASS | exit 0, `over=0`, tagline byte-identical |
| Command / claim accuracy | PASS | verified against `init-agent.ts`, `jsr-specifiers.ts`, `deno x --help` |
| Docs link targets exist | PASS | 3/3 present in `docs/site` |
| JSR render (no Lume, absolute links) | PASS | 0 mustache tokens, 12/12 absolute links |
| Internal wording (changed lines) | PASS | clean (only "re**sol**ve" false positives) |
| `deno fmt --check` (README) | PASS | Checked 1 file, exit 0 |
| Scope (git diff) | PASS | `packages/mcp/README.md` only, `+38/-13` |
| Architecture debt delta | n/a | none created or resolved (docs-only) |
| Release E2E class | n/a | no scaffold/runtime/publish-shape change |

_Note: the whole-tree `run-deno-fmt.ts --root packages/mcp` errors with "multiple config files"
(the `packages/mcp/tests/fixtures/**` nested `deno.json`); that is a pre-existing tooling/workspace
collision with `findings:0`, unrelated to this change. The per-file `deno fmt --check` is the
trustworthy verdict and is clean._

## Disposition

PASS. The slice completes its approved docs scope, every applicable gate is green with executed
evidence, and all accuracy claims hold against source. Finding 1 (PLAN-EVAL-pending) is recorded per
protocol as an owner-authorized process deviation and does not block. Recommend the orchestrator
attach this IMPL-EVAL as the authorizing separate-session verdict; PR #807 may proceed to
`status:ready-merge` on owner action. Evaluate-only: the subject worktree was not modified.
