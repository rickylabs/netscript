import { DocsPrimitives } from './gap-docs-primitives-fixture.tsx';
import { CodeBlocks } from './gap-code-block-fixture.tsx';
import { DisplayMotion } from './gap-display-motion-fixture.tsx';
import { DisplayBasics } from './gap-display-basics-fixture.tsx';
import { Overlays } from './gap-overlays-fixture.tsx';
import { Navigation } from './gap-navigation-fixture.tsx';
import { Calendars } from './gap-calendar-fixture.tsx';
import { Forms } from './gap-forms-fixture.tsx';
import { render } from 'preact';
import { useState } from 'preact/hooks';
import { ButtonGroup } from '../../packages/fresh-ui/registry/components/ui/button-group.tsx';
import { Button } from '../../packages/fresh-ui/registry/components/ui/button.tsx';
import { Toggle } from '../../packages/fresh-ui/registry/components/ui/toggle.tsx';
import { ToggleGroup } from '../../packages/fresh-ui/registry/components/ui/toggle-group.tsx';

const parameters = new URLSearchParams(location.search);
const direction = parameters.get('dir') === 'rtl' ? 'rtl' : 'ltr';
document.documentElement.dir = direction;
document.documentElement.dataset.scheme = parameters.get('scheme') === 'dark' ? 'dark' : 'light';

function Actions() {
  const [count, setCount] = useState(0);
  const items = [
    { value: 'all', label: 'All' },
    { value: 'disabled', label: 'Disabled', disabled: true },
    { value: 'open', label: 'Open' },
    { value: 'closed', label: 'Closed' },
  ];
  return (
    <main>
      <h1>Action components</h1>
      <section aria-label='Button group' id='button-group'>
        <ButtonGroup aria-label='Document actions'>
          <Button onClick={() => setCount(count + 1)}>Save</Button>
          <Button>Cancel</Button>
        </ButtonGroup>
        <output aria-label='Saves'>{count}</output>
      </section>
      <section aria-label='Toggle' id='toggle'>
        <Toggle>Bold</Toggle>
        <Toggle disabled>Locked</Toggle>
      </section>
      <section aria-label='Single selection' id='toggle-group'>
        <ToggleGroup label='Status' items={items} defaultValue={['all']} variant='segmented' />
      </section>
      <section aria-label='Multiple selection' id='toggle-multiple'>
        <ToggleGroup label='Formatting' type='multiple' items={items} defaultValue={['all']} />
      </section>
      <section aria-label='Vertical selection' id='toggle-vertical'>
        <ToggleGroup label='Vertical' orientation='vertical' items={items} />
      </section>
      <section aria-label='Sizes' id='sizes'>
        {(['sm', 'md', 'lg'] as const).map((size) => (
          <Toggle key={size} variant='outline' size={size} selected>{size}</Toggle>
        ))}
      </section>
      <button type='button' id='after'>After components</button>
      <Forms />
      <Calendars />
      <Navigation />
      <Overlays />
      <DisplayBasics />
      <DisplayMotion />
      <CodeBlocks />
      <DocsPrimitives />
    </main>
  );
}
render(<Actions />, document.getElementById('app')!);
