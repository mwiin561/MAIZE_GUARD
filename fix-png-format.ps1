Add-Type -AssemblyName System.Drawing

$assetsPath = "c:/Users/CLIENT/Documents/trae_projects/MAIZE_GUARD/assets"
$pngFiles = @("icon.png", "adaptive-icon.png", "splash-icon.png", "favicon.png")

Write-Host "Re-encoding PNG files to proper ARGB format for Android..." -ForegroundColor Cyan

foreach ($file in $pngFiles) {
    $filePath = Join-Path $assetsPath $file
    
    if (Test-Path $filePath) {
        Write-Host "Processing: $file" -ForegroundColor Yellow
        
        try {
            $originalImage = [System.Drawing.Image]::FromFile($filePath)
            $width = $originalImage.Width
            $height = $originalImage.Height
            
            $bitmap = New-Object System.Drawing.Bitmap($width, $height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
            
            $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
            $graphics.Clear([System.Drawing.Color]::Transparent)
            $graphics.DrawImage($originalImage, 0, 0, $width, $height)
            $graphics.Dispose()
            
            $originalImage.Dispose()
            
            $tempPath = "$filePath.tmp"
            $bitmap.Save($tempPath, [System.Drawing.Imaging.ImageFormat]::Png)
            $bitmap.Dispose()
            
            Start-Sleep -Milliseconds 100
            
            Remove-Item $filePath -Force
            Move-Item $tempPath $filePath -Force
            
            Write-Host "  Successfully re-encoded $file to 32-bit ARGB PNG" -ForegroundColor Green
        }
        catch {
            Write-Host "  Error processing $file : $_" -ForegroundColor Red
        }
    }
    else {
        Write-Host "  File not found: $file" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "PNG re-encoding complete!" -ForegroundColor Green
Write-Host "All asset PNGs are now in proper 32-bit ARGB format" -ForegroundColor Cyan
