# Font Notes

The stack uses Cairo, Amiri, and Noto Naskh Arabic with `font-display: swap`.

In offline/dev environments, local system font aliases are used via `@font-face src: local(...)`.
For production, replace this folder with self-hosted WOFF2 files:
- `cairo-regular.woff2`
- `cairo-600.woff2`
- `cairo-700.woff2`
- `amiri-regular.woff2`
- `amiri-700.woff2`
