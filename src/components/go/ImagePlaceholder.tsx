import { cn } from "@/lib/utils"

/* The one image placeholder (Block S1). Wherever an item, category, package
   or hero has no photo: a light warm grey box with a simple grey
   mountain-and-sun graphic, drawn inline. No text, no gradient, no icon
   font. Decorative: the thing it stands for is always named beside it. */
export function ImagePlaceholder({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={cn("flex items-center justify-center overflow-hidden bg-[#ECE7E0]", className)}>
      <svg viewBox="0 0 64 48" className="h-[34%] w-[34%] max-h-16 max-w-16" fill="#B9B0A5">
        <circle cx="44" cy="14" r="6" />
        <path d="M0 48 L22 20 L36 36 L44 28 L64 48 Z" />
      </svg>
    </div>
  )
}
