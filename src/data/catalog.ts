/* Catalog data copied from reference/GO-Customer-Journey-v1.html. Do not edit copy. */

export type OccasionId = "kids" | "adult" | "wedding" | "corporate"
export type PlateVariant = "" | "warm" | "cool" | "stone"

export interface PackageItem {
  name: string
  cat: string
  alts: string[]
}

export interface Pkg {
  id: string
  n: string
  p: number
  plate: PlateVariant
  from?: boolean
  demo?: boolean
  inc: string[]
  items: PackageItem[]
}

export const OCC: Record<OccasionId, { label: string; plate: PlateVariant; q: string }> = {
  kids: { label: "Kids party", plate: "", q: "When's the party?" },
  adult: { label: "Adult party", plate: "warm", q: "When's the night?" },
  wedding: { label: "Wedding", plate: "cool", q: "When's the big day?" },
  corporate: { label: "Corporate", plate: "stone", q: "When's the event?" },
}

export const SUB_OCC: Record<OccasionId, string[]> = {
  kids: ["Birthday", "Bar/Bat Mitzvah", "Sweet 16", "Baby shower", "Graduation", "Other"],
  adult: ["Birthday", "Bachelor/Bachelorette", "Anniversary", "Retirement", "Housewarming", "Other"],
  wedding: ["Ceremony + reception", "Reception only", "Engagement party", "Rehearsal dinner", "Bridal shower", "Other"],
  corporate: ["Holiday party", "Team building", "Product launch", "Client appreciation", "Grand opening", "Other"],
}

const item = (name: string, cat: string, alts: string[]): PackageItem => ({ name, cat, alts })

