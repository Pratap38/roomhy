$ErrorActionPreference = "Stop"

$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$apps = @("website", "superadmin", "propertyowner", "tenant", "digital-checkin")

Write-Host "Inline Asset Audit" -ForegroundColor Cyan
Write-Host "===================" -ForegroundColor Cyan

foreach ($app in $apps) {
    $path = Join-Path $root $app
    if (-not (Test-Path $path)) { continue }

    $htmlFiles = Get-ChildItem -Path $path -Recurse -Filter *.html
    $styleCount = 0
    $inlineScriptCount = 0
    $heavyFiles = @()

    foreach ($file in $htmlFiles) {
        $content = Get-Content $file.FullName -Raw
        $styles = ([regex]::Matches($content, "<style", "IgnoreCase")).Count
        $scripts = ([regex]::Matches($content, "<script(?![^>]*\bsrc=)", "IgnoreCase")).Count

        $styleCount += $styles
        $inlineScriptCount += $scripts

        if ($content.Length -gt 120000 -or $styles -gt 0 -or $scripts -gt 1) {
            $heavyFiles += [PSCustomObject]@{
                File = $file.FullName.Replace($root + "\", "")
                SizeKB = [math]::Round($content.Length / 1KB, 1)
                StyleBlocks = $styles
                InlineScripts = $scripts
            }
        }
    }

    Write-Host "`n[$app]" -ForegroundColor Yellow
    Write-Host "HTML files: $($htmlFiles.Count)"
    Write-Host "Inline <style> blocks: $styleCount"
    Write-Host "Inline <script> blocks (without src): $inlineScriptCount"

    if ($heavyFiles.Count -gt 0) {
        Write-Host "Top refactor candidates:" -ForegroundColor Green
        $heavyFiles |
            Sort-Object -Property @{Expression="SizeKB";Descending=$true} |
            Select-Object -First 10 |
            Format-Table -AutoSize
    }
}
