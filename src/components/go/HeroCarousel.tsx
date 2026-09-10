import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel"
import { SCRIM } from "@/components/go/PhotoPlate"

/* Welcome hero carousel. Real photos replace the placeholder plate: BRAND.md
   section 6's "Photo treatment" (bottom gradient to charcoal at 72%) is all
   that carries over, not the placeholder-only corner marks, texture, or spec
   line. Auto-advances, pauses while the user is dragging, dot indicators. */

interface Slide {
  src: string
  alt: string
  position?: string
}

const AUTOPLAY_MS = 4500

export function HeroCarousel({
  slides,
  eyebrow,
  title,
}: {
  slides: Slide[]
  eyebrow?: string
  title?: string
}) {
  const [api, setApi] = useState<CarouselApi>()
  const [selected, setSelected] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (!api) return
    const onSelect = () => setSelected(api.selectedScrollSnap())
    onSelect()
    api.on("select", onSelect)
    return () => {
      api.off("select", onSelect)
    }
  }, [api])

  useEffect(() => {
    if (!api) return
    const onDown = () => setPaused(true)
    const onUp = () => setPaused(false)
    api.on("pointerDown", onDown)
    api.on("pointerUp", onUp)
    return () => {
      api.off("pointerDown", onDown)
      api.off("pointerUp", onUp)
    }
  }, [api])

  useEffect(() => {
    if (!api || paused) return
    const id = setInterval(() => {
      if (api.canScrollNext()) api.scrollNext()
      else api.scrollTo(0)
    }, AUTOPLAY_MS)
    return () => clearInterval(id)
  }, [api, paused])

  return (
    <div className="relative aspect-[4/5] overflow-hidden rounded-[14px]">
      <Carousel setApi={setApi} className="h-full">
        <CarouselContent className="ml-0 h-full">
          {slides.map((s) => (
            <CarouselItem key={s.src} className="h-full pl-0">
              <img src={s.src} alt={s.alt} className="h-full w-full object-cover" style={{ objectPosition: s.position ?? "center" }} />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
      <div className="pointer-events-none absolute inset-0" style={{ background: SCRIM }} />
      <div className="pointer-events-none absolute right-3.5 bottom-3.5 left-3.5 text-white">
        <div className="mb-2 flex gap-1.5">
          {slides.map((s, i) => (
            <span key={s.src} className={cn("h-1.5 rounded-full transition-all duration-300", i === selected ? "w-4 bg-white" : "w-1.5 bg-white/40")} />
          ))}
        </div>
        {eyebrow && <small className="mb-[3px] block text-[10px] font-bold tracking-[.14em] opacity-80">{eyebrow}</small>}
        {title && <b className="block text-lg leading-[1.1] font-black">{title}</b>}
      </div>
    </div>
  )
}
