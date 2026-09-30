import { useState } from "react"
import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { GoLabel } from "@/components/go/GoLabel"
import { GigFacts } from "@/components/go/bid/GigFacts"
import { easternWhen, usPhone } from "@/components/go/bid/format"
import { askQuestion, confirmSet, type BidGig } from "@/lib/bidApi"

/* After the bid is accepted, the same link is the gig page: the full address,
   arrival notes, a number to call, "I'm set" to confirm, and a short question
   box with what has been asked. Every optional line is left out when the
   admin has nothing for it. Reminder texts land here. */

const QUESTION_MAX = 500

const card = "rounded-[14px] border border-line bg-white px-4 py-3.5"

export function GigPage({ token, gig, onGig }: { token: string; gig: BidGig; onGig: (g: BidGig) => void }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [text, setText] = useState("")
  const [asking, setAsking] = useState(false)
  const [askError, setAskError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  const confirmed = easternWhen(gig.confirmedAt)

  const imSet = async () => {
    setBusy(true)
    setError(null)
    const result = await confirmSet(token)
    setBusy(false)
    if (result.ok) onGig({ ...gig, confirmedAt: result.data.confirmedAt })
    else setError(result.message)
  }

  const ask = async () => {
    const q = text.trim()
    if (!q || asking) return
    setAsking(true)
    setAskError(null)
    setSent(false)
    const result = await askQuestion(token, q)
    setAsking(false)
    if (result.ok) {
      onGig({ ...gig, questions: [...gig.questions, { text: q, createdAt: new Date().toISOString() }] })
      setText("")
      setSent(true)
    } else {
      setAskError(result.message)
    }
  }

  return (
    <>
      <div className="mb-3.5 flex size-12 items-center justify-center rounded-full bg-orange-tint">
        <Check className="size-6 stroke-orange" strokeWidth={2.5} />
      </div>
      <p className="mb-4 text-body text-charcoal-soft">{gig.crewFirstName ? `${gig.crewFirstName}, you're on this one.` : "You're on this one."}</p>
      <GigFacts gig={gig} />

      {(gig.address || gig.arrivalNotes || gig.contactPhone) && (
        <div className={`mt-2 ${card}`}>
          {gig.address && (
            <div className="border-b border-line pb-3 last:border-b-0 last:pb-0">
              <div className="text-[10.5px] font-bold tracking-[.1em] text-taupe uppercase">Address</div>
              <div className="mt-[3px] text-sm font-bold whitespace-pre-line text-charcoal">{gig.address}</div>
            </div>
          )}
          {gig.arrivalNotes && (
            <div className={`${gig.address ? "pt-3" : ""} ${gig.contactPhone ? "border-b border-line pb-3" : ""}`}>
              <div className="text-[10.5px] font-bold tracking-[.1em] text-taupe uppercase">Arrival</div>
              <div className="mt-[3px] text-sm whitespace-pre-line text-charcoal">{gig.arrivalNotes}</div>
            </div>
          )}
          {gig.contactPhone && (
            <div className={gig.address || gig.arrivalNotes ? "pt-3" : ""}>
              <div className="text-[10.5px] font-bold tracking-[.1em] text-taupe uppercase">Day-of contact</div>
              <a href={`tel:${gig.contactPhone}`} className="-my-1 mt-0.5 inline-block py-2.5 text-sm font-bold text-charcoal underline">
                {usPhone(gig.contactPhone)}
              </a>
            </div>
          )}
        </div>
      )}

      <div className="mt-3.5">
        {confirmed ? (
          <div className={`${card} text-sm text-charcoal`}>
            <b>You're set.</b> Confirmed {confirmed}.
          </div>
        ) : (
          <>
            <Button className="w-full" disabled={busy} onClick={imSet}>
              {busy ? "Sending" : "I'm set"}
            </Button>
            {error && (
              <div role="alert" className={`mt-3 ${card} text-sm text-charcoal`}>
                {error}
              </div>
            )}
          </>
        )}
      </div>

      <form
        className="mt-6"
        onSubmit={(e) => {
          e.preventDefault()
          ask()
        }}
      >
        <GoLabel className="mb-1.5 tracking-[.1em]">Questions</GoLabel>
        <label htmlFor="gig-question" className="block text-sm font-bold text-charcoal">
          Something to ask us?
        </label>
        <textarea
          id="gig-question"
          rows={3}
          maxLength={QUESTION_MAX}
          className="mt-1.5 w-full resize-none rounded-[12px] border-[1.5px] border-line bg-white px-3.5 py-3 text-[15px] text-charcoal transition-colors outline-none placeholder:text-muted focus:border-charcoal"
          placeholder="Parking, power, timing"
          value={text}
          onChange={(e) => {
            setText(e.target.value.slice(0, QUESTION_MAX))
            setSent(false)
          }}
        />
        <p className="mt-1 text-right text-small text-muted">
          {text.length} of {QUESTION_MAX}
        </p>
        {askError && (
          <div role="alert" className={`mt-2 ${card} text-sm text-charcoal`}>
            {askError}
          </div>
        )}
        {sent && <p className="mt-2 text-small text-charcoal-soft">Sent. GO will call or text you back.</p>}
        <Button type="submit" variant="ghost" className="mt-2.5 w-full" disabled={!text.trim() || asking}>
          {asking ? "Sending" : "Send question"}
        </Button>

        {gig.questions.length > 0 && (
          <ul className="mt-4 space-y-2">
            {gig.questions.map((q, i) => (
              <li key={`${q.createdAt}-${i}`} className={card}>
                <p className="text-sm whitespace-pre-line text-charcoal">{q.text}</p>
                <p className="mt-1 text-small text-muted">{easternWhen(q.createdAt)}</p>
              </li>
            ))}
          </ul>
        )}
      </form>
    </>
  )
}
