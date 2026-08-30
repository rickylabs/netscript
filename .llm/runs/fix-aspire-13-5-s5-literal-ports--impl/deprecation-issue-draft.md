# Draft issue: chore(plugins): remove deprecated default-port compatibility exports in 0.0.8

## Summary

Remove the `AUTH_API_DEFAULT_PORT`, `SAGAS_API_DEFAULT_PORT`, and `TRIGGERS_API_DEFAULT_PORT`
compatibility exports in 0.0.8. Since Aspire 13.5 S5, these values are not runtime fallbacks:
plugin endpoints resolve only from an explicit URL, an Aspire service reference, supported
environment variables, or Aspire's allocated resource URL.

`WORKERS_API_DEFAULT_PORT` does not exist on the current public surface, so there is no workers
compatibility export to remove.

## Acceptance

- [ ] Remove the auth export from root and the shared `./public` / `./plugin` entrypoint.
- [ ] Remove the sagas export from root, `./public`, `./runtime`, and `./aspire` entrypoints.
- [ ] Remove the triggers export from root, the shared `./public` / `./plugin` entrypoint,
      `./aspire`, and `./services`.
- [ ] Remove each deprecation-contract test and update plugin migration notes.
- [ ] Confirm no runtime or scaffold path reads any symbol before removal.
- [ ] Run each affected plugin's `deno publish --dry-run` and full-export `deno doc --lint` gates.

## Milestone

`0.0.8`
