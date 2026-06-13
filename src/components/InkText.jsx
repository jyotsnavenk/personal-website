// Renders a company block's text as individual character spans so a scroll-
// driven "ink mask" can sweep across it letter by letter. Each character gets
// a --pos (its position 0→1 in the block's reading order); CSS turns --pos plus
// the block-level --p (scroll progress) into a per-letter gray→black reveal.
// Words are wrapped in inline-block spans so the mask never breaks a word
// across lines.

// Splits `text` into word spans of char spans, numbering each char continuously
// from `offset` and normalizing against `total` so name + description form one
// uninterrupted sweep. Spaces between words are preserved as plain text.
function splitChars(text, offset, total) {
  const denom = Math.max(1, total - 1)
  const nodes = []
  let i = offset
  // Split on spaces, keeping the spaces as their own entries.
  text.split(/(\s+)/).forEach((token, t) => {
    if (token === '') return
    if (/^\s+$/.test(token)) {
      nodes.push(token) // whitespace stays a normal break opportunity
      return
    }
    const chars = [...token].map((ch, c) => {
      const pos = (i / denom).toFixed(4)
      i += 1
      return (
        <span key={`${t}-${c}`} className="ink__char" style={{ '--pos': pos }}>
          {ch}
        </span>
      )
    })
    nodes.push(
      <span key={`w-${t}`} className="ink__word">
        {chars}
      </span>
    )
  })
  return nodes
}

export default function InkText({ name, desc }) {
  const total = name.length + desc.length
  return (
    <>
      <p className="projects__company-name">{splitChars(name, 0, total)}</p>
      <p className="projects__company-desc">{splitChars(desc, name.length, total)}</p>
    </>
  )
}
