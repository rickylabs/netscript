import type { ComponentChildren, JSX } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { Dialog, Drawer, Sheet } from '../../../../fresh-ui/interactive.ts';

/** Which page of the fixture the island renders. */
export type ModalScenario = 'interactive' | 'initial' | 'late';

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

type LateContent = (generation: number, remount: () => void) => ComponentChildren;

// Mounts Content only after its already-open Root, then remounts it under a new key: the
// state lives below the Root, so the Root itself never re-renders for either attachment.
function LateSlot(props: { readonly kind: string; readonly content: LateContent }): JSX.Element {
  const [mounted, setMounted] = useState(false);
  const [generation, setGeneration] = useState(0);
  return (
    <>
      <button id={`late-${props.kind}-mount`} type='button' onClick={() => setMounted(true)}>
        Mount {props.kind}
      </button>
      {mounted ? props.content(generation, () => setGeneration((value) => value + 1)) : null}
    </>
  );
}

function RemountButton(props: { readonly kind: string; readonly remount: () => void }) {
  return (
    <button id={`late-${props.kind}-remount`} type='button' onClick={props.remount}>
      Remount {props.kind}
    </button>
  );
}

function Late(): JSX.Element {
  return (
    <>
      <Dialog.Root id='late-dialog' defaultOpen>
        <LateSlot
          kind='dialog'
          content={(generation, remount) => (
            <Dialog.Content key={generation} data-generation={String(generation)}>
              <Dialog.Title>late dialog</Dialog.Title>
              <RemountButton kind='dialog' remount={remount} />
            </Dialog.Content>
          )}
        />
      </Dialog.Root>
      <Sheet.Root id='late-sheet' defaultOpen>
        <LateSlot
          kind='sheet'
          content={(generation, remount) => (
            <Sheet.Content key={generation} data-generation={String(generation)}>
              <Sheet.Title>late sheet</Sheet.Title>
              <RemountButton kind='sheet' remount={remount} />
            </Sheet.Content>
          )}
        />
      </Sheet.Root>
      <Drawer.Root id='late-drawer' defaultOpen>
        <LateSlot
          kind='drawer'
          content={(generation, remount) => (
            <Drawer.Content key={generation} data-generation={String(generation)}>
              <Drawer.Title>late drawer</Drawer.Title>
              <RemountButton kind='drawer' remount={remount} />
            </Drawer.Content>
          )}
        />
      </Drawer.Root>
    </>
  );
}

const SCENARIOS: Readonly<Record<ModalScenario, () => JSX.Element>> = {
  initial: Initial,
  interactive: Interactive,
  late: Late,
};

/** Fresh island rendering fresh-ui overlays inside a sticky, translucent ancestor. */
export default function ModalHarness(props: { readonly scenario: ModalScenario }): JSX.Element {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  const Scenario = SCENARIOS[props.scenario];
  return (
    <header data-hydrated={String(hydrated)}>
      <Scenario />
    </header>
  );
}
