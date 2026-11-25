import { useState } from 'preact/hooks';
import {
  HTTP_HEADER_NAME_PATTERN,
  type KeyValueRow,
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
  const [tokenHasStored, setTokenHasStored] = useState(true);
  const [tokenSubmission, setTokenSubmission] = useState('');
  const [omitSubmission, setOmitSubmission] = useState('');
  const [failStatus, setFailStatus] = useState('');
  const [invalidRetryCount, setInvalidRetryCount] = useState(0);
  const [kvSubmission, setKvSubmission] = useState('');
  const [controlledRows, setControlledRows] = useState<readonly KeyValueRow[]>([
    { id: 'c-1', key: 'X-Region', value: 'eu-west' },
    { id: 'c-2', key: 'X-Token', secret: true, hasValue: true },
  ]);
  const [controlledSecretEmittedValue, setControlledSecretEmittedValue] = useState(false);
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
            hadStoredSecret: tokenHasStored,
            action,
          });
          if (parsed.mode === 'replace') setTokenHasStored(true);
          else if (parsed.mode === 'clear') setTokenHasStored(false);
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
          hasValue={tokenHasStored}
          helpText='Stored value is never displayed.'
        />
        <button type='submit'>Save token secret</button>
        <button type='reset'>Reset token secret</button>
        <output aria-label='Token secret submission'>{tokenSubmission}</output>
      </form>

      <form
        id='secret-form-native-post'
        method='post'
        action='/echo-secret-digest'
        target='native-post-frame'
      >
        <SecretField
          id='sf-native-post'
          name='webhook_secret'
          actionName='webhook_secret_action'
          label='Native POST secret'
          hasValue
        />
        <button type='submit'>Submit native POST</button>
      </form>
      <iframe
        name='native-post-frame'
        title='Native POST digest response'
        width={300}
        height={40}
      />

      <form
        id='secret-form-fail'
        onSubmit={(event) => {
          event.preventDefault();
          const fd = new FormData(event.currentTarget);
          // Simulate rejected/failed save: never flip server-owned hasValue props.
          setFailStatus(
            JSON.stringify({
              unsetAction: fd.get('fail_unset_action'),
              setAction: fd.get('fail_set_action'),
              rejected: true,
            }),
          );
        }}
      >
        <SecretField
          id='sf-fail-unset'
          name='fail_unset'
          actionName='fail_unset_action'
          label='Rejected unset secret'
          hasValue={false}
          placeholder='Enter secret that will fail'
        />
        <SecretField
          id='sf-fail-set'
          name='fail_set'
          actionName='fail_set_action'
          label='Rejected clear secret'
          hasValue
        />
        <button type='submit'>Attempt rejected save</button>
        <output aria-label='Rejected secret status'>{failStatus}</output>
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
      <form
        id='secret-form-invalid'
        onSubmit={(event) => {
          event.preventDefault();
          new FormData(event.currentTarget);
          setInvalidRetryCount((count) => count + 1);
        }}
      >
        <SecretField
          id='sf-invalid'
          name='invalid_secret'
          label='Invalid secret'
          error='Credential must be at least 32 characters.'
        />
        <button type='submit'>Retry invalid secret</button>
        <output aria-label='Invalid retry count'>{String(invalidRetryCount)}</output>
      </form>
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
        <button type='reset'>Reset headers</button>
        <output aria-label='KV submission'>{kvSubmission}</output>
      </form>

      <div id='kv-controlled-box'>
        <KeyValueEditor
          id='kv-controlled'
          label='Controlled headers'
          rows={controlledRows}
          onRowsChange={(nextRows) => {
            if (nextRows.some((row) => row.secret && 'value' in row)) {
              setControlledSecretEmittedValue(true);
            }
            setControlledRows(
              nextRows.map((row, index) => ({
                ...row,
                id: row.id ?? `c-gen-${index + 1}`,
              })),
            );
          }}
        />
        <output aria-label='Controlled secret value leak'>
          {String(controlledSecretEmittedValue)}
        </output>
      </div>

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
