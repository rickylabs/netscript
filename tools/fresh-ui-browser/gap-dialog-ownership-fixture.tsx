import { Button } from '../../packages/fresh-ui/registry/components/ui/button.tsx';
import { useRef, useState } from 'preact/hooks';
import { Dialog, Sheet } from '../../packages/fresh-ui/interactive.ts';

/** Public native Dialog controls used by shell composition; no custom Escape handler. */

/** Caller paint keeps headless native controls legible without adding data axes. */
const CALLER_BUTTON_STYLE = Object.freeze({
  background: 'var(--ns-primary)',
  color: 'var(--ns-primary-fg)',
});

function ModalOwnership({ kind }: { kind: 'dialog' | 'sheet' }) {
  const Modal = kind === 'dialog' ? Dialog : Sheet;
  const [open, setOpen] = useState(false);
  const [accept, setAccept] = useState(false);
  const [requested, setRequested] = useState('none');
  const acceptedReasons = useRef<string[]>([]);
  const acceptedOutput = useRef<HTMLOutputElement>(null);
  const [forcedOpen, setForcedOpen] = useState(false);
  const [revision, setRevision] = useState(0);
  const forced = useRef<{ reasons: string[]; cancelable: boolean[] }>({
    reasons: [],
    cancelable: [],
  });
  const reasonsOutput = useRef<HTMLOutputElement>(null);
  const cancelOutput = useRef<HTMLOutputElement>(null);
  return (
    <section id={`${kind}-ownership`} aria-label={`${kind} state ownership`}>
      <h2>{kind === 'dialog' ? 'Dialog' : 'Sheet'} ownership examples</h2>
      <Modal.Root
        open={open}
        onOpenChange={(next, detail) => {
          acceptedReasons.current.push(detail.reason);
          if (acceptedOutput.current) {
            acceptedOutput.current.value = JSON.stringify(
              acceptedReasons.current,
            );
          }
          setRequested(String(next));
          if (next || accept) setOpen(next);
        }}
      >
        <Modal.Trigger style={CALLER_BUTTON_STYLE}>Open controlled navigation</Modal.Trigger>
        <Modal.Content style={{ background: 'var(--ns-card)', color: 'var(--ns-fg)' }}>
          <Modal.Title>Controlled navigation sample</Modal.Title>
          <Modal.Description>The parent decides whether closing is accepted.</Modal.Description>
          <Button type='button' onClick={() => setAccept(true)}>Allow navigation close</Button>
          <Modal.Close style={CALLER_BUTTON_STYLE}>Close controlled navigation</Modal.Close>
        </Modal.Content>
      </Modal.Root>
      <output aria-label='Requested navigation dialog state'>{requested}</output>
      <output ref={acceptedOutput} aria-label='Accepted navigation close reasons'>
        {JSON.stringify(acceptedReasons.current)}
      </output>
      <Modal.Root>
        <Modal.Trigger style={CALLER_BUTTON_STYLE}>Open uncontrolled navigation</Modal.Trigger>
        <Modal.Content style={{ background: 'var(--ns-card)', color: 'var(--ns-fg)' }}>
          <Modal.Title>Uncontrolled navigation sample</Modal.Title>
          <Modal.Description>Escape closes this ordinary native modal.</Modal.Description>
          <a href='#destination'>Destination</a>
          <Modal.Close style={CALLER_BUTTON_STYLE}>Close uncontrolled navigation</Modal.Close>
        </Modal.Content>
      </Modal.Root>
      <Modal.Root closeOnEscape={false}>
        <Modal.Trigger style={CALLER_BUTTON_STYLE}>Open Escape-disabled navigation</Modal.Trigger>
        <Modal.Content style={{ background: 'var(--ns-card)', color: 'var(--ns-fg)' }}>
          <Modal.Title>Escape-disabled navigation sample</Modal.Title>
          <Modal.Description>The close button remains available.</Modal.Description>
          <Modal.Close style={CALLER_BUTTON_STYLE}>Close Escape-disabled navigation</Modal.Close>
        </Modal.Content>
      </Modal.Root>
      <Button type='button' onClick={() => setRevision((n) => n + 1)}>
        Render accepted navigation state again
      </Button>
      <output aria-label='Accepted navigation revision'>{revision}</output>
      <Modal.Root
        open={forcedOpen}
        onOpenChange={(next, detail) => {
          forced.current.reasons.push(detail.reason);
          if (reasonsOutput.current) {
            reasonsOutput.current.value = JSON.stringify(
              forced.current.reasons,
            );
          }
          // A native-close notification deliberately does not render the parent or reopen the modal.
          if (next) setForcedOpen(true);
        }}
      >
        <Modal.Trigger style={CALLER_BUTTON_STYLE}>Open platform-close navigation</Modal.Trigger>
        <Modal.Content
          style={{ background: 'var(--ns-card)', color: 'var(--ns-fg)' }}
          onCancel={(event) => {
            forced.current.cancelable.push(event.cancelable);
            if (cancelOutput.current) {
              cancelOutput.current.value = JSON.stringify(
                forced.current.cancelable,
              );
            }
            event.preventDefault();
          }}
        >
          <Modal.Title>Platform-close navigation sample</Modal.Title>
          <Modal.Description>
            The consumer veto applies only to cancelable requests.
          </Modal.Description>
          <Modal.Close style={CALLER_BUTTON_STYLE}>Close platform-close navigation</Modal.Close>
        </Modal.Content>
      </Modal.Root>
      <output ref={reasonsOutput} aria-label='Platform navigation close reasons'>
        {JSON.stringify(forced.current.reasons)}
      </output>
      <output ref={cancelOutput} aria-label='Platform navigation cancelability'>
        {JSON.stringify(forced.current.cancelable)}
      </output>
    </section>
  );
}

/** Both native modal consumers share the same ownership scenarios. */
export function DialogOwnership() {
  return (
    <>
      <ModalOwnership kind='dialog' />
      <ModalOwnership kind='sheet' />
    </>
  );
}
