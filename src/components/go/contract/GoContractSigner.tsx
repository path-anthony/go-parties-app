import { useEffect, useId, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { GoContractDocument } from "@/components/go/contract/GoContractDocument"
import type { GoDocument } from "@/components/go/contract/types"
import type { SignatureValues } from "@/components/go/contract/signature"

/* The GO contract as something to sign, wherever it appears (the texted
   link, checkout, the portal): the document with the signature lines live, a
   "Jump to signature" on phones, and the one rule for when a signature is
   ready: the signature block has been scrolled into view, a printed name is
   typed, and the ESIGN box is ticked. The page owns the values (so checkout
   can keep them in its store) and the button; this reports `ready`. */

export function GoContractSigner({
  doc,
  value,
  onChange,
  busy,
  onReadyChange,
  className,
}: {
  doc: GoDocument
  value: SignatureValues
  onChange: (v: SignatureValues) => void
  busy: boolean
  onReadyChange: (ready: boolean) => void
  className?: string
}) {
  const id = useId()
  const sigId = `sig-${id.replace(/:/g, "")}`
  const [seen, setSeen] = useState(false)
  const seenRef = useRef(false)

  const reached = () => {
    if (seenRef.current) return
    seenRef.current = true
    setSeen(true)
  }

  // Once the signature block has been on screen, it counts as reached; the
  // flag never drops, so scrolling back up does not take the button away.
  // Three ways to know, so one browser quirk never leaves the button off:
  // an IntersectionObserver, a scroll and resize check of the block's own
  // position, and typing or ticking inside the block (S1.2: on the live
  // site the button stayed off for a customer who was at the block).
  useEffect(() => {
    const el = document.getElementById(sigId)
    if (!el || seenRef.current) return
    const inView = () => {
      const r = el.getBoundingClientRect()
      const vh = window.innerHeight || document.documentElement.clientHeight
      return r.top < vh - 80 && r.bottom > 80
    }
    const check = () => {
      if (inView()) reached()
    }
    const io = typeof IntersectionObserver !== "undefined" ? new IntersectionObserver((entries) => entries.some((e) => e.isIntersecting) && reached(), { threshold: 0.1 }) : null
    io?.observe(el)
    check()
    window.addEventListener("scroll", check, { passive: true })
    window.addEventListener("resize", check)
    el.addEventListener("focusin", reached)
    el.addEventListener("input", reached)
    return () => {
      io?.disconnect()
      window.removeEventListener("scroll", check)
      window.removeEventListener("resize", check)
      el.removeEventListener("focusin", reached)
      el.removeEventListener("input", reached)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sigId, doc])

  const ready = seen && value.name.trim() !== "" && value.consent && !busy
  useEffect(() => {
    onReadyChange(ready)
  }, [ready, onReadyChange])

  return (
    <div className={className}>
      <div className="mb-3 flex justify-end min-[640px]:hidden">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            document.getElementById(sigId)?.scrollIntoView({ behavior: "smooth", block: "start" })
            // Jumping there is reaching it; the scroll check backs this up.
            setTimeout(reached, 600)
          }}
        >
          Jump to signature
        </Button>
      </div>
      <GoContractDocument
        doc={doc}
        signatureId={sigId}
        live={{
          name: value.name,
          onName: (name) => onChange({ ...value, name }),
          additional: value.additional,
          onAdditional: (additional) => onChange({ ...value, additional }),
          consent: value.consent,
          onConsent: (consent) => onChange({ ...value, consent }),
          busy,
        }}
      />
      <p className="mt-3 text-small text-muted">
        {seen
          ? "Typing your name on the form is your legal signature. Tick the box above the signature lines to sign electronically."
          : "Read through to the signature lines at the bottom of the form."}
      </p>
    </div>
  )
}
