# Hairstyle thumbnails

These images are the small preview pictures shown in the "Choose a hairstyle"
grid on the AI try-on page. They are **only thumbnails** — they do not affect
the AI result. The hairstyle the AI produces is driven by the style `name` in
`src/app/try-on/page.tsx`.

## How to add an image

Drop a `.jpg` file in this folder with the exact name below. Square images
(e.g. 500×500) look best, since the grid shows them as squares.

| Hairstyle      | File name to add        |
| -------------- | ----------------------- |
| Fade           | `fade.jpg`              |
| High top fade  | `high-top-fade.jpg`     |
| Buzz cut       | `buzz-cut.jpg`          |
| Crew cut       | `crew-cut.jpg`          |
| High and tight | `high-and-tight.jpg`    |
| Undercut       | `undercut.jpg`          |
| Quiff          | `quiff.jpg`             |
| Pompadour      | `pompadour.jpg`         |

If a file is missing, that card simply shows no image (it won't break the
page — the broken image is hidden automatically).

## To add a NEW hairstyle

1. Add an entry to the `STYLES` list in `src/app/try-on/page.tsx`, e.g.
   `{ name: 'Man bun', photo: '/styles/man-bun.jpg' }`
2. Put a `man-bun.jpg` in this folder.
