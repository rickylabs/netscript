# Logging removal controls

Remove each factory logger config independently and run its structured HTTP test. Tests fail
at the native info vs plugin debug assertion. Also remove legacy workers option delegation
and startTriggersService delegation: configured-info cases fail against the debug default.
Restore files in finally; no mutation commit is needed. All seven controls fail as expected.
Triggers uses logger service name triggers-api. Its legacy start returns no handle: parent
preallocates five explicit child-authorized ports; owned listeners die with the reaped child.
