import { assertEquals, assertThrows } from '@std/assert';
import { DATABASE, REPORT_FORMAT } from '../../src/domain/extension-axes.ts';
import { mapRunOptions } from '../../src/presentation/cli/options/run-options.ts';

Deno.test('mapRunOptions keeps defaults by omitting undefined values', () => {
  assertEquals(mapRunOptions({ format: REPORT_FORMAT.PRETTY }), { format: REPORT_FORMAT.PRETTY });
});

Deno.test('mapRunOptions accepts sqlite database axis', () => {
  assertEquals(mapRunOptions({ db: DATABASE.SQLITE }), { database: DATABASE.SQLITE });
});

Deno.test('mapRunOptions rejects unsupported database values', () => {
  assertThrows(
    () => mapRunOptions({ db: 'mssql' }),
    Error,
    '--db must be postgres, mysql, or sqlite.',
  );
});

Deno.test('mapRunOptions rejects unsupported plugin values', () => {
  assertThrows(
    () => mapRunOptions({ plugins: 'worker,unknown' }),
    Error,
    'Unsupported plugin kind',
  );
});
