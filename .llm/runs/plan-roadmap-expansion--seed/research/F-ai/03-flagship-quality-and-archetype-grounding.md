# F-ai: flagship-quality mandate and archetype grounding

## 1. The mandate does not exist as repo doctrine text — it exists as a GitHub ruling

A direct search of this cell's own reads plus a broad sweep of
`docs/architecture/doctrine/`, `.agents/skills/netscript-doctrine/`, `.llm/harness/debt/arch-debt.md`,
and every AI-package doc/README/code-comment found **no** doctrine file, debt entry, or code
comment asserting "`@netscript/plugin-ai` MUST be state-of-the-art / meet-or-exceed reference
plugins." That absence is itself a finding, not a dead end: the mandate is real, but it currently
lives **only as a GitHub issue/comment**, not as codified doctrine.

## 2. The grounding: Epic #238 comment 10 → Issue #388

Per `research/F-ai/04-github-ai-program-state.md` §1 (comment 10) and §2:

- **Epic #238, comment 10** (dated 2026-07-04): *"Correction: the AI plugin is a flagship, not a
  thin-by-design afterthought."* The owner directive explicitly corrects language in the epic
  itself and in `plugins/ai/README.md` that had treated `plugins/ai`'s missing e2e/hardening as
  acceptable *because* it is "deliberately thin."
- That comment's full body became its own tracked issue: **#388 — "[AI-stack] plugins/ai:
  state-of-the-art flagship parity"** (`type:feat`, `gate:e2e`, `epic:ai-stack`,
  `area:plugin-ai`, `status:plan`, `priority:p1`, milestone `0.0.1-beta.3`).
- **Consequence recorded on the issue:** baseline parity/hardening is now flagship beta.3 work, not
  deferred; two previously-deferred sub-issues (#262 centralized gateway, #290 `--mcp`/skill
  scaffolder) were moved `stable`/`wave:defer` → up to beta.4 as a direct result of this ruling.
- **Root-cause naming:** the comment also names the process gap that allowed the gap to persist —
  #260 (part of the P-cluster, manifest/scaffold/registry-codegen) was closed with its `gate:e2e`
  box unchecked and the gate never actually wired. That gap is tracked as its own companion process
  issue, **#387** ("process: gate issue closure on verified acceptance"), filed alongside #388 but
  deliberately *not* labeled `epic:ai-stack` (it is a repo-process fix, not an AI-stack feature).

This is the precise citation the task brief asked for: **the flagship-quality law's textual source
is GitHub Epic #238 (comment 10) / Issue #388, dated 2026-07-04** — not a doctrine markdown file.
Any Stage-C/D plan.md for F-ai should either (a) cite #388 directly as the grounding, or (b)
recommend promoting this ruling into `docs/architecture/doctrine/` as a standing law, since right
now it exists in exactly one place (a GitHub issue) with no doctrine-side backstop.

## 3. Concrete evidence the correction is warranted (thin ≠ lower bar, proven in source)

Independent of the GitHub text, this cell's own source reads confirm the gap #388 describes is
real, not rhetorical:

- `plugins/ai/README.md:3` still reads: *"A **thin** NetScript plugin that scaffolds an app-owned,
  **in-process** AI chat, tool, and agent..."* — the exact framing #388 says needs correcting has
  not yet been edited.
- The stream-proxy scaffolder bypasses the `plugin-ai-core` contract entirely (see
  `research/F-ai/01-plugin-ai-current-surface-inventory.md` §4.2 and
  `research/F-ai/02-ai-stack-architecture-and-migration-delta.md` §4 item 1) — a concrete
  soundness gap that "thin" framing was masking as acceptable.
- Per #388's own scope text (`research/F-ai/04-github-ai-program-state.md` §2), `plugins/ai` today
  has: no `scaffold.runtime` e2e case, no `verify-plugin.ts`, no scaffolder golden tests across its
  7 emitters, and no `plugin doctor` test — a materially lower coverage bar than the reference
  plugins (workers/sagas/triggers/streams), which is exactly the "thin ≠ lower quality bar" pattern
  this cell was asked to ground.

