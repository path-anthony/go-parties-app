/* Sub-occasion select. BRAND.md section 8: native select on purpose, identical
   on every phone and browser. Same pattern as PackageSelect. */
export function SubOccSelect({
  options,
  value,
  onChange,
}: {
  options: string[]
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="relative mt-3 after:pointer-events-none after:absolute after:top-1/2 after:right-4 after:size-2 after:-translate-y-[70%] after:rotate-45 after:border-r-2 after:border-b-2 after:border-charcoal">
      <select
        className="w-full appearance-none rounded-[12px] border-[1.5px] border-line bg-white py-3.5 pr-11 pl-3.5 text-sm font-bold text-charcoal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="" disabled>
          Pick one
        </option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  )
}
