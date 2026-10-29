import { autotrim, engine } from 'lume/deps/vento.ts';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function count(haystack: string, needle: string): number {
  return haystack.split(needle).length - 1;
}

const scenarios = [
  {
    key: 'orders',
    title: 'An order backend',
    problem: 'Undo a charge when shipping fails.',
    tabs: [{ label: 'saga.ts', lang: 'ts', code: 'defineSaga("order")' }],
    alternative: 'A queue library and a status column.',
    why: 'The undo has a declared place.',
    href: '/tutorials/storefront/',
  },
  {
    key: 'sync',
    title: 'A nightly sync',
    problem: 'Run a `python` step on a schedule.',
    tabs: [{ label: 'sync.ts', lang: 'ts', code: 'defineScheduledTrigger()' }],
    alternative: 'Host cron and a subprocess wrapper.',
    why: 'One queue, one retry policy, one trace.',
  },
];

/** Render the component the way Lume's Vento plugin does, with a stub for nested components. */
async function render(data: Record<string, unknown>): Promise<string> {
  const env = engine({ dataVarname: 'it', useWith: true, autoescape: false });
  env.use(autotrim());
  env.filters.ic = (value: unknown) =>
    typeof value === 'string' ? value.replace(/`([^`]+)`/g, '<code>$1</code>') : (value ?? '');
  const comp = {
    tabbedCode: ({ tabs }: { tabs: { label: string; code: string }[] }) =>
      `<div class="ns-tabbed">${tabs.map((tab) => `<pre>${tab.code}</pre>`).join('')}</div>`,
  };
  const source = await Deno.readTextFile(
    new URL('../_components/scenarioPicker.vto', import.meta.url),
  );
  const result = await env.runString(source, { comp, ...data });
  return result.content;
}

Deno.test('scenario picker renders every panel with its heading and no hidden panel', async () => {
  const html = await render({ id: 'compare', label: 'Pick a scenario', scenarios });

  assert(count(html, 'data-ns-scenario="') === scenarios.length, 'expected one panel per scenario');
  assert(count(html, '<option ') === scenarios.length, 'expected one option per scenario');
  assert(html.includes('<option value="orders" selected>'), 'first scenario starts selected');
  assert(
    html.includes('<label for="compare-select">Pick a scenario</label>'),
    'select is labelled',
  );
  assert(html.includes('<select id="compare-select"'), 'label targets the select');
  // No-JS output: panels are never hidden in markup, only the picker is.
  assert(!/<article[^>]*\shidden/.test(html), 'no panel may be hidden in server markup');
  assert(/class="ns-scenarios__picker"[^>]*\shidden/.test(html), 'picker waits for the script');
  for (const scenario of scenarios) {
    assert(
      html.includes(
        `<h3 class="ns-scenarios__title" id="compare-${scenario.key}-title">${scenario.title}</h3>`,
      ),
      `missing heading: ${scenario.title}`,
    );
    assert(html.includes(`id="compare-${scenario.key}"`), `missing anchor for ${scenario.key}`);
    for (const text of [scenario.alternative, scenario.why]) {
      assert(html.includes(text), `missing panel text: ${text}`);
    }
    assert(html.includes(scenario.tabs[0].code), `missing NetScript code for ${scenario.key}`);
  }
  assert(html.includes('Undo a charge when shipping fails.'), 'problem line renders');
  assert(html.includes('Run a <code>python</code> step'), 'inline code in prose fields renders');
  assert(html.includes('<a href="/tutorials/storefront/">'), 'optional link renders');
  assert(count(html, 'ns-scenarios__more') === 1, 'link renders only when href is set');
});

Deno.test('scenario picker output stays one Markdown HTML block', async () => {
  const html = await render({ scenarios });
  // A blank line would end the HTML block and let Markdown re-parse indented markup as code.
  assert(!/\n[ \t]*\n/.test(html.trim()), 'component output must not contain blank lines');
  assert(html.includes('id="ns-scenarios-select"'), 'default id applies without an explicit id');
  assert(html.includes('<script>'), 'inline enhancement ships with the markup');
});
