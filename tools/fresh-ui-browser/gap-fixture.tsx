import {
  ClippedDocsComposition,
  DocsNavigationExamples,
  InsetDesktopContents,
  InsetMobileContents,
  InsetSections,
} from './gap-docs-navigation-fixture.tsx';
import { DocsStructureExamples } from './gap-docs-structure-fixture.tsx';
import { AIInteractionExamples } from './gap-ai-interaction-fixture.tsx';
import { AIExamples } from './gap-ai-fixture.tsx';
import { DataTableExamples } from './gap-data-table-fixture.tsx';
import { StatsGrids } from './gap-stats-grid-fixture.tsx';
import { ShellExamples } from './gap-shell-fixture.tsx';
import SidebarToggle from '../../packages/fresh-ui/registry/islands/SidebarToggle.tsx';
import { DialogOwnership } from './gap-dialog-ownership-fixture.tsx';
import { Resizables } from './gap-resizable-fixture.tsx';
import { PageHeaders } from './gap-page-header-fixture.tsx';
import { NativeLayouts } from './gap-native-layout-fixture.tsx';
import { CommandPalettes } from './gap-command-palette-fixture.tsx';
import { ProseExamples } from './gap-prose-fixture.tsx';
import { Alerts } from './gap-alert-fixture.tsx';
import { DocsPrimitives } from './gap-docs-primitives-fixture.tsx';
import { CodeBlocks } from './gap-code-block-fixture.tsx';
import { DisplayMotion } from './gap-display-motion-fixture.tsx';
import { DisplayBasics } from './gap-display-basics-fixture.tsx';
import { Overlays } from './gap-overlays-fixture.tsx';
import { Navigation } from './gap-navigation-fixture.tsx';
import { Calendars } from './gap-calendar-fixture.tsx';
import { Forms } from './gap-forms-fixture.tsx';
import { hydrate, render } from 'preact';
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
      <Alerts />
      <ProseExamples />
      <CommandPalettes />
      <PageHeaders />
      <NativeLayouts />
      <Resizables />
      <DialogOwnership />
    </main>
  );
}
if (location.pathname === '/docs-navigation-inset-static') {
  hydrate(<InsetDesktopContents />, document.getElementById('inset-desktop-island')!);
  hydrate(<InsetMobileContents />, document.getElementById('inset-mobile-island')!);
  hydrate(<InsetSections />, document.getElementById('inset-sections-island')!);
} else if (location.pathname === '/docs-navigation-composition') {
  render(<ClippedDocsComposition />, document.body);
} else if (location.pathname === '/shell-static') {
  hydrate(<SidebarToggle />, document.getElementById('standalone-toggle')!);
} else if (location.pathname === '/ai-interaction-static') {
  hydrate(<AIInteractionExamples />, document.body);
} else if (location.pathname === '/docs-navigation') {
  render(<DocsNavigationExamples />, document.body);
} else if (location.pathname === '/docs-structure') {
  render(<DocsStructureExamples />, document.body);
} else if (location.pathname === '/ai-interaction') {
  render(<AIInteractionExamples />, document.body);
} else if (location.pathname === '/ai-static') {
  hydrate(<AIExamples />, document.body);
} else if (location.pathname === '/ai') {
  render(<AIExamples />, document.body);
} else if (location.pathname === '/data-table') {
  render(<DataTableExamples />, document.getElementById('app')!);
} else if (location.pathname === '/stats-grid') {
  render(<StatsGrids />, document.getElementById('app')!);
} else if (location.pathname === '/shell') {
  document.body.style.padding = '0';
  render(<ShellExamples />, document.getElementById('app')!);
} else render(<Actions />, document.getElementById('app')!);
