/* The brand's letterhead: the wordmark set large and spaced, a double rule,
   the place. Used by the pages reached from a text link (the contract to
   sign, the crew gig page), which carry no app header of their own. */
export function Letterhead() {
  return (
    <header className="px-5 pt-7 text-center">
      <div className="text-[19px] font-black tracking-[.22em] text-charcoal">
        <b className="text-orange">GO!</b> EVENT GROUP
      </div>
      <div className="mt-2.5 border-y-[3px] border-double border-charcoal py-1.5 text-[10.5px] font-semibold tracking-[.32em] text-taupe uppercase">
        Farmington, Connecticut
      </div>
    </header>
  )
}
