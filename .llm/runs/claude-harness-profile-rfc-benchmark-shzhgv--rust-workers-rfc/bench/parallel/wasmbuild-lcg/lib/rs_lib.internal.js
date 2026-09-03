// @generated file from wasmbuild -- do not edit
// @ts-nocheck: generated
// deno-lint-ignore-file
// deno-fmt-ignore-file

/**
 * @param {bigint} n
 * @param {bigint} seed
 * @returns {bigint}
 */
export function lcg_run(n, seed) {
  const ret = wasm.lcg_run(n, seed);
  return BigInt.asUintN(64, ret);
}
export function __wbindgen_init_externref_table() {
  const table = wasm.__wbindgen_externrefs;
  const offset = table.grow(4);
  table.set(0, undefined);
  table.set(offset + 0, undefined);
  table.set(offset + 1, null);
  table.set(offset + 2, true);
  table.set(offset + 3, false);
}

let wasm;
export function __wbg_set_wasm(val) {
  wasm = val;
}
