/**
 * Unit tests for the shared key utilities in `core/keys.ts`.
 *
 * @module
 */

import { assert, assertEquals, assertStrictEquals } from "@std/assert";

import {
  compareKeys,
  generateVersionstamp,
  keyHasPrefix,
  keyToString,
} from "../core/keys.ts";

// ---------------------------------------------------------------------------
// keyToString
// ---------------------------------------------------------------------------

Deno.test("keyToString — string-only key", () => {
  assertEquals(keyToString(["users", "123"]), '["users","123"]');
});

Deno.test("keyToString — mixed types (string, number, boolean)", () => {
  assertEquals(keyToString(["ns", 42, true]), '["ns",42,true]');
});

Deno.test("keyToString — single segment", () => {
  assertEquals(keyToString(["root"]), '["root"]');
});

Deno.test("keyToString — empty key", () => {
  assertEquals(keyToString([]), "[]");
});

Deno.test("keyToString — deterministic (same input produces identical output)", () => {
  const key = ["users", "123"] as const;
  assertStrictEquals(keyToString(key), keyToString(key));
  assertStrictEquals(keyToString(["ns", 42, true]), keyToString(["ns", 42, true]));
});

// ---------------------------------------------------------------------------
// generateVersionstamp
// ---------------------------------------------------------------------------

Deno.test("generateVersionstamp — returns a 26-character string", () => {
  const stamp = generateVersionstamp();
  assertStrictEquals(typeof stamp, "string");
  assertStrictEquals(stamp.length, 26);
});

Deno.test("generateVersionstamp — matches Crockford base-32 alphabet", () => {
  const stamp = generateVersionstamp();
  assert(
    /^[0-9A-HJKMNP-TV-Z]{26}$/.test(stamp),
    `Expected Crockford base-32, got "${stamp}"`,
  );
});

Deno.test("generateVersionstamp — sequential calls are strictly monotonic", () => {
  const a = generateVersionstamp();
  const b = generateVersionstamp();
  assert(a < b, `Expected "${a}" < "${b}"`);
});

Deno.test("generateVersionstamp — rapid burst of 100 calls: unique and ascending", () => {
  const stamps: string[] = [];
  for (let i = 0; i < 100; i++) {
    stamps.push(generateVersionstamp());
  }

  // Every stamp should be unique.
  const unique = new Set(stamps);
  assertStrictEquals(unique.size, stamps.length, "All 100 stamps must be unique");

  // Every consecutive pair must be strictly ascending.
  for (let i = 1; i < stamps.length; i++) {
    assert(
      stamps[i - 1] < stamps[i],
      `stamps[${i - 1}] ("${stamps[i - 1]}") should be < stamps[${i}] ("${stamps[i]}")`,
    );
  }
});

// ---------------------------------------------------------------------------
// keyHasPrefix
// ---------------------------------------------------------------------------

Deno.test("keyHasPrefix — exact match returns true", () => {
  assertStrictEquals(keyHasPrefix(["a", "b"], ["a", "b"]), true);
});

Deno.test("keyHasPrefix — proper prefix returns true", () => {
  assertStrictEquals(keyHasPrefix(["a", "b", "c"], ["a", "b"]), true);
});

Deno.test("keyHasPrefix — wrong prefix returns false", () => {
  assertStrictEquals(keyHasPrefix(["x", "b"], ["a"]), false);
});

Deno.test("keyHasPrefix — key shorter than prefix returns false", () => {
  assertStrictEquals(keyHasPrefix(["a"], ["a", "b"]), false);
});

Deno.test("keyHasPrefix — empty prefix always matches", () => {
  assertStrictEquals(keyHasPrefix(["a"], []), true);
});

Deno.test("keyHasPrefix — both empty returns true", () => {
  assertStrictEquals(keyHasPrefix([], []), true);
});

Deno.test("keyHasPrefix — numeric segments", () => {
  assertStrictEquals(keyHasPrefix([1, 2, 3], [1, 2]), true);
});

Deno.test("keyHasPrefix — type mismatch with strict equality (string '1' vs number 1)", () => {
  // The function uses `!==` so "1" and 1 are different.
  assertStrictEquals(keyHasPrefix(["1"], [1]), false);
});

// ---------------------------------------------------------------------------
// compareKeys
// ---------------------------------------------------------------------------

Deno.test("compareKeys — equal keys return 0", () => {
  assertStrictEquals(compareKeys(["a", "b"], ["a", "b"]), 0);
});

Deno.test("compareKeys — first key less than second returns negative", () => {
  assert(compareKeys(["a"], ["b"]) < 0);
});

Deno.test("compareKeys — first key greater than second returns positive", () => {
  assert(compareKeys(["b"], ["a"]) > 0);
});

Deno.test("compareKeys — shorter key sorts before longer key when common prefix matches", () => {
  assert(compareKeys(["a"], ["a", "b"]) < 0);
});

Deno.test("compareKeys — numeric segments compared via String() coercion", () => {
  // String(1) = "1", String(2) = "2"; "1" < "2"
  assert(compareKeys([1], [2]) < 0);
});

Deno.test("compareKeys — mixed types ordered via String() coercion", () => {
  // String("a") = "a" equal, then String(1) = "1" < String(2) = "2"
  assert(compareKeys(["a", 1], ["a", 2]) < 0);
});
