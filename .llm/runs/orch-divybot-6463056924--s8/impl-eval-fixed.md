# Final independent IMPL-EVAL repair

**Verdict: PASS** for the S8 implementation (on the uncommitted repair tree). **Merge readiness: NOT READY.**

The earlier FAIL_FIX stays on record. This PASS covers the implementation scope of #2430 as it stands in the uncommitted repair tree built on `c5bbb98`. It isn't proof for any committed head and isn't a readiness claim.

### B1 resolved
- **Old spacing and type names resolve again:**
  - `generate-tokens.ts` adds 18 compatibility names (`tools/docs-site/generate-tokens.ts:43-64`). Each one points at an existing Utility role or a `calc()` over one, so there's no second set of raw values.
  - Generation fails if a name already exists or a target role is missing (`generate-tokens.ts:138-143`).
  - The resulting sizes match the old fresh-ui scale: `space-1/2/3/4/6/8/10` come out at 4/8/12/16/24/32/40 px, and `space-px` at 1 px.
- **The checks now cover it:** the policy reads every shipped stylesheet, including `/assets/design-system/section.css`, with no folder skipped. That file gets all three checks (raw colour, misplaced red, undefined role) in all four projects with no findings (`impl-repair-evidence.json:473-474`). Only Pagefind's generated CSS gets the undefined-role check alone, and a fixture proves that check still fails on a missing role.
- **Screenshots look right now:**
  - `design-system-light-1280.png` and `design-system-dark-390.png` show the section nav spaced and wrapping, with ruled top and bottom borders.
  - The mono eyebrows are at label size and the H1 is at title size.
  - There's one "NetScript default" row, the section's own.
  - The breadcrumb reads "Home / Design system" with no repeated lane.
  - The browser suite asserts link gaps of at least 4 px at every scheme and width, and checks that nav groups without a page produce no empty links.
- **Negative controls on the repair tree:** both exit 1 on the intended findings, the raw gradient and the red `border-color` (`repair-negative-controls.json`).

### Acceptance re-checked across S8
| Area | Result |
| --- | --- |
| Tokens and fonts | Generated from the copied Figma export, Light and Dark, self-hosted fonts with OFL files, freshness checked |
| Shell | Six lanes, sidebar shows only the active lane, layouts for home, article, reference and landing, drawer and TOC on mobile |
| Component APIs | Every existing argument still works, including `fileTree({ tree })` |
| Signature kit | Eyebrow, kbd, file-path chip, attribute chip, location marker |
| Search | Real Pagefind index, loaded lazily; stale responses ignored; empty, loading and error states honest; separate fallback |
| Colour identity | Monochrome; red only on the logo and error states, enforced by the policy |
| B3 diagrams | Hidden lazy source image, inline SVG with an accessible name and unique ids, canonical twin URL and alt text, source SVGs unchanged |
| Browser run | 48 passed, 0 skipped, 0 flaky; 24 axe audits with 0 serious or critical violations |
| Protected sources | No edits |

### Merge-readiness gates: none waived
1. **Committed proof.** All repair evidence comes from the uncommitted tree. Its audit records carry `commit: c5bbb98` only because that's the parent, so they don't prove any commit. Before readiness can be claimed, after commit and push you need:
   - the freshness checks (`check:agent-docs-prose`, `check:publish-assets`, `check:mcp-export-corpus`, `check:assets-barrel`) at the exact head;
   - the browser matrix and both negative controls at the exact head;
   - a successful Pages workflow, including `utility-browser`, at the exact head.
2. **Full CLI runtime E2E: not green.**
   - The run at `69f` failed 34 of 35 at `generated-guarded-service` with exit 143.
   - The run at `c5` failed 14 of 15 at `outbound-webhook` with exit 143, and its log shows dependency downloads.
   - The local run is environment-unproven.

   This leaf changes no runtime or package code except regenerated docs carrier files, and the static and sqlite tiers passed. So I classify these as **external readiness limitations, not S8 implementation blockers**. But it's still a configured merge gate. It needs one unchanged full run green at the final head, or the owner's written waiver.
3. **Native desktop exception boundary: failed.** The workflow describes it as additive and not required on ordinary PRs. Record it as failed, and don't describe the workflow as green.
4. **Landing order:** #2437 first, then this PR (#2439) rebased, with the generated files, lock file and twins regenerated and re-verified. No owner approval for the reverse order is on record, and nothing was merged on GitHub in this run.
