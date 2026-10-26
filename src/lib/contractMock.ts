import type { GoDocument } from "@/components/go/contract/types"
import type { ContractLoad, SignResult } from "@/lib/contractApi"

/* Fixtures for the GO contract page, DEV only. contractApi imports this
   dynamically behind `import.meta.env.DEV && token.startsWith("mock-")`, so
   a production build never contains it. Everything here is made up: the
   people, the venue, the numbers. Tokens:
     mock-contract         the form with only the company's own text filled
     mock-contract-full    a fully filled fake wedding (DJ, MC, lighting, a discount)
     mock-contract-signed  the same wedding, signed by both sides
   A signing of mock-contract or mock-contract-full turns it signed in memory. */

const COMPANY: GoDocument["company"] = {
  name: "Go Event Group",
  addressLine: "767 New Britain Ave, Farmington, Connecticut 06032",
  phone: "413.391.4635 (GO!DJ)",
  email: "info@thegoeventgroup.com",
  website: "www.thegoeventgroup.com",
  logoUrl: "/brand/go-logo.png",
  footerLine: "Go Event Group  |  767 New Britain Ave, Farmington, CT 06032  |  413.391.4635  |  info@thegoeventgroup.com  |  thegoeventgroup.com",
}

const HEADER: GoDocument["header"] = {
  title: "This is your official contract",
  confirmByLine: "Date and event are not confirmed until retainer and signed contract are received by:",
  confirmByDate: null,
  nonRefundableLine: "Retainer is non-refundable",
}

const LEFT = ["Go DJ", "Go MC", "Event Coordination", "Go Photo", "Go Video", "Go Photo Booth", "Uplighting", "Up-Beat Lighting", "Stage / Dance Floor", "Light-Up Dance Platforms", "Light-Up Color Add-On"]
const RIGHT = ["Sound System", "AV Equipment", "Inflatables", "Miscellaneous", null, "Cold Spark Fountains", "Dancing on Clouds", "CO2 Jets and Guns", "Confetti Cannon", "Bubble Exit", "Rental Options", "Fireworks"]

const row = (label: string | null) =>
  label === null ? { label: 'Special effects (priced "starting at")', checked: null, details: null, fee: null, isGroupHeading: true } : { label, checked: false, details: null, fee: null }

const SERVICES_NOTE =
  "Light-up platforms: 2x2x1 ft $250 ea | 3x4 ft x 18 in $325 ea | 2x2x2 ft $200 ea; custom configurations and layouts available. Color add-on: $30 per light-up section, stationary or revolving color that moves to the music."

const PAYMENT_NOTE =
  'Gray fields calculate automatically: Services Subtotal = all fees added; Total Contracted Amount = Subtotal minus Total Discount (Discount % x Subtotal + Discount $); the retainer is 30% of the Total Contracted Amount, is due at signing and is non-refundable; the Balance (Total minus retainer) is due 30 days prior to the event. Enter fees as numbers only. Tip and tax are not included. Special effects and rentals are priced as "starting at" and finalized above.'

