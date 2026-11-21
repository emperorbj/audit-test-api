// The vector illustration on the login page: an "evidence network".
// A shield in the middle, audit events (nodes) on rings around it, and floating cards that
// stand for log rows, a verified citation and a timeline. Purely decorative (aria-hidden).
// Colours and the gentle floating motion are in brand.css (motion stops for reduced-motion).

const RING_NODES = [
  [260, 110], [390, 185], [395, 340], [260, 410], [128, 338], [125, 182],
  [330, 60], [470, 260], [330, 465], [60, 262],
]

export function HeroArt() {
  return (
    <svg className="hero-art" viewBox="0 0 520 520" aria-hidden="true">
      <defs>
        <radialGradient id="glow-primary" cx="50%" cy="50%" r="50%">
          <stop offset="0%" className="stop-primary" />
          <stop offset="100%" className="stop-clear" />
        </radialGradient>
        <radialGradient id="glow-info" cx="50%" cy="50%" r="50%">
          <stop offset="0%" className="stop-info" />
          <stop offset="100%" className="stop-clear" />
        </radialGradient>
        <pattern id="dots" width="22" height="22" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1.3" className="hero-art__dot" />
        </pattern>
        <radialGradient id="fade" cx="50%" cy="50%" r="50%">
          <stop offset="55%" stopColor="white" />
          <stop offset="100%" stopColor="black" />
        </radialGradient>
        <mask id="fade-mask">
          <rect width="520" height="520" fill="url(#fade)" />
        </mask>
      </defs>

      {/* Soft colour glows and a dot grid that fades out at the edges */}
      <circle cx="200" cy="210" r="210" fill="url(#glow-primary)" />
      <circle cx="380" cy="360" r="170" fill="url(#glow-info)" />
      <rect width="520" height="520" fill="url(#dots)" mask="url(#fade-mask)" />

      {/* Rings */}
      <circle className="hero-art__ring" cx="260" cy="260" r="150" />
      <circle className="hero-art__ring hero-art__ring--dashed" cx="260" cy="260" r="210" />
      <circle className="hero-art__ring" cx="260" cy="260" r="80" />

      {/* Connections from the centre to each event, and the events themselves */}
      {RING_NODES.slice(0, 6).map(([x, y], i) => (
        <line key={`l${i}`} className="hero-art__link" x1="260" y1="260" x2={x} y2={y} />
      ))}
      {RING_NODES.map(([x, y], i) => (
        <circle key={`n${i}`} className={`hero-art__node ${i % 3 === 0 ? 'hero-art__node--accent' : ''}`}
          cx={x} cy={y} r={i < 6 ? 7 : 4.5} style={{ animationDelay: `${i * 0.4}s` }} />
      ))}

      {/* The shield with a check in the middle */}
      <g className="hero-art__shield">
        <circle cx="260" cy="260" r="52" className="hero-art__halo" />
        <path d="M260 214 296 228v26c0 23-15 40-36 47-21-7-36-24-36-47v-26l36-14Z" className="hero-art__shield-body" />
        <path d="m244 258 11 11 22-23" className="hero-art__shield-check" />
      </g>

      {/* Floating card: log rows */}
      <g className="hero-art__card hero-art__float-a">
        <rect x="318" y="96" width="168" height="92" rx="14" className="hero-art__card-bg" />
        <circle cx="340" cy="120" r="6" className="hero-art__chip-dot" />
        <rect x="354" y="116" width="72" height="8" rx="4" className="hero-art__text" />
        <rect x="336" y="140" width="132" height="7" rx="3.5" className="hero-art__text hero-art__text--soft" />
        <rect x="336" y="158" width="96" height="7" rx="3.5" className="hero-art__text hero-art__text--soft" />
      </g>

      {/* Floating card: verified citation */}
      <g className="hero-art__card hero-art__float-b">
        <rect x="34" y="350" width="176" height="64" rx="14" className="hero-art__card-bg" />
        <circle cx="62" cy="382" r="13" className="hero-art__badge" />
        <path d="m56 382 4.5 4.5 8-8.5" className="hero-art__badge-check" />
        <rect x="86" y="370" width="98" height="8" rx="4" className="hero-art__text" />
        <rect x="86" y="388" width="62" height="10" rx="5" className="hero-art__pill" />
      </g>

      {/* Floating card: a tiny timeline */}
      <g className="hero-art__card hero-art__float-c">
        <rect x="300" y="404" width="172" height="62" rx="14" className="hero-art__card-bg" />
        <line x1="318" y1="435" x2="454" y2="435" className="hero-art__axis" />
        {[330, 364, 398, 432].map((x, i) => (
          <circle key={x} cx={x} cy="435" r={i === 2 ? 6 : 4.5} className="hero-art__node hero-art__node--still" />
        ))}
      </g>
    </svg>
  )
}
