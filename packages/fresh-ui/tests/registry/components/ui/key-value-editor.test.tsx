import { assert, assertEquals, assertFalse, assertStringIncludes, assertThrows } from '@std/assert';
import { render } from 'npm:preact-render-to-string@^6.7.0';
import {
  HTTP_HEADER_NAME_PATTERN,
  keyValueFieldName,
  type KeyValueRow,
  parseKeyValueFormData,
  SECRET_FIELD_CLEAR_TOKEN,
  SECRET_FIELD_UNCHANGED_TOKEN,
  validateKeyValueRows,
} from '../../../../interactive.ts';
import { KeyValueEditor } from '../../../../registry/components/ui/key-value-editor.tsx';

Deno.test('KeyValueEditor renders semantic table markup, per-row secret semantics, and indexed inputs', () => {
  const html = render(
    <KeyValueEditor
      id='req-headers'
      name='headers'
      label='Request headers'
      defaultRows={[
        { id: 'r1', key: 'Accept', value: 'application/json' },
        { id: 'r2', key: 'Authorization', secret: true, hasValue: true },
        { id: 'r3', key: 'X-New-Token', secret: true, hasValue: false },
      ]}
    />,
  );

  assertStringIncludes(html, 'data-scope="key-value-editor"');
  assertStringIncludes(html, '<table');
  assertStringIncludes(html, 'scope="col"');
  assertStringIncludes(html, 'name="headers[0][id]" value="r1"');
  assertStringIncludes(html, 'name="headers[0][key]"');
  assertStringIncludes(html, 'name="headers[0][value]"');
  assertStringIncludes(html, 'name="headers[0][secret]" value="false"');
  assertStringIncludes(html, 'name="headers[1][secret]" value="true"');
  assertStringIncludes(
    html,
    `name="headers[1][value]" value="${SECRET_FIELD_UNCHANGED_TOKEN}"`,
  );
  assertStringIncludes(html, 'name="headers[1][action]" value="keep"');
  assertStringIncludes(html, 'data-part="secret-mask"');
  assertStringIncludes(html, 'name="headers[2][value]"');
  assertStringIncludes(html, 'type="password"');
  assertStringIncludes(html, 'autocomplete="new-password"');
  assertStringIncludes(html, 'spellcheck="false"');
  assertStringIncludes(html, 'Add row');
  assertFalse(html.toLowerCase().includes('reveal'), 'secret rows must never render reveal');
});

Deno.test('KeyValueEditor marks empty, duplicate, and pattern-invalid keys with inline errors', () => {
  const html = render(
    <KeyValueEditor
      id='bad-headers'
      name='headers'
      label='Outbound headers'
      keyPattern={HTTP_HEADER_NAME_PATTERN}
      caseInsensitiveKeys
      defaultRows={[
        { id: 'r1', key: 'Accept', value: 'application/json' },
        { id: 'r2', key: 'accept', value: 'text/plain' },
        { id: 'r3', key: 'Bad Header', value: '123' },
        { id: 'r4', key: '', value: 'orphan' },
      ]}
    />,
  );

  assertStringIncludes(html, 'data-state="invalid"');
  assertStringIncludes(html, 'data-invalid="true"');
  assertStringIncludes(html, 'aria-invalid="true"');
  assertStringIncludes(html, 'Duplicate key');
  assertStringIncludes(html, 'Key contains invalid characters.');
  assertStringIncludes(html, 'Key is required.');
});

Deno.test('validateKeyValueRows enforces empty, duplicate (case-insensitive & sensitive), and pattern rules', () => {
  const errors = validateKeyValueRows(
    [
      { id: '1', key: 'X-Api-Key', secret: true, hasValue: true },
      { id: '2', key: 'x-api-key', value: 'dup' },
      { id: '3', key: 'Invalid Key!', value: 'v' },
      { id: '4', key: '   ', value: 'has-value' },
      { id: '5', key: '', value: '' },
    ],
    {
      keyPattern: HTTP_HEADER_NAME_PATTERN,
      caseInsensitiveKeys: true,
      ignoreBlankRows: true,
    },
  );

  assertEquals(
    [...errors.entries()].map(([index, list]) => [index, list.map((e) => e.code)]),
    [
      [2, ['invalid-key-pattern']],
      [3, ['empty-key']],
      [0, ['duplicate-key']],
      [1, ['duplicate-key']],
    ],
  );

  const caseSensitive = validateKeyValueRows(
    [
      { id: '1', key: 'Env', value: 'a' },
      { id: '2', key: 'env', value: 'b' },
    ],
    { caseInsensitiveKeys: false },
  );
  assertEquals(caseSensitive.size, 0);
});

