# PowerShell script to process sprites using ImageMagick
# 1. Convert JPG to PNG
# 2. Rescale large images to match project scale (max height 600px)
# 3. Remove white background USING FLOODFILL (preserves interior whites)
# 4. Add 15px PADDING before border to prevent clipping
# 5. Add 10px white sticker border
# 6. Apply specific flips (Princess Restore Action)

$spriteDir = "public/sprites"
$magick = "magick"

if (-not (Test-Path $spriteDir)) {
    Write-Error "Sprite directory not found: $spriteDir"
    exit 1
}

# Process JPGs -> PNGs
Get-ChildItem -Path $spriteDir -Filter "*.jpg" | ForEach-Object {
    $file = $_.FullName
    $pngFile = [io.path]::ChangeExtension($file, ".png")
    Write-Host "Converting $($_.Name) to PNG..."
    & $magick "$file" "$pngFile"
    Remove-Item "$file" -Force
}

# Process all PNGs
Get-ChildItem -Path $spriteDir -Filter "*.png" | ForEach-Object {
    $file = $_.FullName
    $name = $_.Name
    
    if ($name -eq "app-icon.png") {
        Write-Host "Skipping $name (manually processed by user)..."
        return
    }

    Write-Host "Processing $name..."

    # Use an array to build arguments for reliable PowerShell execution
    $args = @($file)

    # Specific Flips
    if ($name -eq "princess-restore-action.png") {
        Write-Host "  -> Flipping orientation for Princess Restore"
        $args += "-flop"
    }

    # Resizing: If larger than 650px height, scale down to 600px height
    $height = & $magick identify -format "%h" "$file"
    if ([int]$height -gt 650) {
        Write-Host "  -> Resizing large image (height: $height) to 600px height"
        $args += "-resize", "x600"
    }

    # Core logic arguments
    $args += "-bordercolor", "white", "-border", "2x2"
    $args += "-fuzz", "15%", "-fill", "none", "-draw", "color 0,0 floodfill"
    $args += "-shave", "2x2"
    $args += "-trim", "+repage"
    $args += "-bordercolor", "transparent", "-border", "15x15"
    
    # Complex filter block for sticker border
    # In PowerShell, we pass the complex expression as a single string if needed, 
    # but ImageMagick likes them as separate args.
    $args += "(", "+clone", "-alpha", "extract", "-morphology", "Dilate", "Disk:10", "-threshold", "0", "-background", "white", "-alpha", "shape", ")"
    
    $args += "-compose", "DstOver", "-composite"
    $args += "-trim", "+repage"
    $args += "-bordercolor", "transparent", "-border", "5x5"
    $args += "-define", "png:color-type=6"
    $args += "$file"

    & $magick @args
}

Write-Host "All sprites processed with safe padding and scaling! ✨"
