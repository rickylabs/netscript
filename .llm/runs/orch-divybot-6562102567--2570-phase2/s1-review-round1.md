**FAIL_FIX**

1. **[P2] Overview failures become misleading empty states in Recent records and Activity.**  
   Path: `packages/cli/src/kernel/assets/app/routes/(_components)/dashboard-view.tsx.template`  
   When the initial records request succeeds but a later overview page fails, `data` becomes `undefined`. `recent = { ...records, rows: data?.latest ?? [] }` then discards the successfully loaded rows while preserving their `ready` state and success message. Recent records displays an empty-table prompt, and Activity says changes will appear after the first record is created—even though records exist. Preserve the available rows with an accurate scope, or propagate the overview failure into these sections. Reserve first-record guidance for a confirmed empty result.

2. **[P2] Mobile layout removes every sorting control.**  
   Paths: `packages/cli/src/kernel/assets/app/assets/workspace.css.template`, `packages/cli/src/kernel/assets/app/islands/RecordTable.tsx.template`, `packages/cli/src/kernel/assets/app/routes/records/index.tsx.template`  
   At widths of 640px or less, `.workspace-table-head { display: none; }` hides all four sort links. The filter form contains only hidden `sortBy` and `sortOrder` inputs, so mobile users cannot change sorting. Provide visible mobile sorting controls that preserve the active filters and reset pagination. The responsive treatment should also retain accessible column labels rather than hiding the entire header from assistive technology.

3. **[P2] Activity selects by creation time before ordering by update time.**  
   Path: `packages/cli/src/kernel/assets/app/routes/(_components)/dashboard-view.tsx.template`  
   Activity sorts `data.latest` by `updatedAt`, but the supplied projection tests establish that `latest` is a creation-ranked selection supporting truncation through `latestLimit`. Once an older record falls outside that selection, even its newest update cannot appear under “Latest record changes.” For example, with a limit of one, a newly created record excludes an older record updated more recently. Select the latest updates from the complete dataset before limiting, or explicitly scope the section’s wording to changes among recent records.

4. **[P2] Out-of-range pages render impossible record ranges.**  
   Path: `packages/cli/src/kernel/assets/app/routes/records/index.tsx.template`  
   Both adapters preserve the requested page when its result is empty. With `page = 3`, `pageSize = 25`, `total = 40`, and no rows, the pagination text becomes **“Showing 50–50 of 40 records.”** This can occur after deletions while a user retains an existing page URL. Clamp or redirect an out-of-range page, or render an explicit empty-page summary without claiming a displayed range.

This is a source-only S1 verdict. I did not execute validation. The supplied validation results remain reported evidence; the latest native-table emitted-app recheck and browser proof remain pending.