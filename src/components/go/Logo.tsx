import { Link } from "react-router-dom"

/* GO's badge: the round logo (public/brand/go-logo.png, 193 x 193, the same
   file the admin and the contract page use), 40px, linking to Home. On a
   desktop the wordmark text follows it; on a phone the badge stands alone. */
export function Logo({ text = true }: { text?: boolean }) {
  return (
    <Link to="/" aria-label="GO Event Group, home" className="flex min-h-[44px] items-center gap-2.5 no-underline">
      <img src="/brand/go-logo.png" alt="" width={40} height={40} className="size-10 flex-none rounded-full" />
      {text && (
        <span className="hidden text-[14px] font-black tracking-[.1em] whitespace-nowrap text-charcoal min-[641px]:inline">
          <b className="text-orange">GO!</b> EVENT GROUP
        </span>
      )}
    </Link>
  )
}
