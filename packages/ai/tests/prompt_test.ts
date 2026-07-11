import { assertEquals, assertInstanceOf, assertThrows } from '@std/assert';
import {
  composeSystemPrompt,
  DuplicatePromptSectionError,
  PromptAssembler,
  SYSTEM_PROMPT_SECTION_SEPARATOR,
} from '../mod.ts';
import type { AgentLoopInput } from '../agent.ts';

Deno.test('composeSystemPrompt orders by precedence with insertion-order ties', () => {
  const prompt = composeSystemPrompt([
    { name: 'app', precedence: 30, content: 'App instructions' },
    { name: 'skills', precedence: 10, content: 'Skills' },
    { name: 'memory', precedence: 20, content: 'Memory' },
    { name: 'catalog', precedence: 20, content: 'Catalog' },
  ]);

  assertEquals(
    prompt,
    ['Skills', 'Memory', 'Catalog', 'App instructions'].join(
      SYSTEM_PROMPT_SECTION_SEPARATOR,
    ),
  );
});

Deno.test('composeSystemPrompt lets precedence override contribution order', () => {
  assertEquals(
    composeSystemPrompt([
      { name: 'last-contributed', precedence: -1, content: 'First' },
      { name: 'first-contributed', precedence: 100, content: 'Second' },
    ]),
    'First\n\nSecond',
  );
});

Deno.test('composeSystemPrompt drops blank sections and trims retained content', () => {
  assertEquals(
    composeSystemPrompt([
      { name: 'empty', precedence: 0, content: '  \n ' },
      { name: 'kept', precedence: 1, content: '\n Keep me \n' },
    ]),
    'Keep me',
  );
  assertEquals(composeSystemPrompt([]), '');
});

Deno.test('composeSystemPrompt rejects duplicate names with a typed error', () => {
  const error = assertThrows(
    () =>
      composeSystemPrompt([
        { name: 'skills', precedence: 1, content: '' },
        { name: 'skills', precedence: 2, content: 'duplicate' },
      ]),
    DuplicatePromptSectionError,
  );

  assertInstanceOf(error, DuplicatePromptSectionError);
  assertEquals(error.sectionName, 'skills');
});

Deno.test('PromptAssembler result fits the agent-loop system input unchanged', () => {
  const assembler = new PromptAssembler([
    { name: 'skills', precedence: 10, content: 'Use loaded skills.' },
    { name: 'app', precedence: 20, content: 'Answer concisely.' },
  ]);
  const input: AgentLoopInput = {
    model: 'test:model',
    messages: [],
    system: assembler.compose(),
  };

  assertEquals(input.system, 'Use loaded skills.\n\nAnswer concisely.');
});
