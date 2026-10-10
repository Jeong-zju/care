#!/usr/bin/env bash
# Rebuilds the media assets of the project page from the raw sources.
#
#   RAW_DIR    raw footage and 4K screenshots   (default: ~/Downloads/before-we-act-cuts)
#   PAPER_DIR  the LaTeX repo with figures/*.pdf and main.pdf (default: ../before-we-act-paper)
#
# Usage:  scripts/build_media.sh [all|folding|opening|images|figures|paper]
#
# Both raw clips open with roughly ten seconds of idle robots, and both end
# with footage that gives the recording away: opening_box.mp4 jumps back to
# the reset scene at 40.24 s, and folding_bed.mp4 shows the arms
# swinging back to their home pose. The cut points below remove that.
set -euo pipefail
HERE=$(cd "$(dirname "$0")/.." && pwd)
RAW_DIR=${RAW_DIR:-$HOME/Downloads/before-we-act-cuts}
PAPER_DIR=${PAPER_DIR:-$HERE/../before-we-act-paper}
OUT=$HERE/assets

FOLD_START=10.4; FOLD_END=69.0     # folding_bed.mp4  (raw 76.5 s)
OPEN_START=12.4; OPEN_END=40.2     # opening_box.mp4  (raw 45.4 s)

encode() { # encode <src> <start> <end> <name>
  local src=$1 start=$2 end=$3 name=$4
  local dur fo
  dur=$(python3 -c "print(round($end-$start,3))")
  fo=$(python3 -c "print(round($end-$start-0.6,3))")
  # One decode of the 4K60 source, two H.264 renditions (30 fps is plenty for the web).
  ffmpeg -v error -y -ss "$start" -t "$dur" -i "$src" \
    -filter_complex "[0:v]fps=30,fade=t=in:st=0:d=0.4,fade=t=out:st=$fo:d=0.6,split=2[a][b];[a]scale=-2:1080[a1];[b]scale=-2:720[b1]" \
    -map "[a1]" -c:v libx264 -preset slow -crf 22 -pix_fmt yuv420p -movflags +faststart -an "$OUT/video/$name-1080p.mp4" \
    -map "[b1]" -c:v libx264 -preset slow -crf 23 -pix_fmt yuv420p -movflags +faststart -an "$OUT/video/$name-720p.mp4"
  # WebM supports browsers whose builds lack H.264 decoding.
  ffmpeg -v error -y -i "$OUT/video/$name-720p.mp4" \
    -c:v libvpx-vp9 -crf 33 -b:v 0 -deadline good -cpu-used 5 \
    -row-mt 1 -threads 4 -an "$OUT/video/$name-720p.webm"
  ffmpeg -v error -y -ss "$start" -i "$src" -frames:v 1 -vf "scale=1920:-2" -q:v 3 "$OUT/video/$name-poster.jpg"
  echo "encoded $name ($dur s)"
}

images() {
  local src=$RAW_DIR/screenshots
  conv() { ffmpeg -v error -y -i "$1" -vf "scale=1600:-2" -q:v 3 "$2"; }
  mkdir -p "$OUT/img/sim" "$OUT/img/real"
  for t in ca lpd tp ps pf; do for i in 0 1 2 3; do
    [ -f "$src/$t$i.png" ] && conv "$src/$t$i.png" "$OUT/img/sim/$t-$i.jpg"
  done; done
  for i in 0 1 2; do conv "$src/lf$i.png" "$OUT/img/sim/lb-$i.jpg"; done   # lf = Lift Barrier
  conv "$src/lf_fail.png" "$OUT/img/sim/lb-fail.jpg"
  conv "$src/tp_fail.png" "$OUT/img/sim/tp-fail.jpg"
  for i in 1 2 3 4; do
    conv "$src/folding0$i.png" "$OUT/img/real/folding-$i.jpg"
    conv "$src/opening0$i.png" "$OUT/img/real/opening-$i.jpg"
  done
  # Social preview (1200x630) from the folding scene.
  ffmpeg -v error -y -i "$src/folding03.png" -vf "scale=1200:-2,crop=1200:630" -q:v 3 "$OUT/og.jpg"
  echo "images done"
}

figures() {
  local f=$PAPER_DIR/figures
  mkdir -p "$OUT/fig"
  pdftoppm -png -r 120 -singlefile "$f/care_teaser_sim.pdf"  "$OUT/fig/teaser"
  pdftoppm -png -r 170 -singlefile "$f/care_method.pdf"      "$OUT/fig/method"
  pdftoppm -png -r 170 -singlefile "$f/selection_result.pdf" "$OUT/fig/selection"
  pdftoppm -png -r 120 -singlefile "$f/real_result.pdf"      /tmp/bwa_real
  pdftoppm -png -r 120 -singlefile "$f/sim_result.pdf"       /tmp/bwa_sim
  ffmpeg -v error -y -i /tmp/bwa_real.png -q:v 2 "$OUT/fig/real_result.jpg"
  ffmpeg -v error -y -i /tmp/bwa_sim.png  -q:v 2 "$OUT/fig/sim_result.jpg"
  rm -f /tmp/bwa_real.png /tmp/bwa_sim.png
  echo "figures done"
}

paper() {
  mkdir -p "$OUT/paper"
  gs -sDEVICE=pdfwrite -dCompatibilityLevel=1.5 -dPDFSETTINGS=/printer -dNOPAUSE -dQUIET -dBATCH \
     -sOutputFile="$OUT/paper/before-we-act.pdf" "$PAPER_DIR/main.pdf"
  echo "paper done"
}

mkdir -p "$OUT/video"
case "${1:-all}" in
  folding) encode "$RAW_DIR/raw_videos/folding_bed.mp4" $FOLD_START $FOLD_END folding-bed ;;
  opening) encode "$RAW_DIR/raw_videos/opening_box.mp4" $OPEN_START $OPEN_END opening-box ;;
  images)  images ;;
  figures) figures ;;
  paper)   paper ;;
  all) encode "$RAW_DIR/raw_videos/folding_bed.mp4" $FOLD_START $FOLD_END folding-bed
       encode "$RAW_DIR/raw_videos/opening_box.mp4" $OPEN_START $OPEN_END opening-box
       images; figures; paper ;;
  *) echo "unknown target: $1" >&2; exit 1 ;;
esac
