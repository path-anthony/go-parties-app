import { useEffect, useState } from "react"
import { ADMIN_API } from "@/lib/adminApi"

/* The Home hero photos (Block S4): GET /api/hero, the admin's active slides
   in order (Block A6: `[{ id, url, altText, width, height }]`, WebP, cached
   a year under an id that never changes). The call that fails, answers
   nothing or answers nonsense falls back to the three photos shipped in
   public/photos/welcome, so the hero always has pictures. Asked once per
   page load and shared. */

export interface HeroSlide {
  id: string
  /* The image, and for the shipped photos a JPEG for browsers without WebP. */
  src: string
  jpg?: string
  alt: string
  width: number
  height: number
}

export const LOCAL_SLIDES: HeroSlide[] = [
  { id: "local-wedding", src: "/photos/welcome/wedding.webp", jpg: "/photos/welcome/wedding.jpg", alt: "A wedding couple sharing a quiet moment", width: 1200, height: 798 },
  { id: "local-adult-party", src: "/photos/welcome/adult-party.webp", jpg: "/photos/welcome/adult-party.jpg", alt: "A party crowd on the dance floor", width: 1200, height: 798 },
  { id: "local-corporate", src: "/photos/welcome/corporate.webp", jpg: "/photos/welcome/corporate.jpg", alt: "A corporate event audience facing the stage", width: 1200, height: 798 },
]

const str = (v: unknown): string | null => (typeof v === "string" && v.trim() !== "" ? v : null)
const num = (v: unknown, fallback: number): number => (typeof v === "number" && Number.isFinite(v) && v > 0 ? v : fallback)

/* Only https image urls are shown: a slide the admin publishes is on its own
   domain, and nothing else gets into an <img> from this feed. */
function parse(data: unknown): HeroSlide[] {
  if (!Array.isArray(data)) return []
  const out: HeroSlide[] = []
  for (const row of data) {
    const r = row as Record<string, unknown>
    const id = str(r.id)
    const src = str(r.url)
    if (!id || !src || !/^https:\/\//.test(src)) continue
    out.push({ id, src, alt: str(r.altText) ?? "", width: num(r.width, 1200), height: num(r.height, 798) })
  }
  return out
}

let cached: Promise<HeroSlide[]> | null = null

function load(): Promise<HeroSlide[]> {
  if (!cached) {
    cached = fetch(`${ADMIN_API}/api/hero`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => parse(data))
      .catch(() => [] as HeroSlide[])
      .then((slides) => {
        // A failed or empty answer is not kept, so the next page load asks again.
        if (slides.length === 0) cached = null
        return slides
      })
  }
  return cached
}

/* The slides to show: the admin's once they arrive, the shipped photos
   whenever the admin has none. While the feed is being asked there are no
   slides (the hero is charcoal under its copy for that moment), so a phone
   never downloads a shipped photo and then the admin's on top of it.
   `source` says which. */
export function useHeroSlides(): { slides: HeroSlide[]; source: "admin" | "local" | "loading" } {
  const [admin, setAdmin] = useState<HeroSlide[] | null | undefined>(undefined)
  useEffect(() => {
    let live = true
    load().then((s) => {
      if (live) setAdmin(s.length > 0 ? s : null)
    })
    return () => {
      live = false
    }
  }, [])
  if (admin === undefined) return { slides: [], source: "loading" }
  return admin ? { slides: admin, source: "admin" } : { slides: LOCAL_SLIDES, source: "local" }
}
