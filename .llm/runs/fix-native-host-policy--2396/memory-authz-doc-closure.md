# Native auth type additions invalidate factory public closure

Incoming main changes AuthzDecision to reference optional ProcedureErrorCode. Both singular worker/stream factory entrypoints re-export AuthzDecision, but their exact accepted public closures (22/21 names) omit this new type. Both structured doc:lint checks now report one private-type-ref, and the unchanged workers public-entrypoint test fails. This is a real integration failure, not the noisy npm @types/node warnings emitted earlier in the same child.

Reproduce without a raw root verdict:

    deno task doc:lint --root plugins/workers --entrypoints services/mod.ts --pretty
    deno task doc:lint --root plugins/streams --entrypoints services/mod.ts --pretty

Do not hide it by excluding the new service subpath, suppressing doc diagnostics or silently expanding the exact named F5 debt bounds. The carrier-only reconciliation retains all source and debt; the coordinator must authorize a native closure/debt disposition.
