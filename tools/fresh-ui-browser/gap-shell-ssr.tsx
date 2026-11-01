import {
  DocsCompositionExamples,
  StaticDocsCompositionShell,
} from './gap-docs-composition-fixture.tsx';
import { StaticDocsNavigation, StaticInsetDocs } from './gap-docs-navigation-fixture.tsx';
import { AIInteractionExamples } from './gap-ai-interaction-fixture.tsx';
import { AIExamples } from './gap-ai-fixture.tsx';
import { render } from 'preact-render-to-string';
import { StaticShell } from './gap-shell-fixture.tsx';
/** Build the real maintained shell once; the fixture server serves these exact SSR bytes. */
await Deno.writeTextFile('test-results/gap-shell.html', render(<StaticShell />));

/** Native details and caller content also ship useful HTML before hydration. */
await Deno.writeTextFile('test-results/gap-ai.html', render(<AIExamples />));

await Deno.writeTextFile('test-results/gap-ai-interaction.html', render(<AIInteractionExamples />));

await Deno.writeTextFile('test-results/gap-docs-navigation.html', render(<StaticDocsNavigation />));

await Deno.writeTextFile('test-results/gap-docs-inset.html', render(<StaticInsetDocs />));

await Deno.writeTextFile(
  'test-results/gap-docs-composition.html',
  render(
    <main>
      <DocsCompositionExamples />
    </main>,
  ),
);
await Deno.writeTextFile(
  'test-results/gap-docs-composition-shell.html',
  render(<StaticDocsCompositionShell />),
);
