import { useEffect, useState } from "react"
import { useHeroSlides, type HeroSlide } from "@/lib/hero"
import { cn } from "@/lib/utils"

/* The Home hero (Block S4, after docs/hero-prototype.html). One photo
   across the top, from GET /api/hero (the shipped photos as the fallback),
   crossfading every 6 seconds with a slow zoom (no zoom and a quick fade
   under prefers-reduced-motion), dots to jump between photos. Over the
   photo, in order: a soft-light orange tint, a charcoal gradient (strong on
   the left and from the bottom on a desktop; from the bottom up on a
   phone), two orange slashes on the right (the catalog motif), then the
   copy bottom left and the "How do you want to plan?" switch, which picks
   the panel right under the hero. The first photo loads eagerly with high
   priority; the rest are put in the page only after it has painted.
   Desktop: full width, rounded 20px, clamp(460px, 46vw, 600px) tall.
   Phone (640px and under): edge to edge, 600px tall. */

const CROSSFADE_MS = 6000

export type Door = "build" | "shop"

const DOORS: [Door, string, string][] = [
  ["build", "Build my party", "Tell GO what you're planning"],
  ["shop", "Shop by category", "Pick items yourself"],
]

function Slide({ slide, on, first, onLoad }: { slide: HeroSlide; on: boolean; first: boolean; onLoad?: () => void }) {
  const img = (
    <img
      src={slide.jpg ?? slide.src}
      alt={on ? slide.alt : ""}
      width={slide.width}
      height={slide.height}
      loading={first ? "eager" : "lazy"}
      fetchPriority={first ? "high" : "low"}
      decoding="async"
      onLoad={onLoad}
      className="absolute inset-0 h-full w-full object-cover"
    />
  )
  return (
    <div
      aria-hidden={!on}
      className={cn(
        "absolute inset-0 transition-[opacity,transform] duration-1000 ease-out motion-reduce:duration-200 motion-reduce:transition-opacity",
        on ? "scale-100 opacity-100 [transition-duration:1s,7s] motion-reduce:[transition-duration:.2s]" : "scale-[1.04] opacity-0 motion-reduce:scale-100"
      )}
    >
      {slide.jpg ? (
        <picture>
          <source srcSet={slide.src} type="image/webp" />
          {img}
        </picture>
      ) : (
        img
      )}
    </div>
  )
}

export function Hero({ door, onDoor }: { door: Door; onDoor: (d: Door) => void }) {
  const { slides } = useHeroSlides()
  const [on, setOn] = useState(0)
  // The rest of the photos join the page once the first one has painted
  // (or after a moment, if the load event never comes).
  const [firstPainted, setFirstPainted] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setFirstPainted(true), 2500)
    return () => clearTimeout(t)
  }, [])
  useEffect(() => {
    if (slides.length < 2) return
    const id = setInterval(() => {
      if (!document.hidden) setOn((i) => (i + 1) % slides.length)
    }, CROSSFADE_MS)
    return () => clearInterval(id)
  }, [slides.length, on])
  const current = slides.length === 0 ? -1 : Math.min(on, slides.length - 1)

  return (
    <section
      aria-label="Welcome"
      className="relative isolate -mx-4 h-[600px] overflow-hidden bg-charcoal text-white min-[641px]:mx-0 min-[641px]:h-[clamp(460px,46vw,600px)] min-[641px]:rounded-[20px]"
    >
      {slides.map((s, i) =>
        i === 0 || firstPainted ? <Slide key={s.id} slide={s} on={i === current} first={i === 0} onLoad={i === 0 ? () => setFirstPainted(true) : undefined} /> : null
      )}
      {/* The tint, then the shade, then the slashes. */}
      <div aria-hidden="true" className="absolute inset-0 z-[1] bg-orange opacity-35 mix-blend-soft-light" />
      <div
        aria-hidden="true"
        className="absolute inset-0 z-[2] bg-[linear-gradient(0deg,rgba(33,29,28,.96)_0%,rgba(33,29,28,.8)_38%,rgba(33,29,28,.15)_70%,rgba(33,29,28,.05)_100%)] min-[641px]:bg-[linear-gradient(90deg,rgba(33,29,28,.92)_0%,rgba(33,29,28,.7)_34%,rgba(33,29,28,.15)_68%,rgba(33,29,28,0)_100%),linear-gradient(0deg,rgba(33,29,28,.75)_0%,rgba(33,29,28,0)_45%)]"
      />
      <div aria-hidden="true" className="pointer-events-none absolute top-[-20px] right-5 z-[3] flex h-[120px] gap-3.5 min-[641px]:right-14 min-[641px]:bottom-[-20px] min-[641px]:h-auto">
        <i className="block w-2.5 skew-x-[-18deg] bg-orange opacity-95 min-[641px]:w-4" />
        <i className="block w-1 skew-x-[-18deg] bg-orange opacity-60 min-[641px]:w-1.5" />
      </div>

      <div className="absolute right-5 bottom-6 left-5 z-[4] grid gap-3 min-[641px]:right-[20%] min-[641px]:bottom-[52px] min-[641px]:left-14 min-[641px]:gap-3.5 min-[901px]:right-[40%]">
        <small className="block text-[12px] font-bold tracking-[.16em] text-[#F7C77A] uppercase">Farmington, CT · 5.0 on Google</small>
        <h1 className="text-[36px] leading-[1.02] font-extrabold tracking-[-.025em] text-balance min-[641px]:text-[clamp(34px,5vw,60px)]">
          Parties and events, <span className="text-orange">done door to door.</span>
        </h1>
        <p className="max-w-[44ch] text-[15px] leading-[1.5] text-[#E8E1DA] min-[641px]:text-[17px]">
          Bounce houses, games, DJs, photo booths and lighting. The GO crew delivers it, sets it up and takes it down.
        </p>
        <small id="door-label" className="mt-1.5 block text-[12px] font-bold tracking-[.12em] text-[#CFC8C2] uppercase">
          How do you want to plan?
        </small>
        <div
          role="tablist"
          aria-labelledby="door-label"
          className="grid max-w-[560px] grid-cols-2 gap-1 rounded-[16px] border border-white/22 bg-white/14 p-[5px] backdrop-blur-[10px]"
        >
          {DOORS.map(([id, label, sub]) => (
            <button
              key={id}
              id={`door-${id}`}
              role="tab"
              aria-selected={door === id}
              aria-controls={`panel-${id}`}
              className={cn("grid min-h-[62px] gap-0.5 rounded-[12px] px-3 py-2.5 text-left min-[641px]:px-4 min-[641px]:py-3", door === id ? "bg-orange text-charcoal" : "text-white")}
              onClick={() => onDoor(id)}
            >
              <b className="text-[15px] min-[641px]:text-[16px]">{label}</b>
              <small className={cn("text-[12px]", door === id ? "text-[#4A2F08]" : "text-[#D9D2CC]")}>{sub}</small>
            </button>
          ))}
        </div>
      </div>

      {/* 10px dots inside 44px tap targets. */}
      {slides.length > 1 && (
        <div className="absolute top-2 left-2 z-[4] flex min-[641px]:top-auto min-[641px]:right-11 min-[641px]:bottom-11 min-[641px]:left-auto">
          {slides.map((s, i) => (
            <button key={s.id} aria-label={`Photo ${i + 1}`} aria-current={i === current} className="flex size-11 items-center justify-center" onClick={() => setOn(i)}>
              <span className={cn("block h-2.5 rounded-full transition-[width] duration-300", i === current ? "w-[30px] bg-white" : "w-2.5 bg-white/45")} />
            </button>
          ))}
        </div>
      )}
    </section>
  )
}
