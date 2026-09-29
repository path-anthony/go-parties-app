import { useCallback, useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AppShell, Body } from "@/components/go/AppShell"
import { GoLabel } from "@/components/go/GoLabel"
import { MetaCard } from "@/components/go/MetaCard"
import { loadContract, signContract, type ContractLoad, type Signed, type UnsignedContract } from "@/lib/contractApi"

/* /sign/:token, the hosted contract. Reached only from the texted or emailed
   link, so it stands alone: the wordmark and nothing to wander off with (no
   menu, no tab bar), and none of the checkout's steps. The contract is read
   in full first (its sections, the way a document reads), then signed: a
   typed full name is the signature, and two separate checkboxes, one for
   signing electronically and one for the terms, are both required. The
   button waits for the name and both boxes; the admin's own refusals still
   show inline, in words for the customer, because the client's checks are a
   courtesy and the server is the authority. The hash of the text shown goes
   back with the signature so a contract that changed in between is refused. */

const usd = (n: number | null) => (n === null ? "To be confirmed" : "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }))

/* "2026-10-10" to "Saturday, October 10, 2026". */
const longDate = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number)
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })
}

/* A signature is dated to the minute, with the zone the business keeps.
   dateStyle and timeZoneName can't be combined, so the parts are spelled out;
   and a formatting failure must never blank a legal page, so it falls back
   to the raw timestamp. */
const signedWhen = (iso: string) => {
  try {
    return new Date(iso).toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZone: "America/New_York",
      timeZoneName: "short",
    })
  } catch {
    return iso
  }
}

function Notice({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <AppShell bare>
      <Body>
        <h1 className="text-hero text-charcoal">{title}</h1>
        {children && <div className="mt-2 text-body text-charcoal-soft">{children}</div>}
      </Body>
    </AppShell>
  )
}

function SignedView({ title, signed, fresh }: { title: string; signed: Signed; fresh: boolean }) {
  return (
    <AppShell bare>
      <Body>
        <div className="mx-auto mb-3.5 flex size-16 items-center justify-center rounded-full bg-orange-tint">
          <Check className="size-[30px] stroke-orange" strokeWidth={2.5} />
        </div>
        <h1 className="text-center text-hero text-charcoal">{fresh ? "Signed. Thank you." : "Already signed."}</h1>
        <p className="mt-2 text-center text-body text-charcoal-soft">
          {fresh ? `Your ${title.toLowerCase()} is signed and on file. Nothing more to do here.` : `This ${title.toLowerCase()} is signed. There is nothing more to do here.`}
        </p>
        <div className="mt-5 grid grid-cols-2 gap-2">
          <MetaCard label="Signed by" value={signed.signedName} />
          <MetaCard label="Signed" value={signedWhen(signed.signedAt)} />
        </div>
        <Button asChild className="mt-4 w-full">
          <a href={signed.pdfUrl} target="_blank" rel="noopener noreferrer">
            Open your signed contract (PDF)
          </a>
        </Button>
      </Body>
    </AppShell>
  )
}

