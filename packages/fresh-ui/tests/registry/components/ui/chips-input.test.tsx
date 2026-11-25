import { assertEquals, assertFalse, assertStringIncludes } from '@std/assert';
import { render } from 'npm:preact-render-to-string@^6.7.0';
import {
  commitChipTokens,
  normalizeChipSuggestions,
  splitChipText,
  validateEmailChip,
} from '../../../../interactive.ts';
import { ChipsInput } from '../../../../registry/components/ui/chips-input.tsx';

Deno.test('ChipsInput renders chips, list semantics, validation state, and hidden form inputs', () => {
  const html = render(
    <ChipsInput
      id='alerts'
      name='recipients'
      label='Alert recipients'
      defaultValue={['ops@example.com', 'not-an-email']}
      validate={validateEmailChip}
      helpText='Press Enter or comma to add.'
    />,
  );

  assertStringIncludes(html, 'data-scope="chips-input"');
  assertStringIncludes(html, 'data-state="invalid"');
  assertStringIncludes(html, 'role="list"');
  assertStringIncludes(html, 'role="listitem"');
  assertStringIncludes(html, 'ops@example.com');
  assertStringIncludes(html, 'Remove ops@example.com');
  assertStringIncludes(html, 'data-invalid="true"');
  assertStringIncludes(html, 'aria-invalid="true"');
  assertStringIncludes(html, 'Enter a valid email address.');
  assertStringIncludes(html, 'type="hidden" name="recipients" value="ops@example.com"');
  assertStringIncludes(html, 'type="hidden" name="recipients" value="not-an-email"');
});

Deno.test('ChipsInput omits empty role="list", supports csv format, readonly, and Combobox suggestions', () => {
  const emptyHtml = render(
    <ChipsInput id='empty' name='tags' label='Tags' submitFormat='csv' />,
  );
  assertFalse(emptyHtml.includes('role="list"'), 'empty chips must not emit empty ARIA list');
  assertStringIncludes(emptyHtml, '<input type="hidden" name="tags" value=""');

  const csvHtml = render(
    <ChipsInput
      id='csv'
      name='tags'
      label='Tags'
      defaultValue={['alpha', 'beta']}
      submitFormat='csv'
      readOnly
    />,
  );
  assertStringIncludes(csvHtml, 'data-state="readonly"');
  assertStringIncludes(csvHtml, '<input type="hidden" name="tags" value="alpha,beta"');
  assertFalse(csvHtml.includes('data-part="chip-remove"'), 'readonly hides chip remove buttons');

  const comboboxHtml = render(
    <ChipsInput
      id='with-sugg'
      name='owners'
      label='Owners'
      suggestions={['platform@example.com', { value: 'sec@example.com', label: 'Security team' }]}
    />,
  );
  assertStringIncludes(comboboxHtml, 'role="combobox"');
  assertStringIncludes(comboboxHtml, 'aria-autocomplete="list"');
});

Deno.test('splitChipText, validateEmailChip, normalizeChipSuggestions, and commitChipTokens handle edge cases', () => {
  assertEquals(
    splitChipText(' a@example.com, b@example.com; c@example.com\n d@example.com\r\n '),
    ['a@example.com', 'b@example.com', 'c@example.com', 'd@example.com'],
  );

  assertEquals(validateEmailChip('ops@example.com'), null);
  assertEquals(validateEmailChip('bad-email'), 'Enter a valid email address.');
  assertEquals(validateEmailChip(''), 'Enter a valid email address.');

  assertEquals(
    normalizeChipSuggestions([
      'ops@example.com',
      { value: 'sec@example.com', label: 'Security', disabled: true },
    ]),
    [
      { value: 'ops@example.com', label: 'ops@example.com', disabled: false },
      { value: 'sec@example.com', label: 'Security', disabled: true },
    ],
  );

  const marked = commitChipTokens(
    [{ value: 'ops@example.com' }],
    ['OPS@example.com', 'bad-email', 'sec@example.com', 'extra@example.com'],
    {
      validate: validateEmailChip,
      invalidBehavior: 'mark',
      maxChips: 3,
    },
  );
  assertEquals(marked.items, [
    { value: 'ops@example.com' },
    { value: 'bad-email', invalid: true, error: 'Enter a valid email address.' },
    { value: 'sec@example.com' },
  ]);
  assertEquals(marked.added.map((item) => item.value), ['bad-email', 'sec@example.com']);
  assertEquals(marked.rejected, [
    { value: 'OPS@example.com', reason: 'OPS@example.com is already added.' },
    { value: 'extra@example.com', reason: 'Maximum of 3 items reached.' },
  ]);

  const rejected = commitChipTokens(
    [],
    ['bad-email', 'good@example.com'],
    { validate: validateEmailChip, invalidBehavior: 'reject' },
  );
  assertEquals(rejected.items, [{ value: 'good@example.com' }]);
  assertEquals(rejected.rejected, [
    { value: 'bad-email', reason: 'Enter a valid email address.' },
  ]);
});
