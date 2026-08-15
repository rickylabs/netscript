# Context pack — comparison pages (#1659)

Status: S1–S2 complete; S3 active.

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
