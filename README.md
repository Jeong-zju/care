# CARE — Before We Act

Public project page for **Before We Act: Learning Action-Conditioned
Team-Response Beliefs for Decentralized Multi-Robot Manipulation**.

Live site: https://jeong-zju.github.io/care/

Plain HTML, CSS, and JavaScript, with interactive result charts, simulation
keyframes, physical-task videos, and the public preprint PDF.

## Authors

Zihao Li, Yanan ZHOU, Ranpeng Qiu, Guoqiang Ren, Weiming Zhi.
Affiliations and corresponding-author contact match the arXiv manuscript.

## Preview

```bash
python3 -m http.server 8000
```

Open http://localhost:8000/.

## Publish

GitHub Pages serves the repository's `main` branch at the root. `.nojekyll`
keeps deployment buildless. Commit and push changes to update the site.

The arXiv button remains pending until an arXiv identifier is assigned. The
code button remains pending until the associated release is selected.

## Content and media

- `index.html`: paper overview, authors, results, videos, and BibTeX.
- `css/style.css`: responsive page styles.
- `js/data.js`: reported values transcribed from the current `experiments.tex`.
- `js/charts.js`, `js/main.js`: charts and page interactions.
- `assets/paper/before-we-act.pdf`: current public arXiv preprint.
- `assets/video/`: MP4 renditions and WebM fallbacks for physical-task clips.
- `assets/fig/`, `assets/img/`: manuscript figures and task keyframes.
- `scripts/build_media.sh`: optional rebuild pipeline from original local footage.

Total-only and Direct-only have no response predictor; their response errors
are missing, not zero, and are omitted from the error chart. The physical
comparison includes the nominal-path control and does not publish the older
parameter/latency values absent from the current manuscript.

After updating the paper, regenerate its release and copy
`../before-we-act-paper/output/arxiv/CARE-arxiv.pdf` to
`assets/paper/before-we-act.pdf` before publishing.
