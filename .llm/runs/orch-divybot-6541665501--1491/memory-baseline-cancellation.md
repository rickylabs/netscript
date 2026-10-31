# Existing extractor cancellation test baseline

The test "interrupted Git ignore probe aborts the source walk" in snippet-extractor_test.ts fails in this environment: its temporary fake git probe does not create the ready marker within the test deadline. It fails on the unchanged origin/main test too; a private reproduction with the original body/imports confirms the same missing probe marker. Do not change or suppress that unrelated test to green a docs slice. The real corpus census and all new command example tests pass independently.
