import { assert, assertEquals } from '@std/assert';
import { docContentBytes, extractDocContent } from '../src/domain/docs/faithful-extraction.ts';
import { DOC_CONTENT_BUDGET } from '../src/domain/docs/doc-retrieval-contract.ts';

Deno.test('review regression: inline prose before late fence cannot starve code or headings', () => {
  const paragraph = 'Read `inlineCode` and [linked material](https://example.test/guide). ' +
    'Lengthy contextual prose with complete words. '.repeat(80) + '\n\n';
  const fence = '```sh\n' + 'deno task late-command\n'.repeat(150) + '```\n';
  const source = '# Beginning\n\n' + paragraph.repeat(8) + '## Late heading\n\n' + fence;
  const result = extractDocContent(source);
  assert(result.content.includes(fence), 'The late fence must survive earlier protected prose.');
  assert(result.content.includes('# Beginning\n'));
  assert(result.content.includes('## Late heading\n'));
  assert(docContentBytes(result.content) <= DOC_CONTENT_BUDGET);
  assert(!result.content.includes('\n\n\n'), 'Assembly must not duplicate block blank separators.');
  const crlf = extractDocContent(source.replaceAll('\n', '\r\n'));
  assert(!/(?:\r?\n){3}/.test(crlf.content), 'CRLF blank separators must also be preserved.');
});

Deno.test('code selection favors several cheap late fences over one expensive early fence', () => {
  const expensive = '```txt\n' + 'large '.repeat(1950) + '\n```\n';
  const cheap = Array.from(
    { length: 10 },
    (_, index) => `~~~sh\ndeno task command-${index}\n${'echo text\n'.repeat(55)}~~~\n`,
  );
  const result = extractDocContent('# Commands\n\n' + expensive + '\n' + cheap.join('\n'));
  for (const fence of cheap) assert(result.content.includes(fence));
  assert(!result.content.includes(expensive));
  assert(result.omitted.blocks >= 1);
});

Deno.test('protected prose retains only the containing sentence and does not promote word-colon prose', () => {
  const text =
    'Opening explanation. Use `exactSpan` with [docs](https://example.test). Unrelated ending.\n\n';
  const source = '# Prose\n\n' + text.repeat(250) + 'Note: ' + 'unpunctuated prose '.repeat(900);
  const result = extractDocContent(source);
  assert(result.content.includes('Use `exactSpan` with [docs](https://example.test).'));
  assert(!result.content.includes('Unrelated ending.'));
  assert(!result.content.includes('Note:'));
  assertEquals(result.content.includes('…[truncated]'), false);
});
