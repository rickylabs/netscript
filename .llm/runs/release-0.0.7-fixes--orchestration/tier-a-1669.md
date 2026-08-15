# Tier-A plan review — PR #1669 (`sdk-cached-entry-swr`, #1461)

| Field | Value |
| --- | --- |
| Reviewed head | `ebf8977c155a5887d16324978aa62483ba5a2a32` — local == remote == PR, draft, clean |
| Plan commit | `7e5be1514`; correction commit `ebf8977c1` (delta: `plan.md`, `drift.md` only) |
| Base | `main@3e8e146a4` (the #1665 merge commit) |
| Author | Codex `01a00646-82a9-7ec2-88e7-16dea98a58fa` (`gpt-5.6-sol` · medium) |
| Reviewer | topic orchestrator (Opus 5 · high), separate session |
| Verdict | **PASS** |

## Phase invariant

`git diff --name-only 3e8e146a4..HEAD -- packages/ plugins/ docs/ deno.json deno.lock` is **empty**.
Seven run-dir artifacts only. Correct for plan phase.

## The cascade lesson transferred — the main thing this review was watching for

#1665 spent three post-evaluation repairs discovering the four-link generated-asset cascade one CI
failure at a time. That lesson was written into this leaf's brief up front, and the plan **absorbed
it**: decision **D7** accepts the four-file cascade explicitly, and slice **S2** lists all four
generated mirrors (`prose.json.gz`, `provenance.json`, `agent-docs.generated.ts`,
`publish-assets.generated.ts`) alongside `check:agent-docs-prose`, `check:assets-barrel`, and
`check:publish-assets` in its proving set. The cascade is planned, not discovered.

## Contract decision — sound and argued

**D1** takes issue remedy 1 (cache-aware callable action, then metadata read). **D2** adds **no
published surface** and explicitly rejects `queryEntry()`, reasoning that "acceptance requires
behavior, not a new spelling" and that a new method would duplicate policy across four public layers
and require a scope-boundary ruling. That is the stronger argument: every acceptance item is
behavioural, so a new export would be surface added for spelling rather than capability.

**D5** commits to proving concurrency with **two overlapping readers and a manually blocked fetcher**,
stating that a sequential or single-reader test cannot establish "exactly one refresh". That was the
specific trap in #1461's acceptance and the plan closes it rather than approximating it. The risk
register also anticipates the inverse failure — that registering background work in the inflight map
could make a second SWR caller *block* — and requires both overlapping returns be asserted before the
refresh is released.

## Contract defects — recorded, not worked around

Both defects caught before dispatch are in `drift.md`: `docs/sdk` and
`docs/site/_site/capabilities/sdk/index.md` do not exist at this base, and `docs/site/_site/` is Lume
**build output**. Action recorded: *"fix the plan contract; never create replacements or edit
`_site`."* The corrected surface targets `docs/site/services-sdk/sdk.md`.

## A defect in this orchestrator's own brief, found by the author

The #1461 brief pinned raw SDK doc-lint at "exactly **six** `private-type-ref` diagnostics". That
compressed **two** invocations into one number. The author ran the combined invocation, got **3**,
and recorded it as drift rather than reporting either figure — the correct behaviour, and the reason
briefs ask for conflicts to be reported rather than reconciled.

Verified at `7e5be1514`: combined 12-entrypoint = **3**, cache entrypoint alone = **3**. The "six"
was 3 + 3. The #1665 briefs stated this correctly; this brief compressed it carelessly. Left
unchallenged it would have produced a false no-regression bar — either a phantom "three missing
diagnostics" or a quiet reinterpretation to fit.

Corrected by bounded plan-artifact-only dispatch. The plan now carries validation rows **14a/14b**
naming both invocations, their exact diagnostics, that the third combined diagnostic is external to
the SDK, and that **neither may ever be reported as a pass**. Drift resolved as *brief ambiguity
corrected by the orchestrator* rather than left standing against the author.

## Known-red gates carried correctly

`check:mcp-export-corpus` (tracked **#1668**), `surface:diff` (stale
`baselines/public-surfaces.json`), and JSR `F-DOCT-5` are marked not-to-touch and never-to-report-green.
The `typed-queue` flake (**#1667**) is pre-briefed with its signature.

## Outcome

Tier-A **PASS** at `ebf8977c1`. PLAN-EVAL is warranted rather than `N/A` under the 2026-08-08 owner
decision: the plan makes a published-surface decision, defines a concurrency/single-flight contract,
and pulls a four-link generated cascade into scope. Next gate: fresh opposite-family PLAN-EVAL.
No product code exists on the branch; PR remains draft at sole `status:plan`.
