import { Check } from "lucide-react"
import { money, percent, signedOn } from "@/components/go/contract/format"
import type { GoDocument, GoField, GoSignature } from "@/components/go/contract/types"
import { SIGNATURE_FONT, useSignatureFont } from "@/components/go/contract/useSignatureFont"
import { cn } from "@/lib/utils"

/* The GO contract, as a web page: the paper form, section for section. Black
   bars with orange headings, the orange banner, the logo top right, labels
   over cream value boxes, the two service columns, the payment grid, the
   numbered terms, the signature lines and the footer rule. Everything shown
   comes from the admin's document; the layout labels (which box is which)
   are the form's own and live here. A null value is an empty box, like the
   blank form. On a phone the grids stack to one column and keep the same
   look. Light only, like the paper.

   The signature block can be live (the customer typing their name on the
   form itself) or filled (a signed contract). The page decides which. */

/* The paper's own colors, kept apart from the app's tokens on purpose. */
const INK = "#000000"
const LABEL = "#444444"
const BOX = "#FFF8EA"
const BOX_AUTO = "#E6E6E6"
const RULE = "#777777"
const ORANGE = "#FEA002"
const LINK = "#1A4FB4"

export interface LiveSignature {
  name: string
  onName: (v: string) => void
  additional: string
  onAdditional: (v: string) => void
  consent: boolean
  onConsent: (v: boolean) => void
  busy: boolean
}

