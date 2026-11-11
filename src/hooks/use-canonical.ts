import { useEffect } from "react"
import { useLocation } from "react-router-dom"

/* The page's own address for search engines (Block D1). index.html carries
   the site's root as the default, which is right for a crawler that does not
   run scripts; this keeps the tag in step with the route so /browse is not
   reported as a copy of the home page. Always the public domain, never the
   address the page happened to be opened on (the old Vercel address, a
   preview). The home page has two paths and one canonical. Pages reached
   from a private link (a contract, a crew gig) point at the root, so a
   token never lands in a tag. */
export const SITE_ORIGIN = "https://parties.thegoeventgroup.com"

export function canonicalFor(pathname: string): string {
  if (pathname === "/" || pathname === "/home") return `${SITE_ORIGIN}/`
  if (pathname.startsWith("/sign/") || pathname.startsWith("/bid/")) return `${SITE_ORIGIN}/`
  return `${SITE_ORIGIN}${pathname.replace(/\/+$/, "")}`
}

export function useCanonical() {
  const { pathname } = useLocation()
  useEffect(() => {
    const href = canonicalFor(pathname)
    let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    if (!link) {
      link = document.createElement("link")
      link.rel = "canonical"
      document.head.appendChild(link)
    }
    link.href = href
    const og = document.head.querySelector<HTMLMetaElement>('meta[property="og:url"]')
    if (og) og.content = href
  }, [pathname])
}
