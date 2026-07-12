/**
 * Type conversion utilities for MySQL to Prisma type mappings.
 *
 * Based on @prisma/adapter-mariadb conversion.ts but adapted for
 * deno_mysql driver which returns data in a different format.
 */

import type { ArgType, ColumnType, ResultValue } from '@prisma/driver-adapter-utils';
import { ColumnTypeEnum } from '@prisma/driver-adapter-utils';

/**
 * MySQL column type constants.
 * These match the field type values returned by deno_mysql.
 */
export const enum MySqlColumnType {
  DECIMAL = 0x00,
  TINY = 0x01,
  SHORT = 0x02,
  LONG = 0x03,
  FLOAT = 0x04,
  DOUBLE = 0x05,
  NULL = 0x06,
  TIMESTAMP = 0x07,
  LONGLONG = 0x08,
  INT24 = 0x09,
  DATE = 0x0a,
  TIME = 0x0b,
  DATETIME = 0x0c,
  YEAR = 0x0d,
  NEWDATE = 0x0e,
  VARCHAR = 0x0f,
  BIT = 0x10,
  TIMESTAMP2 = 0x11,
  DATETIME2 = 0x12,
  TIME2 = 0x13,
  JSON = 0xf5,
  NEWDECIMAL = 0xf6,
  ENUM = 0xf7,
  SET = 0xf8,
  TINY_BLOB = 0xf9,
  MEDIUM_BLOB = 0xfa,
  LONG_BLOB = 0xfb,
  BLOB = 0xfc,
  VAR_STRING = 0xfd,
  STRING = 0xfe,
  GEOMETRY = 0xff,
}

// MySQL field flag constants
const UNSIGNED_FLAG = 1 << 5;
const BINARY_FLAG = 1 << 7;

/**
 * Field metadata from deno_mysql driver.
 * The driver returns metadata in a different format than mariadb npm package.
 */
export interface MySqlFieldInfo {
  catalog: string;
  schema: string;
  table: string;
  originTable: string;
  name: string;
  originName: string;
  encoding: number;
  fieldLen: number;
  fieldType: number;
  fieldFlag: number;
  decimals: number;
  defaultVal: string;
}

/**
 * Maps MySQL field type to Prisma ColumnType.
 */
export function mapColumnType(field: MySqlFieldInfo): ColumnType {
  const fieldType = field.fieldType;
  const flags = field.fieldFlag;

  switch (fieldType) {
    case MySqlColumnType.TINY:
    case MySqlColumnType.SHORT:
    case MySqlColumnType.INT24:
    case MySqlColumnType.YEAR:
      return ColumnTypeEnum.Int32;

    case MySqlColumnType.LONG:
      // Unsigned INT becomes Int64
      if (flags & UNSIGNED_FLAG) {
        return ColumnTypeEnum.Int64;
      }
      return ColumnTypeEnum.Int32;

    case MySqlColumnType.LONGLONG:
      return ColumnTypeEnum.Int64;

    case MySqlColumnType.FLOAT:
      return ColumnTypeEnum.Float;

    case MySqlColumnType.DOUBLE:
      return ColumnTypeEnum.Double;

    case MySqlColumnType.TIMESTAMP:
    case MySqlColumnType.TIMESTAMP2:
    case MySqlColumnType.DATETIME:
    case MySqlColumnType.DATETIME2:
      return ColumnTypeEnum.DateTime;

    case MySqlColumnType.DATE:
    case MySqlColumnType.NEWDATE:
      return ColumnTypeEnum.Date;

    case MySqlColumnType.TIME:
    case MySqlColumnType.TIME2:
      return ColumnTypeEnum.Time;

    case MySqlColumnType.DECIMAL:
    case MySqlColumnType.NEWDECIMAL:
      return ColumnTypeEnum.Numeric;

    case MySqlColumnType.VARCHAR:
    case MySqlColumnType.VAR_STRING:
    case MySqlColumnType.STRING:
      // Check if it's a binary string
      if (flags & BINARY_FLAG) {
        return ColumnTypeEnum.Bytes;
      }
      return ColumnTypeEnum.Text;

    case MySqlColumnType.BLOB:
    case MySqlColumnType.TINY_BLOB:
    case MySqlColumnType.MEDIUM_BLOB:
    case MySqlColumnType.LONG_BLOB:
      // BLOB types with binary flag are bytes, otherwise text
      if (flags & BINARY_FLAG) {
        return ColumnTypeEnum.Bytes;
      }
      return ColumnTypeEnum.Text;

    case MySqlColumnType.ENUM:
      return ColumnTypeEnum.Enum;

    case MySqlColumnType.JSON:
      return ColumnTypeEnum.Json;

    case MySqlColumnType.BIT:
    case MySqlColumnType.GEOMETRY:
      return ColumnTypeEnum.Bytes;

    case MySqlColumnType.NULL:
      // Fall back to Int32 for consistency with quaint
      return ColumnTypeEnum.Int32;

    default:
      return ColumnTypeEnum.Text;
  }
}

