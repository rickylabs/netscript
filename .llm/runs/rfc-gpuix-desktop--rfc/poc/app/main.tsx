/**
 * Installable entry. `NetScript --bench [--compare=<webview build>]` runs the
 * benchmark against itself (and an optional webview build) on this machine's
 * real GPU; anything else opens the app.
 */
if (Deno.args.includes('--bench')) {
  await import('./bench-mode.ts');
} else {
  await import('./main.gpuix.tsx');
}
