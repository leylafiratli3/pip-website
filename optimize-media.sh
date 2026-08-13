#!/usr/bin/env bash
#
# optimize-media.sh — shrink Pip's raw videos/photos into web-ready assets.
#
# Phone videos come off the camera at 1080p and 5–12 MB each, which is far too
# heavy to load quickly in a browser. This script re-encodes them to slimmer
# 720p H.264 MP4 (so the page loads fast) and pulls a poster frame for each so
# the browser can paint something instantly before the video bytes arrive.
#
# (H.264 MP4 is universally supported and — at these clip lengths — came out
# smaller than VP9 WebM, so we ship a single MP4 per clip.)
#
# Requires ffmpeg:  brew install ffmpeg
#
# Usage:  ./optimize-media.sh
#
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
SRC="$ROOT/assets/new_content"      # raw camera files
OUT="$ROOT/assets/video"            # web-ready videos
POSTERS="$OUT/posters"              # poster frames

if ! command -v ffmpeg >/dev/null 2>&1; then
  echo "ffmpeg not found. Install it with:  brew install ffmpeg" >&2
  exit 1
fi

mkdir -p "$OUT" "$POSTERS"

# map: <source file in assets/new_content>  <clean output name>
# (space-separated pairs; edit here when new footage is dropped in)
VIDEOS=(
  "20260725_095627.mp4 home-group"
  "20260725_095415.mp4 book-circle"
  "20260724_114729.mp4 practice-pond"
)

for pair in "${VIDEOS[@]}"; do
  set -- $pair
  in="$SRC/$1"
  name="$2"
  if [[ ! -f "$in" ]]; then
    echo "skip: $in not found"; continue
  fi

  echo "==> $name"

  # H.264 MP4 — universal support, 720p, faststart so playback can begin
  # before the whole file downloads. Muted background clips: drop the audio.
  ffmpeg -y -i "$in" \
    -vf "scale=-2:720" \
    -c:v libx264 -profile:v high -crf 26 -preset veryslow \
    -movflags +faststart -an \
    "$OUT/$name.mp4" -loglevel error

  # Poster frame (first frame), 1280px wide, ~80% quality JPEG.
  ffmpeg -y -i "$in" \
    -vf "scale=1280:-2" -frames:v 1 -q:v 4 \
    "$POSTERS/$name.jpg" -loglevel error

  printf '    mp4: %s\n' "$(du -h "$OUT/$name.mp4" | cut -f1)"
done

echo "Done. Optimized assets are in assets/video/"
