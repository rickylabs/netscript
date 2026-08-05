# Plan: Aspire Deno runtime / NuGet dependency research

## Run Metadata

| Field          | Value                                                                              |
| -------------- | ---------------------------------------------------------------------------------- |
| Run ID         | `research-aspire-deno-runtime-path--1227-adjacent`                                 |
| Branch         | `research/aspire-deno-runtime-path`                                                |
| Phase          | `research`                                                                         |
| Target         | `packages/cli` generated Aspire configuration, observed only; run artifact changed |
| Archetype      | `6 — CLI / Tooling`                                                                |
| Scope overlays | `docs`                                                                             |

## Archetype and Current Doctrine Verdict

The subject is Archetype 6 because it is a generated CLI/scaffold orchestration flow. The actual
changeset is evidence-only and uses the docs overlay. Doctrine file 10 identifies `@netscript/cli`
as the largest package and the top remediation surface; this slice does not deepen or remediate that
debt.

## Axioms in Play

| Axiom | Why it matters                                                                              |
| ----- | ------------------------------------------------------------------------------------------- |
| A6    | A toolkit integration must earn its helper/dependency cost.                                 |
| A7    | Prefer Aspire SDK primitives/upstream behavior to local or third-party abstraction.         |
| A9    | The CLI/scaffold subject remains Archetype 6 even though the output is a research artifact. |
| A14   | The verdict requires executable evidence, not inference from issue state.                   |

## Goal

Produce a cited, experimentally proven verdict—adopt now, adopt when an exact upstream signal lands,
or do not adopt—on whether a Deno-oriented Aspire path removes or shrinks the NuGet restore surface
behind #1227.

## Scope

- Test external-package `[AspireExport]` behavior on Aspire 13.4.6.
- Test the current CommunityToolkit Deno integration in a TypeScript AppHost.
- Quantify current and candidate NuGet restore graphs.
- Test Deno-only AppHost configurations for a no-NuGet path and document losses.
- Verify the two upstream issues, linked PRs, owner-expected next-milestone work, and timeline.
- Write the result in `research.md` and carry it in a PR that references—but does not close—#1227.

## Non-Scope

- No scaffold/template/source changes.
- No migration, retry implementation, dependency update, cache deletion, or lock-file edit.
- No claim that a conditional upstream path is shipped before the controlled fixture proves it.
- No new 0.0.6 epic; the artifact only recommends whether one is worthwhile.

## Hidden Scope

- Isolate caches and distinguish SDK bootstrap packages from AppHost integration packages.
- Separate TypeScript export-module generation from runtime resource viability.
- Record cold/isolated package identities as well as raw package counts.
- Account for the capability lost when bypassing the Aspire AppHost/SDK entirely.

## Locked Decisions

| ID | Decision                                                                                       | Rationale                                                          |
| -- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| D1 | Research only; do not edit scaffold output.                                                    | Owner constraint and safe scope.                                   |
| D2 | Execute against Aspire CLI 13.4.6.                                                             | The question is version-specific.                                  |
| D3 | Use official upstream issues, PRs, releases, docs, and NuGet metadata as citation authorities. | Capability and timeline claims need primary sources.               |
| D4 | Compare package identities and counts under controlled scratch caches/configurations.          | A dependency claim cannot rest on a package-reference count alone. |
| D5 | The verdict names an exact upstream signal when conditional.                                   | Makes the result actionable rather than aspirational.              |
| D6 | No local formal PLAN-EVAL; record milestone composition without a PASS claim.                  | Explicit owner ruling.                                             |
| D7 | Preserve the inherited `deno.lock` modification and exclude it from commits.                   | Lock hygiene and unrelated-user-change rule.                       |

## Open-Decision Sweep

| Decision                    | Status                          | Notes                                                      |
| --------------------------- | ------------------------------- | ---------------------------------------------------------- |
| Toolkit adoption verdict    | must resolve now                | Determined by experiments and restore delta.               |
| Exact upstream watch signal | must resolve now if conditional | Must name issue/PR/release behavior, not only a milestone. |
| 0.0.6 epic recommendation   | must resolve now                | Required deliverable.                                      |
| Product migration design    | safe to defer                   | Explicitly outside this research slice.                    |

## Risk Register

| Risk                                                          | Mitigation                                                                                    |
| ------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Warm global caches hide package downloads.                    | Use isolated scratch package/cache roots and retain command/package-graph evidence.           |
| Generated module existence is mistaken for runtime viability. | Test generation and execution/restore separately.                                             |
| Open issues hide capability shipped elsewhere.                | Read linked PRs, release notes, code/docs, and run the fixture.                               |
| Preview Toolkit versions are mistaken for support.            | Report stable version, prerelease state, ownership, and explicit support language separately. |
| Experiments mutate the repository lock/worktree.              | Run only in `.llm/tmp` scratch roots; inspect raw git status before each commit.              |

## Anti-Patterns to Avoid

| AP    | Status | Plan                                                                    |
| ----- | ------ | ----------------------------------------------------------------------- |
| AP-2  | risk   | Do not recommend a helper that only renames `addExecutable`.            |
| AP-9  | risk   | Do not introduce a speculative integration seam.                        |
| AP-18 | risk   | Compare semantic generated modules/package graphs, not giant snapshots. |
| AP-19 | risk   | Document restore/network/tool requirements and losses explicitly.       |

## Fitness and Validation Gates

| Gate                | Required | Expected evidence                                                                |
| ------------------- | -------- | -------------------------------------------------------------------------------- |
| Source alignment    | yes      | Every load-bearing claim cites code, command output, or primary upstream source. |
| Scope separation    | yes      | Diff contains only `.llm/runs/**` research/control artifacts.                    |
| Link integrity      | yes      | Local paths and external source links resolve.                                   |
| Format              | yes      | Scoped non-mutating format check on the run artifact directory.                  |
| Runtime experiments | yes      | Aspire 13.4.6 fixtures with captured exit/package/module evidence.               |
| JSR/package fitness | N/A      | No package public surface or source changes.                                     |
| Full CLI E2E        | N/A      | Research-only and no generated output changes; docs-only CI skips are explicit.  |

## Arch-Debt Implications

None expected. Any discovered existing divergence is evidence in `research.md`, not a new or
deepened package violation.

## Drift Watch

- Toolkit stable version/support status differs from the owner brief.
- Either upstream issue is closed/superseded or the capability shipped under another PR.
- 13.4.6 experiment contradicts the generated-code comment.
- The supposedly no-NuGet path still resolves SDK/AppHost NuGet packages.