const CLAUSES: GoDocument["terms"]["clauses"] = [
  ["Retainer and Confirmation", "A non-refundable retainer equal to 30% of the Total Contracted Amount is due when this contract is signed. The date and event are not confirmed, and no date is held, until Go Event Group's office has received BOTH the signed contract and the retainer. The retainer reserves the date, staff and equipment for the Client and is non-refundable for any reason."],
  ["Payment", "The remaining balance, including any additions, applicable taxes, and any check or credit card processing fees, is due in full 30 days prior to the contracted event date. Tip and tax are not included in the listed prices; applicable taxes will be added as required by law. Items added after signing are added to the balance. Returned checks incur a $50 return fee and are subject to late and legal fees. Go Event Group may withhold services if the balance has not been paid by the due date."],
  ["Cancellation", "If the Client cancels for any reason, the retainer is considered a cancellation fee and is non-refundable. If the event is cancelled within 30 days of the contracted date, the full contracted balance is due and non-refundable."],
  ["Rescheduling", "If the Client requests to reschedule or postpone the event date, a fee of 20% of the contract total will be added to the final costs. A reschedule date must be agreed on in writing by both the Client and Go Event Group and is subject to availability."],
  ["Event Planners and Coordinators", "The Client is responsible for a 20% service charge if working with a wedding or event planner that is not hired or supplied through Go Event Group."],
  ["Equipment, Damage and Client Responsibility", "The Client assumes full responsibility for any damage to the staff's equipment and gear caused by the Client or the Client's guests, whether accidental or intentional, including but not limited to damage by theft, fire, vandalism, water or other liquids, while at the event. The Client agrees to pay the cost of repair or replacement."],
  ["Staffing and Substitutions", "Go Event Group will provide requested entertainers and staff whenever possible. In the event of an emergency replacement, the Client is assured an entertainer or staff member of equal caliber. However, the requested staff member is never guaranteed."],
  ["Venue, Setup and Power", "The Client is required to furnish one 6 foot table not further than 25 feet from electrical power. The Client is responsible for venue approval of the services, load-in and setup access, and any venue rules, fees or permits, and for providing a safe, covered and powered area for outdoor events. Go Event Group is not responsible for delays or limits caused by the venue."],
  ["Staff Meals", "The Go Event Group staff are considered guests and must be provided a meal or meal option at the time the Client's guests are served."],
  ["Special Effects and Fireworks", "Special effects (including cold spark fountains, low fog, CO2, confetti, bubbles and fireworks) are subject to venue approval, weather, and all applicable Connecticut and local fire, safety and permit requirements. Fireworks require licensed operators and permits. Go Event Group may modify, delay or decline any effect it believes is unsafe or not permitted, without liability to the Client."],
  ["Music and Entertainment", 'Go Event Group will honor reasonable music requests and "do not play" lists submitted in advance, but the DJ and MC keep final discretion over music selection, volume and event flow. Guests use dance floors, platforms, effects and other equipment at their own risk.'],
  ["Photo and Video; Print and Album Items", "Go Event Group keeps the copyright in all photos and video it produces and grants the Client a license for personal, non-commercial use. Go Event Group may use event images in its portfolio, website and social media. The Client agrees to forfeit all included print and album items if they are not ordered within 6 months after the contracted event date."],
  ["Additional Time", "Time beyond the contracted hours is subject to staff availability and is billed at Go Event Group's then-current rate."],
  ["Force Majeure; Limit of Liability", "Go Event Group is not liable for failure or delay in performing due to causes beyond its reasonable control, including severe weather, natural disaster, government order, utility failure, travel restrictions or illness. Go Event Group will make reasonable efforts to provide the services on another mutually agreed date. To the fullest extent permitted by law, Go Event Group's total liability under this contract is limited to the amounts the Client has paid to Go Event Group, and Go Event Group is not liable for indirect or consequential damages. The Client agrees to indemnify Go Event Group against claims arising from the conduct of the Client, the Client's guests or the venue."],
  ["Electronic Signatures and Records", "The parties agree that this contract may be signed electronically, by typed or drawn signature, and delivered electronically, and that electronic signatures and copies have the same legal effect as handwritten signatures and originals under the federal ESIGN Act and the Connecticut Uniform Electronic Transactions Act. The Client consents to do business electronically."],
  ["Governing Law and General Terms", "This contract is governed by the laws of the State of Connecticut, and any dispute will be brought in the state or federal courts located in Connecticut. This contract is the entire agreement between the parties, may be changed only in a writing signed by both parties, and if any part is found unenforceable the rest remains in effect. The Client confirms that they are at least 18 years old and have authority to sign for any organization named in this contract."],
].map(([title, body], i) => ({ number: i + 1, title, body }))

