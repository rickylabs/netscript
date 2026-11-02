**FAIL_FIX** — two source defects need correction. One additional localization defect is lower severity.

1. **P2 — CSV export changes negative amounts into text.**
   **Location:** `packages/cli/src/kernel/assets/app/islands/RecordTable.tsx.template`, `exportRecords()` and its `cell()` helper.
   **Trigger:** Export any record with a negative amount, including the seeded refunded records.
   `String(row.amount)` passes through the text formula guard, which prefixes every leading `-` with an apostrophe. An amount of `-8990` therefore becomes the CSV field `"'-8990"`. This changes the exported value and prevents consumers from reliably treating refunds as numeric amounts; spreadsheet aggregates can omit them.
   **Required fix:** Serialize the validated numeric amount separately, preserving its sign. Apply formula neutralization to untrusted textual cells. Add a focused export assertion covering a negative amount alongside formula-like owner/reference text.

2. **P2 — The empty database state directs users to an unsupported creation operation.**
   **Location:** `packages/cli/src/kernel/assets/app/lib/scaffold-records.database.ts.template`, the zero-total message in `loadScaffoldRecords()`. Related navigation appears in `packages/cli/src/kernel/assets/app/routes/records/[id].tsx.template` as **“Manage record.”**
   **Trigger:** The database list returns zero records.
   The page says **“Create the first one on your service page.”** The canonical service example supplied here provides a list query, deferred summary, and demonstration note form; its mutation copies form values and does not create a record. Following the instruction therefore cannot complete the advertised action.
   **Required fix:** Replace the creation instruction with guidance for an actually supported operation, or link to an existing creation surface. Review the “Manage record” label for the same mismatch. This finding does **not** require adding CRUD persistence to the accepted demonstration form.

3. **P3 — Locale negotiation ignores language quality values.**
   **Location:** `packages/cli/src/kernel/assets/app/lib/scaffold-contract.ts.template`, `scaffoldLocale()`.
   **Trigger:** An `Accept-Language` header such as `fr;q=0,en-US;q=1`, or preferences whose textual order differs from their quality order.
   The function strips the parameters and selects the first supported language. It consequently chooses French in this example despite its explicit exclusion, affecting record dates, amounts, and counts.
   **Suggested fix:** Honor quality ordering, exclude `q=0`, and preserve header order for equal priorities while retaining malformed-tag handling. Cover exclusion and reversed-priority cases.

These findings are within the current scope and warrant **FAIL_FIX**, rather than rescoping or deferring to debt. I treated public streams pending #1383, dependency degradation with HTTP 200 app liveness, undiscovered background endpoints, and the non-persisting demonstration form as accepted constraints.

This verdict is based solely on the supplied source packet. I executed no tools or gates and did not independently verify the reported tests, captures, emitted application, or runtime interactions. Visual scoring and the pending clean-fixture, root-check, carrier, and CI results remain separate from this source review.
