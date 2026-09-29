param([Parameter(Mandatory=$true)][string]$NsisRoot)
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$testParent = Join-Path $projectRoot '.test-data'
$runRoot = Join-Path $testParent ('installer-shell-' + [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds())
if (-not [IO.Path]::GetFullPath($runRoot).StartsWith([IO.Path]::GetFullPath($testParent) + '\')) { throw 'Unsafe fixture path' }
if (Test-Path -LiteralPath $runRoot) { throw 'Fixture already exists' }
if (Test-Path -LiteralPath "$env:TEMP\hd2csm-desktop-tests.lock") { throw 'Desktop test running; run this probe separately' }
$compiler = Join-Path $NsisRoot 'Bin\makensis.exe'
$sevenZip = Join-Path $projectRoot 'node_modules\electron-winstaller\vendor\7z.exe'
if (-not (Test-Path -LiteralPath $compiler)) { throw 'Use the existing reviewed NSIS compiler; no automatic download' }
$noticeHash = (Get-FileHash -LiteralPath (Join-Path $NsisRoot 'COPYING') -Algorithm SHA256).Hash.ToLowerInvariant()
if ($noticeHash -ne '3c8de989f6504d52f5f8dfafedb6668cd47201f5d01f1319570727c091425dd6') { throw 'NSIS license/toolset differs from reviewed fixture' }
New-Item -ItemType Directory -Path $runRoot | Out-Null
$testId = 'org.hd2chaosslotmachine.fixture.' + [Guid]::NewGuid().ToString('N')
$wsh = New-Object -ComObject WScript.Shell
$target = Join-Path $runRoot 'not-a-shortcut.txt'
'Fixture only; never launched.' | Set-Content -LiteralPath $target -Encoding UTF8
foreach ($name in @('new identity.lnk','read-only.lnk','untouched.lnk','replace identity.lnk','register-input.lnk')) {
  $lnk=$wsh.CreateShortcut((Join-Path $runRoot $name))
  $lnk.TargetPath=$target
  $lnk.Arguments='--fixture "argument with spaces"'
  $lnk.WorkingDirectory=$runRoot
  $lnk.Description='Preserve existing shortcut fields'
  $lnk.IconLocation="$env:SystemRoot\system32\shell32.dll,1"
  $lnk.Save()
  [Runtime.InteropServices.Marshal]::FinalReleaseComObject($lnk) | Out-Null
}
# WScript's legacy Save failed for this Unicode filename on this host. Copy the
# known fixture bytes with the filesystem API; the NSIS helper still loads and
# saves the Unicode path, and Shell.Application independently reads its ID.
Copy-Item -LiteralPath (Join-Path $runRoot 'new identity.lnk') -Destination (Join-Path $runRoot 'unicode-漢字.lnk')
'not a Windows shell link' | Set-Content -LiteralPath (Join-Path $runRoot 'damaged.lnk') -Encoding UTF8
(Get-Item -LiteralPath (Join-Path $runRoot 'read-only.lnk')).IsReadOnly=$true
$preserveNames=@('damaged.lnk','read-only.lnk','untouched.lnk','not-a-shortcut.txt')
$before=@{}
foreach ($name in $preserveNames) { $before[$name]=(Get-FileHash -LiteralPath (Join-Path $runRoot $name)).Hash }
$buildArgs=@('/V3','/INPUTCHARSET','UTF8',"/DTEST_ROOT=$runRoot","/DPROJECT_ROOT=$projectRoot","/DTEST_APP_ID=$testId",(Join-Path $projectRoot 'test\fixtures\installer-shell-probe.nsi'))
& $compiler @buildArgs *> (Join-Path $runRoot 'compile.log')
if ($LASTEXITCODE -ne 0) { Get-Content -LiteralPath (Join-Path $runRoot 'compile.log'); throw "Compiler failed; fixture retained: $runRoot" }
$probe=Join-Path $runRoot 'shell-probe.exe'
$listing = & $sevenZip l -slt $probe
if ($LASTEXITCODE -ne 0) { throw 'Cannot inspect compiled probe' }
$listing | Set-Content -LiteralPath (Join-Path $runRoot 'archive-list.txt')
if (($listing -join "`n") -match 'WinShell\.dll') { throw 'Probe unexpectedly includes old WinShell' }
if (($listing -join "`n") -notmatch 'System\.dll') { throw 'Probe is missing System.dll' }
$process=Start-Process -FilePath $probe -ArgumentList '/S' -WorkingDirectory $runRoot -WindowStyle Hidden -PassThru
if (-not $process.WaitForExit(30000)) { throw "Probe did not exit. No forced termination; stop further tests and inspect PID $($process.Id) at $runRoot" }
if ($process.ExitCode -ne 0) { throw "Probe exit code: $($process.ExitCode)" }
$ini=Get-Content -LiteralPath (Join-Path $runRoot 'native.ini')
$values=@{}
foreach ($line in $ini) { if ($line -match '^([^=]+)=(.*)$') { $values[$matches[1]]=$matches[2] } }
$checks=[Collections.Generic.List[string]]::new()
function Confirm([bool]$condition,[string]$message) { if(-not $condition){throw "$message; evidence: $runRoot"}; $checks.Add($message) }
foreach ($key in @('set','repeat','unicode','registerInput','oldId','replaceId')) { Confirm ($values[$key] -in @('0','1')) "$key reports native success" }
Confirm ($values['wrapperSet'] -in @('0','1')) 'Production setter wrapper succeeds'
Confirm ([int]$values['wrapperMissing'] -lt 0) 'Production wrapper retains failure HRESULT'
Confirm ((Get-Content -Raw -LiteralPath (Join-Path $runRoot 'installer-shell-warnings.log')) -match 'missing.lnk; HRESULT -') 'Silent wrapper failure writes a persistent warning'
foreach ($key in @('empty','missing','damaged','readonly','extension','longId','unpinMissing','emptyCleanup')) { Confirm ($values.ContainsKey($key) -and $values[$key] -ne '0') "$key reports an error instead of success" }
Confirm ($values['zero'] -eq 'preserve-zero' -and $values['eight'] -eq 'preserve-eight' -and $values['Rzero'] -eq 'preserve-Rzero') 'Caller registers preserved'
Confirm ($values['stack'] -eq 'stack-sentinel') 'Caller stack balanced'
$shell=New-Object -ComObject Shell.Application
$folder=$shell.NameSpace($runRoot)
foreach ($name in @('new identity.lnk','unicode-漢字.lnk','register-input.lnk','replace identity.lnk')) {
  $item=$folder.ParseName($name)
  Confirm ($item.ExtendedProperty('System.AppUserModel.ID') -eq $testId) "$name persisted the exact AppUserModel.ID"
  $readPath=Join-Path $runRoot $name
  if ($name -eq 'unicode-漢字.lnk') {
    # Same legacy WScript filename limitation on reads. Inspect a byte-identical
    # ASCII-named copy; the direct Unicode-path Shell property read is above.
    $readPath=Join-Path $runRoot 'unicode-field-check.lnk'
    Copy-Item -LiteralPath (Join-Path $runRoot $name) -Destination $readPath
    Confirm ((Get-FileHash -LiteralPath $readPath).Hash -eq (Get-FileHash -LiteralPath (Join-Path $runRoot $name)).Hash) 'Unicode field-check copy is byte-identical'
  }
  $lnk=$wsh.CreateShortcut($readPath)
  Confirm ($lnk.TargetPath -eq $target -and $lnk.Arguments -eq '--fixture "argument with spaces"' -and $lnk.WorkingDirectory -eq $runRoot -and $lnk.Description -eq 'Preserve existing shortcut fields' -and $lnk.IconLocation -eq "$env:SystemRoot\system32\shell32.dll,1") "$name retained target/arguments/working-directory/description/icon"
  [Runtime.InteropServices.Marshal]::FinalReleaseComObject($lnk) | Out-Null
  [Runtime.InteropServices.Marshal]::FinalReleaseComObject($item) | Out-Null
}
foreach ($name in $preserveNames) { Confirm ((Get-FileHash -LiteralPath (Join-Path $runRoot $name)).Hash -eq $before[$name]) "$name remained byte-identical" }
Confirm (-not (Test-Path -LiteralPath (Join-Path $runRoot 'missing.lnk'))) 'Missing link was not created'
$uninstaller=Join-Path $runRoot 'shell-probe-uninstall.exe'
$unlisting=& $sevenZip l -slt $uninstaller
Confirm ($LASTEXITCODE -eq 0 -and ($unlisting -join "`n") -notmatch 'WinShell\.dll') 'Compiled fixture uninstaller contains no WinShell DLL'
$unlisting | Set-Content -LiteralPath (Join-Path $runRoot 'uninstaller-archive-list.txt')
# _?= prevents NSIS copying itself to TEMP and returning before the child ends.
# This fixture has no Delete/RMDir/registry instructions; it cannot remove itself.
$unprocess=Start-Process -FilePath $uninstaller -ArgumentList "/S _?=$runRoot" -WorkingDirectory $runRoot -WindowStyle Hidden -PassThru
if (-not $unprocess.WaitForExit(30000)) { throw "Fixture uninstaller still running; do not force-kill PID $($unprocess.Id)" }
Confirm ($unprocess.ExitCode -eq 0) 'Fixture uninstaller exited normally'
$unvalues=@{}
foreach ($line in (Get-Content -LiteralPath (Join-Path $runRoot 'uninstall.ini'))) { if ($line -match '^([^=]+)=(.*)$') { $unvalues[$matches[1]]=$matches[2] } }
Confirm ($unvalues['set'] -in @('0','1')) 'Uninstaller-context property setter reports native success'
Confirm ($unvalues.ContainsKey('wrapperUnpin') -and $unvalues.ContainsKey('wrapperCleanup')) 'Production cleanup wrappers executed in fixture uninstaller'
$item=$folder.ParseName('new identity.lnk')
Confirm ($item.ExtendedProperty('System.AppUserModel.ID') -eq "$testId.uninstall") 'Uninstaller-context identity persisted'
[Runtime.InteropServices.Marshal]::FinalReleaseComObject($item) | Out-Null
foreach ($name in $preserveNames) { Confirm ((Get-FileHash -LiteralPath (Join-Path $runRoot $name)).Hash -eq $before[$name]) "$name still unchanged after fixture uninstall context" }
$report=[ordered]@{Passed=$true;At=[DateTime]::UtcNow.ToString('o');Fixture=$runRoot;FixtureAppId=$testId;Checks=$checks;NativeResults=$values;NativeUninstallerResults=$unvalues;UnpinObserved=$false;ExistingJumpListRemovalObserved=$false;Compiler=$compiler;CompilerSha256=(Get-FileHash -LiteralPath $compiler).Hash;ProbeSha256=(Get-FileHash -LiteralPath $probe).Hash;ProductionInstallerExecuted=$false;ProductionPackagingChanged=$false;Limits='Private fixture only. Unpin and unique test-ID jump-list cleanup API return codes are recorded, not proof of actual pinned-item/recent-list removal. No registry, Desktop, Start menu, installed app or personal save changes.'}
$report | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath (Join-Path $runRoot 'report.json') -Encoding UTF8
[Runtime.InteropServices.Marshal]::FinalReleaseComObject($folder) | Out-Null
[Runtime.InteropServices.Marshal]::FinalReleaseComObject($shell) | Out-Null
[Runtime.InteropServices.Marshal]::FinalReleaseComObject($wsh) | Out-Null
$report | ConvertTo-Json -Depth 6
