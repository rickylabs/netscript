# Ready-to-file upstream report (owner action)

No matching microsoft/aspire issue found in the searches recorded in research.md; this run has not filed one.

**Title:** ResourceNotificationService.WatchAsync leaks subscriptions when disposed during initial snapshots (Aspire 13.5.3)

**Repro:** Start an Aspire 13.5.3 AppHost with its dashboard healthy. Collect a server heap dump. Run `aspire describe --format Json` twenty times; collect another heap dump. Repeat with `aspire ps --format Json` or healthy-resource `aspire wait`. Compare UnboundedChannel<ResourceEvent>, Action<ResourceEvent>, and active readers. The downstream report observed approximately two extra retained channels per CLI connection; exact batch counts and RSS observations are in https://github.com/rickylabs/netscript/issues/2401 . No fresh heap measurement performed in this run.

**Cause:** https://github.com/microsoft/aspire/blob/v13.5.3/src/Aspire.Hosting/ApplicationModel/ResourceNotificationService.cs — WatchAsync adds WriteToChannel to OnResourceUpdated, then yields the initial snapshots outside try/finally. WaitForResourceCoreAsync returns when a healthy dashboard matches an initial snapshot; iterator disposal skips the finally and never unsubscribes/completes the channel. DashboardUrlsHelper's dashboard health wait and AuxiliaryBackchannelRpcTarget.WaitForResourceEventAsync are affected entrypoints.

**Expected/fix:** Put subscription and the complete initial snapshot enumeration under the same try/finally as channel consumption, or subscribe lazily with an equivalent lifetime guarantee. Always unsubscribe and complete the channel on early disposal, cancellation, or errors. Add a regression test that repeatedly consumes one initial healthy snapshot then disposes the iterator; publish later updates and verify no handlers/channels remain retained.

**Downstream mitigation:** NetScript replaces periodic CLI snapshots with a long-lived describe --follow stream and retains bounded one-shot discovery. No Aspire upgrade in NetScript 0.0.9.
