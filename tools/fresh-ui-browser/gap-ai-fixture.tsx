import { IconButton } from '../../packages/fresh-ui/registry/components/ui/icon-button.tsx';
import { Progress } from '../../packages/fresh-ui/registry/components/ui/progress.tsx';
import { useState } from 'preact/hooks';
import { Marker } from '../../packages/fresh-ui/registry/components/ui/marker.tsx';
import { Trace } from '../../packages/fresh-ui/registry/components/ui/trace.tsx';
import { Attachment } from '../../packages/fresh-ui/registry/components/ui/attachment.tsx';
import { Icon } from '../../packages/fresh-ui/primitives.tsx';

const states = ['idle', 'uploading', 'processing', 'error', 'done'] as const;
const statuses = ['done', 'running', 'pending', 'error'] as const;
const preview = 'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><path fill="currentColor" d="M8 8h24v24H8z"/></svg>',
  );

function NativeActions() {
  const [markers, setMarkers] = useState(0);
  const [actions, setActions] = useState(0);
  const [state, setState] = useState<typeof states[number]>('idle');
  return (
    <>
      <section id='marker-native' aria-label='Marker keyboard'>
        <button type='button' data-before-marker>Before marker</button>
        <Marker variant='separator' icon={<Icon name='info' size={14} />}>
          <button type='button' onClick={() => setMarkers(markers + 1)}>
            Inspect event
          </button>
          <a href='#event'>Read event</a>
        </Marker>
        <button type='button' data-after-marker>After marker</button>
        <output aria-label='Marker actions'>{markers}</output>
      </section>
      <section id='attachment-native' aria-label='Attachment keyboard'>
        <button type='button' data-before-attachment>Before attachment</button>
        <Attachment
          title='report.pdf'
          state={state}
          size='xs'
          description='Transfer details'
          media={<Icon name='file-text' size={14} />}
          actions={
            <>
              <button type='button' onClick={() => setActions(actions + 1)}>
                Retry report
              </button>
              <a href='#report'>Read report</a>
            </>
          }
        />
        <button type='button' data-after-attachment>After attachment</button>
        <button
          type='button'
          onClick={() => setState(states[(states.indexOf(state) + 1) % states.length])}
        >
          Advance attachment state
        </button>
        <output aria-label='Attachment actions'>{actions}</output>
      </section>
    </>
  );
}

function Disclosure() {
  const [open, setOpen] = useState(false);
  const [accept, setAccept] = useState(false);
  const [proposals, setProposals] = useState(0);
  const [renders, setRenders] = useState(0);
  return (
    <section id='trace-native' aria-label='Trace keyboard'>
      <button type='button' data-before-trace>Before trace</button>
      <Trace title='Agent trace' status='running' duration='4 steps' style={{ maxWidth: 480 }}>
        <Trace.Line
          title='Static step'
          description='Always visible'
          status='done'
          connector={false}
        >
          <button type='button'>Inspect static step</button>
        </Trace.Line>
        <Trace.Line
          title='Search docs'
          description='Two sources found'
          status='running'
          duration='312ms'
          collapsible
          defaultOpen
        >
          <button type='button'>Inspect sources</button>
          <a href='#sources'>Read sources</a>
        </Trace.Line>
        <Trace.Line
          title='Controlled step'
          description='Host decides'
          status='pending'
          collapsible
          open={open}
          onOpenChange={(next) => {
            setProposals((n) => n + 1);
            if (accept) setOpen(next);
          }}
        >
          <button type='button'>Controlled action</button>
        </Trace.Line>
      </Trace>
      <button type='button' data-after-trace>After trace</button>
      <label>
        <input
          type='checkbox'
          checked={accept}
          onChange={(e) => setAccept(e.currentTarget.checked)}
        />Accept disclosure changes
      </label>
      <button type='button' onClick={() => setRenders(renders + 1)}>
        Rerender unchanged disclosure
      </button>
      <output aria-label='Disclosure proposals'>{proposals}</output>
      <output aria-label='Parent renders'>{renders}</output>
    </section>
  );
}

/** Actual copied sources, caller state and native controls; no upload or agent runtime. */
export function AIExamples() {
  return (
    <main>
      <h1>AI component examples</h1>
      <NativeActions />
      <Disclosure />
      <section id='marker-variants' aria-label='Marker variants'>
        {(['default', 'border', 'separator'] as const).map((variant) => (
          <Marker
            key={variant}
            variant={variant}
            icon={<Icon name='info' size={14} />}
            label='Session restored · 42 messages replayed'
          />
        ))}
      </section>
      <section id='trace-variants' aria-label='Trace variants'>
        {(['running', 'done', 'error'] as const).map((status) => (
          <Trace
            key={status}
            status={status}
            title='Agent trace'
            duration='3.8s'
          >
            {statuses.map((lineStatus) =>
              [false, true].map((open) => (
                <Trace.Line
                  key={lineStatus + open}
                  status={lineStatus}
                  title='Search docs'
                  description={lineStatus === 'error' ? 'Search timed out' : 'Two sources found'}
                  duration='312ms'
                  collapsible
                  defaultOpen={open}
                >
                  <pre>searchDocs(query)</pre>
                </Trace.Line>
              ))
            )}
          </Trace>
        ))}
      </section>
      <section
        id='attachment-variants'
        aria-label='Attachment variants'
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 12,
          alignItems: 'start',
        }}
      >
        {states.flatMap((state) =>
          (['default', 'sm', 'xs'] as const).flatMap((size) =>
            (['horizontal', 'vertical'] as const).map((orientation) => (
              <Attachment
                key={state + size + orientation}
                state={state}
                size={size}
                orientation={orientation}
                style={{
                  width: orientation === 'vertical'
                    ? (size === 'default' ? 160 : size === 'sm' ? 136 : 112)
                    : (size === 'default' ? 240 : size === 'sm' ? 208 : 176),
                }}
                title='invoice-SO-10481-october.pdf'
                description={state === 'error' ? 'Upload failed · over the limit' : 'PDF · 248 KB'}
                media={<Icon name='file-text' size={14} />}
                progress={state === 'uploading'
                  ? (
                    <Progress
                      label='Upload progress'
                      size='sm'
                      max={100}
                      value={64}
                    />
                  )
                  : undefined}
                actions={
                  <IconButton
                    type='button'
                    style={{ minHeight: 16, height: 16, width: 16, padding: 0 }}
                    variant='ghost'
                    label={'Remove ' + state + ' ' + size + ' ' + orientation}
                    icon={<Icon name='x' size={12} />}
                  />
                }
              />
            ))
          )
        )}
      </section>
      <section id='attachment-media' aria-label='Attachment media'>
        <Attachment
          title='preview.svg'
          state='done'
          media={<img src={preview} alt='Report preview' />}
          description='Uploaded image'
        />
        <Attachment title='No actions.pdf' description='PDF · 248 KB' />
        <Attachment
          title='Localized.pdf'
          state='error'
          size='xs'
          stateLabel='Échec du transfert'
          description='Too large'
        />
      </section>
      <div id='event'>Event details</div>
      <div id='report'>Report details</div>
      <div id='sources'>Sources</div>
    </main>
  );
}
