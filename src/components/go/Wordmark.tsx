/* Wordmark. BRAND.md section 2: orange GO!, charcoal EVENT GROUP. */
export function Wordmark({ onClick }: { onClick?: () => void }) {
  return (
    <span className="cursor-pointer text-sm font-black tracking-[.08em] text-charcoal" onClick={onClick}>
      <b className="text-orange">GO!</b> EVENT GROUP
    </span>
  )
}
