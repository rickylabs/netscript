# IMPL-EVAL — PR #1412 / issue #1411 (docs specifier pinning + rendered-placeholder gate)

**Role:** independent evaluator. Read-only. You did not write this and must not defend it.
**Route:** Claude · Anthropic · Fable 5 · medium (native opposite-family; Codex-authored work).
**Protocol:** `.llm/harness/evaluator/protocol.md` + `.llm/harness/evaluator/verdict-definitions.md`.
**Worktree:** `/home/codex/repos/ns005-impleval-1412` — verify `git rev-parse HEAD` matches PR #1412's head before starting.

## Boundaries

- Read-only. No edits, commits, pushes, or git write commands.
- **Never enter** `/home/codex/repos/ns005-docs1411`, `/home/codex/repos/ns005-w3b1`,
  `/home/codex/repos/ns005-deno295`, or `/home/codex/repos/ns005-docs-consistency`.
- No Aspire, containers, or `e2e:cli`. Site builds and unit tests are fine.
- Final message is the verdict artifact: `PASS`, `FAIL_FIX`, `FAIL_RESCOPE`, or `FAIL_DEBT`.

## What the slice claims

Three rounds. (1) Pinned five version-less `jsr:@netscript/*` install/import specifiers across four
pages. (2) Pinned four more `deno add jsr:@netscript/ai` occurrences found in a second sweep.
(3) Added `templateEngine` front matter to three reference pages that were rendering literal
`{{ releaseSpecifier }}` to readers, and **extended `check-rendered-output.ts` to fail on a literal
`{{ … }}` in any rendered page**, with a bounded allowance for `reference/cli/index.html`.

## Claims to falsify (execute; do not infer)

1. **No published page still instructs a version-less install/import.** Sweep `docs/site` yourself
   for `deno add|install|x` commands and import-map values naming `jsr:@netscript/*` without a
   version. Report the count. Note deliberately-excluded classes: `_plan/**` and `_includes/**` are
   unpublished, `_includes/readme-template.md:13` uses a literal `...` ellipsis in a spec sentence,
   and `jsr:@netscript/plugin-<plugin>{{ releaseSpecifier }}` in erp-sync/storefront tutorials is
   pinned after the placeholder. Confirm those classifications rather than trusting them.
2. **The rendered output is genuinely correct.** Build the site and confirm the repaired commands
   render with a real pinned version. Pay particular attention to
   `tutorials/chat/05-mcp.md:60`, which sits **inside a fenced ```sh block** — a fence that failed
   to interpolate would publish a literal placeholder, which is worse than the original defect.
3. **The new gate can FAIL — this is the most important check.** Prove
   `assertNoLiteralVentoPlaceholders` exits non-zero by introducing a literal `{{ … }}` into a
   rendered page in a scratch copy outside the repo. Then check the three specific pages it was
   built for: does it fail against the *pre-fix* `_site` (rebuild from `origin/main` in scratch)?
4. **The allowance is narrow, not a loophole.** `reference/cli/index.html` is allowed `{{var}}` ×1
   and `{{var | pipe}}` ×3 with a stated reason. Verify (a) those tokens genuinely document scaffold
   template syntax, (b) the counts are bounded so a *new* leak on that same page still fails — prove
   it by adding a fourth pipe occurrence or a different token in scratch, and (c) no other page has
   an allowance.
5. **No existing assertion weakened.** Diff `check-rendered-output.ts` against `origin/main` and
   confirm the homepage assertions (heading-marker leak, semantic h2s, 5 destination items) are
   intact, and that `check-source-format.ts` is untouched or only strengthened.
6. **Scope.** `git diff origin/main...HEAD --name-only` — expect only `docs/site/**` and run
   artifacts. Any `packages/**`, `plugins/**`, lockfile, or corpus/asset regeneration is out of
   scope and a finding. Confirm no allowance was added to `check:netscript-jsr-specifiers` and that
   guard was not narrowed.
7. **Gates.** Re-run `deno task build`, `check:links`, `check:caveats`, `test:source-format` in
   `docs/site`, and `deno task check:netscript-jsr-specifiers` from the repo root. Report raw exits.
   Note the root guard passes both before and after, because it only sees the corpus after
   regeneration — say so plainly rather than presenting it as proof the docs fix worked.
8. **Acceptance rows.** Read #1411 and state row by row whether this head satisfies each, with
   evidence you executed. Flag anything asserted but not demonstrated.

## Standard

Earlier IMPL-EVALs in this run returned `PASS` only after reproducing what the slice claimed — one
rebuilt a 4.6 MB corpus to byte-identity, another broke a repaired assertion in two dimensions to
prove it still constrained. Match that. Say explicitly when you cannot execute something.

Report per claim: claim → command → observed output → verdict. Then the overall verdict, and the
minimal repair if not PASS, phrased so the original writer can act on it.
