# Native availability code source repair and accurate surface evidence

Coordinator #2474 comment6541660112 authorizes a canonical explicit ProcedureErrorCode
union, retaining the two native literal values, and one facade type export each at23/22.
Deno isolatedDeclarations rejects an inferred exported as-const-satisfies declaration;
annotate the constant with its existing exact readonly literal property shape. Both actual
facade doc-lint commands pass, and targeted availability/public tests pass15/0/0.

The repo surface-diff normalizer hashes declaration syntax rather than resolved TS types.
It reports four major-classified raw changes (alias+const at root/auth). Deno doc previously
widens inferred as-const properties to string and omits readonly; explicit annotations render
the actual old compiler shape. Do not conceal this raw diff or invent a breaking declaration.
A separate structured compiler/runtime fixture imports ACTUAL baseline native source (from
git show) and current public root/auth: all IsExact checks and runtime equality pass1/0/0.
This proves no effective consumer API or runtime constant change, so24/23 fallback is unused.
