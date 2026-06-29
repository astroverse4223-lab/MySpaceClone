<#
  Zips up the project (source, prisma, public/uploads, env files, etc.) into a
  single archive, skipping node_modules/.next/.git since those are huge and
  regenerable. The zip name encodes the package version, git branch + short
  commit hash, and a timestamp so you can tell builds apart at a glance.

  Usage:
    powershell -ExecutionPolicy Bypass -File scripts/backup.ps1
    powershell -ExecutionPolicy Bypass -File scripts/backup.ps1 -OutputDir "D:\Backups"
#>

param(
    [string]$OutputDir = "$PSScriptRoot\..\..\myspaceclone-backups"
)

$ErrorActionPreference = "Stop"
$projectRoot = (Resolve-Path "$PSScriptRoot\..").Path

Push-Location $projectRoot
try {
    $gitHash = (git rev-parse --short HEAD 2>$null)
    if (-not $gitHash) { $gitHash = "nogit" }
    $gitBranch = (git rev-parse --abbrev-ref HEAD 2>$null)
    if (-not $gitBranch) { $gitBranch = "nobranch" }
    $gitDirty = ((git status --porcelain 2>$null) | Measure-Object).Count -gt 0
} finally {
    Pop-Location
}

$pkg = Get-Content (Join-Path $projectRoot "package.json") -Raw | ConvertFrom-Json
$version = $pkg.version
$dirtySuffix = if ($gitDirty) { "-dirty" } else { "" }
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"

$zipName = "myspaceclone_v$($version)_$($gitBranch)_$($gitHash)$($dirtySuffix)_$($timestamp).zip"

if (-not (Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
}
$OutputDir = (Resolve-Path $OutputDir).Path
$zipPath = Join-Path $OutputDir $zipName

# Stage a clean copy so the archive never contains node_modules/.next/.git,
# which are huge and either regenerable (npm install) or already tracked (git).
$stagingDir = Join-Path $env:TEMP "myspaceclone-backup-staging-$timestamp"
if (Test-Path $stagingDir) { Remove-Item $stagingDir -Recurse -Force }
New-Item -ItemType Directory -Path $stagingDir | Out-Null

$excludeDirs = @("node_modules", ".next", ".git", "backups")
robocopy $projectRoot $stagingDir /E /XD $excludeDirs /NFL /NDL /NJH /NJS /NC /NS /NP | Out-Null

@"
Project:    myspaceclone
Version:    $version
Branch:     $gitBranch
Commit:     $gitHash$dirtySuffix
Created:    $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
"@ | Out-File -FilePath (Join-Path $stagingDir "BUILD_INFO.txt") -Encoding utf8

if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
Compress-Archive -Path "$stagingDir\*" -DestinationPath $zipPath -CompressionLevel Optimal

Remove-Item $stagingDir -Recurse -Force

$sizeMb = [math]::Round((Get-Item $zipPath).Length / 1MB, 1)
Write-Host "Backup created: $zipPath ($sizeMb MB)"
