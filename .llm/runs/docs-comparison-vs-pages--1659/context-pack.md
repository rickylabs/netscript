# Context pack — comparison pages (#1659)

Status: owner Tier-A findings T1–T4 are implemented; S4R assets and final gates are complete.

The page argument is fixed: NetScript puts route identity, a shared read, streaming regions,
freshness, layout, failure boundaries, and metadata at one entry point. The selector changes only
the competitor explanation and second code panel. The first competitor is the no-JavaScript view.

Public API inspection rejected `Region.Settled`; examples use the public layer-component overload.
All generated layers will be refreshed only after both pages are final. Formal evaluation is not
part of this run; owner Tier-A review begins after S4.

S1 deleted the old comparison case, protocol page, stored result files, migration pages, and
measurement tool/test. The Concepts lane and xref map now expose only the comparison landing page
plus the new frontend and backend destinations. The landing page is 24 lines with two cards.

S2 adds a reusable server-rendered comparison component. Its selector is hidden until JavaScript
enhances it; every competitor summary and code block is present in the initial DOM, while the first
competitor is the complete no-JavaScript view. The frontend page uses the public `definePage()`
surface and keeps server streaming separate from typed-partial refresh ownership. The first full
verify reached the link checker and found only the planned S3 backend route; the standalone site
build is green.

S3 adds the backend page: a Zod/oRPC route contract drives runtime validation, handler typing, and
the service client; the endpoint triggers a named worker whose payload is parsed by its own schema.
All five NetScript symbols shown in that path resolve through `deno doc`. The full docs-site verifier
is green now that both comparison routes exist.

S4 refreshed the prose bundle, CLI asset barrel, and publish assets in the required order. All four
freshness checks and every owner-specified docs/git gate now return zero. The only package diffs are
the generated CLI agent-doc barrel and generated MCP publish corpus. No lockfile changed. The draft
PR remains in implementation state; no evaluator or ready-for-review transition was launched.

The owner accepted the frontend argument and returned four blocking implementation findings: give
backend its own estimate close, add a second move proving that consumers import the contract object,
confirm the real public `baseContract`, and compile both pages' NetScript snippets. Public docs prove
`baseContract` is the real oRPC builder exported from `@netscript/contracts`; structured scratch
checks now return zero for both frontend and backend. S3R owns the prose corrections, then S4R
regenerated every asset and replaced the final gate evidence. All four freshness checks, all three
docs gates, and both git hygiene gates pass. The draft PR remains `status:impl` for owner re-review.
