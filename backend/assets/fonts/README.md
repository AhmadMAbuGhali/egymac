# Cairo fonts for PDF generation (offline-first)

Place these files here for production PDF rendering without Google Fonts:

| File (preferred) | Alternate | Weight |
|------------------|-----------|--------|
| `cairo-regular.woff2` | `Cairo-Regular.woff2` | 400 |
| `cairo-semibold.woff2` | `Cairo-SemiBold.woff2` | 600 |
| `cairo-bold.woff2` | `Cairo-Bold.woff2` | 700 |

Download from [Google Fonts — Cairo](https://fonts.google.com/specimen/Cairo) or install `@fontsource/cairo` and copy the woff2 files.

`printFonts.js` injects `@font-face` with absolute `file://` URLs (plus inline base64 backup when all weights are present). If files are missing, PDF HTML falls back to Google Fonts `@import`.
