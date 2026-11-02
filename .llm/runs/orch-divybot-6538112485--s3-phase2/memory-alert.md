# Alert handoff and validation

Read ledger-feedback.json and the actual review-alert.png together. Six tones each have subtle and strong emphasis. Strong has a neutral surface, no box edge and a 2px leading rule; subtle has tone fill/border. Label/icon use tone text; descriptions use normal reading ink. Bind existing card padding/control gap/body type/Medium weight roles. Shared alert-styles.css can load after alert.css: scoped Alert overrides must outrank its selectors without changing InlineNotice or adding !important.

Untitled banners need a default tone label, not only an aria-hidden glyph. Defaults are Note/Info/Success/Warning/Error/Important; toneLabel localizes them. Custom title replaces it; false/null keeps a clipped accessible label. Bell/circle-check/circle-alert are the upstream Lucide geometry under the retained ISC/MIT notice. The Icon contract equality guard must cover the whole public vocabulary.

Visibility uses controlled open or internal defaultOpen; close uses a native button, requests false, and respects controlled refusal. Native hidden plus explicit display:none removes the mounted content from layout, keyboard and accessibility. No focus moves on mount/reopen. After hiding its focused button Chromium's next Tab continues after it; caller policy owns any explicit restoration target.

An SSR string search for hidden can mistake nested SVG aria-hidden for root visibility. Assert the root attribute specifically. Registry metadata is embedded, so regenerate assets before registry/installed-consumer tests; stale embedded JSON is not an import-graph verdict. The runtime dependency guard inspects native deno info direct edges and must agree with the declared package root; keep the frozen legacy fixture unchanged.

Browser lint uses the structured wrapper's --config docs.deno.json, whereas browser check accepts repeated --deno-arg --config --deno-arg docs.deno.json. Root lint excludes browser tooling, so an unconfigured browser lint is a coverage refusal, never PASS. docs:exports-drift is the task name; docs:accuracy also runs it. All raw receipts/transports stay private; public evidence is outcomes and counts with repo-relative paths.
