import { assertEquals } from '@std/assert';
import { mergeClaudeGuidance } from './claude-guidance.ts';

const ROUTE = 'On Claude Code, call the `repo-skills` bridge with the requested skill name.';
const BOOTSTRAP = `@AGENTS.md\n${ROUTE}\n`;

const cases = [
  { name: 'empty', original: '', expected: BOOTSTRAP },
  { name: 'missing import', original: '# Local\n', expected: `${BOOTSTRAP}\n# Local\n` },
  { name: 'existing import', original: '@AGENTS.md\n# Local\n', expected: `${BOOTSTRAP}# Local\n` },
  {
    name: 'equivalent relative import',
    original: '@./AGENTS.md\n# Local\n',
    expected: `@./AGENTS.md\n${ROUTE}\n# Local\n`,
  },
  {
    name: 'import without final newline',
    original: '# Local\n@AGENTS.md',
    expected: `# Local\n${BOOTSTRAP}`,
  },
  {
    name: 'complete bootstrap',
    original: `${BOOTSTRAP}# Local\n`,
    expected: `${BOOTSTRAP}# Local\n`,
  },
  {
    name: 'existing route without import',
    original: `${ROUTE}\n# Local\n`,
    expected: `@AGENTS.md\n\n${ROUTE}\n# Local\n`,
  },
  {
    name: 'BOM with absent import',
    original: '\uFEFF# Local\n',
    expected: `\uFEFF${BOOTSTRAP}\n# Local\n`,
  },
  {
    name: 'BOM with equivalent import',
    original: '\uFEFF@./AGENTS.md\n',
    expected: `\uFEFF@./AGENTS.md\n${ROUTE}\n`,
  },
  {
    name: 'CRLF',
    original: '@AGENTS.md\r\n# Local\r\n',
    expected: `@AGENTS.md\r\n${ROUTE}\r\n# Local\r\n`,
  },
  {
    name: 'fenced example',
    original: `\`\`\`md\n@AGENTS.md\n${ROUTE}\n\`\`\`\n`,
    expected: `${BOOTSTRAP}\n\`\`\`md\n@AGENTS.md\n${ROUTE}\n\`\`\`\n`,
  },
  {
    name: 'tilde fence',
    original: '~~~~md\n@./AGENTS.md\n~~~~\n',
    expected: `${BOOTSTRAP}\n~~~~md\n@./AGENTS.md\n~~~~\n`,
  },
  {
    name: 'lookalike import',
    original: '@AGENTS.md.backup\n',
    expected: `${BOOTSTRAP}\n@AGENTS.md.backup\n`,
  },
];

for (const { name, original, expected } of cases) {
  Deno.test(`#2008 review: mergeClaudeGuidance ${name}`, () => {
    assertEquals(mergeClaudeGuidance(original, BOOTSTRAP), expected);
    assertEquals(mergeClaudeGuidance(expected, BOOTSTRAP), expected);
  });
}