export function GoContractDocument({ doc, live, className, signatureId }: { doc: GoDocument; live?: LiveSignature; className?: string; signatureId?: string }) {
  useSignatureFont()
  const { header, company, client, event, services, payment, terms, acceptance, signatures } = doc
  const retainerLabel = `RETAINER DUE AT SIGNING${payment.retainerPercent !== null ? ` - ${payment.retainerPercent}%` : ""} (AUTO)`
  const balanceLabel = `BALANCE DUE${payment.balanceDueDays !== null ? ` ${payment.balanceDueDays} DAYS PRIOR` : ""} (AUTO)`
  return (
    <article className={cn("border text-[12.5px] leading-snug", className)} style={{ background: "#fff", color: INK, borderColor: RULE }}>
      {/* Page 1 banner */}
      <header className="relative px-5 pt-4 pb-4" style={{ background: INK }}>
        {company.logoUrl && <img src={company.logoUrl} alt="" className="absolute top-3 right-4 size-[72px] rounded-full object-cover" />}
        <div className="pr-20">
          <h1 className="text-[20px] leading-tight font-black tracking-wide uppercase" style={{ color: ORANGE }}>
            {header.title}
          </h1>
          {header.confirmByLine && (
            <p className="mt-1.5 text-[9px] font-bold tracking-wide uppercase" style={{ color: ORANGE }}>
              {header.confirmByLine}
            </p>
          )}
          <div className="mt-1.5 h-7 max-w-[400px] px-2 text-[12px] leading-7 font-bold" style={{ background: "#fff", color: INK }}>
            {header.confirmByDate}
          </div>
          {header.nonRefundableLine && (
            <p className="mt-2.5 text-[12px] font-black tracking-wide uppercase" style={{ color: ORANGE }}>
              {header.nonRefundableLine}
            </p>
          )}
        </div>
      </header>

      {/* Company line */}
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 px-5 pt-3 pb-2">
        <div>
          <b className="text-[13.5px] font-black">{company.name}</b>
          <p className="mt-0.5 text-[10px]" style={{ color: LABEL }}>
            {[company.addressLine, company.phone && `Phone: ${company.phone}`, company.email].filter(Boolean).join("   |   ")}
          </p>
        </div>
        {company.website && (
          <span className="text-[11px]" style={{ color: LINK }}>
            {company.website}
          </span>
        )}
      </div>

      <div className="px-5">
        <SectionBar>CLIENT INFORMATION</SectionBar>
        <Grid cols="min-[640px]:grid-cols-[3fr_2fr]">
          <Field label="INDIVIDUAL NAME AND ORGANIZATION" value={client.nameOrg} />
          <Field label="EMAIL ADDRESS" value={client.email} />
        </Grid>
        <Grid cols="min-[640px]:grid-cols-[4fr_2fr_1fr_1.4fr]">
          <Field label="MAILING ADDRESS" value={client.mailingAddress} />
          <Field label="CITY" value={client.city} />
          <Field label="STATE" value={client.state} />
          <Field label="ZIP" value={client.zip} />
        </Grid>
        <Grid cols="min-[640px]:grid-cols-3">
          <Field label="PHONE - HOME" value={client.phoneHome} />
          <Field label="PHONE - WORK" value={client.phoneWork} />
          <Field label="PHONE - CELL" value={client.phoneCell} />
        </Grid>

        <SectionBar>EVENT DETAILS</SectionBar>
        <Grid cols="min-[640px]:grid-cols-3">
          <Field label="TYPE OF EVENT" value={event.type} />
          <Field label="GUEST OF HONOR" value={event.guestOfHonor} />
          <Field label="DAY / DATE OF EVENT" value={event.date} />
        </Grid>
        <Grid cols="min-[640px]:grid-cols-3">
          <Field label="TIME (FROM / TO)" value={event.timeFromTo} />
          <Field label="NUMBER OF EXPECTED GUESTS" value={event.expectedGuests} />
          <Field label="AGE RANGE" value={event.ageRange} />
        </Grid>
        <Grid cols="min-[640px]:grid-cols-[1fr_1.6fr_0.9fr]">
          <Field label="VENUE NAME" value={event.venueName} />
          <Field label="VENUE ADDRESS" value={event.venueAddress} />
          <Field label="VENUE PHONE #" value={event.venuePhone} />
        </Grid>
        <Grid cols="min-[640px]:grid-cols-[1fr_0.9fr_1.6fr]">
          <Field label="ON-SITE CONTACT NAME" value={event.onsiteContactName} />
          <Field label="ON-SITE CONTACT PHONE #" value={event.onsiteContactPhone} />
          <Field label="PLANNER / COORDINATOR (IF NOT GO EVENT GROUP)" value={event.planner} />
        </Grid>

        <SectionBar>SPECIAL REQUESTS, MISCELLANEOUS OR INFORMATION</SectionBar>
        <div className="mt-2 min-h-[84px] border px-2.5 py-2 text-[12px] whitespace-pre-line" style={{ background: BOX, borderColor: RULE }}>
          {doc.specialRequests}
        </div>

        <SectionBar sub='(check each service included; add details / quantity / hours and the fee)'>SERVICES SELECTED</SectionBar>
        <div className="mt-2 grid grid-cols-1 gap-x-5 min-[640px]:grid-cols-2">
          <ServiceColumn rows={services.left} />
          <ServiceColumn rows={services.right} />
        </div>
        {services.note && (
          <p className="mt-2 text-[9.5px] leading-snug" style={{ color: LABEL }}>
            {services.note}
          </p>
        )}

        <SectionBar>PAYMENT SUMMARY</SectionBar>
        <Grid cols="min-[640px]:grid-cols-[1.2fr_0.9fr_1.1fr_1.3fr_1.6fr]">
          <Field label="SERVICES SUBTOTAL (AUTO)" value={money(payment.subtotal)} auto />
          <Field label="DISCOUNT (%)" value={percent(payment.discountPercent)} />
          <Field label="DISCOUNT ($)" value={money(payment.discountAmount)} />
          <Field label="TOTAL DISCOUNT (AUTO)" value={money(payment.totalDiscount)} auto />
          <Field label="DISCOUNT DESCRIPTION / CODE" value={payment.discountDescription} />
        </Grid>
        <Grid cols="min-[640px]:grid-cols-3">
          <Field label="TOTAL CONTRACTED AMOUNT (AUTO)" value={money(payment.total)} auto strong />
          <Field label={retainerLabel} value={money(payment.retainerAmount)} auto strong />
          <Field label={balanceLabel} value={money(payment.balance)} auto strong hint={payment.balanceDueDate ? `Due ${payment.balanceDueDate}` : null} />
        </Grid>
        {payment.note && (
          <p className="mt-2 text-[9.5px] leading-snug" style={{ color: INK }}>
            {payment.note}
          </p>
        )}
        <PageFoot line={company.footerLine} />
      </div>

      {/* Page 2 and 3: terms, then acceptance */}
      <header className="relative px-5 py-3" style={{ background: INK }}>
        {company.logoUrl && <img src={company.logoUrl} alt="" className="absolute top-2 right-4 size-12 rounded-full object-cover" />}
        <p className="pr-16 text-[13px] font-black tracking-wide uppercase" style={{ color: ORANGE }}>
          {terms.pageHeader}
        </p>
        {terms.pageSubheader && (
          <p className="mt-0.5 pr-16 text-[9.5px]" style={{ color: ORANGE }}>
            {terms.pageSubheader}
          </p>
        )}
      </header>
      <div className="px-5">
        <SectionBar>{terms.heading ?? "TERMS AND CONDITIONS"}</SectionBar>
        <ol className="mt-2.5 space-y-2 text-[11.5px] leading-[1.45]">
          {terms.clauses.map((c, i) => (
            <li key={`${c.number ?? i}-${c.title ?? ""}`}>
              <b className="font-black">
                {c.number !== null && c.number !== undefined ? `${c.number}. ` : ""}
                {c.title}
                {c.title ? "." : ""}
              </b>{" "}
              <span className="whitespace-pre-line">{c.body}</span>
            </li>
          ))}
        </ol>

        <SectionBar>{acceptance.heading ?? "ACCEPTANCE AND SIGNATURES"}</SectionBar>
        {acceptance.text && <p className="mt-2.5 text-[11.5px] leading-[1.45] whitespace-pre-line">{acceptance.text}</p>}

        <div id={signatureId}>
        <label className={cn("mt-3 flex items-start gap-2.5 text-[11.5px]", live && !live.busy ? "cursor-pointer" : "")}>
          <input
            type="checkbox"
            className="mt-px size-4 flex-none"
            style={{ accentColor: INK }}
            checked={live ? live.consent : true}
            disabled={!live || live.busy}
            onChange={(e) => live?.onConsent(e.target.checked)}
          />
          <span>{acceptance.esignLabel}</span>
        </label>

        <SignatureRow
          who="CLIENT"
          auto
          signature={live ? { printedName: live.name, signedAt: null } : signatures.client}
          input={live ? { value: live.name, onChange: live.onName, placeholder: "Type your full name", id: "sign-name", disabled: live.busy } : undefined}
        />
        <SignatureRow
          who="ADDITIONAL SIGNER"
          auto
          signature={live ? { printedName: live.additional, signedAt: null } : signatures.additional}
          input={live ? { value: live.additional, onChange: live.onAdditional, placeholder: "Optional", id: "sign-additional", disabled: live.busy } : undefined}
        />
        <SignatureRow who="GO EVENT GROUP REPRESENTATIVE" signature={signatures.go} placeholderX={!signatures.go?.printedName} />
        </div>

        {acceptance.confirmLine && <p className="mt-5 text-center text-[11px] font-black uppercase">{acceptance.confirmLine}</p>}
        {acceptance.nonRefundableLine && <p className="mt-0.5 text-center text-[11px]">{acceptance.nonRefundableLine}</p>}
        <PageFoot line={company.footerLine} />
      </div>
    </article>
  )
}

