import { renderCopiedProse } from '../../packages/fresh-ui/tests/contracts/utility-prose.ts';

/** Generated fixture is real installed, sanitized output, never hand-written Markdown stand-ins. */
const html = await renderCopiedProse(undefined, { class: 'ns-lede' });
await Deno.writeTextFile(
  'test-results/prose-fixture.ts',
  `export const copiedProseHtml = ${JSON.stringify(html)};\n`,
);
