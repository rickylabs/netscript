import { assertEquals } from '@std/assert';
import { cn } from '../../../registry/lib/cn.ts';

Deno.test('cn lets axis spacing override logical sides', () => {
  assertEquals(cn('ps-2 pe-3', 'px-4'), 'px-4');
});

Deno.test('cn keeps color functions separate from text lengths', () => {
  assertEquals(
    cn('text-lg', 'text-[color(display-p3_1_0_0)]'),
    'text-lg text-[color(display-p3_1_0_0)]',
  );
  assertEquals(cn('bg-conic', 'bg-linear-to-r'), 'bg-linear-to-r');
  assertEquals(cn('columns-3', 'columns-auto'), 'columns-auto');
});
