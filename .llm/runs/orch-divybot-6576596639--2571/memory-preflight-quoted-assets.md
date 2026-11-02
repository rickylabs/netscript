# Release preflight must distinguish stored source from executable syntax

The non-draft quality job begins with `deno task release:preflight`, before
receipt-producing gates. Northwind's generated setup constant exposed a false
positive: `Deno.readTextFile(new URL(..., import.meta.url))` occurred inside a
quoted generated template, and the read scanners treated it as package code.

A first reuse of the existing hand-written quote classifier passed the initial
regressions but independent review found it could hide actual reads after a
regex containing a quote. The accepted repair delegates TypeScript/TSX lexical
classification to Babel's existing locked parser version. Validate token ranges,
ignore stored source/comment/regex tokens, and retain executable interpolations.
If classification fails, retain all candidate matches rather than masking them.
No generated-carrier exemption or release-guard allowlist is needed.

Regression controls cover both read APIs, single/double quoted data, inline and
aliased calls, phantom declarations, mixed division/regex, regex quotes and
backticks, file URL/import-attribute guards, executable template interpolation
and malformed source. All 23 related tests pass. Use the release preflight itself
as the real generated-carrier regression, alongside the focused test wrapper.
