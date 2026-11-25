import { assert, assertEquals, assertFalse, assertStringIncludes } from '@std/assert';
import { render } from 'npm:preact-render-to-string@^6.7.0';
import {
  deriveSecretFieldAction,
  deriveSecretFieldState,
  resolveSecretFieldSubmission,
  resolveSecretHiddenValue,
  SECRET_FIELD_CLEAR_TOKEN,
  SECRET_FIELD_UNCHANGED_TOKEN,
} from '../../../../interactive.ts';
import { SecretField } from '../../../../registry/components/ui/secret-field.tsx';

Deno.test('SecretField renders unset state with write-only password hygiene and no reveal button', () => {
  const html = render(
    <SecretField
      id='api-key'
      name='api_key'
      label='API Key'
      placeholder='Enter API key'
      helpText='Encrypted at rest.'
    />,
  );

  assertStringIncludes(html, 'data-scope="secret-field"');
  assertStringIncludes(html, 'data-state="unset"');
  assertStringIncludes(html, 'type="password"');
  assertStringIncludes(html, 'autocomplete="new-password"');
  assertStringIncludes(html, 'spellcheck="false"');
  assertStringIncludes(html, 'autocapitalize="off"');
  assertStringIncludes(html, 'autocorrect="off"');
  assertStringIncludes(html, 'name="api_key"');
  assertStringIncludes(html, 'for="api-key-input"');
  assertStringIncludes(html, 'aria-describedby="api-key-status api-key-input-help"');
  assertStringIncludes(html, 'Not set');
  assertFalse(html.toLowerCase().includes('reveal'), 'must never render a reveal control');
  assertFalse(html.includes(SECRET_FIELD_UNCHANGED_TOKEN), 'unset field must not submit keep');
});

Deno.test('SecretField renders set state with masked placeholder, Replace/Clear actions, and unchanged token', () => {
  const html = render(
    <SecretField
      id='webhook-secret'
      name='webhook_secret'
      actionName='webhook_secret_action'
      label='Webhook secret'
      hasValue
    />,
  );

  assertStringIncludes(html, 'data-state="set"');
  assertStringIncludes(html, 'data-part="mask"');
  assertStringIncludes(html, '<span>Set</span>');
  assertStringIncludes(html, 'Replace');
  assertStringIncludes(html, 'Clear');
  assertStringIncludes(
    html,
    `<input type="hidden" name="webhook_secret" value="${SECRET_FIELD_UNCHANGED_TOKEN}"`,
  );
  assertStringIncludes(html, '<input type="hidden" name="webhook_secret_action" value="keep"');
  assertFalse(html.includes('type="password"'), 'set state hides input until Replace is activated');
  assertFalse(html.toLowerCase().includes('reveal'), 'must never render a reveal control');
});

Deno.test('SecretField unchangedMode="omit" omits value hidden input while preserving actionName', () => {
  const html = render(
    <SecretField
      id='omit-secret'
      name='signing_secret'
      actionName='signing_secret_action'
      label='Signing secret'
      hasValue
      unchangedMode='omit'
    />,
  );

  assertStringIncludes(html, 'data-state="set"');
  assertFalse(html.includes('name="signing_secret"'), 'omit mode must not emit value input');
  assertStringIncludes(html, 'name="signing_secret_action" value="keep"');
});

Deno.test('SecretField renders rotating, invalid, readonly, and disabled states', () => {
  const rotatingHtml = render(
    <SecretField id='rot' name='rot' label='Token' hasValue state='rotating' />,
  );
  assertStringIncludes(rotatingHtml, 'data-state="rotating"');
  assertStringIncludes(rotatingHtml, 'type="password"');
  assertStringIncludes(rotatingHtml, '<span>Rotating</span>');
  assertStringIncludes(rotatingHtml, 'Cancel');

  const invalidHtml = render(
    <SecretField
      id='inv'
      name='inv'
      label='Token'
      error='Token must be at least 32 characters.'
    />,
  );
  assertStringIncludes(invalidHtml, 'data-state="invalid"');
  assertStringIncludes(invalidHtml, 'aria-invalid="true"');
  assertStringIncludes(invalidHtml, 'aria-describedby="inv-status inv-error"');
  assertStringIncludes(invalidHtml, 'role="alert"');
  assertStringIncludes(invalidHtml, 'Token must be at least 32 characters.');

  const readonlyHtml = render(
    <SecretField id='ro' name='ro' label='Managed secret' hasValue readOnly />,
  );
  assertStringIncludes(readonlyHtml, 'data-state="readonly"');
  assertStringIncludes(readonlyHtml, '<span>Read-only</span>');
  assertFalse(readonlyHtml.includes('aria-readonly='), 'role=group must not carry aria-readonly');
  assertFalse(readonlyHtml.includes('data-action="replace"'));
  assertFalse(readonlyHtml.includes('data-action="clear"'));

  const disabledHtml = render(
    <SecretField id='dis' name='dis' label='Disabled secret' hasValue disabled />,
  );
  assertStringIncludes(disabledHtml, 'data-disabled="true"');
  assertFalse(disabledHtml.includes('type="hidden"'), 'disabled field omits hidden inputs');
});

