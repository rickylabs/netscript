# Independent follow-up source review

Separate read-only Sol reviewer, same session as the original acceptance review.

**FAIL_FIX — follow-up source slice.**

One required fix: the new filters can suppress executable reads because `isInsideQuotedStringLiteral` treats quotes inside regex literals as opening string delimiters.

```ts
const apostrophe = /'/;
await Deno.readTextFile(new URL("./asset.txt", import.meta.url));
```

The previous detector reports this read; the proposed filter skips it. The same regression affects `readFile` and aliased URL reads: filtering can discard both the real URL declaration and its read.

An in-memory reproduction of the reviewed predicates confirmed **1→0 findings across all four combinations**. Repository tests were not rerun.

Make the quoted-data filtering distinguish regex literals from actual strings, and add executable-read regressions for both methods and both addressing forms. Retain the supplied quoted-source and template-interpolation controls.

The reported 19 passing tests do not cover this regression. Prior showcase and Astra acceptance remains unchanged; this verdict makes no claim about remote CI completion.
