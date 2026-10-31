import { assert, assertEquals, assertStringIncludes } from '@std/assert';
import { render } from 'npm:preact-render-to-string@^6.7.0';
import { Alert } from '../../registry/components/ui/alert.tsx';

Deno.test('Alert keeps native attributes, roles and custom legacy content', () => {
  const html = render(
    <Alert id='legacy' class='custom' icon={<b>Icon</b>} title={<span>Title</span>}>
      Legacy description
    </Alert>,
  );
  for (
    const value of [
      'id="legacy"',
      'ns-alert custom',
      'role="status"',
      'data-variant="info"',
      '<b>Icon</b>',
      '<span>Title</span>',
      'Legacy description',
    ]
  ) assertStringIncludes(html, value);
  for (const variant of ['warning', 'destructive'] as const) {
    assertStringIncludes(render(<Alert variant={variant} />), 'role="alert"');
  }
  assertStringIncludes(render(<Alert role='region' aria-label='Feedback' />), 'role="region"');
});

Deno.test('Alert supports six tones, two emphases and optional real controls', () => {
  for (
    const variant of ['neutral', 'info', 'success', 'warning', 'destructive', 'important'] as const
  ) {
    for (const emphasis of ['subtle', 'strong'] as const) {
      const html = render(
        <Alert
          variant={variant}
          emphasis={emphasis}
          close
          action={<button type='button'>Review</button>}
          description='Explicit'
        >
          Legacy
        </Alert>,
      );
      for (
        const value of [
          `data-variant="${variant}"`,
          `data-emphasis="${emphasis}"`,
          'data-part="actions"',
          'type="button"',
          'aria-label="Dismiss notification"',
          'Explicit',
        ]
      ) assertStringIncludes(html, value);
      assert(!html.includes('Legacy'));
      assertEquals((html.match(/data-part="close"/g) ?? []).length, 1);
    }
  }
});

Deno.test('Alert represents controlled/default visibility without stealing focus or firing callbacks', () => {
  let calls = 0;
  const hidden = render(
    <Alert open={false} defaultOpen close onOpenChange={() => calls++}>Content</Alert>,
  );
  assertStringIncludes(hidden, 'hidden');
  assertStringIncludes(hidden, 'data-state="closed"');
  const closed = render(<Alert defaultOpen={false} />);
  assertStringIncludes(closed, 'data-state="closed"');
  const controlled = render(<Alert open defaultOpen={false} />);
  assertStringIncludes(controlled, 'data-state="open"');
  assert(!/<div[^>]*\shidden(?:[\s=>])/.test(controlled));
  assertEquals(calls, 0);
  assert(!hidden.includes('autofocus'));
});

Deno.test('Alert preserves numeric content and hides only explicitly disabled icon content', () => {
  const html = render(<Alert icon={false} title={0} description={0} action={0} />);
  assert(!html.includes('data-part="icon"'));
  assertEquals((html.match(/>0</g) ?? []).length, 3);
  assertStringIncludes(render(<Alert icon>Content</Alert>), '<svg');
  assertStringIncludes(render(<Alert hidden open />), 'hidden');
});

Deno.test('Alert defaults distinguish every tone with localizable accessible text', () => {
  for (
    const [variant, label] of [
      ['neutral', 'Note'],
      ['info', 'Info'],
      ['success', 'Success'],
      ['warning', 'Warning'],
      ['destructive', 'Error'],
      ['important', 'Important'],
    ] as const
  ) {
    assertStringIncludes(render(<Alert variant={variant}>Body</Alert>), `>${label}</div>`);
    const custom = render(<Alert variant={variant} title='Custom label' />);
    assertStringIncludes(custom, '>Custom label</div>');
    assert(!custom.includes(`>${label}</div>`));
  }
  assertStringIncludes(render(<Alert toneLabel='Hinweis' />), '>Hinweis</div>');
  for (const title of [false, null] as const) {
    const hidden = render(<Alert title={title} toneLabel='Hinweis' />);
    assertStringIncludes(hidden, 'class="ns-alert__sr-label"');
    assertStringIncludes(hidden, '>Hinweis</div>');
    assert(!hidden.includes('class="ns-alert__title"'));
  }
  assertStringIncludes(render(<Alert toneLabel='  ' />), '>Info</div>');
});
