# Redis lease design constraints from independent PLAN-EVAL

Keep producer-independent BRPOPLPUSH pickup; WATCHing the ready list for every claim can
starve consumers under sustained enqueues. Stamp receipt/count/deadline transactionally on
processing/lease keys, and recover the pickup-to-stamp crash gap through bounded adoption.
A legacy claim must receive a full fresh lease rather than immediate redelivery. Quiesce old
workers at upgrade because their old encoded acknowledgements cannot remove replaced bytes.
Normalize raw JSON exactly once so identity/count persist. Poison bytes need a validation_failed
DLQ record with raw payload rather than blocking the queue head forever.
