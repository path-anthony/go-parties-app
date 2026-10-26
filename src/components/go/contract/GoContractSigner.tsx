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

  // Once the signature block has been on screen, it counts as reached; the
  // flag never drops, so scrolling back up does not take the button away.
  useEffect(() => {
    const el = document.getElementById(sigId)
    if (!el || seenRef.current) return
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          seenRef.current = true
          setSeen(true)
          io.disconnect()
        }
      },
      { threshold: 0.2 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [sigId, doc])

  const ready = seen && value.name.trim() !== "" && value.consent && !busy
  useEffect(() => {
    onReadyChange(ready)
  }, [ready, onReadyChange])

  return (
    <div className={className}>
      <div className="mb-3 flex justify-end min-[640px]:hidden">
        <Button type="button" variant="ghost" size="sm" onClick={() => document.getElementById(sigId)?.scrollIntoView({ behavior: "smooth", block: "start" })}>
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
