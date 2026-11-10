<#
  Windows follow-up probe for the GPUIX desktop RFC (decision gate 1).

  A) Launch types for both hosts: first launch (deno-compile code cache cleared + new profile),
     relaunch (same profile), fresh profile (cache warm). Records spawn → native window and
     spawn → data-backed frame (NETSCRIPT_READY).
  B) Where GPUIX spends CPU at 20 events/s: per-thread CPU grouped by thread description, on the
     overview (large tree) and on settings (small tree), plus idle. WebView2 per-process CPU by
     --type for comparison.

  Usage:  powershell -ExecutionPolicy Bypass -File windows-probe.ps1 -AppDir <dir> [-Repeats 3] [-Out <json>]
#>
param(
  [Parameter(Mandatory = $true)][string]$AppDir,
  [int]$Repeats = 3,
  [string]$Out = (Join-Path $env:USERPROFILE ("netscript-probe-windows-" + (Get-Date -Format 'yyyyMMdd-HHmmss') + ".json"))
)
$ErrorActionPreference = 'Stop'
$gpuixExe = Join-Path $AppDir 'NetScript.exe'
$webviewExe = Join-Path $AppDir 'webview\NetScript-Webview.exe'
if (-not (Test-Path $gpuixExe)) { throw "NetScript.exe not found in $AppDir" }
$hasWebview = Test-Path $webviewExe

Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public static class NsThreadNames {
  [DllImport("kernel32.dll", SetLastError = true)] static extern IntPtr OpenThread(uint access, bool inherit, uint id);
  [DllImport("kernel32.dll")] static extern bool CloseHandle(IntPtr handle);
  [DllImport("kernel32.dll")] static extern int GetThreadDescription(IntPtr handle, out IntPtr description);
  [DllImport("kernel32.dll")] static extern IntPtr LocalFree(IntPtr memory);
  public static string Get(int id) {
    IntPtr handle = OpenThread(0x0800, false, (uint)id); // THREAD_QUERY_LIMITED_INFORMATION
    if (handle == IntPtr.Zero) return "";
    try {
      IntPtr text;
      if (GetThreadDescription(handle, out text) < 0 || text == IntPtr.Zero) return "";
      string value = Marshal.PtrToStringUni(text);
      LocalFree(text);
      return value ?? "";
    } finally { CloseHandle(handle); }
  }
}
"@

function Read-Shared([string]$Path) {
  if (-not (Test-Path $Path)) { return '' }
  try {
    $stream = [System.IO.File]::Open($Path, 'Open', 'Read', 'ReadWrite')
    try { return (New-Object System.IO.StreamReader($stream)).ReadToEnd() } finally { $stream.Dispose() }
  } catch { return '' }
}

function Stop-Tree([int]$ProcessId) {
  & taskkill.exe /PID $ProcessId /T /F *> $null
  Start-Sleep -Milliseconds 1200
}

function Set-BenchEnv([string]$HostKind, [string]$ProfileDir, [int]$Rate, [string]$Path) {
  $env:NETSCRIPT_BENCH = '1'
  $env:NETSCRIPT_BENCH_RATE = "$Rate"
  if ($HostKind -eq 'webview') { $env:NETSCRIPT_BENCH_PROFILE = $ProfileDir } else { Remove-Item Env:NETSCRIPT_BENCH_PROFILE -ErrorAction SilentlyContinue }
  if ($Path) { $env:NETSCRIPT_PATH = $Path } else { Remove-Item Env:NETSCRIPT_PATH -ErrorAction SilentlyContinue }
}

function Clear-BenchEnv {
  foreach ($name in 'NETSCRIPT_BENCH', 'NETSCRIPT_BENCH_RATE', 'NETSCRIPT_BENCH_PROFILE', 'NETSCRIPT_PATH') {
    Remove-Item "Env:$name" -ErrorAction SilentlyContinue
  }
}

function Start-Host([string]$HostKind, [string]$ProfileDir, [string]$OutFile) {
  $exe = if ($HostKind -eq 'webview') { $webviewExe } else { $gpuixExe }
  if ($HostKind -eq 'webview') {
    return Start-Process -FilePath $exe -RedirectStandardOutput $OutFile -RedirectStandardError ($OutFile + '.err') -PassThru
  }
  return Start-Process -FilePath $exe -ArgumentList ("--profile=" + $ProfileDir) -RedirectStandardOutput $OutFile -RedirectStandardError ($OutFile + '.err') -PassThru
}

function New-ProfileDir { $dir = Join-Path $env:TEMP ("ns-probe-" + [guid]::NewGuid().ToString('N')); New-Item -ItemType Directory -Path $dir | Out-Null; return $dir }

