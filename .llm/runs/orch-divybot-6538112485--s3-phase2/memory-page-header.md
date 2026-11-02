# PageHeader and copied layout support

PageHeader's actual source is `registry/components/ui/page-header.tsx` and its
L2 contract is `src/contracts/catalog/layout-blocks/1.ts`. The copied component
now supports the declarative heading/slots plus the original section namespace.
The root title input owns the page h1; composed Intro is the alternative when a
host already owns that heading. Empty primitive/array slots omit wrappers, zero
is content. Variants do not create controls or capture focus.

`layout-objects` is a real registry dependency and installs
`registry/styles/layouts.css`. Its CSS supplies Breadcrumb and legacy
stack/cluster/shell layout. Dedicated gap browser fixtures must load it before
component styles; otherwise Breadcrumb appears as an unstyled numbered list,
and a screenshot is not representative of a consumer install. Any shared
fixture stylesheet change requires the full gap matrix to catch cross-fixture
interactions. Retain captures before that next run replaces test-results/gaps.

Source wrapper selection must include changed tests. Browser fixture lint uses
`--cwd tools/fresh-ui-browser --config docs.deno.json`, and explicit relative
roots; root config excludes those tools and the wrapper correctly refuses a
false green with dropped files. Fixture type checking uses the generated
`test-results/gap.bundle.deno.json` config. Native browser RTL/Tab behavior is
proved through actual child controls, not invented header keyboard handlers.

Preact's SSR text escape guarantees less-than escaping; it need not escape a
safe greater-than sign in a text node. Assert the absent executable opening tag
and actual escaped delimiter rather than a serializer-specific safe spelling.

Publication audit: use `deno task publish:dry-run --member packages/fresh-ui`;
the repo wrapper materializes catalog imports into a disposable workspace and
passes the native static dry run without changing maintained locks. This is
not real remote package/runtime proof. `audit-jsr-package.ts --no-dry-run`
requires `--allow-write` when `--out` is specified. Its known JSON-export
module-tag finding cannot be repaired by adding a JSDoc comment to JSON.
The structured full-export doc-lint gate reports124 current diagnostics:
123 TypeScript identities exactly match the saved measured baseline, plus the
existing JSON data-export JSDoc limitation. Identity comparison uses diagnostic
kind, message and repo-relative source path, without source-line offsets.
