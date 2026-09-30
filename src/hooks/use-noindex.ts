import { useEffect } from "react"

/* Pages reached from a private link (a contract, a crew gig) must stay out of
   search engines. The X-Robots-Tag header in vercel.json is the strong
   signal; this meta tag is the belt to that brace, added while the page is
   mounted and removed after. */
export function useNoIndex() {
  useEffect(() => {
    const meta = document.createElement("meta")
    meta.name = "robots"
    meta.content = "noindex"
    document.head.appendChild(meta)
    return () => {
      meta.remove()
    }
  }, [])
}
