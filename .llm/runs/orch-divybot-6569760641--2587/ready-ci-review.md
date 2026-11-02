**PASS — narrow regression repair for PR #2589 / issue #2587.**

The supplied changes correct stale fixtures and expectations to match the previously reviewed product contracts. I found no substantive failure being hidden or negative control being weakened.

- **Route-template expectations:** Replacing `Donut` with explicit column/bar `ChartBlock` assertions matches the approved UI change and checks the status label/count mapping. The create/update assertions now require typed `ServiceHandlerContext` bindings and forwarding `actor(context)`. List/delete bindings and the prohibitions on persistence access remain checked.
- **Memory isolation:** Reusing the same search query checks the actual mutated record in a fresh repository instance. The ID comparison prevents an unrelated row from satisfying the assertion. The earlier check still requires the original snapshot to remain `awaiting_payment` while the update result is `cancelled`, so shared-state leakage would fail the fresh-instance comparison. This is a stronger isolation check than assuming the globally newest row is `paid`.
- **Golden scaffold inventory:** Adding the activity adapter and domain files reflects the intentional generated surface in both variants. Exact inventory equality, rerun skip counts, runnable-test detection, and the negative controls against ORM calls, pagination, and sorting in routers remain intact.
- **Authentication fixture:** Supplying `Date` timestamps in both the fake Prisma row and its Zod schema matches the persisted model and satisfies the existing activity contract. It does not weaken `ActivityRecord`, bypass type checking, or change the authentication expectations. Anonymous, bearer, cookie-only, scope-denial, concurrent credential isolation, and `no-store` assertions remain present.
- **Generated consumer coverage:** The real add-handler/type-check/test path and typed missing-record `NOT_FOUND` check remain intact. Regenerating the embedded assets is appropriate because the repaired memory test is shipped to consumers.

The supplied combined receipt reports **45 passed, 0 failed, 0 ignored**, with reproduction receipts consistent with the stated stale-expectation failures. The four carrier tasks are reported successful; I have not independently inspected their generated output.

This verdict is based solely on the self-contained packet. I used no tools or network and ran no tests. It covers these regression repairs; pending CI must still establish that the pushed revision passes the full required gate set.
