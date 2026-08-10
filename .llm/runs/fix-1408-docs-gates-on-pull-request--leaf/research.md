# Research — fix-1408-docs-gates-on-pull-request--leaf

## Re-baseline

- Carried-in source: issue #1408 facts F1–F5 and locked decision D8.
- Re-derived against `origin/main` @ `da40fbfe377a9e728f190056771298100297a8f8` on 2026-08-10.
- Live issue body and the named workflow/task locations match the carried-in facts.

## Findings

| # | Finding | How to verify |
| - | --- | --- |
| 1 | `pages.yml` has no PR trigger and is the full-site gate consumer. | `.github/workflows/pages.yml` |
| 2 | `quality` already runs for `needs_docs`, making it the cheapest blocking source-format lane. | `.github/workflows/ci.yml` quality job |
| 3 | `build` already chains source-format, Lume, and rendered-output; links and caveats follow in Pages. | `docs/site/deno.json`, `pages.yml` |
| 4 | Source checker/unit test use `--no-lock`; full build previously proved affordable and lock-clean. | `docs/site/deno.json`; issue evidence |

## jsr-audit surface scan

N/A: this CI/docs workflow slice changes no package/plugin or published surface.

## Open questions

None. D8 locks both options; the implementation choice is to extend `pages.yml` so its existing build/deploy pipeline stays single-sourced.
