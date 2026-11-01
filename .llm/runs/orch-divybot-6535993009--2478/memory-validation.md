# Fixture validation recipe

Root CI bridge: docs/site/_plugins/markdown-render_test.ts spawns the real fixture with --no-lock and standalone docs/site/deno.json. Use structured run-deno-test.ts with --allow-all and the bridge path. Import Lume Element from the same lume/deps/dom.ts module as DOMParser for constructor identity. Root workflow code-quality-repo uses durable run-gate.ts --gate quality-scan-repo; docs-only paths do not trigger the PR Code quality workflow at this baseline.
