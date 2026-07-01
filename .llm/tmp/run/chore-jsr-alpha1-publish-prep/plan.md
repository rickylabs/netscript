# Plan — JSR alpha-1 publish mechanics (PR1)

Run-id: `chore-jsr-alpha1-publish-prep`
Archetype: CLI/tooling (`packages/cli`) + workspace-wide release-version field edits + docs-site
data + CI workflow. Overlay: SCOPE-docs applies to the `docs/site` data touch only.

## Locked decisions

- D1 — Target version `0.0.1-alpha.1` for ALL 32 members.
- D2 — fresh-ui is normalized `0.1.0` → `0.0.1-alpha.0` BEFORE the workspace bump, so
  `deno bump-version prerelease -w` lands everything uniformly on `0.0.1-alpha.1` and rewrites root
  import-map `jsr:` refs in one pass. (Do NOT hand-edit 32 version fields; the bump tool also keeps
  the import map consistent.)
- D3 — Scaffold `@netscript/*` pins become EXACT `@0.0.1-alpha.1` (caret is meaningless on a
  prerelease), sourced from a SINGLE release-version constant, not 48 literals. Preferred mechanism:
  derive from the CLI package's own `version` (lockstep ⇒ always the released version, bump-safe).
  Final mechanism is PLAN-EVAL-confirmable; drift-free single-source is the hard requirement.
- D4 — Docs read the release version from one data constant; remove all hardcoded `^1.0.0`/`1.0.0`
  and "not installable today" framing (banned docs voice per `docs-voice-no-honesty-framing`).
- D5 — New `.github/workflows/publish.yml`: tag-push trigger, `permissions: id-token: write` +
  `contents: read`, OIDC (tokenless) `deno publish` at workspace root. No secret.
- D6 — Regenerate `deno.lock` after version changes (approved). Lock-hygiene: only the
  version-driven re-resolution; no unrelated churn.

## Implementation slices (commit-by-slice; WSL Codex daemon-attached)

1. **Version align** — edit `packages/fresh-ui/deno.json` version → `0.0.1-alpha.0`; run
   `deno task version:bump prerelease -w` (wrapper over `deno bump-version`); verify every
   `packages/*/deno.json` + `plugins/*/deno.json` + root import-map `jsr:` refs == `0.0.1-alpha.1`.
   Gate: `deno task check:scaffold-versions`, `run-deno-check` on touched roots.
2. **Single version source + scaffold pin fix** — introduce the release-version constant
   (single source), rewrite `import-resolver.ts` `PACKAGE_TO_JSR` to emit `@0.0.1-alpha.1` from it
   (all 48 specifiers incl. subpaths), update `import-resolver_test.ts` assertions. Gate:
   `deno test` for the CLI scaffold tests, `run-deno-check` + `run-deno-lint` on `packages/cli`.
3. **Docs dynamic version** — add a release-version constant to the docs data layer
   (`docs/site/_data.ts` or a sibling `_data` module), reference it where versions appear, and
   replace the `^1.0.0`/"not installable today" narrative in `concepts.vto`, `capabilities/auth.md`,
   `explanation/auth-model.md`, `how-to/add-authentication.md`. Gate: docs build + the scoped
   fmt/lint wrappers on `docs/site` (source only).
4. **OIDC publish workflow + lock regen** — add `.github/workflows/publish.yml` (tag-push,
   `id-token: write`, workspace `deno publish`); regenerate `deno.lock`. Gate: workflow yaml lints;
   `deno task publish:dry-run` green; `git diff deno.lock` is version-driven only.

## Gates / merge-readiness

- `deno task check:scaffold-versions` PASS.
- Scoped `run-deno-check` / `run-deno-lint` / `run-deno-fmt` (`--ext ts,tsx`, source only) on
  touched roots PASS.
- CLI scaffold tests (`import-resolver_test.ts`) PASS with new exact pins.
- `deno task publish:dry-run` exit 0 over all members at the new version.
- `deno task e2e:cli run scaffold.runtime --cleanup` — only if scaffold JSR-mode output is exercised
  by the suite; otherwise note that scaffold.runtime uses local-source mode and the JSR-pin change is
  covered by the unit test. (Evaluator to confirm whether e2e is required for this slice.)

## Debt / deferrals

- Slow-types polish for the 4 whitelisted packages → post-launch (accepted).
- README revamp + in-package `/docs` removal → PR2 (doc-authoring lane), gates the publish tag.
- The actual release-tag push / `deno publish` execution → after PR1+PR2 merge.

## Evaluator

- PLAN-EVAL: OpenHands minimax-M3 (separate session). No slice before PASS.
- IMPL-EVAL: OpenHands qwen3.7-max (separate session).
- Implementation: WSL Codex daemon-attached slices (mobile-visible), explicit-refspec pushes.
