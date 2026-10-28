import { useCallback, useEffect, useState } from "react"
import { Navigate, useNavigate, useParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { AppShell, Body, Foot } from "@/components/go/AppShell"
import { GoLabel } from "@/components/go/GoLabel"
import { MetaCard } from "@/components/go/MetaCard"
import { GoContractDocument } from "@/components/go/contract/GoContractDocument"
import { GoContractSigner } from "@/components/go/contract/GoContractSigner"
import { EMPTY_SIGNATURE, type SignatureValues } from "@/components/go/contract/signature"
import type { GoDocument } from "@/components/go/contract/types"
import { customerApi, type CustomerContract } from "@/lib/customerApi"
import { useCustomer } from "@/state/customer"

/* The customer's contract, inside the portal: the same GO document and the
   same signing rule as the texted link, behind the customer's session
   instead of a token. Unsigned, it is signed here; signed, it is shown as
   signed with the PDF. An older contract without the GO format shows its
   text with the two original checkboxes. */

const signedWhen = (iso: string) => {
  try {
    return new Date(iso).toLocaleString("en-US", { year: "numeric", month: "long", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "America/New_York", timeZoneName: "short" })
  } catch {
    return iso
  }
}

/* Keyed by booking, so one contract's signed state never carries over to
   another booking's page. */
export default function PartyContract() {
  const { id = "" } = useParams()
  return <PartyContractFor key={id} id={id} />
}

function PartyContractFor({ id }: { id: string }) {
  const navigate = useNavigate()
  const { customer, ready } = useCustomer()
  const [state, setState] = useState<{ kind: "loading" } | { kind: "ok"; contract: CustomerContract } | { kind: "error"; message: string }>({ kind: "loading" })
  const [sig, setSig] = useState<SignatureValues>(EMPTY_SIGNATURE)
  const [consent, setConsent] = useState(false)
  const [terms, setTerms] = useState(false)
  const [sigReady, setSigReady] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<{ status: number; message: string } | null>(null)
  const [done, setDone] = useState<{ signedName: string; signedAt: string; pdfUrl: string } | null>(null)

  const fetchIt = useCallback(() => customerApi.contract(id).then((r) => setState(r.ok ? { kind: "ok", contract: r.data } : { kind: "error", message: r.message })), [id])
  const load = useCallback(() => {
    setState({ kind: "loading" })
    void fetchIt()
  }, [fetchIt])

  useEffect(() => {
    if (customer) void fetchIt()
  }, [customer, fetchIt])

  if (ready && !customer) return <Navigate to="/party/signin" replace />

  const sign = async () => {
    if (state.kind !== "ok") return
    const c = state.contract
    const isGo = c.format === "go-v2" && !!c.document
    if (isGo ? !sigReady : !(sig.name.trim() && consent && terms)) return
    setBusy(true)
    setError(null)
    const additional = sig.additional.trim()
    const r = await customerApi.sign(id, {
      fullName: sig.name.trim(),
      ...(additional ? { additionalSignerName: additional } : {}),
      esignConsent: isGo ? sig.consent : consent,
      consentToElectronicSignature: isGo ? sig.consent : consent,
      agreeToTerms: isGo ? true : terms,
      ...(c.contentHash ? { contentHash: c.contentHash } : {}),
    })
    setBusy(false)
    if (r.ok) setDone({ signedName: r.data.signedName, signedAt: r.data.signedAt, pdfUrl: r.data.pdfUrl })
    else setError({ status: r.status, message: r.message })
  }

  let body: React.ReactNode
  let foot: React.ReactNode = <Button variant="ghost" onClick={() => navigate("/party")}>Back</Button>

  if (state.kind === "loading") {
    body = <p className="mt-2 text-body text-muted">Opening your contract.</p>
  } else if (state.kind === "error") {
    body = (
      <div className="mt-3.5 rounded-[14px] border border-line bg-white px-4 py-3.5 text-sm text-charcoal">
        {state.message}
        <Button variant="ghost" size="sm" className="mt-2.5 block" onClick={load}>
          Try again
        </Button>
      </div>
    )
  } else {
    const c = state.contract
    const signedNow = done ?? (c.signed && c.signedName && c.signedAt ? { signedName: c.signedName, signedAt: c.signedAt, pdfUrl: c.pdfUrl ?? "" } : null)
    if (signedNow) {
      const additional = sig.additional.trim()
      const doc: GoDocument | null =
        c.format === "go-v2" && c.document
          ? done
            ? { ...c.document, signatures: { ...c.document.signatures, client: { printedName: done.signedName, signedAt: done.signedAt }, additional: additional ? { printedName: additional, signedAt: done.signedAt } : c.document.signatures.additional } }
            : c.document
          : null
      body = (
        <>
          <div className="text-center"><span className="mx-auto mb-3.5 inline-block rounded-full bg-orange-tint px-3 py-1 text-[11px] font-bold tracking-[.14em] text-charcoal uppercase">Signed</span></div>
          <h1 className="text-center text-hero text-charcoal">{done ? "Signed. Thank you." : "Signed."}</h1>
          <p className="mt-2 text-center text-body text-charcoal-soft">{done ? "Your contract is signed and on file. The retainer is the next step." : "This contract is signed and on file."}</p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <MetaCard label="Signed by" value={signedNow.signedName} />
            <MetaCard label="Signed" value={signedWhen(signedNow.signedAt)} />
          </div>
          {signedNow.pdfUrl.startsWith("https://") && (
            <Button asChild className="mt-4 w-full">
              <a href={signedNow.pdfUrl} target="_blank" rel="noopener noreferrer">
                Open your signed contract (PDF)
              </a>
            </Button>
          )}
          {doc ? <GoContractDocument doc={doc} className="mt-5" /> : c.text ? <p className="mt-5 whitespace-pre-line text-[14.5px] leading-relaxed text-charcoal">{c.text}</p> : null}
        </>
      )
      foot = <Button onClick={() => navigate("/party")}>Back to My party</Button>
    } else if (c.format === "go-v2" && c.document) {
      body = (
        <>
          <h1 className="mt-1.5 text-hero text-charcoal">Your contract</h1>
          <p className="mt-2 text-body text-charcoal-soft">Read it all the way through, then sign on the form.</p>
          <GoContractSigner doc={c.document} value={sig} onChange={setSig} busy={busy} onReadyChange={setSigReady} className="mt-4" />
          {error && (
            <div role="alert" className="mt-3 rounded-[14px] border border-line bg-white px-4 py-3.5 text-sm text-charcoal">
              {error.message}
              {error.status === 409 && (
                <Button variant="ghost" size="sm" className="mt-2.5 block" onClick={load}>
                  Refresh this page
                </Button>
              )}
            </div>
          )}
        </>
      )
      foot = (
        <>
          <Button variant="ghost" disabled={busy} onClick={() => navigate("/party")}>
            Back
          </Button>
          <Button disabled={!sigReady || busy} onClick={sign}>
            {busy ? "Signing" : "Sign contract"}
          </Button>
        </>
      )
    } else {
      // The original sections layout: the text, a typed name, two boxes.
      const ok = sig.name.trim() !== "" && consent && terms && !busy
      body = (
        <>
          <h1 className="mt-1.5 text-hero text-charcoal">{c.title}</h1>
          <div className="mt-4 rounded-[14px] border border-line bg-white px-4 py-4">
            {(c.sections ?? []).length > 0 ? (
              (c.sections ?? []).map((s, i) => (
                <section key={s.heading} className="mt-5 first:mt-0">
                  <h2 className="border-b border-charcoal pb-1.5 text-[13px] font-bold tracking-[.14em] uppercase">{i + 1}. {s.heading}</h2>
                  <p className="mt-2.5 whitespace-pre-line text-[14.5px] leading-relaxed text-charcoal">{s.body}</p>
                </section>
              ))
            ) : (
              <p className="whitespace-pre-line text-[14.5px] leading-relaxed text-charcoal">{c.text}</p>
            )}
          </div>
          <label htmlFor="party-sign-name" className="mt-4 block text-sm font-bold text-charcoal">Your full name</label>
          <input id="party-sign-name" className="mt-1.5 w-full rounded-[12px] border-[1.5px] border-line bg-white px-3.5 py-[15px] text-[15px] text-charcoal outline-none focus:border-charcoal" autoComplete="name" placeholder="First and last name" value={sig.name} onChange={(e) => setSig({ ...sig, name: e.target.value })} />
          <label className="mt-4 flex cursor-pointer items-start gap-3 text-sm text-charcoal">
            <input type="checkbox" className="mt-0.5 size-5 flex-none accent-charcoal" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
            <span>{c.consentText ?? "I consent to sign this contract electronically, and I understand my typed name is my legal signature."}</span>
          </label>
          <label className="mt-3 flex cursor-pointer items-start gap-3 text-sm text-charcoal">
            <input type="checkbox" className="mt-0.5 size-5 flex-none accent-charcoal" checked={terms} onChange={(e) => setTerms(e.target.checked)} />
            <span>{c.termsText ?? "I have read this contract and agree to its terms."}</span>
          </label>
          {error && (
            <div role="alert" className="mt-3 rounded-[14px] border border-line bg-white px-4 py-3.5 text-sm text-charcoal">
              {error.message}
            </div>
          )}
        </>
      )
      foot = (
        <>
          <Button variant="ghost" disabled={busy} onClick={() => navigate("/party")}>
            Back
          </Button>
          <Button disabled={!ok} onClick={sign}>
            {busy ? "Signing" : "Sign contract"}
          </Button>
        </>
      )
    }
  }

  return (
    <AppShell wide>
      <Body>
        <GoLabel>Contract</GoLabel>
        {body}
      </Body>
      <Foot>{foot}</Foot>
    </AppShell>
  )
}
