import { useRef } from "react"
import type { LatLng } from "@/lib/maps"

/* Dev-only stand-in for the Google map, loaded lazily behind the checkout
   mock. A map plate (grid, one road) that is about 700 m wide, with the pin
   draggable across it by pointer, so the far-from-the-address line can be
   seen without a key. Not for production builds. */

const WIDTH_M = 700
const M_PER_DEG_LAT = 111_320
/* Height over width of the plate the parent draws (16/11 in checkout, 16/9 on the portal card; the pin is read-only there). */
const ASPECT = 11 / 16

export function SetupMapMock({ address, setup, onSetup, readOnly }: { address: LatLng; setup: LatLng; onSetup?: (p: LatLng) => void; readOnly?: boolean }) {
  const box = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)
  const mPerDegLng = M_PER_DEG_LAT * Math.cos((address.lat * Math.PI) / 180)

  // Percent of the plate, from meters; the plate's height follows its width
  // through the parent's aspect ratio, so no measuring during render.
  const toPct = (p: LatLng) => {
    const x = 50 + (((p.lng - address.lng) * mPerDegLng) / WIDTH_M) * 100
    const y = 50 - (((p.lat - address.lat) * M_PER_DEG_LAT) / (WIDTH_M * ASPECT)) * 100
    return { x: Math.max(2, Math.min(98, x)), y: Math.max(4, Math.min(96, y)) }
  }
  const fromPointer = (e: React.PointerEvent): LatLng => {
    const r = box.current!.getBoundingClientRect()
    const mPerPx = WIDTH_M / r.width
    const dx = (e.clientX - r.left - r.width / 2) * mPerPx
    const dy = (r.top + r.height / 2 - e.clientY) * mPerPx
    return { lat: address.lat + dy / M_PER_DEG_LAT, lng: address.lng + dx / mPerDegLng }
  }
  const at = toPct(setup)

  return (
    <div
      ref={box}
      data-testid="mock-map"
      className="absolute inset-0 touch-none select-none"
      style={{
        backgroundImage:
          "linear-gradient(90deg,transparent 0 31px,#E8E2D9 31px 32px),linear-gradient(0deg,transparent 0 31px,#E8E2D9 31px 32px)",
        backgroundSize: "32px 32px",
      }}
      onPointerDown={(e) => {
        if (readOnly || !onSetup) return
        dragging.current = true
        try {
          box.current?.setPointerCapture(e.pointerId)
        } catch {
          /* a synthetic pointer has nothing to capture */
        }
        onSetup(fromPointer(e))
      }}
      onPointerMove={(e) => {
        if (readOnly || !onSetup || !dragging.current) return
        onSetup(fromPointer(e))
      }}
      onPointerUp={() => {
        dragging.current = false
      }}
      onPointerCancel={() => {
        dragging.current = false
      }}
    >
      <div className="absolute top-1/2 -right-[10%] -left-[10%] h-3.5 -rotate-12 border-y border-line bg-white" />
      <div className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${at.x}%`, top: `${at.y}%` }}>
        <span className="block size-5 rounded-full border-[3px] border-white bg-orange shadow-float" />
      </div>
      <span className="absolute bottom-2.5 left-3 text-[9px] font-bold tracking-[.14em] text-muted">MAP · LOCAL MOCK · {readOnly ? "SETUP PIN" : "DRAG THE PIN"}</span>
    </div>
  )
}
