# Context Pack

- Branch: `fix/e2e-prod-inner-min-dep-age`
- Base: `origin/main` at `2a1c8ed9`
- Failure: Actions run 29564434302, gate `scaffold.plugin.ai.lifecycle`
- Root cause: Deno 2.9.3 `deno x` internal `deno run` re-exec drops minimum-age/config flags.
- Chosen fix: direct published `cli.ts` URL under `deno run --minimum-dependency-age=0`.
- Plan status: awaiting separate PLAN-EVAL.
- Product follow-up: real users on Deno 2.9.x encounter the same ~24h window.
