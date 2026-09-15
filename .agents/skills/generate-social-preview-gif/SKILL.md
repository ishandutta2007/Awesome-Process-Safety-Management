---
name: generate-social-preview-gif
description: >-
  Generates an animated GIF tailored for GitHub Social Preview images (640x320px, strictly under 1MB, with 50px top and bottom padding).
  Use this skill whenever generating or updating a social preview GIF banner for a repository.
---

# Generate Social Preview GIF Skill

This skill provides an automated Node.js script to create lightweight, zero-dependency, pixel-perfect animated GIFs formatted for GitHub repository Social Previews.

## Specifications

- **Dimensions**: Exactly 640px (width) x 320px (height).
- **Padding**: 50px top and bottom padding (all visual content contained between `y = 50` and `y = 270`).
- **File Size**: Guaranteed < 1 MB (typically < 100 KB using custom 8-bit palette + LZW GIF stream encoder).
- **Output Location**: `assets/preview.gif`

## Helper Script

The generator script is located at:
[generate_gif.js](./scripts/generate_gif.js)

## Usage

To generate `assets/preview.gif` in the root workspace directory, run:

```bash
node .agents/skills/generate-social-preview-gif/scripts/generate_gif.js
```
