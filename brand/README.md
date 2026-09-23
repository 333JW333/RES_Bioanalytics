# Brand assets

`EcoPeps_Brand_System_v1/` is the designer's full brand package: master
vectors, lockups, icons, print files (including the 40 × 20 mm vial label)
and the brand guidelines. Start with its own `README.md`.

This folder is **not** served by the website. The site uses copies in
`public/brand/`.

The site uses the approved rasters (`00_Approved_Raster/`) wherever they
work, and falls back to the vector files only where they don't. The web
copies are trimmed and resized (and the navy copy has its background
removed); the artwork itself is otherwise unchanged.

| Site file | Source in the package |
|---|---|
| `ecopeps-logo.png` (header, entry/register pages) | `00_Approved_Raster/EcoPeps_Approved_Transparent_1774x887.png`, cropped to x 100, y 118, 1575 × 624 and resized to 1200 px wide |
| `ecopeps-logo-reverse.png` (navy footer) | `00_Approved_Raster/EcoPeps_Approved_Dark_1774x887.png`, cropped to x 101, y 119, 1575 × 621, its `#041c32` background keyed to transparent (the site navy is `#071a2c`, so an opaque copy shows a box), resized to 1200 px wide |
| `ecopeps-apple-touch.png` | `00_Approved_Raster/EcoPeps_Approved_Light_1774x887.png`, the torus cropped square (x 72, y 85, 690 × 690) and resized to 180 × 180 |
| `ecopeps-og.png` (social share image) | Built from `00_Approved_Raster/EcoPeps_Approved_Transparent_1774x887.png` |
| `ecopeps-mark.svg` (browser tab icon) | `03_Icons/EcoPeps_Torus_Flat.svg`. Vector, because tab icons are 16–32 px and the guidelines rule out the detailed mark below 40 px |
| `src/app/favicon.ico` | `03_Icons/EcoPeps_Favicon.ico`, for the same reason |

Render the raster lockup at least 44 px tall (see `src/components/Logo.tsx`)
so its torus stays above that 40 px minimum.

The site's teal follows the approved raster logo rather than the
guidelines' Peptide Teal `#14B8A6`: `--brand-teal` in `src/app/globals.css`
is the wordmark P's `#01a2a9`, and `--brand-teal-dark` (`#01767c`) is the
same hue darkened for text. The other brand colors match the guidelines.
When the package is updated, add it as a new versioned folder and refresh
the copies above.