export const BLANK: GoDocument = {
  header: HEADER,
  company: COMPANY,
  client: { nameOrg: null, email: null, mailingAddress: null, city: null, state: null, zip: null, phoneHome: null, phoneWork: null, phoneCell: null },
  event: { type: null, guestOfHonor: null, date: null, timeFromTo: null, expectedGuests: null, ageRange: null, venueName: null, venueAddress: null, venuePhone: null, onsiteContactName: null, onsiteContactPhone: null, planner: null },
  specialRequests: null,
  services: { left: LEFT.map(row), right: RIGHT.map(row), note: SERVICES_NOTE },
  payment: { subtotal: null, discountPercent: null, discountAmount: null, totalDiscount: null, discountDescription: null, total: null, retainerPercent: 30, retainerAmount: null, balance: null, balanceDueDays: 30, balanceDueDate: null, note: PAYMENT_NOTE },
  terms: {
    heading: "Terms and conditions",
    pageHeader: "Go Event Group  |  Service contract and retainer agreement",
    pageSubheader: "RETAINER IS NON-REFUNDABLE  -  Date and event are not confirmed until retainer and signed contract are received.",
    clauses: CLAUSES,
  },
  acceptance: {
    heading: "Acceptance and signatures",
    text: "By signing below, the Client confirms that they have read, understood and agree to all terms of this contract, including that the retainer (30% of the Total Contracted Amount) is non-refundable and that the date and event are not confirmed until the retainer and this signed contract are received by Go Event Group.",
    esignLabel: "I agree to sign and receive this contract electronically (ESIGN Act / Connecticut UETA).",
    confirmLine: "Date and event are not confirmed until retainer and signed contract are received by our office.",
    nonRefundableLine: "Retainer is non-refundable.",
  },
  signatures: { client: null, additional: null, go: null },
}

const pick = (rows: typeof BLANK.services.left, filled: Record<string, [string, number | "-"]>) =>
  rows.map((r) => (r.label && filled[r.label] ? { ...r, checked: true, details: filled[r.label][0], fee: filled[r.label][1] } : r))

export const FULL: GoDocument = {
  ...BLANK,
  header: { ...HEADER, confirmByDate: "Friday, October 30, 2026" },
  client: {
    nameOrg: "Jordan Sample and Riley Example",
    email: "jordan.sample@example.com",
    mailingAddress: "12 Sample Street",
    city: "Avon",
    state: "CT",
    zip: "06001",
    phoneHome: null,
    phoneWork: null,
    phoneCell: "(860) 555-0142",
  },
  event: {
    type: "Wedding",
    guestOfHonor: "Jordan and Riley",
    date: "Saturday, June 12, 2027",
    timeFromTo: "5:00 PM to 11:00 PM",
    expectedGuests: "140",
    ageRange: "21 to 75",
    venueName: "The Example Barn",
    venueAddress: "100 Orchard Lane, Simsbury, CT 06070",
    venuePhone: "(860) 555-0177",
    onsiteContactName: "Casey Placeholder",
    onsiteContactPhone: "(860) 555-0118",
    planner: null,
  },
  specialRequests: "First dance at 7:15 PM. Uplighting in amber. Please keep the ceremony playlist to the submitted list. Load in through the side barn door.",
  services: {
    ...BLANK.services,
    left: pick(BLANK.services.left, { "Go DJ": ["6 hours", 180000], "Go MC": ["6 hours", 60000], Uplighting: ["12 fixtures, amber", 45000], "Up-Beat Lighting": ["Dance floor wash", 35000] }),
    right: pick(BLANK.services.right, { "Sound System": ["Ceremony and reception", 30000], "Cold Spark Fountains": ["2 units, first dance", 60000] }),
  },
  payment: {
    ...BLANK.payment,
    subtotal: 370000,
    discountPercent: 10,
    discountAmount: 0,
    totalDiscount: 37000,
    discountDescription: "Spring booking, SPRING10",
    total: 333000,
    retainerAmount: 99900,
    balance: 233100,
    balanceDueDate: "May 13, 2027",
  },
}

