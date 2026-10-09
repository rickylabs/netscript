import type { JSX } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { Dialog, Drawer, Sheet } from '../../../../fresh-ui/interactive.ts';

/** Which page of the fixture the island renders. */
export type ModalScenario = 'interactive' | 'initial';

function DialogParts(props: { readonly kind: string }): JSX.Element {
  return (
    <>
      <Dialog.Title>{props.kind} title</Dialog.Title>
      <Dialog.Close id={`${props.kind}-close`}>Close {props.kind}</Dialog.Close>
    </>
  );
}

function Interactive(): JSX.Element {
  const [controlled, setControlled] = useState(false);
  return (
    <>
      <Dialog.Root id='dialog'>
        <Dialog.Trigger id='dialog-trigger'>Open dialog</Dialog.Trigger>
        <Dialog.Content>
          <DialogParts kind='dialog' />
        </Dialog.Content>
      </Dialog.Root>
      <Sheet.Root id='sheet'>
        <Sheet.Trigger id='sheet-trigger'>Open sheet</Sheet.Trigger>
        <Sheet.Content>
          <Sheet.Title>sheet title</Sheet.Title>
          <Sheet.Close id='sheet-close'>Close sheet</Sheet.Close>
        </Sheet.Content>
      </Sheet.Root>
      <Drawer.Root id='drawer'>
        <Drawer.Trigger id='drawer-trigger'>Open drawer</Drawer.Trigger>
        <Drawer.Content>
          <Drawer.Title>drawer title</Drawer.Title>
          <Drawer.Close id='drawer-close'>Close drawer</Drawer.Close>
        </Drawer.Content>
      </Drawer.Root>
      <Dialog.Root id='nonmodal' modal={false}>
        <Dialog.Trigger id='nonmodal-trigger'>Open non-modal</Dialog.Trigger>
        <Dialog.Content>
          <DialogParts kind='nonmodal' />
        </Dialog.Content>
      </Dialog.Root>
      <button id='controlled-trigger' type='button' onClick={() => setControlled(true)}>
        Open controlled
      </button>
      <Dialog.Root id='controlled' open={controlled} onOpenChange={setControlled}>
        <Dialog.Content>
          <Dialog.Title>controlled title</Dialog.Title>
          <button id='controlled-force-close' type='button' onClick={() => setControlled(false)}>
            Force close
          </button>
        </Dialog.Content>
      </Dialog.Root>
    </>
  );
}

function Initial(): JSX.Element {
  return (
    <>
      <Dialog.Root id='initial-nonmodal' defaultOpen modal={false}>
        <Dialog.Content>
          <DialogParts kind='initial-nonmodal' />
        </Dialog.Content>
      </Dialog.Root>
      <Dialog.Root id='initial-modal' defaultOpen>
        <Dialog.Content>
          <DialogParts kind='initial-modal' />
        </Dialog.Content>
      </Dialog.Root>
    </>
  );
}

/** Fresh island rendering fresh-ui overlays inside a sticky, translucent ancestor. */
export default function ModalHarness(props: { readonly scenario: ModalScenario }): JSX.Element {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return (
    <header data-hydrated={String(hydrated)}>
      {props.scenario === 'initial' ? <Initial /> : <Interactive />}
    </header>
  );
}
