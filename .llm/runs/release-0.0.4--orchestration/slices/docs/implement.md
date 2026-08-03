use harness

# Slice: documentation sequencing (#1068, #1069, #1070, #1020)

Worktree: `/home/codex/repos/ns004-docs` · branch `docs/1068-task-routing` · base `origin/main`
@ `f663fe0e4`.

**Lane: Gemini 3.6 Flash** (`google/gemini-3.6-flash`), by owner decision recorded 2026-08-03. The
binding lands in `config/models.ts` / `provider-profiles.ts` / `routing-policy.ts` /
`lane-policy.md` via the agentic-tooling slice on `/home/codex/repos/ns004-agentic`. Read those
files for the exact preset name before launching — do not invent a spelling and do not hardcode a
model id outside `config/`.

## SKILL

Load, in order:

- `.agents/skills/netscript-harness` — run loop, `SCOPE-docs` overlay, commit trail.
- `.llm/harness/workflow/doc-audit.md` — the docs gate set and the audit/polish lifecycle.
- `.agents/skills/netscript-deno-toolchain` — `deno doc` is the authority for generated surfaces;
  do not hand-write what generation should emit.
- `.agents/skills/netscript-pr` — branch/PR/label/milestone rules. `Closes #N` goes in the PR
  **body**; every `gh` call passes `--repo rickylabs/netscript`.
- `.agents/skills/rtk` — prefix read-heavy `git`/`gh`/`grep` with `rtk`.

## Why this slice exists

Two wave-four agents each read six manual pages, all backend, and **never reached the web layer**.
Not because those pages are bad — because nothing sequenced them. One of them then hand-wrote a
360-line island and 291 lines of bespoke CSS, reimplementing `Button`, `Input`, `Card`, `Badge` and
`FormField` that were already in its own app. `docs/deno-doc/fresh-ui.txt` was in its bundle, linked
three times from `llms.txt`, and already a declared dependency in its own `deno.json`. It never
opened it.

The information was all present and correctly linked. The **sequencing** was absent.

## Scope

Read every issue body in full.

- **#1068 (p1)** add a task router of ≤ 8 rows **above** the `llms.txt` catalog. Each row names a
  reading **order**, not a set of links, and every row ends the same way: manual for the model,
  scaffold for the shape, generated surface for symbols. Must be included in the offline bundle
  build (`.briefing/build-docs-bundle.sh`).
- **#1069 (p1)** the web-layer builders page must **lead** with the full-power `definePage()`
  example and an explicit capability list, keeping the minimal example after it. The issue carries
  the exact sample. This is "lead with full power" — **not** an instruction to make every page long.
- **#1070 (p2)** generated `deno-doc` surfaces do not cross-route. `fresh.txt` is 5,502 lines with
  builders at 644 and streams at 5,162 and no map — add a module overview at the top pointing at
  `fresh-ui` and the scaffold. `fresh-ui.txt` must render actual registry collections and item names
  from `freshUiRegistryManifest`, not only its type, and state plainly that visual components are
  **copied into your app**.
- **#1020 (p3)** stream path prefix and the non-durable in-memory default are unsurfaced.

## Rules

- **Do not rewrite the manual.** #1069 is explicit about this: replace the opening sample and label
  it. Precision beats volume.
- #1070 is **generation**, not hand-editing. If the generated surface is wrong, fix what generates
  it — a hand-patched `.txt` will be overwritten.
- Every code sample you place must type-check against the current API. Verify with `deno doc`; do
  not trust an example carried in from an issue body without checking it still compiles.
- Do **not** touch the generated app-scoped `AGENTS.md` / `WEB-LAYER.md` — a separate slice owns
  those on `/home/codex/repos/ns004-scaffold`. That slice owns **generated app** files; this one
  owns the **published documentation site** and the generated doc surfaces. Do not cross.
- This changeset is docs-only and not release-gated. Apply `ci:skip-e2e`, and `ci:skip-scaffold`
  where scaffold-static does not apply, and record the choice in the opening PR comment so the cheap
  lane is visibly intentional.

## Gates

Doc-lint · link resolution (every path the router names must resolve) · the docs bundle build ·
`deno doc` regeneration for #1070. Verify the artefact, never the exit code.

## Deliverable

One draft PR closing #1068, #1069, #1070, #1020, driven to ready-for-merge. Commit per slice; push
and comment commit hash + evidence on the draft PR before the next slice.
