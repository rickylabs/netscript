<#
  Windows start-time probe for the real-stack build: where do the 11-13 s go?

  pwsh -NoProfile -File windows-stack-start.ps1 -App <folder with NetScript.exe> -Out <json> [-Runs 3]

  Measures: Defender state; raw spawn costs (deno.exe --version, deno eval, GarnetServer alone);
  fresh-profile starts and relaunches of one profile with per-node spawn/ready timings from the
  supervisor's stack/logs/supervisor.json; the process tree (conhost per deno.exe); graceful
  window close (WM_CLOSE) and what is left afterwards. Changes nothing outside the profiles it
  creates under $env:TEMP.
#>
param(
  [string]$App = "$env:USERPROFILE\Downloads\NetScript-GPUIX-PoC-realstack\NetScript",
  [string]$Out = "$env:USERPROFILE\netscript-stack-start.json",
  [int]$Runs = 3
)
$ErrorActionPreference = 'Stop'
$exe = Join-Path $App 'NetScript.exe'
$stack = Join-Path $App 'stack'
$deno = Join-Path $stack 'deno.exe'
$garnet = Join-Path $stack 'garnet\GarnetServer.exe'
$root = Join-Path $env:TEMP ("ns-start-" + [guid]::NewGuid().ToString('N').Substring(0, 8))
New-Item -ItemType Directory -Force $root | Out-Null

$result = [ordered]@{ date = (Get-Date).ToString('o'); app = $App; defender = $null; primitives = [ordered]@{}; runs = @() }

try {
  $m = Get-MpComputerStatus
  $result.defender = [ordered]@{ realTime = $m.RealTimeProtectionEnabled; onAccess = $m.OnAccessProtectionEnabled; behavior = $m.BehaviorMonitorEnabled; antivirusEnabled = $m.AntivirusEnabled }
} catch { $result.defender = "unavailable: $($_.Exception.Message)" }

function Measure-Times([scriptblock]$Block, [int]$Count) {
  $times = @()
  for ($i = 0; $i -lt $Count; $i++) { $times += [math]::Round((Measure-Command $Block).TotalMilliseconds) }
  return , $times
}

$result.primitives.denoVersionMs = Measure-Times { & $deno --version | Out-Null } 5
$result.primitives.denoEvalMs = Measure-Times { & $deno eval "0" | Out-Null } 3
$result.primitives.denoDirFiles = (Get-ChildItem -Recurse -File (Join-Path $stack 'deno-dir')).Count
$result.primitives.workspaceFiles = (Get-ChildItem -Recurse -File (Join-Path $stack 'workspace')).Count

# Garnet alone: spawn and wait until the port accepts connections.
$garnetTimes = @()
for ($i = 0; $i -lt 3; $i++) {
  $port = 29500 + $i
  $sw = [Diagnostics.Stopwatch]::StartNew()
  $g = Start-Process $garnet -ArgumentList '--port', $port, '--lua', '--lua-transaction-mode' -WindowStyle Hidden -PassThru
  $up = $false
  while ($sw.Elapsed.TotalSeconds -lt 30 -and -not $up) {
    try { $c = [Net.Sockets.TcpClient]::new('127.0.0.1', $port); $c.Close(); $up = $true } catch { Start-Sleep -Milliseconds 25 }
  }
  $garnetTimes += [math]::Round($sw.Elapsed.TotalMilliseconds)
  Stop-Process -Id $g.Id -Force -ErrorAction SilentlyContinue
  Start-Sleep -Milliseconds 500
}
$result.primitives.garnetReadyMs = $garnetTimes

function Get-Tree([int]$RootId) {
  $all = Get-CimInstance Win32_Process | Select-Object ProcessId, ParentProcessId, Name, WorkingSetSize
  $ids = [Collections.Generic.HashSet[int]]::new(); [void]$ids.Add($RootId)
  do {
    $added = $false
    foreach ($p in $all) { if ($ids.Contains([int]$p.ParentProcessId) -and $ids.Add([int]$p.ProcessId)) { $added = $true } }
  } while ($added)
  return @($all | Where-Object { $ids.Contains([int]$_.ProcessId) })
}

