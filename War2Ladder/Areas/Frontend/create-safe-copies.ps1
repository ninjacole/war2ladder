# PowerShell script to create safe URL copies while preserving originals
$mapsDir = "public/maps"
$manifestPath = "public/maps/manifest.json"

# Read current manifest
$manifest = Get-Content $manifestPath | ConvertFrom-Json

# Create new manifest array
$newManifest = @()

foreach ($item in $manifest) {
    $originalName = $item.name
    $safeName = $originalName -replace '[()!~$\[\]]', '_' -replace '\s+', '_' -replace '_+', '_'
    
    if ($originalName -ne $safeName) {
        $originalPath = Join-Path $mapsDir $originalName
        $safePath = Join-Path $mapsDir $safeName
        
        if (Test-Path $originalPath) {
            Write-Host "Creating safe copy: $originalName -> $safeName"
            Copy-Item $originalPath $safePath
        }
    }
    
    # Add to new manifest with safe URL but original download name
    $newManifest += @{
        name = $originalName  # Keep original name for display/download
        path = "/maps/$safeName"  # Use safe name for URL
        downloadName = $originalName  # Explicit download filename
    }
}

# Write updated manifest
$newManifest | ConvertTo-Json | Set-Content $manifestPath
Write-Host "Manifest updated with safe URLs but preserved filenames"