function Contract({ contract, token, onStale }: { contract: UnsignedContract; token: string; onStale: () => void }) {
  const [name, setName] = useState("")
  const [consent, setConsent] = useState(false)
  const [terms, setTerms] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<{ status: number; reason: string; message: string } | null>(null)
  const [done, setDone] = useState<Signed | null>(null)

  if (done) return <SignedView title={contract.title} signed={done} fresh />

  const ready = name.trim() !== "" && consent && terms && !busy
  const sections = contract.sections?.length ? contract.sections : null

  const submit = async () => {
    if (!ready) return
    setBusy(true)
    setError(null)
    const result = await signContract(token, {
      fullName: name.trim(),
      consentToElectronicSignature: consent,
      agreeToTerms: terms,
      contentHash: contract.contentHash,
    })
    setBusy(false)
    if (result.ok) setDone(result.signed)
    else setError({ status: result.status, reason: result.reason, message: result.message })
  }

  return (
    <AppShell bare>
      <Body>
        <GoLabel>Contract</GoLabel>
        <h1 className="mt-1.5 text-hero text-charcoal">{contract.title}</h1>
        <p className="mt-2 text-body text-charcoal-soft">Please read this agreement all the way through, then sign at the bottom.</p>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <MetaCard label="When" value={`${longDate(contract.eventDate)}${contract.eventTime ? `, ${contract.eventTime}` : ""}`} />
          <MetaCard label="Where" value={contract.address ?? "To be confirmed"} />
        </div>

        <div className="mt-2 rounded-[14px] border border-line bg-white px-4 py-3.5">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-sm text-charcoal-soft">Total</span>
            <b className="text-[22px] font-extrabold text-charcoal">{usd(contract.total)}</b>
          </div>
          <div className="mt-2.5 flex items-baseline justify-between gap-3 border-t border-line pt-2.5 text-sm text-charcoal">
            <span>Deposit ({contract.depositPercentage}%), due to hold the date</span>
            <b>{usd(contract.depositAmount)}</b>
          </div>
          <div className="mt-1.5 flex items-baseline justify-between gap-3 text-sm text-charcoal">
            <span>Remaining balance</span>
            <b>{usd(contract.balanceAmount)}</b>
          </div>
        </div>

        <div className="mt-2.5 rounded-[14px] border border-line bg-white px-4 py-4">
          {sections ? (
            sections.map((s) => (
              <section key={s.heading} className="mt-5 first:mt-0">
                <h2 className="text-[11px] font-bold tracking-[.1em] text-taupe uppercase">{s.heading}</h2>
                <p className="mt-1.5 whitespace-pre-line text-[14.5px] leading-relaxed text-charcoal">{s.body}</p>
              </section>
            ))
          ) : (
            <p className="whitespace-pre-line text-[14.5px] leading-relaxed text-charcoal">{contract.text}</p>
          )}
        </div>

        <form
          className="mt-4"
          onSubmit={(e) => {
            e.preventDefault()
            submit()
          }}
        >
          <GoLabel className="mb-1.5 tracking-[.1em]">Sign</GoLabel>
          <label htmlFor="sign-name" className="block text-sm font-bold text-charcoal">Your full name</label>
          <Input
            id="sign-name"
            className="mt-1.5"
            placeholder="First and last name"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <p className="mt-1.5 text-small text-muted">Typing your name here is your legal signature.</p>

          <label className="mt-4 flex cursor-pointer items-start gap-3 text-sm text-charcoal">
            <input type="checkbox" className="mt-0.5 size-5 flex-none cursor-pointer accent-charcoal" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
            <span>{contract.consentText}</span>
          </label>
          <label className="mt-3 flex cursor-pointer items-start gap-3 text-sm text-charcoal">
            <input type="checkbox" className="mt-0.5 size-5 flex-none cursor-pointer accent-charcoal" checked={terms} onChange={(e) => setTerms(e.target.checked)} />
            <span>{contract.termsText}</span>
          </label>

          {error && (
            <div role="alert" className="mt-4 rounded-[14px] border border-line bg-white px-4 py-3.5 text-sm text-charcoal">
              {error.message}
              {error.status === 409 && (
                <Button type="button" variant="ghost" size="sm" className="mt-2.5 block" onClick={onStale}>
                  Refresh this page
                </Button>
              )}
            </div>
          )}

          <Button type="submit" className="mt-4 w-full" disabled={!ready}>
            {busy ? "Signing" : "Sign contract"}
          </Button>
        </form>
      </Body>
    </AppShell>
  )
}

export default function Sign() {
  const { token = "" } = useParams()
  const [state, setState] = useState<ContractLoad | null>(null)
  const [round, setRound] = useState(0)

  const load = useCallback(() => {
    setState(null)
    setRound((n) => n + 1)
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    loadContract(token, controller.signal)
      .then(setState)
      .catch(() => {})
    return () => controller.abort()
  }, [token, round])

  if (!state) {
    return (
      <AppShell bare>
        <Body>
          <GoLabel>Contract</GoLabel>
          <p className="mt-2 text-body text-muted">Opening your contract.</p>
        </Body>
      </AppShell>
    )
  }
  if (state.kind === "invalid") {
    return <Notice title="This link isn't valid.">Check the link in your text message, or text us and we'll send you a fresh one.</Notice>
  }
  if (state.kind === "error") {
    return (
      <Notice title="We couldn't open it.">
        {state.message}
        <Button variant="ghost" size="sm" className="mt-3 block" onClick={load}>
          Try again
        </Button>
      </Notice>
    )
  }
  if (state.kind === "signed") return <SignedView title={state.contract.title} signed={state.contract} fresh={false} />
  return <Contract contract={state.contract} token={token} onStale={load} />
}