/**
 * Maps an argument value to the appropriate MySQL format.
 */
export function mapArg(
  arg: unknown,
  argType: ArgType,
): unknown {
  if (arg === null) {
    return null;
  }

  // Handle BigInt conversion from string
  if (typeof arg === 'string' && argType.scalarType === 'bigint') {
    return BigInt(arg);
  }

  // Handle datetime string conversion
  if (typeof arg === 'string' && argType.scalarType === 'datetime') {
    arg = new Date(arg);
  }

  // Handle Date formatting based on database type
  if (arg instanceof Date) {
    const dbType = argType.dbType as string;
    if (dbType === 'TIME' || dbType === 'TIME2') {
      return formatTime(arg);
    }
    if (dbType === 'DATE' || dbType === 'NEWDATE') {
      return formatDate(arg);
    }
    return formatDateTime(arg);
  }

  // Handle bytes conversion from base64 string
  if (typeof arg === 'string' && argType.scalarType === 'bytes') {
    return base64ToUint8Array(arg);
  }

  // Handle ArrayBuffer views
  if (ArrayBuffer.isView(arg)) {
    return new Uint8Array(
      arg.buffer,
      arg.byteOffset,
      arg.byteLength,
    );
  }

  return arg;
}

/**
 * Maps a row from MySQL result to Prisma format.
 * deno_mysql returns rows as objects, but Prisma expects arrays.
 */
export function mapRow(
  row: Record<string, unknown>,
  fields: MySqlFieldInfo[],
): ResultValue[] {
  return fields.map((field) => {
    const value = row[field.name];

    if (value === null || value === undefined) {
      return null;
    }

    const fieldType = field.fieldType;

    // Handle timestamp/datetime - format as ISO string
    switch (fieldType) {
      case MySqlColumnType.TIMESTAMP:
      case MySqlColumnType.TIMESTAMP2:
      case MySqlColumnType.DATETIME:
      case MySqlColumnType.DATETIME2:
        if (value instanceof Date) {
          return value.toISOString().replace(/(\.000)?Z$/, '+00:00');
        }
        if (typeof value === 'string') {
          // Parse and reformat the date string
          return new Date(`${value}Z`).toISOString().replace(/(\.000)?Z$/, '+00:00');
        }
        break;

      case MySqlColumnType.DATE:
      case MySqlColumnType.NEWDATE:
        if (value instanceof Date) {
          return formatDate(value);
        }
        break;

      case MySqlColumnType.TIME:
      case MySqlColumnType.TIME2:
        if (value instanceof Date) {
          return formatTime(value);
        }
        break;
    }

    // Handle BigInt
    if (typeof value === 'bigint') {
      return value.toString();
    }

    // Handle Uint8Array - convert to base64 for JSON transport
    if (value instanceof Uint8Array) {
      return uint8ArrayToBase64(value);
    }

    return value as ResultValue;
  });
}

/**
 * Converts row object to array in column order.
 */
export function rowToArray(
  row: Record<string, unknown>,
  columnNames: string[],
): unknown[] {
  return columnNames.map((name) => row[name] ?? null);
}

// Date formatting utilities

function formatDateTime(date: Date): string {
  const pad = (n: number, z = 2) => String(n).padStart(z, '0');
  const ms = date.getUTCMilliseconds();
  return (
    pad(date.getUTCFullYear(), 4) +
    '-' +
    pad(date.getUTCMonth() + 1) +
    '-' +
    pad(date.getUTCDate()) +
    ' ' +
    pad(date.getUTCHours()) +
    ':' +
    pad(date.getUTCMinutes()) +
    ':' +
    pad(date.getUTCSeconds()) +
    (ms ? '.' + String(ms).padStart(3, '0') : '')
  );
}

function formatDate(date: Date): string {
  const pad = (n: number, z = 2) => String(n).padStart(z, '0');
  return (
    pad(date.getUTCFullYear(), 4) +
    '-' +
    pad(date.getUTCMonth() + 1) +
    '-' +
    pad(date.getUTCDate())
  );
}

function formatTime(date: Date): string {
  const pad = (n: number, z = 2) => String(n).padStart(z, '0');
  const ms = date.getUTCMilliseconds();
  return (
    pad(date.getUTCHours()) +
    ':' +
    pad(date.getUTCMinutes()) +
    ':' +
    pad(date.getUTCSeconds()) +
    (ms ? '.' + String(ms).padStart(3, '0') : '')
  );
}

// Base64 utilities for binary data

function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
