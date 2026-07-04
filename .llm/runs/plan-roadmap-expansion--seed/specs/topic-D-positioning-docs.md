# Topic D — Per-feature storytelling / positioning docs

**Kind:** docs · **Milestone:** beta.7 (docs cut) · **Epic:** rescope `#232` · **Status:** rework existing docs

## §1 Owner's original brief (verbatim intent — PRESERVE, DO NOT DILUTE)

- **Rework the docs** so that **one Fable supervisor drives per feature**.
- **Storytelling** — each feature told as a story, not a reference dump.
- An **elevator pitch** per feature.
- **Prioritize, showcase, and compare with other frameworks** — position each feature against the
  competition.

## §2 Ratified decisions for this topic

- Bundled with Topic C into the **beta.7 docs release cut** (D3).
- Authoring lane: **Opus docs workflow, one supervisor per feature** (matches the owner's "one Fable
  supervisor per feature" intent — realized as Opus authoring workflows under Fable's coordination),
  **OpenHands-validated per feature**. Never Fable in the fan-out.

## §3 eis-chat reference (see `specs/02`)

- eis-chat demonstrates real feature usage end-to-end — the **showcase material** for the "storytelling
  + real usage" snippets (workers/streams/services/telemetry/MCP/desktop all exercised).
- `docs/site/_plan/research/competitors/{encore,medusa,trpc,temporal}.md` — the comparison baseline.

## §4 Delegated to Fable

- The per-feature story spine + which competitor comparison is sharpest per feature. Propose the
  feature list + ordering (prioritization), record rationale.

## §5 Dependencies / constraints

- **Locked positioning (`specs/01`) is the hard constraint here** — this topic IS positioning:
  AI-agent build-efficiency, **not** throughput; no unshipped-capability claims; comparisons must be
  factual and current. **Ban honesty/candor framing.**
- Docs-only cut; Lume/Vento landmines apply.

## §6 What B (Sonnet 5 workflow) must research for this topic

- Current docs positioning surface + gaps (where features are reference-dumped, not storytold).
  `analysis/D-positioning/`.
- Competitor positioning/comparison teardown (Encore, Medusa, tRPC, Temporal + others). `matrix/` + `research/D-positioning/`.
- Per-feature "why it matters / elevator pitch" raw material from real eis-chat usage. `context/D-positioning/`.

## §7 What Fable must produce for this topic

- Under `#232`: per-feature positioning/storytelling sub-issues, each with elevator pitch, story
  spine, comparison angle, acceptance criteria, beta.7 milestone.
- One Opus-workflow authoring brief per feature + OpenHands validation brief.
