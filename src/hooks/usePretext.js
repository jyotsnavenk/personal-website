import { useEffect, useRef, useState, useCallback } from 'react'
import { prepare, layout, prepareWithSegments, layoutWithLines } from '@chenglou/pretext'

const fontsReady = typeof document !== 'undefined'
  ? document.fonts.ready
  : Promise.resolve()

export function usePretextMeasure(text, fontString, containerWidth, lineHeight) {
  const [result, setResult] = useState({ height: 0, lineCount: 0, ready: false })
  const preparedRef = useRef(null)

  useEffect(() => {
    if (!text || !fontString || !containerWidth) return
    fontsReady.then(() => {
      const prepared = prepare(text, fontString)
      preparedRef.current = prepared
      const measured = layout(prepared, containerWidth, lineHeight)
      setResult({ height: measured.height, lineCount: measured.lineCount, ready: true })
    })
  }, [text, fontString, containerWidth, lineHeight])

  const remeasure = useCallback((newWidth) => {
    if (!preparedRef.current) return { height: 0, lineCount: 0 }
    return layout(preparedRef.current, newWidth, lineHeight)
  }, [lineHeight])

  return { ...result, remeasure }
}

export function usePretextLines(text, fontString, maxWidth, lineHeight) {
  const [result, setResult] = useState({ lines: [], height: 0, ready: false })

  useEffect(() => {
    if (!text || !fontString || !maxWidth) return
    fontsReady.then(() => {
      const prepared = prepareWithSegments(text, fontString)
      const measured = layoutWithLines(prepared, maxWidth, lineHeight)
      setResult({ lines: measured.lines, height: measured.height, ready: true })
    })
  }, [text, fontString, maxWidth, lineHeight])

  return result
}

export function usePretextFit(text, fontString, maxWidth) {
  const [fits, setFits] = useState(true)

  useEffect(() => {
    if (!text || !fontString || !maxWidth) return
    fontsReady.then(() => {
      const prepared = prepare(text, fontString)
      const measured = layout(prepared, maxWidth, 1.2)
      setFits(measured.lineCount <= 1)
    })
  }, [text, fontString, maxWidth])

  return fits
}

export { prepare, layout, prepareWithSegments, layoutWithLines }