Deno.test('keyValueFieldName and parseKeyValueFormData round-trip plain and secret rows', () => {
  assertEquals(keyValueFieldName('headers', 2, 'value'), 'headers[2][value]');

  const formData = new FormData();
  formData.set('headers[2][id]', 'row-new');
  formData.set('headers[2][key]', 'X-New-Secret');
  formData.set('headers[2][secret]', 'true');
  formData.set('headers[2][value]', 'brand-new-token');
  formData.set('headers[2][action]', 'replace');

  formData.set('headers[0][id]', 'row-plain');
  formData.set('headers[0][key]', 'Accept');
  formData.set('headers[0][secret]', 'false');
  formData.set('headers[0][value]', 'application/json');

  formData.set('headers[1][id]', 'row-keep');
  formData.set('headers[1][key]', 'Authorization');
  formData.set('headers[1][secret]', 'true');
  formData.set('headers[1][value]', SECRET_FIELD_UNCHANGED_TOKEN);
  formData.set('headers[1][action]', 'keep');

  formData.set('headers[3][id]', 'row-clear');
  formData.set('headers[3][key]', 'X-Old-Secret');
  formData.set('headers[3][secret]', 'true');
  formData.set('headers[3][value]', SECRET_FIELD_CLEAR_TOKEN);
  formData.set('headers[3][action]', 'clear');

  formData.set('headers[4][id]', 'row-omit-keep');
  formData.set('headers[4][key]', 'X-Omitted-Keep');
  formData.set('headers[4][secret]', 'true');

  formData.set('headers[5][id]', 'row-empty');
  formData.set('headers[5][key]', '');
  formData.set('headers[5][secret]', 'false');
  formData.set('headers[5][value]', '');

  const parsed = parseKeyValueFormData(formData, 'headers', {
    storedSecretIds: new Set(['row-keep', 'row-clear', 'row-omit-keep']),
  });

  assertEquals(parsed, [
    {
      index: 0,
      id: 'row-plain',
      key: 'Accept',
      secret: false,
      value: 'application/json',
    },
    {
      index: 1,
      id: 'row-keep',
      key: 'Authorization',
      secret: true,
      secretSubmission: { mode: 'keep' },
    },
    {
      index: 2,
      id: 'row-new',
      key: 'X-New-Secret',
      secret: true,
      secretSubmission: { mode: 'replace', value: 'brand-new-token' },
    },
    {
      index: 3,
      id: 'row-clear',
      key: 'X-Old-Secret',
      secret: true,
      secretSubmission: { mode: 'clear' },
    },
    {
      index: 4,
      id: 'row-omit-keep',
      key: 'X-Omitted-Keep',
      secret: true,
      secretSubmission: { mode: 'keep' },
    },
    {
      index: 5,
      id: 'row-empty',
      key: '',
      secret: false,
      value: '',
    },
  ]);
});

Deno.test('parseKeyValueFormData fails closed on non-canonical indices, duplicate subfields, File entries, and invalid secret flags', () => {
  const leadingZero = new FormData();
  leadingZero.set('headers[00][key]', 'Authorization');
  leadingZero.set('headers[00][value]', 'Bearer token');
  assertThrows(
    () => parseKeyValueFormData(leadingZero, 'headers'),
    Error,
    'canonical non-negative integer',
  );

  const duplicateSubfield = new FormData();
  duplicateSubfield.append('headers[0][key]', 'Authorization');
  duplicateSubfield.append('headers[0][value]', 'first');
  duplicateSubfield.append('headers[0][value]', 'second');
  assertThrows(
    () => parseKeyValueFormData(duplicateSubfield, 'headers'),
    Error,
    'Duplicate key-value field',
  );

  const fileValue = new FormData();
  fileValue.set('headers[0][key]', 'Authorization');
  fileValue.set('headers[0][value]', new File(['secret'], 'secret.txt'));
  assertThrows(
    () => parseKeyValueFormData(fileValue, 'headers'),
    Error,
    'expected text value',
  );

  const badSecretFlag = new FormData();
  badSecretFlag.set('headers[0][key]', 'Authorization');
  badSecretFlag.set('headers[0][secret]', 'yes');
  assertThrows(
    () => parseKeyValueFormData(badSecretFlag, 'headers'),
    Error,
    'expected "true" or "false"',
  );
});

Deno.test('KeyValueEditor rejects secret rows carrying plaintext values and controlled secret rows missing stable ids', () => {
  // @ts-expect-error secret rows forbid passing plaintext value.
  const invalidSecretRow: KeyValueRow = { key: 'Authorization', secret: true, value: 'leaked' };
  // @ts-expect-error plain rows forbid passing hasValue.
  const invalidPlainRow: KeyValueRow = { key: 'Accept', hasValue: true };
  assert(Boolean(invalidSecretRow) && Boolean(invalidPlainRow));

  assertThrows(
    () =>
      render(
        <KeyValueEditor
          label='Headers'
          defaultRows={[
            {
              id: 'r1',
              key: 'Authorization',
              secret: true,
              value: 'sk_live_kv_canary_must_not_leak',
            } as unknown as KeyValueRow,
          ]}
        />,
      ),
    TypeError,
  );

  assertThrows(
    () =>
      render(
        <KeyValueEditor
          label='Controlled headers'
          rows={[
            { key: 'Authorization', secret: true, hasValue: true },
          ]}
        />,
      ),
    Error,
    'stable "id"',
  );
});
