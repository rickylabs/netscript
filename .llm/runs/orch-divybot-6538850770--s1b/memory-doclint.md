# Baseline doc lint

Canonical `deno task doc:lint --root packages/fresh-ui --pretty` exits 1 at assignment baseline with 124 diagnostics: 96 private-type-ref, 28 missing-jsdoc, 0 other. tokens.ts is clean; token-config.ts has existing findings. Keep per-file/entrypoint counts so new token work cannot hide behind inherited total debt.
