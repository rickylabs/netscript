use harness

# Stage 3 — Public docs & API story (Kimi K3, docs-first concretion)

You are the **stage-3 docs agent** for seed run `.llm/runs/plan-frontend-contrib--seed/` on
branch `plan/frontend-contrib`. The frontend contribution layer has been designed (rev 2,
post-adversarial). Your job — the owner's rationale, verbatim intent: *forecasting the docs
makes the public API concrete and forces DX-first implementation.* You write the public-facing
documentation as if the feature had shipped. Where writing the docs exposes an API wart, you
record it — you do not change the contracts.

## SKILL

Read in order: `.agents/skills/netscript-harness/SKILL.md` (context only — you produce docs
drafts, no evals), then the run docs: `design/canonical/00-overview.md` → `06-doctrine-fit.md`,
`design/examples/*.md`, `plan.md`. Treat `design/canonical/01-contracts.md` (rev 2) as the
normative API. For voice/format, look at 2-3 existing public docs pages under `docs/site/` and
the README of `packages/fresh-ui/` or `packages/plugin/`.

## Deliverables (create exactly these files)

1. `design/docs-story/guide-plugin-frontend.md` — the future docs-site guide **"Ship frontend
   from your plugin"**, written as-if-shipped: 5-minute quickstart (the crons example),
   authoring model (routes/islands/zones/nav/theme), the dev loop (`plugin new --with frontend`,
   `plugin dev`, local-source vs published modes — honest about both), data access via the
   gateway + typed clients, starters vs live (`plugin resource add`), theming with `--ns-*`
   tokens, troubleshooting (quarantine states, doctor).
2. `design/docs-story/reference-plugin-frontend-core.md` — API reference for
   `@netscript/plugin-frontend-core` (`defineFrontend`, envelope, the five `app`-family kinds,
   identity, `HostSurfaceDescriptor`, contexts, `requires`, `./testing` kit) in deno-doc-style
   sections with signatures + one example each.
3. `design/docs-story/reference-fresh-plugins.md` — API reference for `@netscript/fresh/plugins`
   (`defineFreshApp` `frontend` option, `mountPluginFrontends`, `definePluginPage`, `pluginApi`,
   `PluginZone`, `pluginNavSections`, `normalizeFreshRouteModule`, the generated gateway).
4. `design/docs-story/readme-fragments.md` — the README section each affected package gains
   (plugin-frontend-core, fresh, plugin, cli), each a self-contained fragment.
5. `design/docs-story/docs-story-notes.md` — **the point of this stage**: every place where
   writing the doc was awkward — a name that reads badly, a concept needing two paragraphs where
   one should do, a step authors will forget, an asymmetry between kinds — as numbered notes
   (K-1, K-2, …) with a concrete suggestion each. Honest and specific; the generator integrates
   these next.

## Hard rules

- **No invented APIs.** Every symbol/field you document must exist in the rev-2 contracts docs.
  Mechanisms the design marks [P1]–[P5] (proof-gated) are documented without the proof caveat in
  the as-if-shipped guide BUT listed in docs-story-notes.md as pending proofs. If a doc needs an
  API the design lacks, that is a K-note, not a new API.
- **Public-clean prose** in files 1–4: no internal run/process/PR references, no harness
  vocabulary, no model/agent names. File 5 is internal and may reference anything.
- Files land ONLY under `.llm/runs/plan-frontend-contrib--seed/design/docs-story/`. No other
  file edits; nothing under `packages/`, `plugins/`, `docs/`, `.github/`.
- Match the repo's Markdown style (100-col wrap, fenced ts/tsx blocks).
- Commit exactly once: `plan(frontend-contrib): Kimi K3 docs story (stage 3)` and push with
  `git push origin HEAD:refs/heads/plan/frontend-contrib` (never bare push). If push fails,
  leave the commit local and say so.
- End your final message with `DONE` (or `BLOCKED: <reason>`).
