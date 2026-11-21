// The app's logo: a shield (trust) with a magnifying glass (investigation).
// Colours come from brand.css, so it follows the light and dark themes.

export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg className="logo-mark" width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <path className="logo-mark__shield" d="M16 2.5 27 6.6v8.2c0 7.2-4.6 12.6-11 14.7C9.6 27.4 5 22 5 14.8V6.6L16 2.5Z" />
      <circle className="logo-mark__lens" cx="14.5" cy="14.5" r="4.6" />
      <path className="logo-mark__handle" d="m18 18 3.6 3.6" />
    </svg>
  )
}

export function Logo() {
  return (
    <span className="logo">
      <LogoMark />
      <span className="logo__text">Audit Agent</span>
    </span>
  )
}
