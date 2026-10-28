# Research

Baseline main `2560bf564`. #2427 merged the eleven theme pairs, templates and GUIDELINES.md. No existing #2436 implementation PR. S8 #2430 is a separate shared-chrome worker; no corresponding merged implementation found at intake.

The source uses YAML front matter: version/name/description/colors/typography/rounded/spacing/components followed by the complete Markdown specification. Studio flavors are H3s within its Flavors section, not independent YAML files. There is currently only the package API reference at reference/fresh-ui/index.md; no separate legacy design pages remain on this baseline. Preserve its export inventory and add a design-section link.

Lume 2.5.4 auto-loads `.page.ts` generator modules. A generator under design-system can emit all pages using layouts/base.vto, avoiding edits to _config.ts, _data.ts or shared UI. Reuse the configured Markdown renderer (including anchors) for prose. Section-local styling belongs in _components/design and consumes existing --ns-* roles; swatches represent source values as data rather than a new UI palette.

Theme gallery branch `424ce242dff4e155d16f046056146449e25a54b4` contains exactly 34 WebPs. Landing references already exist on main and were inspected. Composition: source-derived introduction, rules, restrained catalog, a prominent Studio Utility image, scheme previews and seven flavors. Use native details/summary for the alternate scheme without shipping JavaScript.

Required Pages workflow: root docs:exports-drift and docs:snippets, then docs/site build, check:links and check:caveats. Scoped wrappers cover new TS. AGENTS also requests full e2e:cli before readiness; run it once in final validation and report actual execution. No package/plugin framework code changes, so package archetype and publish gates are not applicable. Separate Claude PLAN-EVAL and IMPL-EVAL are mandatory by brief.
