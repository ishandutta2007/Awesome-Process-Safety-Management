---
name: generate-social-preview-gif
description: >-
  Generates an animated GIF tailored for GitHub Social Preview images (640x320px, strictly under 1MB, with 50px top and bottom padding).
  Use this skill whenever generating or updating a social preview GIF banner for a repository.
---

# Generate Social Preview GIF Skill

This skill provides an automated generator to create lightweight, high-fidelity animated GIFs formatted for GitHub repository Social Previews.

## Specifications

- **Dimensions**: Exactly 640px (width) x 320px (height).
- **Padding**: Strictly 50px top and bottom padding (all visual content contained between `y = 50` and `y = 270` to prevent being cropped by GitHub's header UI).
- **File Size**: Guaranteed strictly < 1 MB (typically ~180 KB using optimized 128-color quantization).
- **Dynamic Behavior**: Sine wave oscillation matching `assets/banner.svg` with a glowing moving safety indicator dot.
- **Output Location**: `assets/preview.gif`

## Generator Scripts

- **Python (Recommended for pixel-perfect TrueType typography & anti-aliased rendering)**:
  [generate_gif.py](./scripts/generate_gif.py)
- **Node.js (Alternative lightweight fallback)**:
  [generate_gif.js](./scripts/generate_gif.js)

## Usage

To regenerate `assets/preview.gif`, run:

```bash
python .agents/skills/generate-social-preview-gif/scripts/generate_gif.py
```

