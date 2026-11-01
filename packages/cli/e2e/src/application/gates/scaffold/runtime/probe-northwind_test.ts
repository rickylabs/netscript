import { assertThrows } from '@std/assert';
import { assertNorthwindDom } from './probe-northwind.ts';

const fields = ['NW-10253', 'Hanari Carnes', 'Brazil', '$1,444.80', 'pending'];
const live = `<table><tr>${fields.map((value) => `<td>${value}</td>`).join('')}</tr></table>`;

Deno.test('Northwind runtime assertion accepts rendered cells and detail fields', () => {
  assertNorthwindDom(live, 'ready');
  assertNorthwindDom(`<dl>${fields.map((value) => `<dd>${value}</dd>`).join('')}</dl>`, 'ready');
});

Deno.test('Northwind runtime assertion rejects HTTP200 empty shells and hydration-only rows', () => {
  assertThrows(() => assertNorthwindDom('<h1>Records</h1><p>Records unavailable</p>', 'ready'));
  assertThrows(() => assertNorthwindDom(`<h1>Records</h1><script>${live}</script>`, 'ready'));
  assertThrows(() => assertNorthwindDom(live.replace('Hanari Carnes', ''), 'ready'));
  assertThrows(() => assertNorthwindDom(live + '<p>No connected data</p>', 'ready'));
});

Deno.test('Northwind service-down control requires unavailable and rejects stale rows', () => {
  assertNorthwindDom('<h1>Records</h1><p>Records unavailable</p>', 'unavailable');
  assertThrows(() => assertNorthwindDom('<h1>Records</h1>', 'unavailable'));
  assertThrows(() => assertNorthwindDom(live + '<p>Records unavailable</p>', 'unavailable'));
});
