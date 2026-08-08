# docs(reference): four publishable plugin-*-core packages have no reference page, the publish gate demands a path the IA does not use, and the JSR landing README teaches the wrong dialect — DRAFT (no GitHub mutation; owner ratification pending)

**Draft-ID:** T5-05 · **Proposed milestone:** 0.0.6 · **Labels:** `type:docs` `area:docs`
`area:packages` `priority:p2` `status:triage` · **Depends on:** T5-01 (dialect), T5-02 (gate)

## Summary

The reference tree does not cover the publish set, and the gate that is supposed to enforce coverage
has never run against it and would demand paths the site does not use. Twenty-two package READMEs —
including `packages/sdk/README.md`, which is the JSR landing page — have not been touched since a
single bulk commit and still teach the query dialect the scaffold does not emit. Seven public CLI
verbs are documented nowhere, one documented claim about `deploy docker`/`compose` is the inverse of
the code, and the root README hardcodes a scaffold file count that the quickstart explicitly says not
to trust. Individually these are small; together they are the reason a reader who leaves the golden
path cannot get back on it.

## Evidence

Corpus: `research/repo-audit/docs-quickstart.md` §2.6, §2.7, §2.9, §2.10, §4 Tier 2;
`research/repo-audit/mcp-cli.md` §2.1, §4.5 C3; `SYNTHESIS.md` §4 T5.

Verified in the worktree at `fac9e339042c`:

1. **Missing reference pages.** `docs/site/reference/` has 32 package directories.
   `plugin-ai-core` and `plugin-auth-core` have pages; `plugin-sagas-core`, `plugin-streams-core`,
   `plugin-triggers-core`, `plugin-workers-core` do not. All four declare an object-valued
   `publish` key in `deno.json` (`packages/plugin-sagas-core/deno.json:39`,
   `plugin-streams-core:20`, `plugin-triggers-core:32`, `plugin-workers-core:42`), i.e. they are
   publishable — contrast `packages/bench/deno.json:33` `"publish": false`, which correctly has no
   page. The omission is inconsistent, not policy.
2. **Gate vs IA disagreement.** `.llm/tools/release/publish-readiness.ts:302-306` requires
   `docs/site/reference/${packageSegment(member.name)}/index.md`, where `packageSegment` is the part
   after `@netscript/` (`:411-415`). The site documents `@netscript/plugin-sagas` at
   `docs/site/reference/sagas/index.md` (its front matter reads `title: "@netscript/plugin-sagas"`),
   and the same for `streams`, `triggers`, `workers`. A first publish under the current rule would
   demand `/reference/plugin-sagas/`.
3. **The gate has never checked the existing tree.** It runs only over `newPackages`, computed as
   members with no registry versions (`publish-readiness.ts:158-180`), through `auditFirstPublish`
   (`:179`).
4. **README staleness (measured by `git log -1` per file).** 22 of 30 `packages/*/README.md` and 4 of
   6 `plugins/*/README.md` were last touched 2026-07-18, including `packages/sdk/README.md`.
   `jsr-package-settings.json:6` sets `readmeSource: "readme"`, so that file *is* the JSR landing
   page. `packages/sdk/README.md:32-33` front-loads `createServiceQueryUtils` as the TanStack story —
   the dialect T5-01 demotes.
