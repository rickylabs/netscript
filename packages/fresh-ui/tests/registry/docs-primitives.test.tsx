import { assert, assertEquals, assertStringIncludes, assertThrows } from '@std/assert';
import { render } from 'npm:preact-render-to-string@^6.7.0';
import { Label } from '../../registry/components/ui/label.tsx';
import { Card } from '../../registry/components/ui/card.tsx';
import { Pagination } from '../../registry/components/ui/pagination.tsx';
import { Icon, ICON_PATHS } from '../../primitives.tsx';
import { componentContracts } from '../../contracts.ts';

Deno.test('Icon contract names cover the complete published curated vocabulary', () => {
  const names = componentContracts.components.find((contract) => contract.name === 'icon')!
    .props.name.values!;
  assertEquals([...names].sort(), Object.keys(ICON_PATHS).sort());
});

Deno.test('Label keeps native association and exposes eyebrow, state and optional hint', () => {
  const html = render(
    <Label
      for='contact'
      variant='eyebrow'
      state='invalid'
      optional
      optionalText='Not required'
      class='custom'
    >
      Contact
    </Label>,
  );
  for (
    const value of [
      'for="contact"',
      'data-variant="eyebrow"',
      'data-state="invalid"',
      'data-part="optional-hint"',
      'Not required',
      'ns-label custom',
    ]
  ) assertStringIncludes(html, value);
  assert(!html.includes('tabindex'));
  const required = render(<Label required optional>Contact</Label>);
  assertStringIncludes(required, 'data-required="true"');
  assert(!required.includes('data-part="optional-hint"'));
  const hidden = render(<Label required srOnly>Hidden contact</Label>);
  assertStringIncludes(hidden, 'sr-only');
  assertStringIncludes(hidden, 'data-sr-only="true"');
  assert(!hidden.includes('data-required'));
});

Deno.test('Card retains sections and native children without aggregate widget semantics', () => {
  const html = render(
    <Card variant='rule' size='sm' state='selected' interactive id='docs-card' class='custom'>
      <Card.Header>
        <Card.Title>Title</Card.Title>
        <Card.Description>Description</Card.Description>
        <Card.Action>
          <a href='#action'>Action</a>
        </Card.Action>
      </Card.Header>
      <Card.Body>Body</Card.Body>
      <Card.Footer>Footer</Card.Footer>
    </Card>,
  );
  for (const part of ['header', 'title', 'description', 'action', 'body', 'footer']) {
    assertStringIncludes(html, `data-part="${part}"`);
  }
  for (
    const value of [
      'data-variant="rule"',
      'data-size="sm"',
      'data-state="selected"',
      'data-interactive="true"',
      'href="#action"',
      'id="docs-card"',
      'ns-card custom',
    ]
  ) assertStringIncludes(html, value);
  assert(!html.includes('tabindex'));
  assert(!html.includes('role="button"'));
});

Deno.test('Pagination retains legacy composition and native disabled/current destinations', () => {
  const html = render(
    <Pagination aria-label='Orders'>
      <Pagination.Meta>Orders 1–20</Pagination.Meta>
      <Pagination.Actions>
        <Pagination.Link href='#one' current>1</Pagination.Link>
        <Pagination.Link href='#disabled' disabled>Unavailable</Pagination.Link>
        <Pagination.Ellipsis />
      </Pagination.Actions>
    </Pagination>,
  );
  for (
    const value of [
      'role="navigation"',
      'aria-label="Orders"',
      'data-variant="numbered"',
      'data-part="meta"',
      'data-part="actions"',
      'aria-current="page"',
      'aria-disabled="true"',
      'tabindex="-1"',
      'data-part="ellipsis"',
    ]
  ) assertStringIncludes(html, value);
  assert(!html.includes('href="#disabled"'));
  assertThrows(() => render(<Pagination.Link>Missing destination</Pagination.Link>), RangeError);
});

Deno.test('Pager tiles expose native relations, headings and disabled snapshots', () => {
  const html = render(
    <Pagination variant='pager'>
      <Pagination.Previous href='#before'>Before</Pagination.Previous>
      <Pagination.Next state='disabled'>After</Pagination.Next>
    </Pagination>,
  );
  for (
    const value of [
      'data-variant="pager"',
      'rel="prev"',
      'rel="next"',
      'data-part="previous"',
      'data-part="next"',
      'data-part="direction"',
      'data-part="title"',
      'aria-disabled="true"',
    ]
  ) assertStringIncludes(html, value);
  assertEquals((html.match(/href=/g) ?? []).length, 1);
  for (const name of ['arrow-left', 'arrow-right'] as const) {
    const icon = render(<Icon name={name} title='Direction' />);
    assertStringIncludes(icon, 'role="img"');
    assertEquals((icon.match(/<path /g) ?? []).length, 2);
    assertStringIncludes(icon, 'stroke="currentColor"');
  }
});
