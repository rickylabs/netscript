# Pre-change quality baseline

At 7907293f3dad3aeb557923809ddcd3435adae151 before production edits, `deno task quality:gate` exits 1 in quality:scan because docs/site/_plugins/markdown-render-fixture.ts:48 contains `return element as unknown as Element;`. This matches #2165 memory. Root coverage passes. Independent `deno task arch:check` exits 0, with existing advisory warnings. Do not broaden #2187 into unrelated docs fixture repairs or call quality:gate green. Record exact baseline/current findings and scoped source results.
