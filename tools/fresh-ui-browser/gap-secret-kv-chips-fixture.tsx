import { useState } from 'preact/hooks';
import {
  HTTP_HEADER_NAME_PATTERN,
  parseKeyValueFormData,
  resolveSecretFieldSubmission,
  validateEmailChip,
} from '@netscript/fresh-ui/interactive';
import { SecretField } from '../../packages/fresh-ui/registry/components/ui/secret-field.tsx';
import { KeyValueEditor } from '../../packages/fresh-ui/registry/components/ui/key-value-editor.tsx';
import { ChipsInput } from '../../packages/fresh-ui/registry/components/ui/chips-input.tsx';

async function sha256Hex(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/** Browser fixture exercising write-only SecretField, KeyValueEditor, and ChipsInput contracts. */
export function SecretKvChips() {
  const [tokenSubmission, setTokenSubmission] = useState('');
  const [omitSubmission, setOmitSubmission] = useState('');
  const [kvSubmission, setKvSubmission] = useState('');
  const [chipsSubmission, setChipsSubmission] = useState('');

  return (
    <section aria-label='Secret, key-value, and chips components' id='secret-kv-chips'>
      <h2>Secret, key-value, and chips components</h2>

      <form
        id='secret-form-token'
        onSubmit={(event) => {
          event.preventDefault();
          const fd = new FormData(event.currentTarget);
          const raw = fd.get('webhook_secret');
          const action = fd.get('webhook_secret_action');
          const parsed = resolveSecretFieldSubmission(raw, {
            hadStoredSecret: true,
            action,
          });
          const rawText = typeof raw === 'string' ? raw : '';
          void sha256Hex(rawText).then((digest) => {
            setTokenSubmission(
              JSON.stringify({
                mode: parsed.mode,
                action: typeof action === 'string' ? action : '',
                hasField: fd.has('webhook_secret'),
                digest,
              }),
            );
          });
        }}
      >
        <SecretField
          id='sf-token'
          name='webhook_secret'
          actionName='webhook_secret_action'
          label='Webhook signing secret'
          hasValue
          helpText='Stored value is never displayed.'
        />
        <button type='submit'>Save token secret</button>
        <output aria-label='Token secret submission'>{tokenSubmission}</output>
      </form>

      <form
        id='secret-form-omit'
        onSubmit={(event) => {
          event.preventDefault();
          const fd = new FormData(event.currentTarget);
          const raw = fd.get('omit_secret');
          const parsed = resolveSecretFieldSubmission(raw, { hadStoredSecret: true });
          setOmitSubmission(JSON.stringify({ mode: parsed.mode, hasField: fd.has('omit_secret') }));
        }}
      >
        <SecretField
          id='sf-omit'
          name='omit_secret'
          label='Omit mode secret'
          hasValue
          unchangedMode='omit'
        />
        <button type='submit'>Save omit secret</button>
        <output aria-label='Omit secret submission'>{omitSubmission}</output>
      </form>

      <SecretField
        id='sf-unset'
        name='unset_secret'
        label='Fresh signing secret'
        placeholder='Enter new secret'
      />
      <SecretField
        id='sf-invalid'
        name='invalid_secret'
        label='Invalid secret'
        error='Credential must be at least 32 characters.'
      />
      <SecretField
        id='sf-readonly'
        name='readonly_secret'
        label='Managed secret'
        hasValue
        readOnly
      />

      <form
        id='kv-form'
        onSubmit={(event) => {
          event.preventDefault();
          const fd = new FormData(event.currentTarget);
          const rows = parseKeyValueFormData(fd, 'headers', {
            storedSecretIds: new Set(['hdr-2']),
          });
          // Never echo plaintext secret values into the DOM; record only metadata.
          const safeSummary = rows.map((row) =>
            row.secret
              ? {
                id: row.id,
                key: row.key,
                secret: true,
                mode: row.secretSubmission?.mode,
                length: row.secretSubmission?.mode === 'replace'
                  ? row.secretSubmission.value.length
                  : 0,
              }
              : { id: row.id, key: row.key, secret: false, value: row.value }
          );
          setKvSubmission(JSON.stringify(safeSummary));
        }}
      >
        <KeyValueEditor
          id='kv-headers'
          name='headers'
          label='Outbound request headers'
          keyPattern={HTTP_HEADER_NAME_PATTERN}
          caseInsensitiveKeys
          defaultRows={[
            { id: 'hdr-1', key: 'Accept', value: 'application/json' },
            { id: 'hdr-2', key: 'Authorization', secret: true, hasValue: true },
          ]}
        />
        <button type='submit'>Save headers</button>
        <output aria-label='KV submission'>{kvSubmission}</output>
      </form>

      <form
        id='chips-email-form'
        onSubmit={(event) => {
          event.preventDefault();
          const fd = new FormData(event.currentTarget);
          setChipsSubmission(JSON.stringify(fd.getAll('recipients')));
        }}
      >
        <ChipsInput
          id='chips-email'
          name='recipients'
          label='Alert recipients'
          validate={validateEmailChip}
          placeholder='Add recipient email'
          helpText='Press Enter or comma to commit.'
        />
        <button type='submit'>Save recipients</button>
        <output aria-label='Submitted recipients'>{chipsSubmission}</output>
      </form>

      <div id='chips-sugg-box'>
        <ChipsInput
          id='chips-sugg'
          name='owners'
          label='Team owners'
          suggestions={[
            'ops@example.com',
            'oncall@example.com',
            'security@example.com',
          ]}
          placeholder='Filter team owners'
        />
      </div>

      <ChipsInput
        id='chips-ro'
        label='Read-only tags'
        defaultValue={['production']}
        readOnly
      />
    </section>
  );
}
