import { assertEquals } from 'jsr:@std/assert@1';
import { ColumnTypeEnum } from '@prisma/driver-adapter-utils';
import {
  mapArg,
  mapColumnType,
  mapRow,
  MySqlColumnType,
  type MySqlFieldInfo,
} from '../src/conversion.ts';

function field(
  name: string,
  fieldType: MySqlColumnType,
  fieldFlag = 0,
): MySqlFieldInfo {
  return {
    catalog: '',
    schema: '',
    table: '',
    originTable: '',
    name,
    originName: name,
    encoding: 0,
    fieldLen: 0,
    fieldType,
    fieldFlag,
    decimals: 0,
    defaultVal: '',
  };
}

Deno.test('mapColumnType maps common MySQL types to Prisma column types', () => {
  assertEquals(mapColumnType(field('id', MySqlColumnType.LONG)), ColumnTypeEnum.Int32);
  assertEquals(mapColumnType(field('total', MySqlColumnType.NEWDECIMAL)), ColumnTypeEnum.Numeric);
  assertEquals(mapColumnType(field('payload', MySqlColumnType.JSON)), ColumnTypeEnum.Json);
  assertEquals(
    mapColumnType(field('created_at', MySqlColumnType.DATETIME)),
    ColumnTypeEnum.DateTime,
  );
});

Deno.test('mapArg converts Prisma transport values for MySQL parameters', () => {
  assertEquals(
    mapArg('42', { scalarType: 'bigint', dbType: 'BIGINT', arity: 'scalar' }),
    42n,
  );
  assertEquals(
    mapArg(new Date('2026-06-07T12:34:56.789Z'), {
      scalarType: 'datetime',
      dbType: 'DATETIME',
      arity: 'scalar',
    }),
    '2026-06-07 12:34:56.789',
  );
  assertEquals(
    mapArg('AQID', { scalarType: 'bytes', dbType: 'BLOB', arity: 'scalar' }),
    new Uint8Array([1, 2, 3]),
  );
});

Deno.test('mapRow converts rows to Prisma result arrays', () => {
  const fields = [
    field('id', MySqlColumnType.LONGLONG),
    field('created_at', MySqlColumnType.DATETIME),
    field('blob', MySqlColumnType.BLOB),
  ];

  assertEquals(
    mapRow(
      {
        id: 12n,
        created_at: new Date('2026-06-07T12:34:56.000Z'),
        blob: new Uint8Array([1, 2, 3]),
      },
      fields,
    ),
    ['12', '2026-06-07T12:34:56+00:00', 'AQID'],
  );
});
