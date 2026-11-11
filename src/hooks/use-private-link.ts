import { useEffect } from "react"

/* A page reached from a private link (the pay link) keeps its token to
   itself: out of search engines, and out of any request this page makes to
   another site. vercel.json sends the same two signals as headers; these
   tags are the belt to that brace, added while the page is mounted. The
   referrer is "origin", not "no-referrer": Stripe's form gets the site and
   never the address with the token in it. */
export function usePrivateLink() {
  useEffect(() => {
    const robots = document.createElement("meta")
    robots.name = "robots"
    robots.content = "noindex"
    const referrer = document.createElement("meta")
    referrer.name = "referrer"
    referrer.content = "origin"
    document.head.append(robots, referrer)
    return () => {
      robots.remove()
      referrer.remove()
    }
  }, [])
}
