import { assert, assertEquals } from '@std/assert';

const sourceUrl = new URL('../src/client/errors.ts', import.meta.url);
const referenceUrl = new URL('../../../docs/site/reference/sdk/index.md', import.meta.url);

for (const symbol of ['safe', 'isDefinedError', 'SafeResult', 'SafeFailure']) {
  Deno.test(`${symbol} reference summary matches discriminant-first JSDoc`, async () => {
    const source = await Deno.readTextFile(sourceUrl);
    const reference = await Deno.readTextFile(referenceUrl);
    const comments = source.matchAll(
      /\/\*\*((?:[^*]|\*(?!\/))*)\*\/\s*export (?:type|(?:async )?function) (\w+)/g,
    );
    const declaration = Array.from(comments).find((match) => match[2] === symbol);
    assert(declaration, `Missing public JSDoc for ${symbol}`);
    const summary = declaration[1]
      .split(/\n\s*\*\s*\n/)[0]
      .replace(/^\s*\* ?/gm, '')
      .trim()
      .replace(/\s*\n\s*/g, ' ')
      // Inline links render as the linked symbol's code text in the reference summary.
      .replace(/\{@link (\w+)\}/g, '`$1`');
    const row = reference.split('\n').find((line) =>
      line.split('|')[1]?.trim() === `\`${symbol}\``
    );
    assert(row, `Missing reference row for ${symbol}`);
    assertEquals(row.split('|')[3].trim(), summary, `${symbol} documentation drift`);
    const success = summary.indexOf('`isSuccess`');
    const defined = summary.indexOf('`isDefined`');
    assert(success >= 0 && defined > success, `${symbol} must lead with discriminant narrowing`);
  });
}