## 4. Archetype grounding — where "thin" is legitimate vs. where it was over-applied

The correction in #388 is precise, not a blanket rejection of thinness as a pattern:

- **`packages/plugin-ai-core` legitimately stays thin** — it is explicitly and correctly
  `Archetype 1 (Small Contract)` (`packages/plugin-ai-core/docs/architecture.md:3`), and its
  contract surface (file 01 §3) is fully typed, drift-guarded (`z.ZodType<T>` pattern throughout
  `ai.contract.ts` and `ai.contract-schemas.ts`), and has zero unsanctioned erasure casts. Nothing
  in #388 asks `plugin-ai-core` to become fatter — its thinness is doctrinally sound.
- **`plugins/ai`'s thinness-as-*implementation-shape*** (scaffolder + connector, not a runtime
  service) is also not what #388 objects to — the reference plugins (workers/sagas/triggers/streams)
  are similarly thin-shaped connectors. What #388 objects to is thinness being used as a *quality-bar
  excuse*: missing e2e coverage, an unexercised contract, and unchecked `gate:e2e` boxes, none of
  which follow from the architectural choice to be a thin scaffolder.
- This distinction — **thin as an architectural layering choice is fine; thin as a rationale for
  skipping the quality bar is not** — is the same "plugin-thinness / core-centralization law"
  pattern recorded elsewhere in this program's memory (convention-bearing primitives live in core,
  plugins stay thin, but auth-core+adapters is the reference quality bar all plugins are held to
  regardless of thinness). #388 is that law's concrete application to the AI-stack plugin.

## 5. What Stage-C/D should do with this

- Treat #388 as **load-bearing** for the F-ai roadmap topic, not a candidate for supersession (also
  flagged in `research/F-ai/04-github-ai-program-state.md` §5's supersede/keep pass).
  #388 already carries `priority:p1` and correct taxonomy (`status:plan`, real milestone).
- Flag, for a later doctrine-authoring pass (out of this cell's scope): whether "thin is a
  layering choice, not a quality-bar exemption" should be promoted from a GitHub-issue-only ruling
  into `docs/architecture/doctrine/` so it survives independent of any single tracked issue closing.
  Epic #238's own resolved-questions list already includes "promoting plugin-thinness/base-contract
  law to doctrine ch.11" as an item it resolved — **confirmed by direct read**:
  `docs/architecture/doctrine/11-plugin-thinness-and-base-seams.md` exists and is fully drafted
  (Law 1 — Plugin Thinness/Core-Centralization; Law 2 — Base-Contract/Base-Service Seam, with `auth`
  as the reference realization for both). However, chapter 11 governs **where convention lives**
  (contracts/ports/schemas must live in a `-core` package, not the thin plugin) — it says nothing
  about **test/e2e coverage bar**. #388's "thin ≠ lower quality bar" ruling is a distinct axis
  (coverage/hardening parity, not convention-location) and is **not yet reflected in chapter 11 or
  anywhere else in doctrine**. This is the concrete gap Stage-C should close: either add a short
  coverage-parity clause to chapter 11, or open a new doctrine note cross-referencing #388, so the
  "thin is layering, not a quality exemption" rule survives independent of issue #388 itself ever
  closing.

## Verification gaps

- This file cannot independently verify the GitHub issue/comment text itself (no `gh` access in
  this session's environment — see the Bash/PowerShell tooling note in this run's context); it
  relies entirely on `research/F-ai/04-github-ai-program-state.md`, written by a sibling cell that
  did have working `gh` access via WSL. Treat the exact comment wording above as a close paraphrase
  sourced from that cell, not a verbatim re-fetch by this file's author.
- ~~Whether "doctrine ch.11"... has actually been drafted~~ — resolved above (§5): it exists and
  covers Law 1/Law 2, but not the coverage-parity axis #388 raises.