5. **Root README.** `README.md:41` asserts "The scaffold reports **183 files, 44 directories**",
   directly contradicted by `docs/site/quickstart.vto:51` ("treat the printed result—not a static
   number in this guide—as the authority"); the counts vary with `--db/--service/--editor`.
   `README.md:35` prints the literal `jsr:@netscript/cli@<version>` while the site derives the
   specifier automatically (`docs/site/_data.ts:30-33`).
6. **Undocumented verbs** (grep over `docs/site` returns zero files for each):
   `netscript agent drift`, `netscript deploy desktop`, `netscript deploy package-cli`,
   `netscript deploy list`, `netscript config list`. `netscript plugin ai` appears only in
   `docs/site/reference/plugin-ai/index.md`, never as a CLI verb in the command reference. All exist
   in the public tree (`packages/cli/src/public/features/agent/agent-group.ts:44-51`,
   `.../deploy/deploy-group.ts:25-97`, `.../config/config-group.ts:13-29`,
   `.../plugins/plugins-group.ts:33-151`).
7. **Inverted claim.** `docs/site/cli-reference.md:246-249` states "`netscript deploy docker` and
   `deploy compose` exist as command groups but are not wired — they only print help." Both are
   implemented by `AspireComposeDeployTarget`, whose operation list is
   `plan · up · down · status · logs`
   (`packages/cli/src/kernel/adapters/aspire/aspire-compose-deploy-target.ts:65-70,92,109-117`).
8. **Fabricated aliases.** `@contracts` (`web-layer/query.md:143`, `services-sdk/sdk.md:100`,
   `tutorials/live-dashboard/02-contract-to-service.md:112`, `.../03-sdk-cache-first-query.md:55`)
   and `@/lib/api-clients.ts` (`services-sdk/sdk.md:189,194,199`) are never generated; the scaffold
   emits only `'@app/' -> './'` and `'@<projectName>/contracts'`
   (`packages/cli/src/kernel/adapters/templates/app/generate-app-deno-json.ts:62-63,125-130`).
9. **Maintainer version.** `netscript-dev` reports a hardcoded `version('1.0.0')`
   (`packages/cli/src/maintainer/features/root/maintainer-command-tree.ts:32`) against the real
   `CLI_PACKAGE_VERSION` train.

## Current surface

32 reference pages for a larger publish set; a first-publish-only docs gate keyed to a path
convention the IA does not follow; 26 READMEs frozen at 2026-07-18, one of which is the SDK's JSR
landing page teaching a non-canonical dialect; a root README with a hardcoded file count and a
literal version placeholder; seven verbs with no prose; one reference claim that is the inverse of
the code.

## Target contract

1. **Coverage.** Every package whose `deno.json` `publish` key is not `false` has a
   `docs/site/reference/<segment>/index.md`, generated or hand-written, listed in the site nav.
2. **One path convention, written down.** Either the gate's `packageSegment` rule is relaxed to a
   declared alias map (`@netscript/plugin-sagas` → `sagas`), or the IA moves to the gate's rule. The
   decision is recorded in the reference index; the gate and the IA agree afterwards.
3. **The gate runs over the whole publish set**, not only first-publish packages, so a new package
   without a page and an existing package without a page fail the same way.
4. **READMEs match the ratified dialect.** `packages/sdk/README.md` leads with
   `createQueryFactories` per T5-01; every package README's code blocks are covered by T5-02's
   compile gate; `docs:readme:check` staleness is #767's problem and is not re-litigated here.
5. **Root README truth.** The file count becomes "the scaffold prints its own count" and the install
   snippet derives its specifier the way the site does, or states explicitly that the reader should
   substitute the current release.
6. **Verb coverage.** `docs/site/reference/cli/commands.md` documents `agent drift`, `plugin ai`,
   `deploy desktop`, `deploy package-cli`, `deploy list`, `config list`, and corrects the
   docker/compose row and the "three-verb lifecycle" claim.
7. **Aliases.** Every sample uses the two aliases the scaffold generates.

## Acceptance

- [ ] Every package with a non-`false` `publish` key has a reference page.
- [ ] `plugin-sagas-core`, `plugin-streams-core`, `plugin-triggers-core`, `plugin-workers-core` have
      reference pages.
- [ ] The reference path convention is stated once and the publish gate matches it.
- [ ] The docs-reference check runs over the full publish set, not only first-publish packages.
- [ ] `packages/sdk/README.md` leads with `createQueryFactories`.
- [ ] `README.md` carries no hardcoded scaffold file or directory count.
- [ ] `README.md`'s install snippet resolves to a real specifier or states the substitution.
- [ ] `agent drift`, `plugin ai`, `deploy desktop`, `deploy package-cli`, `deploy list`, and
      `config list` are documented in the CLI reference.
- [ ] The docker/compose "not wired" claim is replaced by the real five-verb surface.
- [ ] `@contracts` and `@/lib/...` appear in zero code samples.
- [ ] Negative test: adding a publishable package without a reference page fails the docs gate.
- [ ] Negative test: a CLI command group present in the public tree but absent from the command
      reference fails a check derived from the command tree, not from a literal list.
- [ ] [post-merge] The published JSR landing page for `@netscript/sdk` shows the canonical dialect.

## Boundaries

- **#1108** owns verifying generated package references against live export maps — the *content*
  correctness of reference pages and the expansion of `check-exports-drift`. This issue owns
  *existence*, path convention, and gate scope; do not re-file #1108's export verification here.
- **#767** owns `docs:readme:check` being a dead gate (checker/template/house-style divergence). This
  issue fixes README *content*, not the README standard checker.
- **#1201** owns serving export surfaces through MCP; **#1260** owns SDK prose in the MCP corpus.
  Fixing `packages/sdk/README.md` here does not decide what ships in the corpus.
- **#1210** owns per-API deep dives; **#1208** owns the tutorial page-builder rewrite. No new
  conceptual pages here — reference and README truth only.
- **#1277** owns docs-site layout/UI polish.
- **T5-01** owns the dialect decision itself; this issue applies it to READMEs and reference prose.
- Not a goal: authoring per-package tutorials, or renaming published packages.

## Docs/consumer proof

`deno task publish:dry-run` and the release readiness check agree with the site tree for every
publishable member. A reader running `netscript --help` can find prose for every group it prints.
The JSR pages for `@netscript/sdk` and the four `plugin-*-core` packages link to a reference page
that exists.

## Provenance

Seed run `plan-fable5-remediation-roadmap--seed`, PR #1347, 2026-08-08. README staleness re-measured
with `git log -1 --format=%ad` per file in this pass (22/30 packages and 4/6 plugins at 2026-07-18);
the corpus figure of 21/30 is superseded by this measurement.
