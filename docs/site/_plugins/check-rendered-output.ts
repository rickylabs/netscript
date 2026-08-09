import { DOMParser } from 'lume/deps/dom.ts';
import { assertNoLiteralVentoPlaceholders } from './check-rendered-placeholders.ts';

export async function assertRenderedHomepage(path: string): Promise<void> {
  const html = await Deno.readTextFile(path);
  const document = new DOMParser().parseFromString(html, 'text/html');
  if (!document) throw new Error(`Could not parse rendered homepage: ${path}`);

  const headings = [...document.querySelectorAll('main h2')].map((heading) =>
    heading.textContent.trim()
  );
  for (const expected of ['One definition, carried end to end', 'Where to go']) {
    if (!headings.includes(expected)) {
      throw new Error(`Rendered homepage is missing semantic h2: ${expected}`);
    }
  }
  const mainText = document.querySelector('main')?.textContent ?? '';
  if (['## One definition', '## Where to go'].some((marker) => mainText.includes(marker))) {
    throw new Error('Rendered homepage leaks a literal Markdown heading marker');
  }

  const destinations = document.querySelectorAll('nav.ns-destination-list li > a');
  if (destinations.length !== 5) {
    throw new Error(
      `Rendered homepage expected 5 semantic destination items, found ${destinations.length}`,
    );
  }
}

if (import.meta.main) {
  const homepagePath = Deno.args[0] ?? '_site/index.html';
  await assertRenderedHomepage(homepagePath);
  const separator = Math.max(homepagePath.lastIndexOf('/'), homepagePath.lastIndexOf('\\'));
  const siteRoot = separator === -1 ? '.' : homepagePath.slice(0, separator);
  const result = await assertNoLiteralVentoPlaceholders(siteRoot);
  console.log(
    `Rendered output: OK (homepage semantics; ${result.filesScanned} HTML files; ` +
      `${result.allowancesUsed} documented-syntax allowances)`,
  );
}
