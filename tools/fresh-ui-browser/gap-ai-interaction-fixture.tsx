import { useState } from 'preact/hooks';
import { MessageScroller } from '../../packages/fresh-ui/registry/components/ui/message-scroller.tsx';
import { Questionnaire } from '../../packages/fresh-ui/registry/components/ui/questionnaire.tsx';
import { Message } from '../../packages/fresh-ui/registry/components/ui/message.tsx';
import { Marker } from '../../packages/fresh-ui/registry/components/ui/marker.tsx';
import { Button } from '../../packages/fresh-ui/registry/components/ui/button.tsx';
import { Progress } from '../../packages/fresh-ui/registry/components/ui/progress.tsx';

const choices = [
  { value: 'postgres', label: 'PostgreSQL', shortcut: '1' },
  { value: 'sqlite', label: 'SQLite', shortcut: '2' },
  { value: 'kv', label: 'Deno KV', shortcut: '3', disabled: true },
];

function Scrollers() {
  const [count, setCount] = useState(18);
  const [follow, setFollow] = useState(true);
  const [height, setHeight] = useState(320);
  const [show, setShow] = useState(true);
  return (
    <section id='scroller-examples' aria-label='Message scroller examples'>
      <div>
        <button type='button' onClick={() => setCount(count + 1)}>Append message</button>
        <button type='button' onClick={() => setCount(1)}>Use one message</button>
        <button type='button' onClick={() => setHeight(height === 320 ? 220 : 320)}>
          Resize viewport
        </button>
        <button type='button' onClick={() => setShow(!show)}>Mount message viewport</button>
        <label>
          <input
            type='checkbox'
            checked={follow}
            onChange={(e) => setFollow(e.currentTarget.checked)}
          />Follow pinned end
        </label>
      </div>
      {show && (
        <MessageScroller
          id='primary-scroller'
          label='Conversation'
          followEnd={follow}
          style={{ height }}
        >
          <Marker variant='separator' label='Conversation restored' />
          {Array.from({ length: count }, (_, index) => (
            <MessageScroller.Item key={index}>
              <Message
                message={{
                  role: index % 2 === 0 ? 'assistant' : 'user',
                  author: { name: index % 2 === 0 ? 'Assistant' : 'Maya', agent: index % 2 === 0 },
                  body: 'Message ' + (index + 1) + ': your workspace is ready to use.',
                }}
              />
              {index === count - 1 && (
                <>
                  <p data-stream-target>Streaming content.</p>
                  <label>
                    Message annotation<input defaultValue='Notes' />
                  </label>
                </>
              )}
              {index === 0 && <a href='#message-source'>Read message source</a>}
            </MessageScroller.Item>
          ))}
        </MessageScroller>
      )}
      <MessageScroller
        id='secondary-scroller'
        label='Independent conversation'
        followEnd={false}
        style={{ height: 200 }}
      >
        {Array.from({ length: 12 }, (_, index) => (
          <MessageScroller.Item key={index}>
            <p>Independent message {index + 1}</p>
          </MessageScroller.Item>
        ))}
      </MessageScroller>
      <div id='message-source'>Message source</div>
    </section>
  );
}

function ControlledAnswers() {
  const [value, setValue] = useState<readonly string[]>(['postgres']);
  const [text, setText] = useState('Accepted notes');
  const [multipleValue, setMultipleValue] = useState<readonly string[]>(['postgres']);
  const [multipleProposals, setMultipleProposals] = useState(0);
  const [accept, setAccept] = useState(false);
  const [proposals, setProposals] = useState(0);
  const [textProposals, setTextProposals] = useState(0);
  const [preventReset, setPreventReset] = useState(false);
  const [revision, setRevision] = useState(0);
  return (
    <section id='controlled-answers' aria-label='Controlled answer examples'>
      <label>
        <input
          type='checkbox'
          checked={accept}
          onChange={(e) => setAccept(e.currentTarget.checked)}
        />Accept answer changes
      </label>
      <label>
        <input
          type='checkbox'
          checked={preventReset}
          onChange={(e) => setPreventReset(e.currentTarget.checked)}
        />Prevent native reset
      </label>
      <button type='button' onClick={() => setRevision(revision + 1)}>
        Rerender unchanged answers
      </button>
      <Questionnaire
        title='Controlled storage'
        options={choices}
        value={value}
        onValueChange={(next) => {
          setProposals((n) => n + 1);
          if (accept) setValue(next);
        }}
        onReset={(e) => {
          if (preventReset) e.preventDefault();
        }}
        actions={<button type='reset'>Reset controlled storage</button>}
      >
        <label>
          Other native field<input name='extra' defaultValue='Initial extra' />
        </label>
      </Questionnaire>
      <Questionnaire
        title='Controlled multiple storage'
        options={choices}
        multiple
        value={multipleValue}
        onValueChange={(next) => {
          setMultipleProposals((n) => n + 1);
          if (accept) setMultipleValue(next);
        }}
        actions={<button type='reset'>Reset controlled multiple storage</button>}
      />
      <Questionnaire
        title='Controlled notes'
        step='freeform'
        text={text}
        onTextChange={(next) => {
          setTextProposals((n) => n + 1);
          if (accept) setText(next);
        }}
        actions={<button type='reset'>Reset controlled notes</button>}
      />
      <output aria-label='Choice proposals'>{proposals}</output>
      <output aria-label='Multiple proposals'>{multipleProposals}</output>
      <output aria-label='Text proposals'>{textProposals}</output>
      <output aria-label='Answer revision'>{revision}</output>
    </section>
  );
}

