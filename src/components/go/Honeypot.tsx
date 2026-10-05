/* A bot trap. A field a person never sees and a script fills in: it sits off
   screen (not display:none, which scripts check for), is hidden from screen
   readers and the keyboard, and has autocomplete off so a browser never fills
   it either. The value is sent as hpField and must arrive empty; the admin
   decides what to do with a request that fills it. The word "website" is bait
   for form-filling scripts. */
export function Honeypot({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div aria-hidden="true" inert className="pointer-events-none absolute top-auto -left-[9999px] h-px w-px overflow-hidden">
      <label>
        Website
        <input type="text" name="website" tabIndex={-1} autoComplete="off" value={value} onChange={(e) => onChange(e.target.value)} />
      </label>
    </div>
  )
}
