use harness

## SKILL

Analysis-only design slice: you change NO product code. All output goes under
`.llm/runs/dashboard-design--orchestrator/analysis/` in this worktree
(`/home/codex/repos/ns-ddr-glm`, branch `design/ddr-s4-glm-design`).

# Design/UX critique pass — NetScript Dev Dashboard prototype

You are a principal product designer and DX specialist reviewing a developer-dashboard
prototype for the NetScript framework (a Deno/Fresh full-stack framework whose dev
dashboard is a DX satellite orbiting the .NET Aspire dashboard and Scalar API docs).

## Inputs (read these files first)

- `.llm/runs/dashboard-design--orchestrator/screen-catalog.md` — ground-truth catalog of
  all 15 screens (routes, purpose, states).
- `.llm/runs/dashboard-design--orchestrator/improvement-brief.md` — the owner's six
  improvement axes (binding).
- `.llm/runs/dashboard-design--orchestrator/design-project/feedback/README.md` and
  `POC-ground-truth.md` — prior adversarial review verdict + the real data model.
- `.llm/runs/dashboard-design--orchestrator/prototype/assets/proto.css` and `ns-ext.css`
  — the actual component CSS (tokens, density, motion) if you want visual-language
  evidence.
- Screenshots exist as PNGs under `.llm/runs/dashboard-design--orchestrator/screenshots/`
  (you may not be able to view images; the catalog describes each precisely).

## Deliverable

Write `.llm/runs/dashboard-design--orchestrator/analysis/glm-design-pass.md` in markdown:

1. **Overall design verdict** — visual language, density, hierarchy, typography,
   color/tone usage, dark mode; what works, what is weak; scored /10 with justification.
2. **Per-screen critique** for every screen in the catalog (layout, information
   hierarchy, affordance clarity, state design), each with 3–5 concrete, actionable
   redesign proposals.
3. **Axis-by-axis proposals** for the six owner axes (especially routing hierarchy /
   information architecture, write-action flows, distributed AI surface,
   plugin/extension visibility) — be specific: name components, layouts, interaction
   patterns.
4. **Ten "wow" ideas** that would put this dashboard visibly ahead of best-in-class dev
   consoles (Temporal, Inngest, Encore, Appwrite, Supabase Studio), each with a
   one-paragraph design spec.

Ground every point in the catalog and CSS evidence; do not invent screens that are not
documented.

When the document is written: `git add` it, commit on branch `design/ddr-s4-glm-design`
with message "docs(run): GLM 5.2 design/UX critique pass", and push the branch to origin.
Touch nothing else. Your final chat message: 5-line summary of your strongest proposals.
