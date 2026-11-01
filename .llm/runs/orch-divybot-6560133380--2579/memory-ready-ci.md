# Ready-for-review test shard

Changing draft PR #2583 to ready activates core test shards. Draft policy skips are not
evidence those tests ran. Run 41330651017 test-1 reported 840 pass / one failure in
generated-router-template_test.ts. Download its test.report.json artifact for the exact
failure; the gate receipt's bounded stdout may omit the failures array.

The sample Prisma adapter wraps update/delete in missingAsNull(async () => ...) to await
Prisma before schema parsing. Static call-count assertions must accept async callbacks
while retaining both wrappers and the P2025-only mapping/rethrow assertions.

Test-4 also passed 1,479 tests with one failed generated memory-service proof: the fixture
uses old status 'archived'. Use a valid status such as 'cancelled' when checking absence so
contract validation does not reject the input before NOT_FOUND/404 mapping can be tested.
The same service-handler-generated_test.ts covers real memory and SQLite Prisma projects.

The memory comparator multiplies its entire primary/tie result by sort direction, so ID
ties already match Prisma's requested direction. The semantic sample test explicitly checks
same-status ascending IDs, descending IDs, a descending page boundary, and descending ID
ties in all four engines' database listQuery output. No generated template change is needed.

The full ready-mode core run also exposed two other fixtures: generated-browser-auth-policy
has an obsolete fake Prisma orderBy object and count() signature, and its minimal database
row no longer satisfies the rich output contract. Keep fixture list args tied to the emitted
domain policy, forward a typed where into count, and return a canonical sample row.
init-no-aspire-operable must expect the 40-record, custom-model seed success message.
Run the full four-variant auth-policy and live no-Aspire SQLite lifecycle test modules.
