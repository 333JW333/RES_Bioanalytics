# Brand assets

`EcoPeps_Brand_System_v1/` is the designer's full brand package: master
vectors, lockups, icons, print files (including the 40 × 20 mm vial label)
and the brand guidelines. Start with its own `README.md`.

This folder is **not** served by the website. The site uses copies in
`public/brand/`:

| Site file | Source in the package |
|---|---|
| `ecopeps-logo-compact.svg` (header, entry/register pages) | `02_Responsive_Lockups/EcoPeps_Compact_Color_Transparent.svg` |
| `ecopeps-logo-compact-reverse.svg` (navy footer) | `02_Responsive_Lockups/EcoPeps_Compact_Reverse_Dark.svg`, background rectangle removed |
| `ecopeps-logo-display-reverse.svg` (home page hero) | `01_Master_Vector/EcoPeps_Display_Metallic_Dark.svg`, background rectangle removed |
| `ecopeps-mark.svg` (browser icon) | `03_Icons/EcoPeps_Torus_Flat.svg` |
| `ecopeps-apple-touch.png` | Rendered from `03_Icons/EcoPeps_Torus_Flat.svg` on white |
| `src/app/favicon.ico` | `03_Icons/EcoPeps_Favicon.ico` |
| `ecopeps-og.png` (social share image) | Built from `00_Approved_Raster/EcoPeps_Approved_Transparent_1774x887.png` |

The brand colors in the guidelines already match the site's tokens in
`src/app/globals.css`. When the package is updated, add it as a new
versioned folder and refresh the copies above.
