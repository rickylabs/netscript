# Runtime preflight — 2026-10-07

Canonical `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` exits 1 on this ephemeral Linux worker. Aspire CLI and docker client are installed, but Docker daemon socket is unavailable. Aspire doctor fails before scaffolding. Cleanup also fails its docker inspection. No generated service, AppHost or container was started. Record this as unproven runtime acceptance, never green. The native server HTTP/restart and 1 GiB RSS integration tests independently run without Docker/Aspire and pass.

Full streams plugin doc-lint exits 1 from baseline streams-cli missing JSDoc (2) and packages/plugin plugin-contributions private reference (1); services entrypoint exit 0. Neither baseline file is changed by the I/O repair. Structural JSR audit exits 0. Keep tests in services/src/tests/ and workers under test_utils/ (publish excludes already cover them) to avoid >12 source directory children.
