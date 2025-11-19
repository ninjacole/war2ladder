# Generate manifest.json for all .pud files with client-side blob renaming approach
# Save this as generate-manifest.ps1 and run it from PowerShell

$mapFolder = "C:\projects\War2Ladder\War2Ladder\Areas\Frontend\public\maps"
$outputFile = Join-Path $mapFolder "manifest.json"

# Get all PUD files
$files = Get-ChildItem -Path $mapFolder -Filter *.pud | Sort-Object Name

$manifest = @()
$id = 1

foreach ($file in $files) {
    $manifest += [PSCustomObject]@{
        id       = $id
        name     = $file.Name           # Display name
        filename = $file.Name           # Original filename for downloads
        path     = "/maps/$($file.Name)" # Original file URL (will be URL encoded by client)
    }
    $id++
}

# Convert to JSON and save
$manifest | ConvertTo-Json -Depth 3 | Set-Content -Path $outputFile -Encoding UTF8

Write-Host "Manifest written to $outputFile with $($manifest.Count) entries."