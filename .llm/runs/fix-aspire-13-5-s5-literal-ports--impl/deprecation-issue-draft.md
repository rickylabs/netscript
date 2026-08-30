# Draft issue: chore(sagas): remove deprecated SAGAS_API_DEFAULT_PORT compatibility export in 0.0.8

## Summary

Remove the `SAGAS_API_DEFAULT_PORT` compatibility export in 0.0.8. Since Aspire 13.5 S5, the value
is not a runtime fallback: sagas endpoints resolve only from an explicit URL, an Aspire service
reference, or supported environment variables.

## Acceptance

- [ ] Remove the export from root, `./public`, `./runtime`, and `./aspire` entry points.
- [ ] Remove the deprecation-contract tests and update the sagas migration notes.
- [ ] Confirm no runtime or scaffold path reads the symbol before removal.
- [ ] Run sagas `deno publish --dry-run` and `deno doc --lint` gates.

## Milestone

`0.0.8`
