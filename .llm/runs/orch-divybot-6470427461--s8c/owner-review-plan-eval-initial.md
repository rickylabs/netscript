**Verdict: FAIL_PLAN**

There is one blocking gap. The rest of the delta plan passes (checklist below).

### Blocker 1: the kind-tag anatomy is only partly decided and proved, so a tag that doesn't match the spec could pass every planned check

- **Where:** `.llm/runs/orch-divybot-6470427461--s8c/owner-review-plan.md`. See the Constants line in the Design checkpoint and Decision 2.
- **Problem:**
  - The merged spec gives kind tags the Utility badge anatomy: "1px outline, 6px square dot, radius 2, Fragment Mono 11" in the kind's syntax colour (`docs/design-system/themes/studio/DESIGN.md:331-334`).
  - That anatomy has **no fill** (`DESIGN.md:306-307`).
  - The plan locks and proves only the dot size, radius and font. It says nothing about removing the fill, or about the outline's width and colour.
  - The current tags paint a `--ns-code-bg` background (`docs/site/styles/components.css:541-552`). Leaving that in place would still pass every listed assertion while breaking the exact anatomy the owner asked for. That would mean another owner-review round.
- **Correction:**
  - In Constants, state that kind tags have no fill (transparent background) and a 1px solid outline in the tag's role colour. Also state that the dot is a 6px square filled with that same role colour.
  - In Decision 2, extend the browser checks to cover every anatomy property:
    - computed `background-color` is transparent;
    - border width is 1px and border colour equals the generated role;
    - the dot is 6×6 with the role colour and no rounding;
    - radius matches the generated 2px badge role;
    - the font is Fragment Mono at 11px.
  - Measure contrast against the actual table background. The existing syntax-contrast test already covers `surface/bg`, and the foreground role is trivially fine.

### Checked and passing

- **Kind palette:** it matches the merged spec exactly:
  - interface and type alias → keyword;
  - class → type;
  - function, method and component → function;
  - variable, constant and enum → number;
  - module and namespace → foreground.
  The test checks against the spec independently of `API_KINDS`.
- **Kept, added and deferred work:** the plan keeps the canonical kind map, adds no new colour values, and leaves #2450, #2453 and the desktop-native disclosure as they were.
- **Symbols:** they stay on one line inside a local overflow container. Range-geometry checks at 390 and 1280 px are planned.
- **Heading code:** it has no chip but keeps the heading's size and weight in the mono font, and a computed-style comparison is planned.
- **Public Docs kit galleries:** the galleries move to public pages under `docs/site/design-system/docs-kit/`, linked from the sidebar and landing page. This deliberately replaces the earlier internal exclusion. The tests are redirected to prove breadcrumbs, nav links, the search lane and Markdown twins instead.
  - The `internal: true` fixtures and `/internal/…` URLs are currently in `docs/site/fixtures/callouts.md` and `docs/site/fixtures/code.md`, and the plan removes them.
  - The new public pages will now enter the CLI prose carrier, which the slice 2 regeneration handles.
- **Language and Copy alignment:** one flexible spacer plus a fixed gap, with bounding-box checks in filename headers and in mixed-language tab headers after switching tabs.
- **Carrier regeneration:**
  - All four tasks exist in `deno.json:120-128`.
  - The order (prose, then MCP export corpus, then assets barrel, then publish assets) is sound. The barrel re-exports the prose carrier but not the publish-assets outputs, and assets-barrel freshness is also checked after the commit.
  - Restoring `docs/site/deno.lock` to exactly match main is a restoration, not a deletion.
- **Gates:** none are weakened. The test-3 CI failure is deliberately left to be read from live logs before any repair, so it doesn't block starting.

After this correction to `owner-review-plan.md`, re-run PLAN-EVAL before implementation starts.
