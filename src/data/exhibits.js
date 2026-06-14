// === EXHIBITS CONTENT ===
// Each project section renders: caption → title → video embed → 3 images.
//
// To add / edit a project, edit this list only — no JSX changes needed.
//   caption — small line above the title (e.g. medium + date)
//   title   — the project name
//   video   — a normal YouTube or Vimeo share URL (watch?v=…, youtu.be/…,
//             or vimeo.com/…). It is converted to an embed automatically.
//             Leave '' to show an empty placeholder.
//   folder  — OPTIONAL. Image folder name under /project-images/.
//             Defaults to the title, so just name the folder the same as the
//             title and drop img1.jpg, img2.jpg, img3.jpg inside it.

export const EXHIBITS = [
  {
    caption: 'Projection art on the Downtown Denver Tower, Aug 2024',
    title: 'Liberation Notes',
    video: 'https://vimeo.com/1001817941?fl=pl&fe=sh',
    folder: 'liberation-notes',
    layout: 'split', // vertical video → portrait left, 2×2 image grid right
  },
  {
    caption: 'Interactive installation through fantasy worlds',
    title: 'Hanging Portals',
    localVideo: true, // plays exhibit-images/hanging-portals/video.mp4 (autoplay + loop)
    folder: 'hanging-portals',
  },
  {
    caption: 'Audio/visual immersive experience',
    title: 'Living Dreams',
    video: 'https://www.youtube.com/watch?v=PItdiwXhN_4',
    folder: 'living-dreams',
  },
  {
    caption: 'Livecoding audio/visual experience',
    title: 'Algorave',
    video: 'https://www.youtube.com/watch?v=MLtGq5N7UfM',
    folder: 'algorave',
  },
  {
    caption: 'Interactive installation',
    title: 'The Space Between',
    video: 'https://www.youtube.com/watch?v=mvTvsu3ApFE',
    folder: 'space-between',
  },
]

// Converts a YouTube/Vimeo share URL into an embeddable iframe src.
// Returns '' for an empty/unrecognized URL so the caller can show a placeholder.
export function toEmbedUrl(url) {
  if (!url) return ''
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/)
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`
  const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/)
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`
  return url // already an embed URL, or unknown host — use as-is
}
