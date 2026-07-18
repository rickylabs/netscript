const platformIndex = Deno.args.indexOf('--platform');
const platform = platformIndex < 0 ? undefined : Deno.args[platformIndex + 1];
if (platform !== 'windows' && platform !== 'darwin') {
  throw new Error('Expected --platform windows or --platform darwin.');
}

const reason = platform === 'windows'
  ? 'Owner-hosted MSI staged-detection/manual-update execution has not been run.'
  : 'No macOS host result exists for the best-effort DMG apply/rollback execution.';
console.error(JSON.stringify({ status: 'NOT_RUN', platform, reason }));

// A host-applicable unexecuted leg is intentionally fail-closed. The invocation
// cannot become a green gate merely because runnable platform proof is pending.
throw new Error(`${platform} native desktop leg is NOT_RUN.`);