function Clear-CodeCache([string]$HostKind) {
  # Only the deno-compile caches this app's binaries create in %TEMP%.
  $pattern = if ($HostKind -eq 'webview') { '^deno-compile-NetScript-Webview' } else { '^deno-compile-NetScript(?!-Webview)' }
  $removed = @()
  Get-ChildItem -Path $env:TEMP -Force -ErrorAction SilentlyContinue | Where-Object { $_.Name -match $pattern } | ForEach-Object {
    $removed += $_.Name
    Remove-Item -LiteralPath $_.FullName -Recurse -Force -ErrorAction SilentlyContinue
  }
  return $removed
}

function Measure-Launch([string]$HostKind, [string]$Kind, [string]$ProfileDir) {
  $outFile = Join-Path $env:TEMP ("ns-probe-" + [guid]::NewGuid().ToString('N') + '.out')
  Set-BenchEnv $HostKind $ProfileDir 0 $null
  $watch = [System.Diagnostics.Stopwatch]::StartNew()
  $process = Start-Host $HostKind $ProfileDir $outFile
  $window = $null; $ready = $null
  while ($watch.ElapsedMilliseconds -lt 45000 -and ($null -eq $window -or $null -eq $ready)) {
    if ($null -eq $window) {
      $process.Refresh()
      if ($process.MainWindowHandle -ne [IntPtr]::Zero) { $window = $watch.ElapsedMilliseconds }
    }
    if ($null -eq $ready -and (Read-Shared $outFile) -match 'NETSCRIPT_READY') { $ready = $watch.ElapsedMilliseconds }
    Start-Sleep -Milliseconds 10
  }
  Stop-Tree $process.Id
  Clear-BenchEnv
  return [pscustomobject]@{ host = $HostKind; kind = $Kind; windowMs = $window; dataMs = $ready }
}

function Get-ThreadTimes([int]$ProcessId) {
  $map = @{}
  $process = Get-Process -Id $ProcessId -ErrorAction SilentlyContinue
  if (-not $process) { return $map }
  foreach ($thread in $process.Threads) {
    try { $map[$thread.Id] = $thread.TotalProcessorTime.TotalMilliseconds } catch { }
  }
  return $map
}

function Measure-GpuixThreads([string]$Label, [int]$Rate, [string]$Path, [int]$WindowMs = 10000) {
  $profileDir = New-ProfileDir
  $outFile = Join-Path $env:TEMP ("ns-probe-" + [guid]::NewGuid().ToString('N') + '.out')
  Set-BenchEnv 'gpuix' $profileDir $Rate $Path
  $process = Start-Host 'gpuix' $profileDir $outFile
  if ($Path) { Start-Sleep -Seconds 8 } else {
    $deadline = (Get-Date).AddSeconds(45)
    while ((Get-Date) -lt $deadline -and -not ((Read-Shared $outFile) -match 'NETSCRIPT_READY')) { Start-Sleep -Milliseconds 100 }
    Start-Sleep -Seconds 2
  }
  $before = Get-ThreadTimes $process.Id
  $processBefore = (Get-Process -Id $process.Id).TotalProcessorTime.TotalMilliseconds
  Start-Sleep -Milliseconds $WindowMs
  $after = Get-ThreadTimes $process.Id
  $processAfter = (Get-Process -Id $process.Id).TotalProcessorTime.TotalMilliseconds
  $groups = @{}
  foreach ($id in $after.Keys) {
    $delta = $after[$id] - $(if ($before.ContainsKey($id)) { $before[$id] } else { 0 })
    if ($delta -le 0) { continue }
    $name = [NsThreadNames]::Get([int]$id)
    if (-not $name) { $name = '(unnamed)' }
    $name = $name -replace '[\s#:\-]*\d+$', ''
    if (-not $groups.ContainsKey($name)) { $groups[$name] = 0.0 }
    $groups[$name] += $delta
  }
  Stop-Tree $process.Id
  Clear-BenchEnv
  $threads = $groups.GetEnumerator() | Sort-Object Value -Descending | ForEach-Object {
    [pscustomobject]@{ thread = $_.Key; cpuPct = [math]::Round($_.Value / $WindowMs * 100, 1) }
  }
  return [pscustomobject]@{ label = $Label; rate = $Rate; path = $(if ($Path) { $Path } else { '/overview' }); totalCpuPct = [math]::Round(($processAfter - $processBefore) / $WindowMs * 100, 1); threads = @($threads) }
}

function Get-TreeProcesses([int]$RootId) {
  $all = Get-CimInstance Win32_Process | Select-Object ProcessId, ParentProcessId, Name, CommandLine, KernelModeTime, UserModeTime
  $members = @(); $queue = New-Object System.Collections.Queue; $queue.Enqueue($RootId)
  while ($queue.Count -gt 0) {
    $id = $queue.Dequeue()
    foreach ($row in $all) {
      if ($row.ProcessId -eq $id) { $members += $row }
      if ($row.ParentProcessId -eq $id -and $row.ProcessId -ne $id) { $queue.Enqueue($row.ProcessId) }
    }
  }
  return $members
}

