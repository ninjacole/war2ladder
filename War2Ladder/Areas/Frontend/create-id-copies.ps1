# Create ID-based copies of all PUD files
# This eliminates special character issues completely

$mapFolder = "C:\projects\War2Ladder\War2Ladder\Areas\Frontend\public\maps"
$manifestPath = Join-Path $mapFolder "manifest.json"

# Clean up old ID-based files
Get-ChildItem -Path $mapFolder -Filter "*.pud" | Where-Object { $_.Name -match '^\d+\.pud$' } | Remove-Item

# Get all original PUD files (excluding safe copies and ID files)
$files = Get-ChildItem -Path $mapFolder -Filter *.pud | Where-Object { -not $_.Name.StartsWith('_') -and -not ($_.Name -match '^\d+\.pud$') }

$manifest = @()
$id = 1

foreach ($file in $files) {
    $originalPath = $file.FullName
    $idPath = Join-Path $mapFolder "$id.pud"
    
    # Create ID-based copy
    Copy-Item $originalPath $idPath
    Write-Host "Created ID copy: $($file.Name) -> $id.pud"
    
    $manifest += [PSCustomObject]@{
        id = $id
        name = $file.Name
        filename = $file.Name  # Original filename for downloads
        path = "/maps/$id.pud"  # ID-based URL
    }
    $id++
}

# Write manifest
$manifest | ConvertTo-Json -Depth 3 | Set-Content -Path $manifestPath -Encoding UTF8
Write-Host "Manifest written with $($manifest.Count) entries using ID-based paths"