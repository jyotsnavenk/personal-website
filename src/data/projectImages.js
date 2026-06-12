// Auto-discovers project images from the root `project-images/<Project>/imgN.jpg`
// folders at build time. Adding img2.jpg, img3.jpg, ... to a folder makes them
// appear in that project's popover with no code change.
const modules = import.meta.glob('/project-images/*/*.{jpg,jpeg,png,webp}', {
  eager: true,
  query: '?url',
  import: 'default',
})

const byFolder = {}
for (const [path, url] of Object.entries(modules)) {
  // path: '/project-images/<folder>/<file>'
  const [, , folder, file] = path.split('/')
  ;(byFolder[folder] ??= []).push({ file, url })
}
for (const list of Object.values(byFolder)) {
  list.sort((a, b) => a.file.localeCompare(b.file, undefined, { numeric: true }))
}

export function getProjectImages(folder) {
  return (byFolder[folder] || []).map((entry) => entry.url)
}