function Start-Once([string]$ProfileDir, [string]$Kind) {
  $log = "$ProfileDir.out.log"
  Remove-Item $log, "$log.err" -ErrorAction SilentlyContinue
  $env:NETSCRIPT_BENCH = '1'
  $env:NETSCRIPT_STACK = 'real'
  $sw = [Diagnostics.Stopwatch]::StartNew()
  $p = Start-Process $exe -ArgumentList "--profile=$ProfileDir" -RedirectStandardOutput $log -RedirectStandardError "$log.err" -PassThru
  $ready = $null
  while ($sw.Elapsed.TotalSeconds -lt 180 -and -not $ready) {
    if (Test-Path $log) {
      $match = Select-String -Path $log -Pattern 'NETSCRIPT_READY (\{.*\})' | Select-Object -First 1
      if ($match) { $ready = $match.Matches[0].Groups[1].Value | ConvertFrom-Json }
    }
    if (-not $ready) { Start-Sleep -Milliseconds 100 }
  }
  $wallMs = [math]::Round($sw.Elapsed.TotalMilliseconds)
  Start-Sleep -Seconds 3
  $tree = Get-Tree $p.Id
  $supervisor = $null
  $supFile = Join-Path $ProfileDir 'stack\logs\supervisor.json'
  if (Test-Path $supFile) { $supervisor = Get-Content $supFile -Raw | ConvertFrom-Json }

  # Graceful close: WM_CLOSE to the app's window (taskkill without /F), then check what is left.
  $closeSw = [Diagnostics.Stopwatch]::StartNew()
  & taskkill /PID $p.Id | Out-Null
  $exited = $p.WaitForExit(15000)
  $closeMs = [math]::Round($closeSw.Elapsed.TotalMilliseconds)
  Start-Sleep -Seconds 2
  $leftIds = @($tree | ForEach-Object { $_.ProcessId })
  $left = @(Get-Process -Id $leftIds -ErrorAction SilentlyContinue | Select-Object Id, ProcessName)
  foreach ($l in $left) { Stop-Process -Id $l.Id -Force -ErrorAction SilentlyContinue }
  if (-not $exited) { Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue }

  return [ordered]@{
    kind = $Kind
    profile = $ProfileDir
    wallToReadyMs = $wallMs
    ready = $ready
    supervisor = $supervisor
    processes = [ordered]@{
      total = $tree.Count
      byName = @($tree | Group-Object Name | ForEach-Object { [ordered]@{ name = $_.Name; count = $_.Count; workingSetMb = [math]::Round((($_.Group | Measure-Object WorkingSetSize -Sum).Sum) / 1MB) } })
    }
    gracefulClose = [ordered]@{ exitedWithin15s = $exited; closeMs = $closeMs; leftover = $left }
  }
}

$first = Join-Path $root 'fresh-0'
for ($i = 0; $i -lt $Runs; $i++) {
  $result.runs += Start-Once (Join-Path $root "fresh-$i") 'fresh-profile'
  Start-Sleep -Seconds 5
}
for ($i = 0; $i -lt $Runs; $i++) {
  $result.runs += Start-Once $first 'relaunch'
  Start-Sleep -Seconds 5
}

$result | ConvertTo-Json -Depth 12 | Set-Content -Encoding utf8 $Out
Write-Output "wrote $Out"
foreach ($r in $result.runs) {
  $slow = @($r.supervisor.nodes | Sort-Object { $_.readyAt - $_.spawnedAt } -Descending | Select-Object -First 3 | ForEach-Object { "$($_.name) $([math]::Round($_.readyAt - $_.spawnedAt)) ms" }) -join ', '
  Write-Output ("{0,-14} ready {1,6} ms  graph {2,6} ms  first spawn at {3,5} ms  slowest: {4}  procs {5}  close {6} ms leftover {7}" -f $r.kind, $r.wallToReadyMs, $r.supervisor.readyMs, $r.supervisor.nodes[0].spawnedAt, $slow, $r.processes.total, $r.gracefulClose.closeMs, $r.gracefulClose.leftover.Count)
}