function NativeAnswerFields() {
  const [submitted, setSubmitted] = useState('');
  const [defaultsChanged, setDefaultsChanged] = useState(false);
  return (
    <section id='native-answers' aria-label='Native form examples'>
      <button type='button' onClick={() => setDefaultsChanged(true)}>
        Change later default props
      </button>
      <Questionnaire
        title='Native storage'
        options={choices}
        defaultValue={[defaultsChanged ? 'sqlite' : 'postgres']}
        actions={
          <>
            <button type='reset'>Reset native storage</button>
            <button type='submit'>Submit native storage</button>
          </>
        }
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitted(JSON.stringify([...new FormData(e.currentTarget)]));
        }}
      >
        <label>
          Native extra field<input name='extra' defaultValue='Initial extra' />
        </label>
      </Questionnaire>
      <Questionnaire
        title='Multiple storage'
        options={choices}
        multiple
        defaultValue={['postgres']}
        actions={
          <>
            <button type='reset'>Reset multiple storage</button>
            <button type='submit'>Submit multiple storage</button>
          </>
        }
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitted(JSON.stringify([...new FormData(e.currentTarget)]));
        }}
      />
      <Questionnaire
        title='Native notes'
        step='freeform'
        defaultText={defaultsChanged ? 'Later default notes' : 'Initial notes'}
        placeholder='Describe your project'
        actions={
          <>
            <button type='reset'>Reset native notes</button>
            <button type='submit'>Submit native notes</button>
          </>
        }
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitted(JSON.stringify([...new FormData(e.currentTarget)]));
        }}
      />
      <Questionnaire
        title='Disabled storage'
        options={choices}
        disabled
        defaultValue={['postgres']}
        actions={<button type='button'>Edit disabled answers</button>}
      />
      <output aria-label='Native form data'>{submitted}</output>
    </section>
  );
}

function NativeAnswers() {
  const [show, setShow] = useState(true);
  return (
    <div>
      <button type='button' onClick={() => setShow(!show)}>Mount native answer forms</button>
      {show && <NativeAnswerFields />}
    </div>
  );
}

function HostFlow() {
  const [step, setStep] = useState<'question' | 'freeform' | 'complete'>('question');
  const [value, setValue] = useState<readonly string[]>([]);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState('');
  return (
    <section id='host-flow' aria-label='Host questionnaire flow'>
      <Questionnaire
        step={step}
        title={step === 'question'
          ? 'Which database should the scaffold use?'
          : step === 'freeform'
          ? 'Anything the agent should know?'
          : 'Answers sent'}
        description={step === 'complete'
          ? 'The host accepted your answers.'
          : 'The host owns this form progression.'}
        progress={step !== 'complete'
          ? (
            <Progress
              label='Questions completed'
              size='sm'
              max={2}
              value={step === 'question' ? 1 : 2}
            />
          )
          : undefined}
        options={choices}
        value={value}
        onValueChange={(next) => {
          setValue(next);
          setError('');
        }}
        text={text}
        onTextChange={setText}
        error={error || undefined}
        onSubmit={(e) => {
          e.preventDefault();
          const data = new FormData(e.currentTarget);
          if (step === 'question' && !data.get('answer')) {
            setError('Pick an option to continue.');
            return;
          }
          if (step === 'question') {
            setStep('freeform');
            setError('');
          } else if (step === 'freeform') {
            setResult(JSON.stringify({ value, text: data.get('answer') }));
            setStep('complete');
          }
        }}
        actions={step === 'complete'
          ? (
            <Button type='button' variant='ghost' onClick={() => setStep('question')}>
              Edit answers
            </Button>
          )
          : (
            <>
              <Button
                type='button'
                variant='ghost'
                onClick={() => {
                  setStep(step === 'question' ? 'freeform' : 'question');
                  setError('');
                }}
              >
                {step === 'question' ? 'Skip' : 'Previous'}
              </Button>
              <Button type='submit'>{step === 'question' ? 'Next' : 'Submit answers'}</Button>
            </>
          )}
      />
      <output aria-label='Host accepted answers'>{result}</output>
    </section>
  );
}

/** Actual native components with host-owned fixture data and effects. */
export function AIInteractionExamples() {
  return (
    <main>
      <h1>AI interaction examples</h1>
      <Scrollers />
      <ControlledAnswers />
      <NativeAnswers />
      <HostFlow />
    </main>
  );
}
