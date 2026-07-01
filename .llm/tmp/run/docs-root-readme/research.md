# Research — PR3 root README (docs/root-readme, PR #118)

## Phase

Research phase of a harnessed docs-authoring run (SCOPE-docs). Generator = Claude (documentation
exception). Deliverable = root `/README.md` landing page for the NetScript meta-framework.

## Re-baseline (against current main)

- Branch `docs/root-readme` cut off `main` @ `f68fa916`, i.e. AFTER PR1 #116 (publish mechanics)
  and PR2 #117 (31 package READMEs + `/docs` removal). HEAD now `96063906` (deep-search trace
  fast-forwarded in).
- No carried-in stale plan. The only prior input is the dual-track dossier from the PR2 run
  (`.llm/tmp/run/docs-readme-revamp/sota-readme-dossier.md`), whose Track 2 seeded this run's
  fresh, NetScript-specific deep search.

## Primary research deliverable

`.llm/tmp/run/docs-root-readme/sota-landing-dossier.md` (347 lines), produced by OpenHands
`openrouter/google/gemini-3.5-flash` and landed on this branch with zero source/lock churn
(verified: only the dossier + OpenHands run trace under `.llm/tmp/run/openhands/pr-118/`).

It delivers, all NetScript-specific:

1. **Competitor head-to-head** — 10 closest-positioned exemplars (Encore, Wasp, RedwoodJS,
   AdonisJS, Medusa, Nitro/UnJS, Hono, Fresh, Nx, Effect), each with URL + the specific
   landing/plugin-composition device quoted.
2. **Canonical framework-landing skeleton** — chapter order for `/README.md`.
3. **Hero options** — A (JSR-safe flat ASCII/monospace banner) and B (centered HTML + logo image).
4. **Architecture-diagram options** — A (ASCII canvas, identical on GitHub + JSR) and B (mermaid,
   GitHub-only, must nest under `<details>` with an ASCII precedent).
5. **Grouped 31-package map** — 6 layers (Foundation Core / Data & Storage / `*-core` Contracts /
   Runtime Plugins / Auth Backends / App Surface), column set Package · JSR badge · Capability ·
   Reference docs.
6. **Visual-design + JSR-compat toolkit** — both-platforms vs GitHub-only device matrix.
7. **Quality blueprint** — anti-patterns + landing-page audit checklist.

## Ground-truth findings (decision-relevant)

- **No brand/logo/banner asset exists in the repo** (glob over png/svg/jpg/webp for
  logo|masthead|banner|brand returned nothing). Hero Option B references a non-existent
  `docs/assets/netscript-masthead.png`. → The shippable hero is Option A (ASCII, no asset). A
  commissioned banner is a future enhancement, not a PR3 blocker.
- **Shipped PR2 package-README convention** (ground-truthed from `packages/contracts/README.md`):
  - Badge row, exactly 3: JSR `jsr.io/badges/@netscript/<pkg>`, CI
    `github.com/rickylabs/netscript/actions/workflows/ci.yml/badge.svg`, Docs
    `img.shields.io/badge/docs-rickylabs.github.io-blue`.
  - Bold one-paragraph value-prop blurb, then `---`.
  - Emoji section headers: `## 🚀 Quick Start`, `## 📦 Key Capabilities`, `## 📖 Documentation`,
    `## 📝 License`.
  - Deno-first install (`deno add jsr:@netscript/<pkg>`) with Node/Bun fallback
    (`npx jsr add` / `bunx jsr add`).
  - Absolute docs links only: `https://rickylabs.github.io/netscript/...`.
  - License line: `MIT — ... Published to JSR with cryptographically verified provenance.`
- **Dossier deltas to correct on authoring** (do NOT copy verbatim):
  - Docs badge: dossier shows `docs-v1.0-blue` / `docs-complete-blue` (inaccurate for alpha) —
    use the shipped `docs-rickylabs.github.io-blue`.
  - Package blurbs in the dossier table are paraphrased — author from the authoritative map in
    `deep-search-brief.md` (the canonical one-liners), not the dossier's looser wording.
  - Architecture-diagram Option A plugin captions ("Fedify Qs", "Sagas/State") are illustrative —
    label plugins by their real names (auth, workers, sagas, triggers, streams).

## Voice / rendering doctrine (carried)

- BANNED: "honest/honesty/honestly" + candor-announcing / apologetic-alpha framing. Signal alpha
  maturity as a factual noun-phrase callout with a roadmap link.
- Root README renders on BOTH GitHub and the JSR scope page → prefer both-platforms devices;
  any GitHub-only device (mermaid, centered HTML) needs a clean degraded fallback.
- Absolute URLs only (JSR flattens packages; relative links break).
