import { useMemo } from 'react'

// Ported as-is from design-reference/gornilo-launcher-v3.html buildLandscape().
function buildLandscape(cols, rows) {
  const grid = Array.from({ length: rows }, () => new Array(cols).fill(' '))
  const opac = Array.from({ length: rows }, () => new Array(cols).fill(1))

  const baseline = Math.floor(rows * 0.62)
  let h = baseline - 8
  const heights = new Array(cols).fill(baseline)
  let run = 0
  for (let c = 0; c < Math.floor(cols * 0.62); c++) {
    if (run <= 0) {
      h += (Math.random() < 0.5 ? -1 : 1) * (1 + Math.floor(Math.random() * 2)) * 2
      h = Math.max(baseline - 22, Math.min(baseline - 2, h))
      run = 2 + Math.floor(Math.random() * 5)
    }
    run--
    heights[c] = h
  }
  let t = baseline - 4
  for (let c = Math.floor(cols * 0.6); c < cols; c++) {
    t += Math.floor(Math.random() * 3) - 1
    t = Math.max(baseline - 12, Math.min(baseline + 1, t))
    heights[c] = t
  }

  const edgeChars = ['.', ':', "'", '`', ',', '"']
  const hatchChars = ['x', '×', '/', '\\', '.', ':']

  for (let c = 0; c < cols; c++) {
    const hc = heights[c]
    const hprev = c > 0 ? heights[c - 1] : hc

    if (hc !== hprev) {
      const top = Math.min(hc, hprev)
      const bot = Math.max(hc, hprev)
      for (let r = top; r <= bot; r++) {
        if (Math.random() < 0.75) grid[r][c] = hatchChars[Math.floor(Math.random() * hatchChars.length)]
      }
    }
    for (let r = hc; r <= hc + 1; r++) {
      if (r >= 0 && r < rows && Math.random() < 0.7) {
        grid[r][c] = edgeChars[Math.floor(Math.random() * edgeChars.length)]
      }
    }
    for (let r = hc + 2; r < rows; r++) {
      const depth = r - hc
      const p = Math.max(0, 0.22 - depth * 0.02)
      if (Math.random() < p) grid[r][c] = '.'
    }
  }

  const clusterCount = 5 + Math.floor(Math.random() * 3)
  for (let i = 0; i < clusterCount; i++) {
    const cx = Math.floor(cols * 0.6 + Math.random() * cols * 0.4)
    const cy = baseline - Math.floor(Math.random() * 5)
    const rad = 3 + Math.floor(Math.random() * 4)
    for (let dy = -rad; dy <= rad; dy++) {
      for (let dx = -rad * 2; dx <= rad * 2; dx++) {
        const r = cy + dy
        const cc = cx + dx
        if (r < 0 || r >= rows || cc < 0 || cc >= cols) continue
        const dist = Math.sqrt((dx / 2) * (dx / 2) + dy * dy)
        if (dist < rad && Math.random() < (1 - dist / rad) * 0.8) {
          grid[r][cc] = hatchChars[Math.floor(Math.random() * hatchChars.length)]
        }
      }
    }
  }

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] !== ' ') continue
      const skyDepth = 1 - r / rows
      const p = 0.012 * skyDepth
      if (Math.random() < p) {
        grid[r][c] = Math.random() < 0.7 ? 'x' : '.'
        opac[r][c] = 0.35 + Math.random() * 0.65
      }
    }
  }

  return { grid, opac }
}

export default function AsciiLandscape() {
  // Regenerated on every mount (each app launch), not a static image.
  const { grid, opac } = useMemo(() => buildLandscape(100, 46), [])

  return (
    <pre id="ascii-landscape">
      {grid.map((row, r) => (
        <span key={r}>
          {row.map((ch, c) =>
            ch === ' ' ? (
              ' '
            ) : (
              <span key={c} style={{ opacity: opac[r][c] }}>
                {ch}
              </span>
            )
          )}
          {'\n'}
        </span>
      ))}
    </pre>
  )
}