export const SIGNED_DOC: GoDocument = {
  ...FULL,
  signatures: {
    client: { printedName: "Jordan Sample", signedAt: "2026-10-12T18:20:00.000Z" },
    additional: { printedName: "Riley Example", signedAt: "2026-10-12T18:20:00.000Z" },
    go: { printedName: "Sam Representative", signedAt: "2026-10-13T14:05:00.000Z" },
  },
}

type Row = { signed: boolean; document: GoDocument; signedName: string; signedAt: string }
const store = new Map<string, Row>()
const SEED: Record<string, () => Row> = {
  "mock-contract": () => ({ signed: false, document: structuredClone(BLANK), signedName: "", signedAt: "" }),
  "mock-contract-full": () => ({ signed: false, document: structuredClone(FULL), signedName: "", signedAt: "" }),
  "mock-contract-signed": () => ({ signed: true, document: structuredClone(SIGNED_DOC), signedName: "Jordan Sample", signedAt: "2026-10-12T18:20:00.000Z" }),
}
function get(token: string): Row | null {
  if (!store.has(token)) {
    const make = SEED[token]
    if (!make) return null
    store.set(token, make())
  }
  return store.get(token) ?? null
}
const wait = () => new Promise((r) => setTimeout(r, 300))
const PDF = "https://example.com/contracts/mock-signed.pdf"
const TITLE = "Service Contract and Retainer Agreement"

export async function mockLoad(token: string): Promise<ContractLoad> {
  await wait()
  const r = get(token)
  if (!r) return { kind: "invalid" }
  if (r.signed) return { kind: "signed", contract: { signed: true, title: TITLE, signedName: r.signedName, signedAt: r.signedAt, pdfUrl: PDF, format: "go-v2", document: structuredClone(r.document) } }
  return {
    kind: "unsigned",
    contract: {
      signed: false,
      title: TITLE,
      customerName: r.document.client.nameOrg ?? "",
      eventDate: "2027-06-12",
      eventTime: r.document.event.timeFromTo,
      address: r.document.event.venueAddress,
      total: r.document.payment.total === null || r.document.payment.total === "-" ? null : r.document.payment.total / 100,
      depositPercentage: r.document.payment.retainerPercent ?? 30,
      depositAmount: r.document.payment.retainerAmount === null || r.document.payment.retainerAmount === "-" ? null : r.document.payment.retainerAmount / 100,
      balanceAmount: r.document.payment.balance === null || r.document.payment.balance === "-" ? null : r.document.payment.balance / 100,
      sections: [],
      text: "",
      contentHash: "mock-hash",
      consentText: "I consent to sign this contract electronically, and I understand my typed name is my legal signature.",
      termsText: "I have read this contract and agree to its terms.",
      format: "go-v2",
      document: structuredClone(r.document),
    },
  }
}

export async function mockSign(
  token: string,
  body: { fullName: string; esignConsent?: boolean; additionalSignerName?: string; contentHash: string }
): Promise<SignResult> {
  await wait()
  const r = get(token)
  if (!r) return { ok: false, status: 404, reason: "not-found", message: "This signing link isn't valid." }
  if (r.signed) return { ok: false, status: 409, reason: "already-signed", message: "This contract was already signed. Nothing more is needed from you." }
  if (body.contentHash !== "mock-hash") return { ok: false, status: 409, reason: "contract-changed", message: "This contract was updated since you opened it. Please refresh the page and read it again before signing." }
  const name = body.fullName.trim().replace(/\s+/g, " ")
  if (name.length < 3 || !name.includes(" ")) return { ok: false, status: 400, reason: "name-required", message: "Type your full name, first and last." }
  if (body.esignConsent !== true) return { ok: false, status: 400, reason: "consent-required", message: "You need to consent to sign electronically to continue." }
  const signedAt = new Date().toISOString()
  r.signed = true
  r.signedName = name
  r.signedAt = signedAt
  r.document.signatures.client = { printedName: name, signedAt }
  r.document.signatures.additional = body.additionalSignerName?.trim() ? { printedName: body.additionalSignerName.trim(), signedAt } : null
  return { ok: true, signed: { signedName: name, signedAt, pdfUrl: PDF } }
}
