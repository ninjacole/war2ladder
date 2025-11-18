# Generate manifest.json for all .pud files in a folder
# Save this as generate-manifest.ps1 and run it from PowerShell

$mapFolder = "C:\projects\War2Ladder\War2Ladder\Areas\Frontend\public\maps"
$outputFile = Join-Path $mapFolder "manifest.json"

$files = Get-ChildItem -Path $mapFolder -Filter *.pud

$manifest = @()

foreach ($file in $files) {
    $manifest += [PSCustomObject]@{
        name = $file.Name
        path = "/maps/$($file.Name)"   # relative URL for Vite public folder
    }
}

# Convert to JSON and save
$manifest | ConvertTo-Json -Depth 3 | Set-Content -Path $outputFile -Encoding UTF8

Write-Host "Manifest written to $outputFile with $($manifest.Count) entries."