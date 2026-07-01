# Plan: Phase P — JSR alpha.0 publish (all members except `@netscript/cli`)

## Run Metadata

| Field    | Value |
| -------- | ----- |
| Milestone | Phase P (between toolchain Phase T and Wave 6 Phase C) |
| Branch   | `chore/jsr-alpha-publish` (cut off `chore/deno-2.8-aspire-13.4-upgrade` after Slice 0) |
| Depends on | Phase T Slice 0 + T0 (publish-clean, `catalog:` baseline) |
| Unblocks | `scaffold.published.runtime` e2e — testing the **production** `netscript init` (JSR-resolved deps), not just the maintainer/local scaffold |

## Goal

Publish an **`alpha.0` prerelease** of all 28 workspace members except `@netscript/cli` to JSR, so
the production scaffolding path (a freshly-`init`-ed app that imports `@netscript/*` from JSR rather
than from the monorepo) can be exercised end-to-end before the CLI itself ships. `@netscript/cli`
ships last by design (LD-7 / maintainer decision #7).

## Why before Wave 6

Wave 6 reshapes the CLI's scaffolding surface. Validating that reshape against a **real published
registry** (not just the local workspace) closes the single biggest untested gap: today only the
maintainer/local scaffold variants are exercised; the published variant is unverified. Publishing
alpha.0 first gives Wave 6 a `scaffold.published.runtime` fixture to assert against.

## Scope

| Step | Action | Gate |
| ---- | ------ | ---- |
| P1 | `deno bump-version prerelease --release-type=alpha` (workspace-aware, all 29 members lockstep). | version graph consistent |
| P2 | Exclude `@netscript/cli` from the publish set (keep its version bump for graph consistency, but `"private"`/skip publish). | cli not on registry |
| P3 | `deno publish` from root (auto path→registry rewrite, 2.8). Dry-run first (E-8), then real with OIDC. | all 27 published green |
| P4 | New e2e `scaffold.published.runtime`: scaffold an app, rewrite its import map to the JSR alpha.0 specifiers, `deno task dev`, assert health. | nightly e2e green |
| P5 | Record published specifiers + the e2e fixture path in `research-realized.md` (the impl log, LD-5/decision #5). | drift logged |

## Locked Decisions (inherited)

- Publish scope = **all 28 members except `@netscript/cli`** (decision #7).
- Prerelease channel = `alpha` (greenfield; no semver-stability promise).
- The `packages/aspire` barrel fix (T0/LD-1) is a **hard prerequisite** — without it P3 is red.

## Open-Decision Sweep

| Decision | Status | Notes |
| -------- | ------ | ----- |
| JSR scope/org token (OIDC vs token) | safe to defer | CI-secret wiring; does not affect plan shape. Resolve at P3. |
| Whether to tag `alpha.0` in git | safe to defer | cosmetic; `deno bump-version` can tag or not. |

## Risk Register

| Risk | Mitigation |
| ---- | ---------- |
| A member fails slow-types at real publish despite dry-run pass | The 4 carve-outs (LD-5) publish with `--allow-slow-types`; dry-run E-8 in Phase T is the gate. |
| Published alpha consumed accidentally as stable | `alpha.0` channel + README banner; cli (the consumer surface) is withheld. |
| Version-graph skew if cli is excluded from bump | P1 bumps the **whole** graph; P2 only skips the publish step, not the version, keeping the lockfile consistent. |

## Validation Plan

1. E-8 `deno publish --dry-run` (27 members) — green.
2. Real `deno publish` — 27 × `published`.
3. `scaffold.published.runtime` nightly e2e — health-check green.
4. `research-realized.md` updated with specifiers + fixture.

## Dependencies

- Phase T Slice 0 + T0 must be merged first.
- Wave 6 Phase C consumes the published fixture (slice 4 scaffold improvements assert against it).