function SectionBar({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <div className="mt-3.5 flex flex-wrap items-baseline gap-x-3 px-2.5 py-1.5" style={{ background: INK }}>
      <h2 className="text-[11.5px] font-black tracking-wide uppercase" style={{ color: ORANGE }}>
        {children}
      </h2>
      {sub && (
        <span className="text-[10px] font-bold" style={{ color: ORANGE }}>
          {sub}
        </span>
      )}
    </div>
  )
}

function Grid({ cols, children }: { cols: string; children: React.ReactNode }) {
  return <div className={cn("mt-2 grid grid-cols-1 gap-x-2.5 gap-y-2", cols)}>{children}</div>
}

function Field({ label, value, auto, strong, hint }: { label: string; value: string | null; auto?: boolean; strong?: boolean; hint?: string | null }) {
  return (
    <div>
      <div className="text-[8.5px] font-bold tracking-wide uppercase" style={{ color: LABEL }}>
        {label}
      </div>
      <div
        className={cn("mt-0.5 min-h-[24px] border-b px-1.5 py-1 text-[12px] leading-4", strong && "font-bold")}
        style={{ background: auto ? BOX_AUTO : BOX, borderColor: RULE }}
      >
        {value}
      </div>
      {hint && (
        <div className="mt-0.5 text-[9px]" style={{ color: LABEL }}>
          {hint}
        </div>
      )}
    </div>
  )
}

