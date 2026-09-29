param([Parameter(Mandatory=$true)][string]$Bundle,[switch]$AllowDisposableGitHubRunner,[switch]$ValidateOnly)
$ErrorActionPreference='Stop'
Set-StrictMode -Version Latest
# Accident-prevention guards, not an authentication/sandbox boundary. Never set
# these environment flags on a personal PC to bypass the disposable-runner check.
if (-not $AllowDisposableGitHubRunner -or $env:GITHUB_ACTIONS -cne 'true' -or
    $env:RUNNER_ENVIRONMENT -cne 'github-hosted' -or $env:RUNNER_OS -cne 'Windows' -or
    $env:ImageOS -notmatch '^win\d+$' -or $env:GITHUB_RUN_ID -notmatch '^\d+$' -or
    $env:GITHUB_REPOSITORY -cne 'BootsOfTango/Helldivers-2-Roulette') {
  throw 'REFUSED: requires explicitly approved disposable GitHub-hosted Windows runner'
}
if (-not $env:RUNNER_TEMP -or -not [IO.Path]::IsPathFullyQualified($env:RUNNER_TEMP)) { throw 'Runner temporary root missing' }
$taskTemp=[IO.Path]::GetFullPath($env:RUNNER_TEMP).TrimEnd('\','/')
$taskBundle=[IO.Path]::GetFullPath($Bundle).TrimEnd('\','/')
if ($taskBundle -cne (Join-Path $taskTemp 'hd2-lifecycle-bundle')) { throw 'Unexpected runner bundle path' }
if ($ValidateOnly) { Write-Output 'Disposable runner/path preflight passed; no mutation'; exit 0 }
if (-not (Test-Path -LiteralPath $taskBundle -PathType Container)) { throw 'Bundle absent' }
if (@(Get-Item -LiteralPath $taskBundle; Get-ChildItem -LiteralPath $taskBundle -Recurse -Force) | Where-Object { $_.Attributes -band [IO.FileAttributes]::ReparsePoint }) { throw 'Linked bundle refused' }
$taskManifest=Get-Content -LiteralPath (Join-Path $taskBundle 'manifest.json') -Raw | ConvertFrom-Json
if ($taskManifest.schemaVersion -ne 1 -or $taskManifest.purpose -cne 'disposable-github-runner-test-only' -or
    $taskManifest.productName -cne 'HD2 Chaos Slot Machine' -or $taskManifest.profileDirectory -cne 'Helldivers 2 Chaos Slot Machine' -or
    $taskManifest.guid -cne '47bdb29f-8aa0-5f3c-a469-272721cfb1dc' -or $taskManifest.sourceCommit -notmatch '^[a-f0-9]{40}$') { throw 'Unexpected manifest identity' }
$taskExpected=@('manifest.json','HD2-Chaos-Slot-Machine-Setup-local-ci-lifecycle-win-x64.exe','synthetic-state.json','test-windows-lifecycle.ps1','TEST-ONLY.txt')
$taskActual=@(Get-ChildItem -LiteralPath $taskBundle -Force)
if ($taskActual.Count -ne 5 -or @($taskActual | Where-Object { $_.PSIsContainer }).Count -or (Compare-Object $taskExpected $taskActual.Name)) { throw 'Unexpected bundle files' }
if ($taskManifest.installer -cne $taskExpected[1] -or $taskManifest.files.Count -ne 4) { throw 'Unexpected installer/file manifest' }
if (Compare-Object @($taskExpected | Where-Object { $_ -ne 'manifest.json' }) @($taskManifest.files.file)) { throw 'Manifest filenames differ' }
foreach ($taskFile in $taskManifest.files) {
  if ($taskFile.sha256 -notmatch '^[a-f0-9]{64}$' -or (Get-FileHash -LiteralPath (Join-Path $taskBundle $taskFile.file)).Hash -ne $taskFile.sha256) { throw 'Bundle checksum mismatch' }
}
if ($taskManifest.runtimeFiles.Count -lt 20 -or $taskManifest.runtimeFiles.Count -gt 2000 -or $taskManifest.uninstallerSha256 -notmatch '^[a-f0-9]{64}$') { throw 'Invalid runtime manifest' }
$taskSeen=[Collections.Generic.HashSet[string]]::new([StringComparer]::OrdinalIgnoreCase)
foreach ($taskFile in $taskManifest.runtimeFiles) {
  if ($taskFile.file -match '(^/|\\|:|(^|/)\.\.?(/|$))' -or $taskFile.sha256 -notmatch '^[a-f0-9]{64}$' -or -not $taskSeen.Add($taskFile.file)) { throw 'Unsafe/duplicate runtime file' }
}
$taskEvidence=Join-Path $taskTemp 'hd2-lifecycle-evidence'
if (Test-Path -LiteralPath $taskEvidence) { throw 'Lifecycle already attempted; use a fresh job' }
New-Item -ItemType Directory -Path $taskEvidence | Out-Null
$taskReport=[ordered]@{Passed=$false;SourceCommit=$taskManifest.sourceCommit;RunnerImage=$env:ImageOS;OS=(Get-CimInstance Win32_OperatingSystem).Caption;InstallerSHA256=($taskManifest.files | Where-Object file -eq $taskManifest.installer).sha256;Checks=[Collections.Generic.List[string]]::new();Phases=[Collections.Generic.List[object]]::new();Limits=@('Fresh GitHub Windows Server image, not tools-free consumer Windows','Silent per-user lifecycle only; no wizard/audio/DPI/all-users or offline-network proof','No local player profiles or release publication')}
function Save-Report { $taskReport | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath (Join-Path $taskEvidence 'report.json') -Encoding utf8 }
function Confirm([bool]$Condition,[string]$Message) { if (-not $Condition) { throw $Message }; $taskReport.Checks.Add($Message); Save-Report }
$taskGuid=$taskManifest.guid
$taskInstall=Join-Path $env:LOCALAPPDATA 'Programs\HD2 Chaos Slot Machine'
$taskProfile=Join-Path $env:APPDATA 'Helldivers 2 Chaos Slot Machine'
$taskExe=Join-Path $taskInstall 'HD2 Chaos Slot Machine.exe'
$taskUninstaller=Join-Path $taskInstall 'Uninstall HD2 Chaos Slot Machine.exe'
$taskDesktop=Join-Path ([Environment]::GetFolderPath('Desktop')) 'HD2 Chaos Slot Machine.lnk'
$taskStart=Join-Path ([Environment]::GetFolderPath('Programs')) 'HD2 Chaos Slot Machine.lnk'
$taskKeys=@("HKCU:\Software\$taskGuid","HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\$taskGuid")
$taskMachineKeys=@("HKLM:\Software\$taskGuid","HKLM:\Software\Microsoft\Windows\CurrentVersion\Uninstall\$taskGuid","HKLM:\Software\WOW6432Node\$taskGuid","HKLM:\Software\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall\$taskGuid")
function Confirm-NoApp { Confirm (-not @(Get-Process -Name 'HD2 Chaos Slot Machine','Helldivers 2 Chaos Slot Machine' -ErrorAction SilentlyContinue).Count) 'No app process before installer lifecycle action' }
function Invoke-Native([string]$File,[string]$Arguments,[string]$Phase) {
  Confirm-NoApp
  $taskProcess=Start-Process -FilePath $File -ArgumentList $Arguments -WindowStyle Hidden -PassThru
  $taskDeadline=[DateTime]::UtcNow.AddSeconds(90)
  while (-not $taskProcess.WaitForExit(1000)) { if ([DateTime]::UtcNow -gt $taskDeadline) { throw 'Native operation timed out; no forced termination or further lifecycle action' } }
  $taskProcess.Refresh()
  $taskReport.Phases.Add(@{Name=$Phase;ExitCode=$taskProcess.ExitCode})
  Confirm ($taskProcess.ExitCode -eq 0) "$Phase exited successfully"
}
function Confirm-Installed {
  foreach ($taskFile in $taskManifest.runtimeFiles) { Confirm ((Get-FileHash -LiteralPath (Join-Path $taskInstall $taskFile.file)).Hash -eq $taskFile.sha256) ('Installed bytes match: '+$taskFile.file) }
  Confirm ((Get-FileHash -LiteralPath $taskUninstaller).Hash -eq $taskManifest.uninstallerSha256) 'Actual product uninstaller hash matches inspected build'
  $taskInstalledFiles=@(Get-ChildItem -LiteralPath $taskInstall -Recurse -Force -File | ForEach-Object { $_.FullName.Substring($taskInstall.Length+1).Replace('\','/') })
  Confirm (-not (Compare-Object (@($taskManifest.runtimeFiles.file)+@('Uninstall HD2 Chaos Slot Machine.exe')) $taskInstalledFiles)) 'No unexpected installed files or shell warning log'
  $taskShell=New-Object -ComObject WScript.Shell
  foreach ($taskShortcut in @($taskDesktop,$taskStart)) {
    Confirm (Test-Path -LiteralPath $taskShortcut) 'Native shortcut exists'
    $taskLink=$taskShell.CreateShortcut($taskShortcut)
    Confirm ($taskLink.TargetPath -ceq $taskExe -and -not $taskLink.Arguments) 'Native shortcut targets installed EXE without extra arguments'
  }
  Confirm ((Get-ItemProperty -LiteralPath $taskKeys[0]).InstallLocation -ceq $taskInstall) 'Per-user install registration correct'
  $taskRegistration=Get-ItemProperty -LiteralPath $taskKeys[1]
  Confirm ($taskRegistration.DisplayVersion -eq $taskManifest.compatibilityVersion -and $taskRegistration.UninstallString.Contains($taskUninstaller)) 'Per-user uninstall registration correct'
  foreach ($taskKey in $taskMachineKeys) { Confirm (-not (Test-Path -LiteralPath $taskKey)) 'Per-user install did not create machine-wide product registration' }
}
function Confirm-Card {
  $taskState=Get-Content -LiteralPath (Join-Path $taskProfile 'state.json') -Raw | ConvertFrom-Json
  $taskCards=@($taskState.data.cards | Where-Object id -eq 'ci-installer-lifecycle-card')
  Confirm ($taskCards.Count -eq 1) 'Exactly one synthetic card retained'
  $taskCard=$taskCards[0]
  Confirm ($taskCard.stats.kills -eq 100 -and $taskCard.originalNote -ceq 'Synthetic locked note' -and $taskCard.commentNotes[0].text -ceq 'Keep this synthetic comment') 'Original stats, locked note and comment preserved'
  Confirm ($taskCard.soloScore.version -eq 1 -and $taskCard.soloScore.result.rating -eq 67.5) 'No automatic scoring recalibration'
}
function Request-NormalClose($Process) {
  # Process caches MainWindowHandle. Startup migration can replace the initial
  # window; re-query before each normal close request rather than using a stale handle.
  for ($taskAttempt=0; $taskAttempt -lt 20; $taskAttempt++) {
    $Process.Refresh()
    if ($Process.HasExited) { return $false }
    if ($Process.MainWindowHandle -ne [IntPtr]::Zero -and $Process.CloseMainWindow()) { return $true }
    Start-Sleep -Milliseconds 500
  }
  return $false
}
# Native UI fixture driver for the disposable runner only. No global keystrokes,
# no arbitrary dialog dismissal, and no disabling/re-enabling blocked windows.
# A first-run JavaScript alert disables its parent, so CloseMainWindow correctly
# refuses the parent until the user acknowledges the informational reminder.
Add-Type -TypeDefinition @'
using System;
using System.Text;
using System.Collections.Generic;
using System.Runtime.InteropServices;
public static class LifecycleDialogs {
  public delegate bool EnumProc(IntPtr window, IntPtr data);
  [DllImport("user32.dll")] static extern bool EnumWindows(EnumProc callback, IntPtr data);
  [DllImport("user32.dll")] static extern bool EnumChildWindows(IntPtr parent, EnumProc callback, IntPtr data);
  [DllImport("user32.dll")] static extern uint GetWindowThreadProcessId(IntPtr window, out uint process);
  [DllImport("user32.dll", CharSet=CharSet.Unicode)] static extern int GetWindowText(IntPtr window, StringBuilder text, int length);
  [DllImport("user32.dll", CharSet=CharSet.Unicode)] static extern int GetClassName(IntPtr window, StringBuilder text, int length);
  [DllImport("user32.dll", CharSet=CharSet.Unicode, SetLastError=true)] static extern IntPtr SendMessageTimeout(IntPtr window, uint message, IntPtr size, StringBuilder text, uint flags, uint timeout, out IntPtr result);
  [DllImport("user32.dll")] public static extern bool IsWindowEnabled(IntPtr window);
  [DllImport("user32.dll")] static extern bool IsWindowVisible(IntPtr window);
  [DllImport("user32.dll")] static extern int GetDlgCtrlID(IntPtr window);
  [DllImport("user32.dll", SetLastError=true)] static extern bool PostMessage(IntPtr window, uint message, IntPtr wParam, IntPtr lParam);
  public class Control {
    public IntPtr Handle; public uint Process; public string Class; public string Text;
    public int Id; public bool Enabled; public bool Visible;
  }
  static Control Read(IntPtr h) {
    uint pid; GetWindowThreadProcessId(h, out pid);
    var text=new StringBuilder(4096); GetWindowText(h,text,text.Capacity);
    var name=new StringBuilder(256); GetClassName(h,name,name.Capacity);
    // Cross-process GetWindowText does not reliably read child-control text.
    // WM_GETTEXT is a read-only, bounded query; never block on an unresponsive UI.
    if(name.ToString()=="Static" || name.ToString()=="Button") {
      var controlText=new StringBuilder(4096); IntPtr result;
      if(SendMessageTimeout(h,0x000D,new IntPtr(controlText.Capacity),controlText,2,500,out result)!=IntPtr.Zero) text=controlText;
    }
    return new Control {Handle=h,Process=pid,Class=name.ToString(),Text=text.ToString(),
      Id=GetDlgCtrlID(h),Enabled=IsWindowEnabled(h),Visible=IsWindowVisible(h)};
  }
  public static Control[] Dialogs(uint pid) {
    var items=new List<Control>();
    EnumWindows((h,d)=>{var c=Read(h); if(c.Process==pid && c.Class=="#32770" && c.Visible) items.Add(c); return true;},IntPtr.Zero);
    return items.ToArray();
  }
  public static Control[] Children(IntPtr parent) {
    var items=new List<Control>();
    EnumChildWindows(parent,(h,d)=>{items.Add(Read(h));return true;},IntPtr.Zero);
    return items.ToArray();
  }
  public static bool IsReminder(Control dialog, Control[] children, uint pid, string expected) {
    if(dialog.Process!=pid || dialog.Class!="#32770" || !dialog.Visible || !dialog.Enabled) return false;
    int messages=0, buttons=0, oks=0;
    foreach(var c in children) {
      if(c.Process!=pid) return false;
      if(c.Class=="Static" && c.Text==expected) messages++;
      if(c.Class=="Button" && c.Visible) {
        buttons++;
        if(c.Id==1 && c.Text.Replace("&","")=="OK" && c.Enabled) oks++;
      }
    }
    return messages==1 && buttons==1 && oks==1;
  }
  public static bool Acknowledge(IntPtr dialog, uint pid, string expected) {
    // Re-read the exact observed handle immediately before sending the same
    // WM_COMMAND/IDOK notification as its OK button. Unknown dialogs are refused.
    var current=Read(dialog); var children=Children(dialog);
    if(!IsReminder(current,children,pid,expected)) return false;
    foreach(var c in children) if(c.Class=="Button" && c.Id==1)
      return PostMessage(dialog,0x0111,new IntPtr(1),c.Handle);
    return false;
  }
}
'@
function Acknowledge-FirstRunReminder($Process,[bool]$Expected) {
  $taskReminder='Desktop save reminder: your cards, item changes, and supported settings are stored in the app save folder with automatic backups. Use Export JSON any time you want a portable copy. First launch from the browser version? Export JSON in the browser version, open this desktop version, then Import JSON here.'
  $taskUntil=[DateTime]::UtcNow.AddSeconds(20)
  do {
    $Process.Refresh()
    if ($Process.HasExited) { throw 'App exited while checking first-run reminder' }
    $taskDialogs=@([LifecycleDialogs]::Dialogs($Process.Id))
    if ($taskDialogs.Count) {
      Confirm ($Expected -and $taskDialogs.Count -eq 1) 'Only the expected first-run dialog is present'
      $taskDialog=$taskDialogs[0]
      $taskControls=[LifecycleDialogs]::Children($taskDialog.Handle)
      $taskReport.Phases.Add(@{Name='observed-first-run-dialog';Class=$taskDialog.Class;Title=$taskDialog.Text;Enabled=$taskDialog.Enabled;Controls=@($taskControls | Select-Object Class,Id,Enabled,Visible,@{n='Text';e={$_.Text.Substring(0,[Math]::Min(600,$_.Text.Length))}})}); Save-Report
      Confirm ([LifecycleDialogs]::IsReminder($taskDialog,$taskControls,$Process.Id,$taskReminder)) 'Exact informational save reminder and sole enabled OK button observed'
      Confirm ([LifecycleDialogs]::Acknowledge($taskDialog.Handle,$Process.Id,$taskReminder)) 'Known first-run reminder acknowledged normally'
      $taskReport.Phases.Add(@{Name='first-run-reminder';Acknowledged=$true}); Save-Report
      $taskGoneUntil=[DateTime]::UtcNow.AddSeconds(10)
      while (@([LifecycleDialogs]::Dialogs($Process.Id)).Count) {
        if ([DateTime]::UtcNow -gt $taskGoneUntil) { throw 'Reminder did not dismiss; no further input' }
        Start-Sleep -Milliseconds 250
      }
      return
    }
    if (-not $Expected) { return }
    Start-Sleep -Milliseconds 250
  } while ([DateTime]::UtcNow -lt $taskUntil)
  throw 'Expected first-run reminder was not observed; no blind acknowledgement'
}
function Launch-And-Close([string]$Phase) {
  Confirm-NoApp
  foreach ($taskEnvName in @('HD2CSM_USER_DATA_DIR','HD2CSM_AUTOMATION','HD2_ELECTRON_TEST_HARNESS','ELECTRON_RUN_AS_NODE','NODE_OPTIONS')) { Remove-Item -LiteralPath "Env:$taskEnvName" -ErrorAction SilentlyContinue }
  $taskApp=Start-Process -FilePath $taskExe -PassThru
  $taskDeadline=[DateTime]::UtcNow.AddSeconds(45)
  do {
    Start-Sleep -Milliseconds 500
    $taskApp.Refresh()
    if ($taskApp.HasExited) { throw 'Installed app exited before window became available' }
    if ([DateTime]::UtcNow -gt $taskDeadline) { throw 'No native window observed; app not force-killed' }
    $taskReady=$false
    $taskDiagPath=Join-Path $taskProfile 'desktop-diagnostics.json'
    if (Test-Path -LiteralPath $taskDiagPath) {
      try {
        $taskStartup=Get-Content -LiteralPath $taskDiagPath -Raw | ConvertFrom-Json
        $taskReady=$taskStartup.pid -eq $taskApp.Id -and 'window-created' -in $taskStartup.events.event
      } catch { $taskReady=$false }
    }
  } while (-not $taskReady -or $taskApp.MainWindowHandle -eq [IntPtr]::Zero)
  Start-Sleep -Seconds 4
  Acknowledge-FirstRunReminder $taskApp ($Phase -eq 'fresh-installed-default-profile')
  $taskApp.Refresh()
  $taskReport.Phases.Add(@{Name=$Phase+'-close-preflight';MainWindowTitle=$taskApp.MainWindowTitle;MainWindowHandle=[string]$taskApp.MainWindowHandle;DiagnosticEvents=@($taskStartup.events.event)})
  Save-Report
  Confirm (Request-NormalClose $taskApp) 'Normal window close requested'
  Confirm ($taskApp.WaitForExit(30000)) 'App exited without force termination'
  $taskApp.Refresh()
  Confirm ($taskApp.ExitCode -eq 0) 'App exit code zero'
  $taskDiagnostic=Get-Content -LiteralPath (Join-Path $taskProfile 'desktop-diagnostics.json') -Raw | ConvertFrom-Json
  Confirm ($taskDiagnostic.pid -eq $taskApp.Id -and 'will-quit' -in $taskDiagnostic.events.event -and 'window-created' -in $taskDiagnostic.events.event) 'Default-profile startup and graceful quit recorded'
  Confirm-NoApp
  Confirm-Card
  $taskReport.Phases.Add(@{Name=$Phase;DefaultProfile=$true;GracefulExit=$true}); Save-Report
}
try {
  Save-Report
  Confirm-NoApp
  foreach ($taskPath in @($taskInstall,$taskProfile,$taskDesktop,$taskStart,(Join-Path $env:APPDATA 'helldivers-2-chaos-roulette'),(Join-Path $env:LOCALAPPDATA 'helldivers-2-chaos-slot-machine-updater'))+$taskKeys+$taskMachineKeys) { Confirm (-not (Test-Path -LiteralPath $taskPath)) 'Fresh job contains no existing product state at checked location' }
  $taskSetup=Join-Path $taskBundle $taskManifest.installer
  Invoke-Native $taskSetup ('/S /currentuser /D='+$taskInstall) 'fresh-install'
  Confirm-Installed
  Confirm (-not (Test-Path -LiteralPath $taskProfile)) 'Installer did not create or replace player profile'
  New-Item -ItemType Directory -Path $taskProfile | Out-Null
  Copy-Item -LiteralPath (Join-Path $taskBundle 'synthetic-state.json') -Destination (Join-Path $taskProfile 'state.json')
  Launch-And-Close 'fresh-installed-default-profile'
  $taskSaveHash=(Get-FileHash -LiteralPath (Join-Path $taskProfile 'state.json')).Hash
  # Ordinary product uninstaller, including its self-delete path. NSIS can
  # relaunch a temp copy, so launcher exit alone is NOT completion evidence.
  Invoke-Native $taskUninstaller '/S /currentuser' 'actual-uninstall-launcher'
  $taskDeadline=[DateTime]::UtcNow.AddSeconds(90)
  do {
    $taskRemaining=@(@($taskInstall,$taskDesktop,$taskStart)+$taskKeys | Where-Object { Test-Path -LiteralPath $_ })
    if (-not $taskRemaining.Count) { break }
    if ([DateTime]::UtcNow -gt $taskDeadline) { throw 'Uninstall effects incomplete; no manual deletion or forced termination' }
    Start-Sleep -Milliseconds 500
  } while ($true)
  Confirm (-not (Test-Path -LiteralPath $taskExe)) 'Uninstaller removed app executable'
  foreach ($taskPath in @($taskDesktop,$taskStart)+$taskKeys) { Confirm (-not (Test-Path -LiteralPath $taskPath)) 'Uninstaller removed product shortcut/registration' }
  Confirm (-not (Test-Path -LiteralPath $taskInstall)) 'Ordinary uninstaller removed the complete installation directory without manual cleanup'
  Confirm ((Get-FileHash -LiteralPath (Join-Path $taskProfile 'state.json')).Hash -eq $taskSaveHash) 'Actual uninstall preserved exact synthetic save bytes'
  Invoke-Native $taskSetup ('/S /currentuser /D='+$taskInstall) 'reinstall'
  Confirm-Installed
  Confirm ((Get-FileHash -LiteralPath (Join-Path $taskProfile 'state.json')).Hash -eq $taskSaveHash) 'Reinstall preserved exact synthetic save bytes before launch'
  Launch-And-Close 'reinstalled-default-profile'
  $taskReport.Passed=$true; Save-Report
  Write-Output "PASS disposable installer lifecycle: $($taskReport.Checks.Count) checks"
} catch {
  $taskReport.Error=$_.Exception.Message; Save-Report
  throw
}
