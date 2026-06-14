// Auto-discovers exhibit images from the root `exhibit-images/<slug>/imgN.jpg`
// folders at build time. Adding img1.jpg, img2.jpg, ... to a folder makes them
// appear in that project's section with no code change.
const modules = import.meta.glob('/exhibit-images/*/*.{jpg,jpeg,png,webp,JPG,JPEG,PNG}', {
  eager: true,
  query: '?url',
  import: 'default',
})

const byFolder = {}
for (const [path, url] of Object.entries(modules)) {
  // path: '/exhibit-images/<folder>/<file>'
  const [, , folder, file] = path.split('/')
  ;(byFolder[folder] ??= []).push({ file, url })
}
for (const list of Object.values(byFolder)) {
  list.sort((a, b) => a.file.localeCompare(b.file, undefined, { numeric: true }))
}

export function getExhibitImages(folder) {
  return (byFolder[folder] || []).map((entry) => entry.url)
}

// Auto-discovers an uploaded video per folder (e.g. exhibit-images/<slug>/video.mp4).
const videoModules = import.meta.glob('/exhibit-images/*/*.{mp4,webm,mov,m4v}', {
  eager: true,
  query: '?url',
  import: 'default',
})

const videoByFolder = {}
for (const [path, url] of Object.entries(videoModules)) {
  const [, , folder] = path.split('/')
  videoByFolder[folder] ??= url // first video found in the folder
}

export function getExhibitVideo(folder) {
  return videoByFolder[folder] || ''
}
