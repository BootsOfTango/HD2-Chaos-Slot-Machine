param([ValidateSet('signed','unsigned')][string]$Mode='signed',[string]$ArtifactDirectory='')
$ErrorActionPreference = 'Stop'

$projectPath = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$distPath = Join-Path $projectPath 'dist'
if ($ArtifactDirectory) {
  $candidatePath = [IO.Path]::GetFullPath($ArtifactDirectory)
  if (!$candidatePath.StartsWith($distPath + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) { throw 'Candidate must be inside this checkout dist directory' }
  $distPath = $candidatePath
}
if (!(Test-Path -LiteralPath $distPath -PathType Container) -or ((Get-Item -LiteralPath $distPath).Attributes -band [IO.FileAttributes]::ReparsePoint)) { throw 'Missing or linked artifact directory' }
$package = Get-Content -LiteralPath (Join-Path $projectPath 'package.json') -Raw | ConvertFrom-Json
$releaseIdentity = Get-Content -LiteralPath (Join-Path $projectPath 'release-identity.json') -Raw | ConvertFrom-Json
$zipPath = Join-Path $distPath "HD2-Chaos-Slot-Machine-v$($releaseIdentity.publicVersion)-win-x64.zip"
$installerPath = Join-Path $distPath "HD2-Chaos-Slot-Machine-Setup-v$($releaseIdentity.publicVersion)-win-x64.exe"
$extractPath = [System.IO.Path]::GetFullPath((Join-Path $distPath 'verify-win-signature'))

if (!(Test-Path $zipPath)) {
  Write-Error "Missing expected ZIP: $zipPath"
  exit 1
}
if (!(Test-Path $installerPath)) {
  Write-Error "Missing expected offline installer: $installerPath"
  exit 1
}

if (Test-Path -LiteralPath $extractPath) {
  $resolvedExtractPath = (Resolve-Path -LiteralPath $extractPath).Path
  if ($resolvedExtractPath -ne (Join-Path $distPath 'verify-win-signature')) {
    throw "Refusing to remove an unexpected verification directory: $resolvedExtractPath"
  }
  if ((Get-Item -LiteralPath $extractPath).Attributes -band [System.IO.FileAttributes]::ReparsePoint) {
    throw "Refusing to remove a linked verification directory: $extractPath"
  }
  Remove-Item -LiteralPath $extractPath -Recurse -Force
}
New-Item -ItemType Directory -Force -Path $extractPath | Out-Null
Expand-Archive -LiteralPath $zipPath -DestinationPath $extractPath -Force

$executables = @(Get-ChildItem -LiteralPath $extractPath -Recurse -File -Filter 'HD2 Chaos Slot Machine.exe')
if ($executables.Count -ne 1) {
  Write-Error 'Could not find HD2 Chaos Slot Machine.exe in the release ZIP.'
  exit 1
}
$exe = $executables[0]

# Inspect, never execute, the exact embedded uninstaller as well.
$sevenZip = Join-Path $projectPath 'node_modules/electron-winstaller/vendor/7z.exe'
$listing = & $sevenZip l -slt $installerPath
if ($LASTEXITCODE -ne 0) { throw 'Cannot inspect embedded uninstaller' }
$members = @($listing | ForEach-Object { if ($_ -match '^Path = (.+[\\/]Uninstall HD2 Chaos Slot Machine\.exe)$') { $Matches[1] } })
if ($members.Count -ne 1) { throw 'Expected one embedded uninstaller' }
& $sevenZip e "-o$extractPath" $installerPath $members[0] -y | Out-Null
if ($LASTEXITCODE -ne 0) { throw 'Cannot extract embedded uninstaller for signature inspection' }
$uninstaller = Join-Path $extractPath 'Uninstall HD2 Chaos Slot Machine.exe'
if (!(Test-Path -LiteralPath $uninstaller -PathType Leaf)) { throw 'Embedded uninstaller missing' }

$expectedPublisher = $env:WINDOWS_SIGNING_PUBLISHER_NAME
if ($Mode -eq 'signed' -and [string]::IsNullOrWhiteSpace($expectedPublisher)) {
  Write-Error 'WINDOWS_SIGNING_PUBLISHER_NAME is required to verify the release publisher.'
  exit 1
}

function Assert-ValidWindowsSignature {
  param(
    [Parameter(Mandatory = $true)]
    [string] $Path
  )

  $signature = Get-AuthenticodeSignature -FilePath $Path
  if ($Mode -eq 'unsigned') {
    if ($signature.Status -ne 'NotSigned' -or $null -ne $signature.SignerCertificate) {
      throw "Expected explicitly unsigned artifact, got $($signature.Status): $Path"
    }
    Write-Host "Verified unsigned artifact (not a safety guarantee): $Path"
    return
  }
  if ($signature.Status -ne 'Valid') {
    Write-Error "Authenticode signature is not valid for '$Path'. Status: $($signature.Status). Message: $($signature.StatusMessage)"
    exit 1
  }

  $actualSubject = $signature.SignerCertificate.Subject
  if ($actualSubject -ne $expectedPublisher) {
    Write-Error "Signer subject '$actualSubject' for '$Path' does not match expected publisher '$expectedPublisher'."
    exit 1
  }

  if ($null -eq $signature.TimeStamperCertificate) {
    Write-Error "Executable signature is missing a timestamp counter-signature: $Path"
    exit 1
  }

  Write-Host "Valid Authenticode signature found on $Path."
  Write-Host "Signer: $actualSubject"
  Write-Host "Timestamp authority: $($signature.TimeStamperCertificate.Subject)"
}

Assert-ValidWindowsSignature -Path $exe.FullName
Assert-ValidWindowsSignature -Path (Resolve-Path $installerPath).Path
Assert-ValidWindowsSignature -Path $uninstaller
