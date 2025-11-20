# PowerShell script to upload all PUD files to S3
# Make sure you have AWS CLI installed and configured first:
# aws configure

# Configuration - UPDATE THESE VALUES
$BucketName = "war2ladder-maps"
$LocalMapsFolder = "public/maps"
$Region = "us-east-1"  # Change to your preferred region

Write-Host "Uploading PUD files to S3 bucket: $BucketName"
Write-Host "Local folder: $LocalMapsFolder"

# Check if AWS CLI is available
try {
    aws --version | Out-Null
} catch {
    Write-Error "AWS CLI not found. Please install AWS CLI and run 'aws configure' first."
    exit 1
}

# Check if bucket exists, create if not
Write-Host "Checking if bucket exists..."
$bucketExists = aws s3 ls "s3://$BucketName" 2>$null
if (-not $bucketExists) {
    Write-Host "Creating bucket $BucketName..."
    aws s3 mb "s3://$BucketName" --region $Region
    
    # Set bucket policy for public read access
    $policy = @"
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::$BucketName/*"
        }
    ]
}
"@
    
    Write-Host "Setting public read policy..."
    $policy | Out-File -FilePath "temp-policy.json" -Encoding UTF8
    aws s3api put-bucket-policy --bucket $BucketName --policy file://temp-policy.json
    Remove-Item "temp-policy.json"
}

# Upload all PUD files
Write-Host "Uploading PUD files..."
aws s3 sync $LocalMapsFolder "s3://$BucketName" --exclude "*" --include "*.pud" --delete

Write-Host ""
Write-Host "Upload complete!"
Write-Host "Your S3 bucket URL is: https://$BucketName.s3.amazonaws.com"
Write-Host ""
Write-Host "Next steps:"
Write-Host "1. Update generate-manifest.ps1 with your bucket URL"
Write-Host "2. Run: powershell -ExecutionPolicy Bypass -File generate-manifest.ps1"
Write-Host "3. Commit and deploy your changes"