export const PKGS: Record<OccasionId, Pkg[]> = {
  kids: [
    { id: "starter", n: "Backyard Starter", p: 999, plate: "", inc: ["1 bounce house, 4 hours", "Popcorn or cotton candy station", "Corn hole and ladder ball", "Delivery, setup, teardown"], items: [item("Bounce Castle A", "Inflatable", ["Bounce Castle B", "Bounce/slide combo (+$150)"]), item("Cotton candy station", "Fun food", ["Popcorn station", "Snow cone station"]), item("Corn hole + ladder ball", "Games", ["Giant Jenga", "Ring toss"])] },
    { id: "theme", n: "Themed Bounce Party", p: 1299, plate: "warm", demo: true, inc: ["Character themed bounce house", "Themed decor touches", "Cotton candy station", "Party favors"], items: [item("Themed bounce (from inventory)", "Inflatable", ["Dino theme", "Princess theme"]), item("Cotton candy station", "Fun food", ["Popcorn station", "Snow cone station"]), item("Party favors", "Extras", ["Glow favors", "Sand art kits"])] },
    { id: "deluxe", n: "Kids Birthday Deluxe", p: 1599, plate: "", inc: ["Bounce house, 4 hours", "Magician or balloon artist hour", "Face painting", "Cotton candy and snow cones"], items: [item("Bounce Castle A", "Inflatable", ["Bounce Castle B", "Bounce/slide combo (+$150)"]), item("Magician hour", "Performer", ["Balloon artist", "Caricature artist"]), item("Face painting", "Performer", ["Airbrush tattoos"]), item("Cotton candy + snow cones", "Fun food", ["Popcorn + snow cones", "Nacho bar (+$100)"])] },
    { id: "splash", n: "Big Splash", p: 1899, plate: "cool", inc: ["Water slide or bounce/slide combo", "2 fun food stations", "Yard games bundle", "Speaker setup"], items: [item("Big Wave water slide", "Inflatable", ["Bounce/slide combo", "Dual lane slide (+$200)"]), item("2 fun food stations", "Fun food", ["Cotton candy + snow cones", "Popcorn + nacho bar"]), item("Yard games bundle", "Games", ["Mini golf (+$150)", "Carnival games (+$250)"]), item("Speaker setup", "Sound", ["DJ, 2 hours (+$700)"])] },
    { id: "grad", n: "Graduation Bash", p: 2299, plate: "stone", inc: ["1 inflatable", "Photo booth, 2 hours", "Nacho bar", "Speaker and uplights"], items: [item("Obstacle course", "Inflatable", ["Water slide", "Bounce/slide combo"]), item("Photo booth, 2 hours", "Photo", ["360 booth (+$1,200)"]), item("Nacho bar", "Fun food", ["Gelato bar (+$100)"]), item("Speaker + uplights", "Production", ["DJ, 3 hours (+$900)"])] },
  ],
  adult: [
    { id: "cigar", n: "Cigar Lounge Night", p: 1600, from: true, plate: "warm", inc: ["Mobile cigar lounge, 4 hours", "Brand cigars", "Whiskey, scotch, cognac service", "Cigarist on request"], items: [item("Cigar trailer", "Lounge", []), item("Cigar selection", "Cigars", ["Premium selection (+$300)"]), item("Whiskey service", "Bar", ["Cognac flight (+$150)"])] },
    { id: "cocktail", n: "Backyard Cocktail Party", p: 2999, plate: "", inc: ["Lounge furniture set", "Uplighting", "Speaker setup", "Nacho or gelato bar", "Corn hole and ladder ball"], items: [item("Lounge furniture set", "Furniture", ["High tops only"]), item("Uplighting", "Lighting", ["Upbeat lighting (+$299)"]), item("Gelato bar", "Fun food", ["Nacho bar"]), item("Corn hole + ladder ball", "Games", ["Casino table (+$449)"])] },
    { id: "casino", n: "Casino Night at Home", p: 3499, plate: "stone", inc: ["Casino tables and games", "Uplighting", "Speaker setup", "Fun food station"], items: [item("Casino tables + dealer", "Games", ["Extra table (+$449)"]), item("Uplighting", "Lighting", ["Gobo monogram (+$350)"]), item("Fun food station", "Fun food", ["Nacho bar", "Gelato bar"])] },
    { id: "gents", n: "Gentlemen's Lounge", p: 4499, plate: "warm", inc: ["Cigar lounge Basic Experience", "Whiskey pairing service", "Lounge furniture set", "Uplighting"], items: [item("Cigar trailer", "Lounge", []), item("Whiskey pairings", "Bar", ["Scotch flight", "Cognac flight"]), item("Lounge furniture set", "Furniture", ["Light-up cubes"]), item("Uplighting", "Lighting", ["Cold spark send-off (+$1,499)"])] },
    { id: "block", n: "Ultimate Block Party", p: 4999, plate: "cool", inc: ["Obstacle course or 2 inflatables", "MC and DJ, 4 hours", "Photo booth, 2 hours", "2 fun food stations", "Games bundle"], items: [item("Obstacle course", "Inflatable", ["2 bounce houses"]), item("MC + DJ, 4 hours", "Entertainment", ["DJ, 5 hours (+$500)"]), item("Photo booth, 2 hours", "Photo", ["360 booth (+$1,200)"]), item("2 fun food stations", "Fun food", ["3 stations (+$200)"])] },
  ],
  wedding: [
    { id: "basic", n: "The Basic", p: 4999, plate: "cool", inc: ["DJ and MC, 4 hours", "1 videographer, 6 hours", "1 photographer, 6 hours", "Online gallery"], items: [item("DJ + MC", "Entertainment", ["Add uplighting (+$599)"]), item("Videographer", "Video", ["Drone add-on (+$1,500)"]), item("Photographer", "Photo", ["Second shooter (+$1,199)"])] },
    { id: "ess", n: "Essential", p: 7999, plate: "", inc: ["MC and DJ, 5 hours", "Videographer, 8 hours", "Photographer, 8 hours", "Photo booth, 2 hours", "One add-on at $350"], items: [item("MC + DJ, 5 hours", "Entertainment", ["6 hours (+$400)"]), item("Videographer, 8 hours", "Video", ["Two videographers (+$1,199)"]), item("Photographer, 8 hours", "Photo", ["Two photographers (+$1,199)"]), item("Photo booth, 2 hours", "Photo", ["4 hours (+$400)"])] },
    { id: "dream", n: "Dream", p: 12449, plate: "warm", inc: ["MC and DJ, 6 hours", "2 videographers, up to 10 hours", "Up to 2 photographers", "Photo booth, 4 hours", "Choice of one add-on"], items: [item("MC + DJ, 6 hours", "Entertainment", ["Dual DJ setup"]), item("2 videographers", "Video", ["Add drone"]), item("2 photographers", "Photo", ["Engagement session"]), item("Photo booth, 4 hours", "Photo", ["360 booth"])] },
    { id: "plat", n: "The Platinum", p: 18999, plate: "stone", inc: ["Unlimited MC and DJ, dream setup", "2 videographers, drone, trailer", "2 photographers, albums", "Photo booth, 6 hours", "Clouds, CO2, cold sparks, planner, JP"], items: [item("Everything", "All in", [])] },
  ],
  corporate: [
    { id: "field", n: "Company Field Day", p: 5999, plate: "", demo: true, inc: ["Obstacle course + inflatable", "Carnival games, dunk tank", "2 fun food stations", "Emcee and sound"], items: [item("Obstacle course", "Inflatable", ["Add mechanical bull (+$800)"]), item("Carnival games + dunk tank", "Games", ["Add casino (+$900)"]), item("Emcee + sound", "Production", ["Live stream (+$1,200)"])] },
    { id: "holiday", n: "Holiday Party", p: 6499, plate: "warm", demo: true, inc: ["MC and DJ Essential tier", "Uplighting and gobo monogram", "Photo booth, 4 hours", "Casino tables"], items: [item("MC + DJ", "Entertainment", ["Dual DJ (+$2,200)"]), item("Uplighting + monogram", "Lighting", ["Cold spark moment (+$1,499)"]), item("Photo booth, 4 hours", "Photo", ["360 booth"]), item("Casino tables", "Games", ["Extra table (+$449)"])] },
    { id: "gala", n: "Gala Production", p: 9999, plate: "cool", demo: true, inc: ["Full AV and lighting design", "Corporate monogram", "Complete-tier photography", "Cold spark moment", "Coordinator"], items: [item("AV + lighting design", "Production", ["Live stream (+$1,200)"]), item("Photography, Complete", "Photo", ["Ultimate tier (+$1,200)"]), item("Cold spark moment", "Effects", ["Dance on the clouds (+$1,199)"])] },
  ],
}

