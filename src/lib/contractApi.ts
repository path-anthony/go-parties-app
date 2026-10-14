import { ADMIN_API } from "@/lib/adminApi"
import { parseGoDocument, type GoDocument } from "@/components/go/contract/types"

/* The hosted contract, by its unguessable token. Public on the admin side (no
   session); reached from a texted link. GET returns the contract to read (or
   the signed record); POST signs it. */

export interface ContractSection {
  heading: string
  body: string
}

export interface UnsignedContract {
  signed: false
  title: string
  customerName: string
  eventDate: string
  eventTime: string | null
  address: string | null
  total: number | null
  depositPercentage: number
  depositAmount: number | null
  balanceAmount: number | null
  sections: ContractSection[]
  text: string
  /* Identifies exactly the text shown; sent back so a contract that changed
     between viewing and signing is refused, not signed. */
  contentHash: string
  consentText: string
  termsText: string
  /* The GO form itself, when the agreement uses the new template. Absent on
     older agreements, which keep the section layout. */
  format?: "go-v2"
  document?: GoDocument
}

export interface SignedContract {
  signed: true
  title: string
  signedName: string
  signedAt: string
  pdfUrl: string
  format?: "go-v2"
  document?: GoDocument
}

/* Keeps the document only when the admin says it is the GO form. */
function withDocument<T extends { format?: "go-v2"; document?: GoDocument }>(data: Record<string, unknown>, base: T): T {
  if (data.format !== "go-v2") return base
  const document = parseGoDocument(data.document)
  return document ? { ...base, format: "go-v2", document } : base
}

export type ContractLoad =
  | { kind: "unsigned"; contract: UnsignedContract }
  | { kind: "signed"; contract: SignedContract }
  | { kind: "invalid" }
  | { kind: "error"; message: string }

const FALLBACK = "That didn't go through. Try again, or text us."

export async function loadContract(token: string, signal?: AbortSignal): Promise<ContractLoad> {
  if (import.meta.env.DEV && token.startsWith("mock-")) {
    return (await import("./contractMock")).mockLoad(token)
  }
  try {
    const res = await fetch(`${ADMIN_API}/api/contracts/${encodeURIComponent(token)}`, { signal })
    if (res.status === 404) return { kind: "invalid" }
    const data = await res.json().catch(() => null)
    if (res.ok && data?.signed === true) return { kind: "signed", contract: withDocument(data, data as SignedContract) }
    if (res.ok && data?.signed === false) return { kind: "unsigned", contract: withDocument(data, data as UnsignedContract) }
    // A 409 here is the admin's own no-policy state: the contract can't be
    // built yet. It is said plainly, not as a generic failure.
    if (res.status === 409 && data?.reason === "no-policy") {
      return { kind: "error", message: "This contract isn't ready yet. Please text us and we'll sort it out." }
    }
    return { kind: "error", message: FALLBACK }
  } catch (err) {
    if ((err as { name?: string }).name === "AbortError") throw err
    return { kind: "error", message: FALLBACK }
  }
}

export interface Signed {
  signedName: string
  signedAt: string
  pdfUrl: string
}

/* reason is the admin's: name-required, consent-required, terms-required for
   a 400; already-signed, contract-changed, no-policy for a 409; not-found for
   a 404. message is always fit to show. */
export type SignResult = { ok: true; signed: Signed } | { ok: false; status: number; reason: string; message: string }

/* What each refusal says to the customer. A 400 shows the admin's own
   sentence (it is written for them); a 409 gets ours, per reason. */
const CONFLICT: Record<string, string> = {
  "already-signed": "This contract was already signed. Nothing more is needed from you.",
  "contract-changed": "This contract was updated since you opened it. Please refresh the page and read it again before signing.",
  "no-policy": "This contract can't be signed yet: the cancellation and retainer policy hasn't been written in the admin. Please text us and we'll fix it.",
}

export async function signContract(
  token: string,
  body: {
    fullName: string
    consentToElectronicSignature: boolean
    agreeToTerms: boolean
    contentHash: string
    /* The GO form's one checkbox (ESIGN Act / Connecticut UETA); the admin
       requires it true for a go-v2 agreement. */
    esignConsent?: boolean
    additionalSignerName?: string
  }
): Promise<SignResult> {
  if (import.meta.env.DEV && token.startsWith("mock-")) {
    return (await import("./contractMock")).mockSign(token, body)
  }
  try {
    const res = await fetch(`${ADMIN_API}/api/contracts/${encodeURIComponent(token)}/sign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    const data = await res.json().catch(() => ({}))
    if (res.status === 201 && data?.signed === true) {
      return { ok: true, signed: { signedName: data.signedName, signedAt: data.signedAt, pdfUrl: data.pdfUrl } }
    }
    const reason = typeof data?.reason === "string" ? data.reason : "error"
    if (res.status === 400 && typeof data?.error === "string") return { ok: false, status: 400, reason, message: data.error }
    if (res.status === 409) return { ok: false, status: 409, reason, message: CONFLICT[reason] ?? FALLBACK }
    if (res.status === 404) return { ok: false, status: 404, reason: "not-found", message: "This signing link isn't valid." }
    if (res.status === 429) return { ok: false, status: 429, reason: "rate-limited", message: "Too many tries. Give it a few minutes and try again." }
    return { ok: false, status: res.status, reason, message: FALLBACK }
  } catch {
    return { ok: false, status: 0, reason: "network", message: FALLBACK }
  }
}
