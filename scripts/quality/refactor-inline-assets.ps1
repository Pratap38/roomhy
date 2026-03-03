param(
    [switch]$DryRun
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$apps = @("website", "superadmin", "propertyowner", "tenant", "digital-checkin")

function Ensure-Dir([string]$path) {
    if (-not (Test-Path $path)) {
        if (-not $DryRun) { New-Item -ItemType Directory -Path $path -Force | Out-Null }
    }
}

function Write-File([string]$path, [string]$content) {
    if ($DryRun) { return }
    Set-Content -Path $path -Value $content -NoNewline
}

function Has-AssetRef([string]$content, [string]$assetPath) {
    return $content -match [regex]::Escape($assetPath)
}

function Extract-FirstStyleBlock([string]$content, [string]$cssRelPath, [string]$cssAbsPath) {
    $styleMatch = [regex]::Match($content, '(?is)<style[^>]*>(.*?)</style>')
    if (-not $styleMatch.Success) { return @{ Updated = $false; Content = $content } }

    $cssBody = $styleMatch.Groups[1].Value.Trim()
    if ([string]::IsNullOrWhiteSpace($cssBody)) { return @{ Updated = $false; Content = $content } }

    if (-not (Has-AssetRef $content $cssRelPath)) {
        Write-File $cssAbsPath $cssBody
        $linkTag = "<link rel=`"stylesheet`" href=`"$cssRelPath`">"
        $newContent = $content.Remove($styleMatch.Index, $styleMatch.Length).Insert($styleMatch.Index, $linkTag)
        return @{ Updated = $true; Content = $newContent }
    }

    return @{ Updated = $false; Content = $content }
}

function Extract-LastInlineScript([string]$content, [string]$jsRelPath, [string]$jsAbsPath) {
    $scriptMatches = [regex]::Matches($content, '(?is)<script(?![^>]*\bsrc=)[^>]*>(.*?)</script>')
    if ($scriptMatches.Count -eq 0) { return @{ Updated = $false; Content = $content } }

    $last = $scriptMatches[$scriptMatches.Count - 1]
    $jsBody = $last.Groups[1].Value.Trim()
    if ([string]::IsNullOrWhiteSpace($jsBody)) { return @{ Updated = $false; Content = $content } }

    # Keep tiny config scripts inline; extract main logic blocks.
    if ($jsBody.Length -lt 500) { return @{ Updated = $false; Content = $content } }

    if (-not (Has-AssetRef $content $jsRelPath)) {
        Write-File $jsAbsPath $jsBody
        $scriptTag = "<script src=`"$jsRelPath`"></script>"
        $newContent = $content.Remove($last.Index, $last.Length).Insert($last.Index, $scriptTag)
        return @{ Updated = $true; Content = $newContent }
    }

    return @{ Updated = $false; Content = $content }
}

$updated = @()
$scanned = 0

foreach ($app in $apps) {
    $appPath = Join-Path $repoRoot $app
    if (-not (Test-Path $appPath)) { continue }

    $cssDir = Join-Path $appPath "assets\css"
    $jsDir = Join-Path $appPath "assets\js"
    Ensure-Dir $cssDir
    Ensure-Dir $jsDir

    $files = Get-ChildItem -Path $appPath -Recurse -Filter *.html
    foreach ($file in $files) {
        $scanned++
        $raw = Get-Content $file.FullName -Raw

        $baseName = [System.IO.Path]::GetFileNameWithoutExtension($file.Name)
        $cssRel = "assets/css/$baseName.css"
        $jsRel = "assets/js/$baseName.js"
        $cssAbs = Join-Path $cssDir "$baseName.css"
        $jsAbs = Join-Path $jsDir "$baseName.js"

        $afterStyle = Extract-FirstStyleBlock -content $raw -cssRelPath $cssRel -cssAbsPath $cssAbs
        $current = $afterStyle.Content

        $afterJs = Extract-LastInlineScript -content $current -jsRelPath $jsRel -jsAbsPath $jsAbs
        $current = $afterJs.Content

        if ($afterStyle.Updated -or $afterJs.Updated) {
            if (-not $DryRun) { Set-Content -Path $file.FullName -Value $current -NoNewline }
            $updated += [PSCustomObject]@{
                File = $file.FullName.Replace($repoRoot + "\", "")
                StyleExtracted = $afterStyle.Updated
                ScriptExtracted = $afterJs.Updated
            }
        }
    }
}

Write-Host "Scanned HTML files: $scanned"
Write-Host "Updated files: $($updated.Count)"
if ($updated.Count -gt 0) {
    $updated | Sort-Object File | Format-Table -AutoSize
}