export type Addon = [name: string, price: number, plate: PlateVariant]

export const ADDONS: Record<string, Addon[]> = {
  "Fun foods": [["Cotton Candy Station", 199, "warm"], ["Popcorn Station", 179, ""], ["Snow Cone Station", 199, "cool"], ["Nacho Bar", 299, "warm"], ["Gelato Bar", 399, "stone"]],
  "Effects": [["Dance on the Clouds", 1199, "cool"], ["CO2 Blaster Gun", 400, "stone"], ["Cold Spark Show", 1499, "warm"], ["Bubbles", 149, "cool"], ["Snow Effect", 249, "cool"]],
  "Games": [["Corn Hole", 99, ""], ["Giant Ladder Ball", 99, ""], ["9-Hole Mini Golf", 249, ""], ["Casino Table + Dealer", 449, "stone"]],
  "Photo": [["Photo Booth, 2 hrs", 799, "stone"], ["360 Booth", 1999, "cool"], ["Photographer, per hour", 500, ""]],
  "Performers": [["Magician Hour", 450, "warm"], ["Balloon Artist", 349, "warm"], ["Face Painter", 299, ""], ["Caricature Artist", 399, "stone"]],
}

export const GUESTS: Record<OccasionId, string[]> = {
  kids: ["Under 25", "25-50", "50-75", "75-100", "100-150", "150+"],
  adult: ["Under 50", "50-100", "100-150", "150-250", "250-400", "400+"],
  wedding: ["Under 75", "75-150", "150-250", "250-400", "400-600", "600+"],
  corporate: ["Under 100", "100-250", "250-500", "500-1000", "1000-2000", "2000+"],
}

export const TIMES: Record<OccasionId, [label: string, time: string][]> = {
  kids: [["Morning", "10 AM"], ["Midday", "12 PM"], ["Afternoon", "2 PM"]],
  adult: [["Afternoon", "3 PM"], ["Evening", "6 PM"], ["Late", "8 PM"]],
  wedding: [["Afternoon", "2 PM"], ["Golden hour", "5 PM"], ["Evening", "7 PM"]],
  corporate: [["Morning", "9 AM"], ["Midday", "12 PM"], ["Evening", "6 PM"]],
}

export const BUDGETS: Record<OccasionId, [label: string, ceiling: number][]> = {
  kids: [["Under $1,500", 1500], ["$1,500-$3,000", 3000], ["$3,000-$5,000", 5000], ["$5,000+", 99999]],
  adult: [["Under $3,000", 3000], ["$3,000-$6,000", 6000], ["$6,000-$10,000", 10000], ["$10,000+", 99999]],
  wedding: [["Under $8,000", 8000], ["$8,000-$15,000", 15000], ["$15,000-$30,000", 30000], ["$30,000+", 99999]],
  corporate: [["Under $10,000", 10000], ["$10,000-$25,000", 25000], ["$25,000-$50,000", 50000], ["$50,000+", 99999]],
}

export const MONTHS: [name: string, year: number, monthIndex: number][] = [
  ["Sep", 2026, 8],
  ["Oct", 2026, 9],
  ["Nov", 2026, 10],
  ["Dec", 2026, 11],
]

export const NEXT_OPEN: Record<OccasionId, string> = {
  kids: "Sat Sep 13",
  adult: "Fri Sep 19",
  wedding: "Oct 2026",
  corporate: "Sep 26",
}

export const fmt = (n: number) => "$" + n.toLocaleString("en-US")

export function occOf(p: Pkg): OccasionId {
  for (const k of Object.keys(PKGS) as OccasionId[]) {
    if (PKGS[k].some((x) => x.id === p.id && x.n === p.n)) return k
  }
  return "kids"
}
