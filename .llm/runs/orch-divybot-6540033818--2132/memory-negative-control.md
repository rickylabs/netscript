# Ordering negative control recipe

Restoring baseline Redis listing with only 97 fixture keys and default SCAN COUNT 5000 can put
all keys in one reply; an exclusive-start-only control then hides the ordering defect. Run the
shared contract in a fresh Deno process with REDIS_SCAN_BATCH_SIZE=16 before imports. Both the
full baseline and an exclusive-start-only baseline must fail global-order/paging assertions on
real Redis. Restore the implementation in finally and verify its SHA-256 is unchanged. Paging
assertions fail on the first wrong page and loops are bounded, avoiding inclusive-start hangs.
