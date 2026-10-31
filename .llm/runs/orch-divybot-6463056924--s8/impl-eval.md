# Final independent IMPL-EVAL

**Verdict: FAIL_FIX** (one blocker, in the composed design-system section)

This is the final IMPL-EVAL for S8 at code head `c5bbb98`. One blocker: the composed design-system section is broken because its stylesheet now uses tokens that no longer exist. It's fixable inside S8's own files without touching the protected design-system sources.

### B1. The new token layer drops the tokens the design-system section's stylesheet uses
- **What breaks:** the design-system section ships its own stylesheet, `docs/site/_components/design/styles.css`, served as `/assets/design-system/section.css` (`docs/site/_plugins/design-system-render.ts:303`). It uses about 55 `var(--ns-…)` references to the old scale: `--ns-space-2/3/4/6/8/10/px`, `--ns-text-xs`, `--ns-text-lg`, `--ns-tracking-wide`, `--ns-leading-relaxed` and `--ns-measure` (`styles.css:1-50`).
- **Why:** those tokens exist only in `packages/fresh-ui/registry/theme/tokens.css`, which the old docs `tokens.css` copied. The new generated `docs/site/styles/tokens.css` defines none of them. So in the composed site every gap, margin and type size in that section falls back to its initial value.
- **Visible in the CI artifact:** in `design-system-light-1280.png`:
  - the section nav runs together as "OverviewGuidelinesToken contractCreate your own themeStudioTonal…" with no gaps;
  - the "DESIGN SYSTEM · FRESH UI" eyebrow shows at body size;
  - "NETSCRIPT DEFAULTStudio · Utility" runs together.

  The handoff's design-system landing frames (`179:698` / `182:2034`) are part of this revamp's scope.
- **Why no gate caught it:**
  - The style policy's source collection skips every folder named `design` (`tools/fresh-ui-browser/docs-tests/docs.spec.ts:328`).
  - It also never reads the generated `section.css`, so the undefined-role check never sees these references.
  - The design-system browser test only checks for a 200 response, a visible H1, no overflow, and axe at serious or critical.
- **Required fix (within S8's writable files):**
  - Give the shared token layer the compatibility roles that existing `--ns-*` consumers need, mapped to Utility values. Either generate them from the Figma density and space collections, or add a clearly documented alias file under `docs/site/styles/` that resolves to generated roles. Don't edit the protected stylesheet.
  - Widen the undefined-role check to every stylesheet the built site ships, including `/assets/design-system/section.css`. A role used by a sibling must not silently fail to resolve.
  - Add a browser assertion on `/design-system/` that the section nav links are visibly spaced apart, for example their bounding boxes don't touch.
  - Then re-run the full matrix at the new head and refresh the generated files if the twins change.
- **Related problem, same page:** the layout also adds its own theme-context row on `landing` pages (`docs/site/_includes/layouts/base.vto:91`), while the section's content already renders "NetScript default · Studio · Utility". The screen shows both. Drop the layout's row, or render it only when the content doesn't have one.

### Verified myself
- **B3:**
  - The source `<img>` keeps `hidden` and `loading="lazy"` (`docs/site/_components/diagram.vto:3`).
  - In the built home page HTML, the `<img src="/netscript/assets/diagrams/contract-flow.svg" alt="An optional DB-backed…" hidden loading="lazy">` is followed by an inline SVG with the unique id `diagram-<uuid>-my-svg`, `role="img"` and an `aria-label` equal to that alt text.
  - The built twin has `![An optional DB-backed…](https://rickylabs.github.io/netscript/assets/diagrams/contract-flow.svg)` (`docs/site/_site/index.md:181`), with no doubled base.
  - The source SVGs are unchanged: a test checks this, and `diagrams:check` passed 16/16.
  - The build fails if any image or name is missing (`docs/site/_config.ts:163-172`), and the browser test covers the twin, the names and a two-instance fixture with unique ids.
- **Final receipts at `c5bbb98`:**
  - browser 48 passed, 0 failed, 0 skipped, 0 flaky;
  - 24 axe audits with 0 serious or critical violations;
  - freshness checks for prose, MCP, publish assets and the assets barrel all passed;
  - both negative controls exited 1 on the intended findings (gradient `background-image`, red `border-color`).
- **Screenshots against the handoff:**
  - Home, light at 1280: the hero layout, no active lane, mono eyebrows, file-path chips, and an ink primary plus outline CTAs.
  - Article, dark at 390: the drawer button, the sticky "On this page" bar with a marker, the mono breadcrumb, the "You own" chips and a graphite background.
  - Reference, light at 1280: the active-lane sidebar, the sticky section nav with a marker, and the important callout with its ink left rule.
  - Search, dark at 390: lane filters with counts, grouped results, the selected row with its ink bar and ↵, section hits, and the key-hint footer.

  These match the Utility identity rules: red appears only on the logo.

### Remaining gates: how I classify them
- **Hosted full runtime at `69f`** failed 34 of 35 at `behavior.generated-guarded-service` (exit 143). This leaf's only package-side changes are two regenerated docs carrier files, and the static, sqlite and cleanup tiers passed. I classify it as an **external readiness limitation, not an S8 implementation blocker**. But it's a configured merge gate. It needs a green rerun at the final head, or the owner's written waiver; I'm not waiving it.
- **Native desktop exception-boundary job:** failed separately. It has the same classification and the same requirement.
- **Local full CLI E2E:** environment-unproven (Aspire doctor preflight, no Docker). It isn't counted as passing.
- **Merge order:** #2437 first, then this PR rebased with its generated files, lock file and twins regenerated and re-verified. No owner approval for the reverse order is on record.
