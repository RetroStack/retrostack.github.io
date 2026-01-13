#!/bin/bash

# Convert WebM videos to optimized GIFs
# Requires ffmpeg to be installed

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VIDEO_DIR="$SCRIPT_DIR/../temp-videos"
OUTPUT_DIR="$SCRIPT_DIR/../public/images/tips"

# Check if ffmpeg is installed
if ! command -v ffmpeg &> /dev/null; then
    echo "Error: ffmpeg is not installed. Please install it first."
    echo "  macOS: brew install ffmpeg"
    echo "  Ubuntu: sudo apt install ffmpeg"
    exit 1
fi

# Function to convert a video to GIF
convert_video() {
    local input="$1"
    local output="$2"
    local width="${3:-400}"
    local fps="${4:-10}"

    echo "Converting: $input -> $output"

    # Create output directory if needed
    mkdir -p "$(dirname "$output")"

    # Two-pass conversion with palette generation for better quality
    ffmpeg -y -i "$input" \
        -vf "fps=$fps,scale=$width:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=256:stats_mode=diff[p];[s1][p]paletteuse=dither=bayer:bayer_scale=5" \
        -loop 0 \
        "$output" 2>/dev/null

    if [ $? -eq 0 ]; then
        # Get file size
        size=$(ls -lh "$output" | awk '{print $5}')
        echo "  Created: $output ($size)"
    else
        echo "  Error converting $input"
    fi
}

# Process all WebM files in temp-videos directory
echo "Converting videos to GIFs..."
echo ""

for video in "$VIDEO_DIR"/*.webm; do
    if [ -f "$video" ]; then
        # Extract category and name from filename (e.g., drawing-drag-paint.webm)
        filename=$(basename "$video" .webm)
        category=$(echo "$filename" | cut -d'-' -f1)
        name=$(echo "$filename" | cut -d'-' -f2-)

        output="$OUTPUT_DIR/$category/$name.gif"
        convert_video "$video" "$output"
    fi
done

echo ""
echo "Done! GIFs saved to $OUTPUT_DIR"
echo ""
echo "To optimize further, you can use:"
echo "  gifsicle -O3 --colors 128 input.gif -o output.gif"
