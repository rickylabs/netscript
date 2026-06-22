# Caveat Gate Drift

## 2026-06-22 — implementation proof

- Clean gate: `cd docs/site && deno task check:caveats` exited 0 with `1 caveat markers across 1 pages — all references resolve`.
- Fail proof: temporary `<!-- caveat: arch-debt:does-not-exist-zzz -->` in `docs/site/glossary.md` exited 1 and reported `glossary.md` / `arch-debt:does-not-exist-zzz`; proof edit reverted before commit.
- Pass proof: temporary `<!-- caveat: arch-debt:aspire-otel-cli-discovery -->` in `docs/site/glossary.md` exited 0 with all references resolving; proof edit reverted before commit.
- Build proof: `cd docs/site && deno task build` exited 0 after wiring `check:caveats`.

## 2026-06-22 — prompt drift

- The slice prompt expected the clean tree to contain `0 caveat markers`, but current branch ground truth already has `docs/site/identity-access/better-auth-plugins.md` containing `<!-- caveat: gh:#108 -->`.
- The new gate resolves that marker by format as requested for `gh:#<n>`, so the clean-tree summary is `1 caveat markers across 1 pages — all references resolve`.
- Scope was kept to the requested gate tool and wiring; no prose markers were added or removed.
