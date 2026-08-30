# Plan — docs(aspire): terminology sweep (#1723 slice A, closes #1000)

**PLAN-EVAL: N/A.** The scope is a mechanical, evidence-bounded string sweep across enumerated
locations with an authoritative naming target and an explicit deferral list. The genuinely
decision-heavy part — what is shippable against a main that has landed no 13.5 work — was resolved in
`research.md` against receipts from main and from the Aspire lane. Nothing left is
architecture-shaped. IMPL-EVAL is **not** waived.

## Why this is a slice and not the issue

#1723 is `[aspire-13-5 S11]`, and its own contract is "prose must match shipped behaviour (S1–S10)".
No S-slice has merged and main pins Aspire 13.4.6, so most of the issue is not implementable without
making the docs false. This leaf takes only the rows that carry **no version or behaviour claim**,
and records every other row with a named dependency.

**This PR does not close #1723.** It closes **#1000** and references #1723 with the remaining scope
stated. A closing keyword on #1723 here would strand the version-bound rows.

## Locked decisions

1. **".NET Aspire" → "Aspire"** in published surfaces. `aspire.dev` replaces
   `learn.microsoft.com/dotnet/aspire/` in the four link sites. Already the convention in five pages
   on main.
2. **`docs/site/_plan/**` is out of scope** — Lume ignores `_`-prefixed directories; those are
   unpublished research archives.
3. **No version literal changes.** `explanation/aspire.md:83` and `deploy-local-aspire.md:58` say
   `13.4.6`, main pins `13.4.6`, and they stay until S1 (#1727) merges.
4. **The `.mmd` comment is in scope** (§4a): the committed SVG carries no `%%` content and
   `diagrams:check` byte-compares, so a comment-only edit renders identically.
5. **Every one of the 102 S11 `doc:public-page` manifest rows is accounted for in the PR body** —
   edited, "no change needed" with the grep that proves it, or deferred with its named dependency.
   S13 turns these into hard gate failures; an unexplained decline becomes someone else's red gate.
6. **Only prose changes.** No `packages/`/`plugins/` source. The single permitted `packages/` diff is
   regenerated `agent-docs.generated.ts`.

## Slices

- **S1** — the terminology sweep across the enumerated locations, plus the four link repoints.
- **S2** — regenerate the derived assets and commit separately.

## Gate set

`--cwd docs/site check:source-format` · `--cwd docs/site build` · `--cwd docs/site check:links` ·
`--cwd docs/site check:caveats` · `--cwd docs/site diagrams:check` · `docs:links` · `docs:accuracy` ·
`doc:lint` · `check:agent-docs-prose` · `check:assets-barrel` · **`check:publish-assets`**

The last one is not optional and is the lesson from #1746: this leaf regenerates the agent-docs
corpus, whose `provenance.json` `sourceCommit` is embedded in
`packages/mcp/src/publish-assets.generated.ts`.

Root `fmt:check`/`lint` do **not** govern these files and must not be cited.

## Definition of done

- Zero ".NET Aspire" occurrences in published surfaces; `_plan/**` untouched.
- No version literal changed; `13.4.6` still reads `13.4.6` everywhere.
- All 102 S11 rows accounted for in the PR body in one of the three buckets.
- Every gate above green at the exact pushed head, with pasted output.
- `Closes #1000`; `#1723` referenced with remaining scope stated and no closing keyword.
