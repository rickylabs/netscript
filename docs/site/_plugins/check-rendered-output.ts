import { DOMParser } from 'lume/deps/dom.ts';

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
  await assertRenderedHomepage(Deno.args[0] ?? '_site/index.html');
  console.log('Rendered homepage semantics: OK');
}
