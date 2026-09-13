$ErrorActionPreference = 'Stop'

$projectPath = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$distPath = Join-Path $projectPath 'dist'
$package = Get-Content -LiteralPath (Join-Path $projectPath 'package.json') -Raw | ConvertFrom-Json
$zipPath = Join-Path $distPath "Helldivers-2-Chaos-Slot-Machine-v$($package.version)-win-x64.zip"
$installerPath = Join-Path $distPath "Helldivers-2-Chaos-Slot-Machine-Setup-v$($package.version)-win-x64.exe"
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

$exe = Get-ChildItem -Path $extractPath -Recurse -Filter 'Helldivers 2 Chaos Slot Machine.exe' | Select-Object -First 1
if ($null -eq $exe) {
  Write-Error 'Could not find Helldivers 2 Chaos Slot Machine.exe in the release ZIP.'
  exit 1
}

$expectedPublisher = $env:WINDOWS_SIGNING_PUBLISHER_NAME
if ([string]::IsNullOrWhiteSpace($expectedPublisher)) {
  Write-Error 'WINDOWS_SIGNING_PUBLISHER_NAME is required to verify the release publisher.'
  exit 1
}

function Assert-ValidWindowsSignature {
  param(
    [Parameter(Mandatory = $true)]
    [string] $Path
  )

  $signature = Get-AuthenticodeSignature -FilePath $Path
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
