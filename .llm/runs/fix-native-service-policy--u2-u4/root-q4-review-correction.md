# Root Q4 final test-oracle correction

Root read the complete two-owner diff and handoff. The152-line adapter preserves the native
resolver, lazy reader acquisition, zero prefetch, Request signal and successful completion semantics.
Actual14/0 owning,630/1 broad service and26/0 consumers plus scoped/publication checks are useful
evidence; the Windows mapped peer and cold DB failures remain open. Source is not yet accepted.

One test oracle needs strengthening before checkpoint: disconnect currently asserts only that the
observed error differs from the primary handler Error. That does not independently establish that
the handler was never entered. Add an explicit entry counter/flag and assert zero on disconnect,
one on the completed-body handler-error branch. Preserve the real native socket/fetch paths and
all original assertions. No production change is requested.

Authorize at most three extra formatted lines beyond the319-line candidate (test cap322) solely
for this meaningful oracle, or a clearer equivalent inside the original320. This is a precise root
rescope, not a general growth allowance. Re-run14 owning tests with sanitizers and selected static
checks for the changed test. Do not repeat passed broad/publication checks absent a new production
change or failure; retain their original receipts and unchanged source hash. Return final test hash
and concrete handler-entry evidence for root source acceptance; no checkpoint before acceptance.
