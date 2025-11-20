# Generate manifest.json for S3-hosted PUD files
# Save this as generate-manifest.ps1 and run it from PowerShell

$mapFolder = "C:\projects\War2Ladder\War2Ladder\Areas\Frontend\public\maps"
$outputFile = Join-Path $mapFolder "manifest.json"

# S3 bucket configuration - UPDATE THIS WITH YOUR ACTUAL BUCKET NAME
$s3BucketUrl = "https://war2ladder-maps.s3.us-east-1.amazonaws.com"

# Function to extract basic metadata from PUD file
function Get-PudMetadata {
    param([string]$FilePath)
    
    try {
        $bytes = [System.IO.File]::ReadAllBytes($FilePath)
        $dimensions = "Unknown"
        $players = 0
        
        # Find DIM section for dimensions
        $dimPattern = [System.Text.Encoding]::ASCII.GetBytes("DIM ")
        for ($i = 0; $i -lt ($bytes.Length - 12); $i++) {
            if ($bytes[$i] -eq $dimPattern[0] -and 
                $bytes[$i + 1] -eq $dimPattern[1] -and 
                $bytes[$i + 2] -eq $dimPattern[2] -and 
                $bytes[$i + 3] -eq $dimPattern[3]) {
                
                $x = [BitConverter]::ToUInt16($bytes, $i + 8)
                $y = [BitConverter]::ToUInt16($bytes, $i + 10)
                $dimensions = "${x}x${y}"
                break
            }
        }
        
        # Find UNIT section and count start locations (players)
        $unitPattern = [System.Text.Encoding]::ASCII.GetBytes("UNIT")
        for ($i = 0; $i -lt ($bytes.Length - 8); $i++) {
            if ($bytes[$i] -eq $unitPattern[0] -and 
                $bytes[$i + 1] -eq $unitPattern[1] -and 
                $bytes[$i + 2] -eq $unitPattern[2] -and 
                $bytes[$i + 3] -eq $unitPattern[3]) {
                
                $sectionSize = [BitConverter]::ToUInt32($bytes, $i + 4)
                $unitCount = $sectionSize / 8
                $offset = $i + 8
                
                for ($u = 0; $u -lt $unitCount; $u++) {
                    $unitOffset = $offset + ($u * 8)
                    if ($unitOffset + 7 -lt $bytes.Length) {
                        $unitType = $bytes[$unitOffset + 4]
                        if ($unitType -eq 0x5E -or $unitType -eq 0x5F) {
                            # HUMAN_START or ORC_START
                            $players++
                        }
                    }
                }
                break
            }
        }
        
        return @{
            dimensions = $dimensions
            players    = $players
        }
    }
    catch {
        Write-Warning "Failed to extract metadata from $FilePath : $_"
        return @{
            dimensions = "Unknown"
            players    = 0
        }
    }
}

# Get all PUD files
$files = Get-ChildItem -Path $mapFolder -Filter *.pud | Sort-Object Name

$manifest = @()
$id = 1

Write-Host "Extracting metadata from $($files.Count) PUD files..."

foreach ($file in $files) {
    Write-Host "Processing: $($file.Name)"
    $metadata = Get-PudMetadata -FilePath $file.FullName
    
    $manifest += [PSCustomObject]@{
        id         = $id
        name       = $file.Name           # Display name
        filename   = $file.Name           # Original filename for downloads
        path       = "$s3BucketUrl/$($file.Name)" # S3 URL - no URL encoding needed for S3
        size       = $file.Length         # File size in bytes
        dimensions = $metadata.dimensions
        players    = $metadata.players
    }
    $id++
}

# Convert to JSON and save
$manifest | ConvertTo-Json -Depth 3 | Set-Content -Path $outputFile -Encoding UTF8

Write-Host "Manifest written to $outputFile with $($manifest.Count) entries."