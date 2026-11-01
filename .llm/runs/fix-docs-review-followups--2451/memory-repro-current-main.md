# Reproducibility on current main — 2026-11-01

Under Deno 2.9.7 the strict checker still exits 1, naming only Pagefind filter, entry JSON and metadata files. The existing workflow-policy `--allow-pagefind-metadata` mode exits 0 while comparing 917 paths, including 260 HTML pages, 208 Markdown twins and 253 search outputs. HTML, fragments, CSS/scripts, registry outputs and all other assets match. #2453 remains a separate open defect; do not describe it as fixed or remove the bounded CI mode.

Current regression counts: classifier/Pages 72 pass; docs tooling 16 pass; site renderer/source-format fixtures 37 pass. The six exact workflow-scoped docs-tools/browser check/lint/fmt wrappers all pass. `deno task --cwd docs/site build` includes registry generation and rendered-output verification.
