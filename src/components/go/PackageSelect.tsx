import { fmt, type Pkg } from "@/data/catalog"

/* Package select. BRAND.md section 8: native select on purpose, identical on
   every phone and browser. */
export function PackageSelect({ pkgs, value, onChange }: { pkgs: Pkg[]; value: string; onChange: (id: string) => void }) {
  return (
    <div className="relative mt-3.5 after:pointer-events-none after:absolute after:top-1/2 after:right-4 after:size-2 after:-translate-y-[70%] after:rotate-45 after:border-r-2 after:border-b-2 after:border-charcoal">
      <select
        className="w-full appearance-none rounded-[12px] border-[1.5px] border-line bg-white py-3.5 pr-11 pl-3.5 text-sm font-bold text-charcoal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {pkgs.map((x) => (
          <option key={x.id} value={x.id}>
            {x.n} · {x.from ? "from " : ""}
            {fmt(x.p)}
          </option>
        ))}
      </select>
    </div>
  )
}
