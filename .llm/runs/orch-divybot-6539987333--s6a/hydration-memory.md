# Generated-query runtime probe — 2026-10-31

- The S6a semantic QueryResult renderer removed the raw main/output JSON surface. Both full
  runtime tiers reached the hydrated query client and users.list query but their DOM selector
  remained stale. The PostgreSQL run passed108checks and SQLite101; each failed only this probe.
  Both cleanup.aspire-stop gates passed. This is a real runtime failure, not a policy skip.
- Generated success markup now owns a data-query-result container, including empty/null/scalar
  success values. Loading/error markup remains outside this contract. The probe retains its
  independent query-client and list-query requirements.
- The observation expression is shared by the actual CDP gate and Playwright. The browser
  fixture compiles QUERY_RESULT_TEMPLATE/RETURN directly and uses the public query singleton.
  It is a DOM-contract test; it does not substitute for the full runtime suite’s hydration and
  refetch proof. An old-output selector mutation must fail on the unchanged successful-state
  assertion; unrelated output/dl markup must never qualify.
- Do not weaken this to a generic main/dl/status selector: those could accept unrelated
  server markup, loading text or an error while the query cache is present.

- Independent review found the first repair targeted ui:add page’s QUERY_RESULT_RETURN while
  scaffold.runtime /people comes from generate resource and a separate ResourceIsland asset.
  Never infer generator identity from similar markup. Trace resource-slice-gates.ts to the
  actual command and template. Share the success return/body through renderResourceSlice’s
  template variables; retain resource-specific loading/error copy.
- The browser suite now renders the full canonical people/users/list/partial resource island
  and loader through renderResourceSlice plus the production formatter. It imports that actual
  PeopleIsland and uses real QueryIsland/useIslandQuery; only the query port is controlled.
  A second negative control removes the marker from the resource renderer alone: page cases
  must stay green while resource cases go red. This catches the precise first-review gap.
