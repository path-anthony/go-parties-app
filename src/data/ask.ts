/* Ask GO scripted responses copied from reference/GO-Customer-Journey-v1.html.
   Scripted in v1. Do not edit copy. */

import type { OccasionId } from "@/data/catalog"

export type AskContext = "home" | "pkg"

export interface AskChip {
  q: string
  a: string
  occ: OccasionId | null
  id: string | null
}

export interface AskScript {
  title: string
  open: string
  chips: AskChip[]
}

export const ASK: Record<AskContext, AskScript> = {
  home: {
    title: "What's the vibe?",
    open: "Tell me the party. I'll build it.",
    chips: [
      {
        q: "Backyard bday, 25 kids, about $1,500",
        a: "Kids Birthday Deluxe at $1,599. Bounce house, a magician hour, face painting, cotton candy and snow cones. Right at the number.",
        occ: "kids",
        id: "deluxe",
      },
      {
        q: "Guys' night, whiskey and cigars",
        a: "Gentlemen's Lounge at $4,499. The cigar trailer, whiskey pairings, lounge set, uplighting. Or go lean with Cigar Lounge Night from $1,600.",
        occ: "adult",
        id: "gents",
      },
      {
        q: "Hot July weekend, lots of kids",
        a: "Big Splash at $1,899. Water slide, two food stations, yard games, a speaker. Add snow cones. Done.",
        occ: "kids",
        id: "splash",
      },
    ],
  },
  pkg: {
    title: "About this package",
    open: "Ask me anything about it.",
    chips: [
      {
        q: "Does it fit in a normal backyard?",
        a: "Yes. The biggest piece needs about 20 by 25 feet of flat grass and a standard outlet within 100 feet. If your yard's tight, swap to a smaller inflatable on the What's in it screen.",
        occ: null,
        id: null,
      },
      {
        q: "What if it rains?",
        a: "Dry inflatables run fine in light rain. Heavy rain or lightning, we call it by 7 AM and you pick a new date, no fee.",
        occ: null,
        id: null,
      },
      {
        q: "Can I add a DJ?",
        a: "Yes. Add-ons has a DJ line, or swap the speaker setup for a DJ on What's in it. About $700 for two hours.",
        occ: null,
        id: null,
      },
    ],
  },
}