function Measure-WebviewProcesses([int]$Rate, [int]$WindowMs = 10000) {
  $profileDir = New-ProfileDir
  $outFile = Join-Path $env:TEMP ("ns-probe-" + [guid]::NewGuid().ToString('N') + '.out')
  Set-BenchEnv 'webview' $profileDir $Rate $null
  $process = Start-Host 'webview' $profileDir $outFile
  $deadline = (Get-Date).AddSeconds(45)
  while ((Get-Date) -lt $deadline -and -not ((Read-Shared $outFile) -match 'NETSCRIPT_READY')) { Start-Sleep -Milliseconds 100 }
  Start-Sleep -Seconds 2
  $before = @{}; foreach ($row in Get-TreeProcesses $process.Id) { $before[$row.ProcessId] = $row.KernelModeTime + $row.UserModeTime }
  Start-Sleep -Milliseconds $WindowMs
  $groups = @{}
  foreach ($row in Get-TreeProcesses $process.Id) {
    $delta = ($row.KernelModeTime + $row.UserModeTime) - $(if ($before.ContainsKey($row.ProcessId)) { $before[$row.ProcessId] } else { 0 })
    $type = if ($row.CommandLine -match '--type=([a-z-]+)') { $Matches[1] } elseif ($row.Name -like 'msedgewebview2*') { 'browser' } else { 'host (Deno + service)' }
    if ($row.CommandLine -match '--utility-sub-type=([\w.]+)') { $type = "$type ($($Matches[1]))" }
    if (-not $groups.ContainsKey($type)) { $groups[$type] = 0.0 }
    $groups[$type] += $delta / 10000.0 # 100-ns → ms
  }
  Stop-Tree $process.Id
  Clear-BenchEnv
  $parts = $groups.GetEnumerator() | Sort-Object Value -Descending | ForEach-Object { [pscustomobject]@{ process = $_.Key; cpuPct = [math]::Round($_.Value / $WindowMs * 100, 1) } }
  return [pscustomobject]@{ rate = $Rate; totalCpuPct = [math]::Round((($groups.Values | Measure-Object -Sum).Sum) / $WindowMs * 100, 1); processes = @($parts) }
}

# ---- A) launch types ----------------------------------------------------------------------
$launches = @()
$cacheNames = @()
$hosts = @('gpuix'); if ($hasWebview) { $hosts += 'webview' }
for ($round = 1; $round -le $Repeats; $round++) {
  foreach ($hostKind in $hosts) {
    $cacheNames += Clear-CodeCache $hostKind
    $profileA = New-ProfileDir
    $launches += Measure-Launch $hostKind 'first-launch (code cache cleared, new profile)' $profileA
    $launches += Measure-Launch $hostKind 'relaunch (existing profile)' $profileA
    $launches += Measure-Launch $hostKind 'new profile (code cache warm)' (New-ProfileDir)
    Write-Host ("round {0} {1} done" -f $round, $hostKind)
  }
}

# ---- B) CPU attribution ---------------------------------------------------------------------
$attribution = @()
$attribution += Measure-GpuixThreads 'GPUIX overview, 20 events/s' 20 $null
$attribution += Measure-GpuixThreads 'GPUIX settings (small tree), 20 events/s' 20 '/settings'
$attribution += Measure-GpuixThreads 'GPUIX overview, idle' 0 $null
$webviewAttribution = $null
if ($hasWebview) { $webviewAttribution = Measure-WebviewProcesses 20 }

$summary = $launches | Group-Object host, kind | ForEach-Object {
  $windows = @($_.Group | Where-Object { $null -ne $_.windowMs } | ForEach-Object { $_.windowMs } | Sort-Object)
  $data = @($_.Group | Where-Object { $null -ne $_.dataMs } | ForEach-Object { $_.dataMs } | Sort-Object)
  [pscustomobject]@{
    host = $_.Group[0].host; kind = $_.Group[0].kind
    windowMedianMs = $(if ($windows.Count) { $windows[[int][math]::Floor($windows.Count / 2)] } else { $null })
    dataMedianMs = $(if ($data.Count) { $data[[int][math]::Floor($data.Count / 2)] } else { $null })
    samples = @($_.Group | ForEach-Object { "window=$($_.windowMs) data=$($_.dataMs)" })
  }
}

$result = [pscustomobject]@{
  date = (Get-Date).ToUniversalTime().ToString('o')
  appDir = $AppDir
  cacheEntriesCleared = @($cacheNames | Sort-Object -Unique)
  launchSummary = @($summary)
  launches = @($launches)
  gpuixThreads = @($attribution)
  webviewProcesses = $webviewAttribution
}
$json = $result | ConvertTo-Json -Depth 6
Set-Content -Path $Out -Value $json -Encoding UTF8
Write-Output $json
Write-Host "wrote $Out"
