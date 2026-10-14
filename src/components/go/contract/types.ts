/* The GO contract as the admin serves it ("format": "go-v2"): one object with
   every field the paper form has, in the same order the form reads. This is a
   locked format shared with the admin. Every value may be null; a null renders
   as an empty box, exactly like the blank form. Money is whole cents. */

export type Cents = number | "-" | null

export interface GoField {
  label: string | null
  checked: boolean | null
  details: string | null
  fee: Cents
  /* A row that is only a heading over the rows under it ("SPECIAL EFFECTS"). */
  isGroupHeading?: boolean | null
}

export interface GoSignature {
  printedName: string | null
  /* ISO instant. */
  signedAt: string | null
}

export interface GoDocument {
  header: { title: string | null; confirmByLine: string | null; confirmByDate: string | null; nonRefundableLine: string | null }
  company: {
    name: string | null
    addressLine: string | null
    phone: string | null
    email: string | null
    website: string | null
    logoUrl: string | null
    footerLine: string | null
  }
  client: {
    nameOrg: string | null
    email: string | null
    mailingAddress: string | null
    city: string | null
    state: string | null
    zip: string | null
    phoneHome: string | null
    phoneWork: string | null
    phoneCell: string | null
  }
  event: {
    type: string | null
    guestOfHonor: string | null
    date: string | null
    timeFromTo: string | null
    expectedGuests: string | null
    ageRange: string | null
    venueName: string | null
    venueAddress: string | null
    venuePhone: string | null
    onsiteContactName: string | null
    onsiteContactPhone: string | null
    planner: string | null
  }
  specialRequests: string | null
  services: { left: GoField[]; right: GoField[]; note: string | null }
  payment: {
    subtotal: Cents
    discountPercent: number | null
    discountAmount: Cents
    totalDiscount: Cents
    discountDescription: string | null
    total: Cents
    retainerPercent: number | null
    retainerAmount: Cents
    balance: Cents
    balanceDueDays: number | null
    balanceDueDate: string | null
    note: string | null
  }
  terms: {
    heading: string | null
    pageHeader: string | null
    pageSubheader: string | null
    clauses: { number: number | string | null; title: string | null; body: string | null }[]
  }
  acceptance: { heading: string | null; text: string | null; esignLabel: string | null; confirmLine: string | null; nonRefundableLine: string | null }
  signatures: { client: GoSignature | null; additional: GoSignature | null; go: GoSignature | null }
}

/* Reads whatever the admin sent into a GoDocument with every field present
   (null when missing), so the components never meet an undefined. Returns
   null when there is no usable document at all. */
export function parseGoDocument(raw: unknown): GoDocument | null {
  if (!raw || typeof raw !== "object") return null
  const d = raw as Record<string, unknown>
  const obj = (v: unknown): Record<string, unknown> => (v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {})
  const str = (v: unknown): string | null => (typeof v === "string" ? (v.trim() === "" ? null : v) : typeof v === "number" ? String(v) : null)
  const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v)) ? Number(v) : null)
  const cents = (v: unknown): Cents => (v === "-" ? "-" : typeof v === "number" && Number.isFinite(v) ? Math.round(v) : null)
  const bool = (v: unknown): boolean | null => (typeof v === "boolean" ? v : null)
  const field = (v: unknown): GoField => {
    const f = obj(v)
    return { label: str(f.label), checked: bool(f.checked), details: str(f.details), fee: cents(f.fee), isGroupHeading: bool(f.isGroupHeading) }
  }
  const fields = (v: unknown): GoField[] => (Array.isArray(v) ? v.map(field) : [])
  const sig = (v: unknown): GoSignature | null => {
    if (!v || typeof v !== "object") return null
    const s = obj(v)
    const printedName = str(s.printedName)
    const signedAt = str(s.signedAt)
    return printedName || signedAt ? { printedName, signedAt } : null
  }
  const h = obj(d.header), co = obj(d.company), cl = obj(d.client), ev = obj(d.event), sv = obj(d.services), pm = obj(d.payment), tm = obj(d.terms), ac = obj(d.acceptance), sg = obj(d.signatures)
  return {
    header: { title: str(h.title), confirmByLine: str(h.confirmByLine), confirmByDate: str(h.confirmByDate), nonRefundableLine: str(h.nonRefundableLine) },
    company: { name: str(co.name), addressLine: str(co.addressLine), phone: str(co.phone), email: str(co.email), website: str(co.website), logoUrl: str(co.logoUrl), footerLine: str(co.footerLine) },
    client: {
      nameOrg: str(cl.nameOrg), email: str(cl.email), mailingAddress: str(cl.mailingAddress), city: str(cl.city), state: str(cl.state), zip: str(cl.zip),
      phoneHome: str(cl.phoneHome), phoneWork: str(cl.phoneWork), phoneCell: str(cl.phoneCell),
    },
    event: {
      type: str(ev.type), guestOfHonor: str(ev.guestOfHonor), date: str(ev.date), timeFromTo: str(ev.timeFromTo), expectedGuests: str(ev.expectedGuests), ageRange: str(ev.ageRange),
      venueName: str(ev.venueName), venueAddress: str(ev.venueAddress), venuePhone: str(ev.venuePhone), onsiteContactName: str(ev.onsiteContactName),
      onsiteContactPhone: str(ev.onsiteContactPhone), planner: str(ev.planner),
    },
    specialRequests: str(d.specialRequests),
    services: { left: fields(sv.left), right: fields(sv.right), note: str(sv.note) },
    payment: {
      subtotal: cents(pm.subtotal), discountPercent: num(pm.discountPercent), discountAmount: cents(pm.discountAmount), totalDiscount: cents(pm.totalDiscount),
      discountDescription: str(pm.discountDescription), total: cents(pm.total), retainerPercent: num(pm.retainerPercent), retainerAmount: cents(pm.retainerAmount),
      balance: cents(pm.balance), balanceDueDays: num(pm.balanceDueDays), balanceDueDate: str(pm.balanceDueDate), note: str(pm.note),
    },
    terms: {
      heading: str(tm.heading), pageHeader: str(tm.pageHeader), pageSubheader: str(tm.pageSubheader),
      clauses: Array.isArray(tm.clauses) ? tm.clauses.map((c) => ({ number: num(obj(c).number) ?? str(obj(c).number), title: str(obj(c).title), body: str(obj(c).body) })) : [],
    },
    acceptance: { heading: str(ac.heading), text: str(ac.text), esignLabel: str(ac.esignLabel), confirmLine: str(ac.confirmLine), nonRefundableLine: str(ac.nonRefundableLine) },
    signatures: { client: sig(sg.client), additional: sig(sg.additional), go: sig(sg.go) },
  }
}
