// The animated scenes shown while the agent works. Each one is a small SVG drawing.
// The movement lives in AgentThinking.css (classes starting with "at-"), and the colours
// come from the design-kit tokens, so the scenes follow the light and dark themes.
//
// To add a scene: add an entry to SCENES with an id, a label and a drawing.

import type { CSSProperties, ReactNode } from 'react'

export type Scene = {
  id: string
  label: string        // shown under the drawing, e.g. "Searching the audit logs"
  drawing: ReactNode
}

// Small helper: start one element's animation a bit later than the others.
const delay = (seconds: number): CSSProperties => ({ animationDelay: `${seconds}s` })

const ROWS = [0, 1, 2, 3, 4]

export const SCENES: Scene[] = [
  {
    // A magnifying glass moves over log rows; each row lights up as it passes.
    id: 'search',
    label: 'Searching the audit logs',
    drawing: (
      <svg viewBox="0 0 160 120">
        {ROWS.map((row) => (
          <rect
            key={row}
            className="at-row"
            x="20" y={16 + row * 19} width="120" height="9" rx="3"
            style={delay(row * 0.5)}
          />
        ))}
        <g className="at-lens">
          <circle className="at-line" cx="0" cy="0" r="13" />
          <line className="at-line" x1="9" y1="9" x2="20" y2="20" />
        </g>
      </svg>
    ),
  },
  {
    // A permission change is linked to its approval ticket, then a check appears.
    id: 'approvals',
    label: 'Matching changes to approvals',
    drawing: (
      <svg viewBox="0 0 160 120">
        <rect className="at-card" x="12" y="32" width="46" height="56" rx="6" />
        <rect className="at-card" x="102" y="32" width="46" height="56" rx="6" />
        {ROWS.slice(0, 3).map((row) => (
          <g key={row}>
            <line className="at-text-line" x1="20" y1={46 + row * 12} x2="50" y2={46 + row * 12} />
            <line className="at-text-line" x1="110" y1={46 + row * 12} x2="140" y2={46 + row * 12} />
          </g>
        ))}
        <path className="at-link" d="M58 60 H102" />
        <circle className="at-badge" cx="80" cy="60" r="11" />
        <path className="at-check" d="M74.5 60 l4 4 l7 -8" />
      </svg>
    ),
  },
  {
    // Events pop onto a timeline one after another.
    id: 'timeline',
    label: 'Rebuilding the timeline',
    drawing: (
      <svg viewBox="0 0 160 120">
        <line className="at-axis" x1="14" y1="64" x2="146" y2="64" />
        {ROWS.map((row) => (
          <g key={row}>
            <line
              className="at-tick"
              x1={24 + row * 28} y1={row % 2 ? 72 : 56}
              x2={24 + row * 28} y2={row % 2 ? 86 : 42}
              style={delay(row * 0.35)}
            />
            <circle className="at-dot" cx={24 + row * 28} cy="64" r="5" style={delay(row * 0.35)} />
          </g>
        ))}
      </svg>
    ),
  },
  {
    // Each line of the answer gets checked off: every claim needs its evidence.
    id: 'citations',
    label: 'Verifying every citation',
    drawing: (
      <svg viewBox="0 0 160 120">
        <rect className="at-card" x="44" y="12" width="72" height="96" rx="6" />
        {[0, 1, 2, 3].map((row) => (
          <g key={row}>
            <path
              className="at-check at-check--small"
              d={`M54 ${33 + row * 20} l3.5 3.5 l6 -7`}
              style={delay(row * 0.45)}
            />
            <line className="at-text-line" x1="70" y1={33 + row * 20} x2="106" y2={33 + row * 20} />
          </g>
        ))}
      </svg>
    ),
  },
  {
    // Rings spread out from the centre and pieces of evidence appear around it.
    id: 'evidence',
    label: 'Cross-checking the evidence',
    drawing: (
      <svg viewBox="0 0 160 120">
        {[0, 1, 2].map((ring) => (
          <circle key={ring} className="at-ring" cx="80" cy="60" r="44" style={delay(ring * 0.8)} />
        ))}
        <circle className="at-core" cx="80" cy="60" r="7" />
        {[
          [48, 36], [116, 42], [56, 88], [108, 84], [80, 22],
        ].map(([x, y], i) => (
          <circle key={i} className="at-dot at-dot--small" cx={x} cy={y} r="3.5" style={delay(i * 0.45)} />
        ))}
      </svg>
    ),
  },
]