Deno.test('SecretField state and action derivation cover all server-side keep/replace/clear cases', () => {
  assertEquals(
    deriveSecretFieldState({
      hasStoredValue: false,
      isRotating: false,
      isCleared: false,
      hasDraft: false,
      readOnly: false,
      invalid: false,
    }),
    'unset',
  );
  assertEquals(
    deriveSecretFieldState({
      hasStoredValue: true,
      isRotating: false,
      isCleared: false,
      hasDraft: false,
      readOnly: false,
      invalid: false,
    }),
    'set',
  );
  assertEquals(
    deriveSecretFieldState({
      hasStoredValue: true,
      isRotating: true,
      isCleared: false,
      hasDraft: false,
      readOnly: false,
      invalid: false,
    }),
    'rotating',
  );
  assertEquals(
    deriveSecretFieldState({
      hasStoredValue: true,
      isRotating: true,
      isCleared: false,
      hasDraft: true,
      readOnly: false,
      invalid: true,
    }),
    'invalid',
  );
  assertEquals(
    deriveSecretFieldState({
      hasStoredValue: true,
      isRotating: false,
      isCleared: false,
      hasDraft: false,
      readOnly: true,
      invalid: false,
    }),
    'readonly',
  );

  assertEquals(
    deriveSecretFieldAction({ hasStoredValue: true, isCleared: false, hasDraft: false }),
    'keep',
  );
  assertEquals(
    deriveSecretFieldAction({ hasStoredValue: true, isCleared: false, hasDraft: true }),
    'replace',
  );
  assertEquals(
    deriveSecretFieldAction({ hasStoredValue: true, isCleared: true, hasDraft: false }),
    'clear',
  );
  assertEquals(
    deriveSecretFieldAction({ hasStoredValue: false, isCleared: false, hasDraft: false }),
    'unset',
  );
  assertEquals(
    deriveSecretFieldAction({ hasStoredValue: false, isCleared: false, hasDraft: true }),
    'replace',
  );

  const tokens = {
    unchangedToken: SECRET_FIELD_UNCHANGED_TOKEN,
    clearToken: SECRET_FIELD_CLEAR_TOKEN,
  };
  assertEquals(
    resolveSecretHiddenValue({ action: 'keep', unchangedMode: 'token', ...tokens }),
    SECRET_FIELD_UNCHANGED_TOKEN,
  );
  assertEquals(
    resolveSecretHiddenValue({ action: 'keep', unchangedMode: 'omit', ...tokens }),
    undefined,
  );
  assertEquals(
    resolveSecretHiddenValue({ action: 'clear', unchangedMode: 'token', ...tokens }),
    SECRET_FIELD_CLEAR_TOKEN,
  );
  assertEquals(
    resolveSecretHiddenValue({ action: 'clear', unchangedMode: 'omit', ...tokens }),
    SECRET_FIELD_CLEAR_TOKEN,
  );
  assertEquals(
    resolveSecretHiddenValue({ action: 'replace', unchangedMode: 'token', ...tokens }),
    undefined,
  );
  assertEquals(
    resolveSecretHiddenValue({ action: 'unset', unchangedMode: 'token', ...tokens }),
    undefined,
  );
});

Deno.test('resolveSecretFieldSubmission interprets keep, replace, clear, and unset safely', () => {
  assertEquals(
    resolveSecretFieldSubmission(SECRET_FIELD_UNCHANGED_TOKEN, { hadStoredSecret: true }),
    { mode: 'keep' },
  );
  assertEquals(
    resolveSecretFieldSubmission(null, { hadStoredSecret: true }),
    { mode: 'keep' },
  );
  assertEquals(
    resolveSecretFieldSubmission('', { hadStoredSecret: true }),
    { mode: 'keep' },
  );
  assertEquals(
    resolveSecretFieldSubmission(SECRET_FIELD_CLEAR_TOKEN, { hadStoredSecret: true }),
    { mode: 'clear' },
  );
  assertEquals(
    resolveSecretFieldSubmission('', { hadStoredSecret: true, action: 'clear' }),
    { mode: 'clear' },
  );
  assertEquals(
    resolveSecretFieldSubmission('rotated-credential-value', { hadStoredSecret: true }),
    { mode: 'replace', value: 'rotated-credential-value' },
  );
  assertEquals(
    resolveSecretFieldSubmission('', { hadStoredSecret: false }),
    { mode: 'unset' },
  );
  assertEquals(
    resolveSecretFieldSubmission(null, { hadStoredSecret: false }),
    { mode: 'unset' },
  );
  assertEquals(
    resolveSecretFieldSubmission('__custom_keep__', {
      hadStoredSecret: true,
      unchangedToken: '__custom_keep__',
    }),
    { mode: 'keep' },
  );
  assertEquals(
    resolveSecretFieldSubmission('__custom_clear__', {
      hadStoredSecret: true,
      clearToken: '__custom_clear__',
    }),
    { mode: 'clear' },
  );
});

Deno.test('SecretField type contract rejects passing stored secret values', () => {
  // @ts-expect-error value is intentionally disallowed on SecretFieldProps.
  const disallowedValue = <SecretField label='Secret' value='leaked' />;
  // @ts-expect-error defaultValue is intentionally disallowed on SecretFieldProps.
  const disallowedDefault = <SecretField label='Secret' defaultValue='leaked' />;
  assert(Boolean(disallowedValue) && Boolean(disallowedDefault));
});