function ServiceColumn({ rows }: { rows: GoField[] }) {
  return (
    <div>
      <div className="grid grid-cols-[1fr_96px_72px] gap-x-1.5 text-[8.5px] font-bold tracking-wide uppercase" style={{ color: LABEL }}>
        <span />
        <span>DETAILS / QTY / HOURS</span>
        <span>FEE ($)</span>
      </div>
      {rows.map((r, i) =>
        r.isGroupHeading ? (
          <div key={i} className="mt-1 px-1.5 py-1 text-[9.5px] font-black uppercase" style={{ background: BOX_AUTO }}>
            {r.label}
          </div>
        ) : (
          <div key={i} className="grid grid-cols-[1fr_96px_72px] items-center gap-x-1.5 border-b py-1" style={{ borderColor: "#D5D5D5" }}>
            <span className="flex items-center gap-1.5 text-[11.5px] font-bold">
              <span className="flex size-3.5 flex-none items-center justify-center border" style={{ borderColor: INK, background: "#fff" }}>
                {r.checked && <Check className="size-3" strokeWidth={3} style={{ color: INK }} />}
              </span>
              {r.label}
            </span>
            <span className="min-h-[18px] border-b px-1 text-[11px] leading-[18px]" style={{ background: BOX, borderColor: RULE }}>
              {r.details}
            </span>
            <span className="min-h-[18px] border-b px-1 text-right text-[11px] leading-[18px] tabular-nums" style={{ background: BOX, borderColor: RULE }}>
              {money(r.fee)}
            </span>
          </div>
        )
      )}
    </div>
  )
}

function SignatureRow({
  who,
  auto,
  signature,
  input,
  placeholderX,
}: {
  who: string
  auto?: boolean
  signature: GoSignature | null
  input?: { id: string; value: string; onChange: (v: string) => void; placeholder: string; disabled: boolean }
  placeholderX?: boolean
}) {
  const name = signature?.printedName ?? ""
  return (
    <div className="mt-4 grid grid-cols-1 gap-x-3 gap-y-2 border-t pt-3 min-[640px]:grid-cols-[1.3fr_1.5fr_0.7fr]" style={{ borderColor: "#D5D5D5" }}>
      <div>
        <div className="text-[8.5px] font-bold tracking-wide uppercase" style={{ color: LABEL }}>
          {who} - PRINTED NAME
        </div>
        {input ? (
          <input
            id={input.id}
            className="mt-0.5 h-7 w-full border-b px-1.5 text-[12px] outline-none focus:border-black"
            style={{ background: BOX, borderColor: RULE, color: INK }}
            autoComplete="name"
            placeholder={input.placeholder}
            value={input.value}
            disabled={input.disabled}
            onChange={(e) => input.onChange(e.target.value)}
          />
        ) : (
          <div className="mt-0.5 min-h-[28px] border-b px-1.5 py-1 text-[12px]" style={{ background: BOX, borderColor: RULE }}>
            {name}
          </div>
        )}
      </div>
      <div>
        <div className="text-[8.5px] font-bold tracking-wide uppercase" style={{ color: LABEL }}>
          {who} - SIGNATURE{auto ? " (AUTO FROM NAME)" : ""}
        </div>
        <div className="mt-0.5 flex h-11 items-center border px-2 text-[22px] leading-none" style={{ background: BOX, borderColor: RULE, fontFamily: SIGNATURE_FONT, color: "#0D1A66" }}>
          {name || (placeholderX ? <span className="text-[14px] font-black" style={{ fontFamily: "Inter, system-ui, sans-serif", color: "#AAAAAA" }}>X</span> : null)}
        </div>
      </div>
      <div>
        <div className="text-[8.5px] font-bold tracking-wide uppercase" style={{ color: LABEL }}>
          DATE
        </div>
        <div className="mt-0.5 min-h-[28px] border-b px-1.5 py-1 text-[12px]" style={{ background: BOX, borderColor: RULE }}>
          {signedOn(signature?.signedAt ?? null)}
        </div>
      </div>
    </div>
  )
}

function PageFoot({ line }: { line: string | null }) {
  return (
    <div className="mt-5 mb-4 border-t-2 pt-1.5 text-[9px]" style={{ borderColor: ORANGE, color: LABEL }}>
      {line}
    </div>
  )
}
