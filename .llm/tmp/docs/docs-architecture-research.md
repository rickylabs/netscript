# Docs-architecture research extract (for `docs/user-site` + `docs/internal-overhaul`)

Captured 2026-06-18 for the `release/jsr-readiness` umbrella. Cite from each docs
sub-run's `research.md`. Sources are primary/official; re-fetch for freshness before
implementation.

## Diátaxis (https://diataxis.fr/)

Four documentation types on two axes:

| Type | Orientation | Axis (action↔cognition / practical↔theoretical) |
|------|-------------|--------------------------------------------------|
| **Tutorial** | learning-oriented; lead a newcomer through doing | action + practical |
| **How-to guide** | task-oriented; solve a specific problem | action + theoretical-application |
| **Reference** | information-oriented; describe the machinery | cognition + theoretical |
| **Explanation** | understanding-oriented; concepts, context, "why" | cognition + practical-context |

Guidance: keep the four **separate** (do not blend a tutorial with reference dumps),
give each its own place in the site architecture, and link across them. Lightweight,
implementation-agnostic — it prescribes *content shape*, not a tool.

**NetScript mapping:** per-package **reference** generated from `deno doc`; **tutorials**
+ **explanation** = conceptual onboarding ("what NetScript is", plugin model, runtime
model); **how-to** = task recipes (scaffold a project, add a plugin, wire a DB, deploy).

## Lume → GitHub Pages (https://lume.land/docs/advanced/deployment/)

Documented recipe:
- Repo **Settings → Pages → Source = GitHub Actions**.
- Workflow: `denoland/setup-deno@v2` (`cache: true`) → `deno task build` →
  `actions/upload-pages-artifact@v3` (path `_site`) → `actions/deploy-pages@v4`.
- Permissions: `contents: read`, `pages: write`, `id-token: write`. Trigger: push to
  `main`.
- **Gap / risk:** Lume's page does not cover a **project subpath** base URL. NetScript
  Pages would serve at `rickylabs.github.io/netscript` (a subpath), which requires Lume
  `location: new URL("https://rickylabs.github.io/netscript/")` in `_config.ts` so asset
  + link paths resolve. Confirm against current Lume docs at implementation. (Workflow
  files require a local-worktree push — PAT lacks `workflow` scope.)

## Reference framework doc architectures (knowledge synthesis; re-verify at impl)

- **Laravel** (laravel.com/docs): single **versioned prose guide**, ordered
  Prologue → Getting Started → Architecture Concepts → The Basics → Digging Deeper, plus
  a generated API reference. Heavy explanation+how-to; reference is secondary/generated.
  Versioned by major release. *Takeaway:* a strong linear conceptual onboarding spine.
- **TanStack** (tanstack.com): **per-library** docs (Query/Router/Table/…), each with
  framework adapters and Overview → Quick Start → Guides → **API Reference** → Examples.
  Typed API reference + runnable examples are first-class. *Takeaway:* per-package
  reference + examples maps cleanly onto NetScript's 27-unit surface and `deno doc`.
- **MedusaJS** (docs.medusajs.com): explicit Diátaxis-ish split — **Get Started**
  (tutorials), **Recipes** (how-to cookbook), **References** (generated API/SDK),
  **Architecture** (explanation). *Takeaway:* clean separation of the four types with
  recipes as a distinct surface; good model for a modular plugin ecosystem.

**Synthesis for NetScript user-site:** Diátaxis four-type separation; per-package
**reference** generated from `deno doc` (it now renders npm packages, JSX/TSX, and
npm-without-types) + a standardized README per unit; a conceptual **onboarding** spine
(tutorial+explanation, Laravel-style linear) and a **recipes** surface (how-to,
Medusa-style); Lume static build → GitHub Pages with subpath `location` config.
