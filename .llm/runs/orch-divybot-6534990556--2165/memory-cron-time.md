# Cron callback time semantics

@netscript/cron adapters share executeScheduledJob/createJobContext in packages/cron/adapters/_shared.ts. Both scheduledTime and actualTime are initialized from new Date() at execution start; the field name does not prove nominal scheduling time. For five-field scheduled-trigger identities, remove seconds/milliseconds to tolerate same-minute multi-processor jitter; do not claim intended-slot recovery after cross-minute provider delay. Always include real createScheduler({ provider: memory }).trigger() coverage, not just injected context callbacks.
