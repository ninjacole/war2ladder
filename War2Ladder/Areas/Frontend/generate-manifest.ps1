# Generate manifest.json for S3-hosted PUD files
# Save this as generate-manifest.ps1 and run it from PowerShell

$mapFolder = "C:\projects\War2Ladder\War2Ladder\Areas\Frontend\public\maps"
$outputFile = Join-Path $mapFolder "manifest.json"

# S3 bucket configuration - UPDATE THIS WITH YOUR ACTUAL BUCKET NAME
$s3BucketUrl = "https://war2ladder-maps.s3.amazonaws.com"

# Get all PUD files
$files = Get-ChildItem -Path $mapFolder -Filter *.pud | Sort-Object Name

$manifest = @()
$id = 1

foreach ($file in $files) {
    $manifest += [PSCustomObject]@{
        id       = $id
        name     = $file.Name           # Display name
        filename = $file.Name           # Original filename for downloads
        path     = "$s3BucketUrl/$($file.Name)" # S3 URL - no URL encoding needed for S3
        size     = $file.Length         # File size in bytes
    }
    $id++
}

# Convert to JSON and save
$manifest | ConvertTo-Json -Depth 3 | Set-Content -Path $outputFile -Encoding UTF8

Write-Host "Manifest written to $outputFile with $($manifest.Count) entries."