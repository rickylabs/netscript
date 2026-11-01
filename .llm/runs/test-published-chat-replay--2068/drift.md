# Drift

2026-10-31: next tracker cell after two completed F1 leaves. Verification-only partial issue scope matches coordinator Step0. No framework source or external consumer repo changes. API-inspection cache is separate from the actual cold proof cache. No drift yet.

2026-10-31 plan correction: native standalone lock includes workspace.dependencies metadata. Preserve that legitimate metadata rather than manually modifying the generated lock; prohibit actual workspace links/members and local framework graph aliases. Evidence from isolated research install.

2026-10-31 tooling correction: the structured test wrapper imports bare @std/path, so the parent wrapper process requires the repository tooling config, frozen. The actual child test/check/lint/fmt processes still receive the isolated consumer config explicitly and inherit consumer cwd/cache. Their probe graph is checked separately. Captured the native standalone lock as consumer.lock.json and proved a further cold run with frozen install; no root lock changes. This strengthens reproducibility without changing the locked verification scope.

2026-10-31 implementation review correction: retained seed history and disposal now have positive assertions. Stronger reload checks exposed the controlled fixture's incorrect treatment of native -1 start cursor; fixed per upstream client's public Offset contract. Reopened subscribers receive suffix events only, so the test asserts disposal of a pending read rather than expecting an invented history replay. Source hashes exclude Deno's variable cache metadata footer. No production regression claimed from the faulty fixture and no reduction of acceptance.
