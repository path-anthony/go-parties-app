import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel"

/* Recommended rail. BRAND.md section 8: horizontal snap of 168px cards.
   Built on the shadcn Carousel so every rail follows one source. */
export function Rail({ children }: { children: React.ReactNode[] }) {
  return (
    <Carousel opts={{ align: "start", dragFree: true, containScroll: "trimSnaps" }} className="mt-2.5">
      <CarouselContent className="-ml-2.5">
        {children.map((child, i) => (
          <CarouselItem key={i} className="basis-auto pl-2.5">
            {child}
          </CarouselItem>
        ))}
      </CarouselContent>
    </Carousel>
  )
}
