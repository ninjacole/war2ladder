# Generate manifest.json for all .pud files in a folder using ID-based approach
# Save this as generate-manifest.ps1 and run it from PowerShell

$mapFolder = "C:\projects\War2Ladder\War2Ladder\Areas\Frontend\public\maps"
$outputFile = Join-Path $mapFolder "manifest.json"

# Get all PUD files (excluding safe copies and manifest)
$files = Get-ChildItem -Path $mapFolder -Filter *.pud | Where-Object { -not $_.Name.StartsWith('_') }

$manifest = @()
$id = 1

foreach ($file in $files) {
    $manifest += [PSCustomObject]@{
        id = $id
        name = $file.Name
        filename = $file.Name  # Original filename for downloads
        path = "/maps/$id.pud"  # ID-based URL
    }
    $id++
}

# Convert to JSON and save
$manifest | ConvertTo-Json -Depth 3 | Set-Content -Path $outputFile -Encoding UTF8

Write-Host "Manifest written to $outputFile with $($manifest.Count) entries."