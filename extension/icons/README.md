# VYRA Extension Icons

The icon files in this directory are generated from `icon.svg` using `rsvg-convert`.

## Files

| File | Size | Usage |
|------|------|-------|
| `icon.svg`    | Source | Vector master — edit this |
| `icon16.png`  | 16×16  | Browser toolbar (small) |
| `icon48.png`  | 48×48  | Extension management page |
| `icon128.png` | 128×128| Chrome Web Store listing |

## Regenerate PNGs

If you edit `icon.svg`, regenerate the PNGs with:

```bash
rsvg-convert -w 16  -h 16  icon.svg -o icon16.png
rsvg-convert -w 48  -h 48  icon.svg -o icon48.png
rsvg-convert -w 128 -h 128 icon.svg -o icon128.png
```

Or with ImageMagick:

```bash
convert -background none -resize 16x16   icon.svg icon16.png
convert -background none -resize 48x48   icon.svg icon48.png
convert -background none -resize 128x128 icon.svg icon128.png
```
