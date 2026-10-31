import { assert, assertEquals, assertThrows } from '@std/assert';
import { render } from 'npm:preact-render-to-string@^6.7.0';
import { Resizable } from '../../registry/components/ui/resizable.tsx';
import { renderedElements } from './contract-render.ts';

Deno.test('Resizable SSR has a static handle until native measurement, without invented ARIA values', () => {
  const html = render(<Resizable label='Contents' startContent='Contents' endContent='Document' />);
  const elements = renderedElements(html);
  const handle = elements.find((e) =>
    e['data-scope'] === 'resizable' && e['data-part'] === 'handle'
  )!;
  assertEquals(handle['aria-hidden'], 'true');
  assertEquals(handle.tabindex, '-1');
  for (
    const attr of [
      'role',
      'aria-valuenow',
      'aria-valuemin',
      'aria-valuemax',
      'aria-valuetext',
      'aria-controls',
    ]
  ) {
    assertEquals(handle[attr], undefined);
  }
  const panels = elements.filter((e) =>
    e['data-scope'] === 'resizable' && e['data-part'] === 'panel'
  );
  assertEquals(panels.length, 2);
  assert(panels.every((e) => e.role === 'group' && e.tabindex === '0'));
  assert(elements.some((e) => e.role === 'group' && e['aria-label'] === 'Contents'));
  assert(elements.some((e) => e.role === 'group' && e['aria-label'] === 'Secondary panel'));
  const labelled = renderedElements(
    render(<Resizable label='Contents' labelledBy='contents-title' grip={false} />),
  );
  assertEquals(labelled.find((e) => e.role === 'group')?.['aria-labelledby'], 'contents-title');
  assert(!labelled.some((e) => e['data-part'] === 'grip'));
});

Deno.test('Resizable rejects impossible configured values without serializing unbounded Infinity', () => {
  for (const value of [-1, NaN, Infinity]) {
    assertThrows(() => render(<Resizable label='Contents' size={value} />), RangeError);
    assertThrows(() => render(<Resizable label='Contents' minSize={value} />), RangeError);
    assertThrows(() => render(<Resizable label='Contents' endMinSize={value} />), RangeError);
    assertThrows(() => render(<Resizable label='Contents' defaultSize={value} />), RangeError);
  }
  for (const step of [0, -1, Infinity, NaN]) {
    assertThrows(() => render(<Resizable label='Contents' step={step} />), RangeError);
  }
  assertThrows(() => render(<Resizable label='Contents' minSize={100} maxSize={80} />), RangeError);
  assertThrows(() => render(<Resizable label='Contents' maxSize={NaN} />), RangeError);
  assertThrows(() => render(<Resizable label=' ' />), TypeError);
  assertThrows(() => render(<Resizable label='Contents' endLabel='' />), TypeError);
  assert(!render(<Resizable label='Contents' maxSize={Infinity} />).includes('Infinity'));
});
