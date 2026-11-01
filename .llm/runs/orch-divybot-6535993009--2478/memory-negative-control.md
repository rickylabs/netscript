# Guard negative control

Structured direct fixture command with --cwd docs/site and --no-lock --allow-read _plugins/markdown-render-fixture.ts exposes all 17 cases. Inverting the Lume instanceof predicate yields exit 1 with 16 failures (all article parse errors) and 1 pass. Restoring it yields 17 passes. Root markdown-render_test.ts is one wrapper test over these 17 cases. Use direct fixture for count evidence and bridge for root-CI discovery compatibility.
