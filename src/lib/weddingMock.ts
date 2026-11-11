import { mockIsWedding } from "@/lib/checkoutMock"
import { mockMode } from "@/lib/mock"
import type { WeddingDetails, WeddingFailure, WeddingField, WeddingItem, WeddingNote, WeddingResult, WeddingSection, WeddingTemplate, WeddingValue } from "@/lib/weddingApi"
import { sectionFields } from "@/lib/weddingApi"

/* Wedding details fixtures, DEV only and loaded lazily behind
   import.meta.env.DEV (Blocks S7 and S7.1). `?mock=wedding` turns the
   portal mock on as well and gives Jordan Sample three wedding bookings:
   bk-wedding-new (not started), bk-wedding-progress (6 of 10 required
   sections answered, due in 10 days) and bk-wedding-submitted. Every other
   booking answers 404. The template below is the admin's TEMPLATE_V1
   (go-parties-admin/server/weddingDetails/template.ts) copied as data, and
   the rules mirror its store: a save is checked whole and one bad field
   refuses it, prefilled keys are locked, only stored answers count toward
   a section being done. A text answer containing "FAIL" is refused with
   500, to walk the autosave failure path. Under `?mock=portal` alone
   everything answers 404. */

type Pair = [string, string]
const TEXT_MAX = 300
const TIME_MAX = 40
const TEXTAREA_MAX = 2000
const NOTES_MAX = 5000
const HANDLE_MAX = 100

type Extra = Partial<Pick<WeddingField, "help" | "max" | "keepLinks" | "prefix">>
const field = (type: WeddingField["type"], key: string, label: string, extra: Extra = {}): WeddingField => ({ kind: "field", type, key, label, ...extra })
const text = (key: string, label: string, extra: Extra = {}) => field("text", key, label, { max: TEXT_MAX, ...extra })
const time = (key: string, label: string) => field("time", key, label, { max: TIME_MAX })
const area = (key: string, label: string, extra: Extra = {}) => field("textarea", key, label, { max: TEXTAREA_MAX, ...extra })
const handle = (key: string, label: string, prefix: "@" | "#" = "@") => field("handle", key, label, { max: HANDLE_MAX, prefix, keepLinks: true })
const opts = (pairs: Pair[]) => pairs.map(([value, label]) => ({ value, label }))
const choice = (key: string, label: string, pairs: Pair[]): WeddingField => ({ ...field("choice", key, label), options: opts(pairs) })
const multi = (key: string, label: string, pairs: Pair[]): WeddingField => ({ ...field("multi", key, label), options: opts(pairs) })
const rank = (key: string, label: string, pairs: Pair[]): WeddingField => ({ ...field("rank", key, label), options: opts(pairs) })
const note = (tag: string | null, body: string): WeddingNote => ({ kind: "note", tag, text: body })
const heading = (body: string, help?: string): WeddingItem => ({ kind: "heading", text: body, help })
const group = (key: string, title: string, boxes: Pair[], groupNote?: string): WeddingItem => ({ kind: "group", key, title, note: groupNote, fields: boxes.map(([k, label]) => field("checkbox", k, label)) })

const YES_NO: Pair[] = [["yes", "Yes"], ["no", "No"]]
const SPECIAL = "SPECIAL REQUESTS (BE VERY SPECIFIC)"

function section(key: string, number: number, title: string, subtitle: string, required: boolean, items: WeddingItem[]): WeddingSection {
  const full = (f: WeddingField, prefix: string): WeddingField => ({ ...f, key: `${prefix}.${f.key}` })
  return {
    key,
    number,
    title,
    subtitle,
    required,
    items: items.map((it) => {
      if (it.kind === "field") return full(it, key)
      if (it.kind === "group") return { ...it, key: `${key}.${it.key}`, fields: it.fields.map((f) => full(f, `${key}.${it.key}`)) }
      return it
    }),
  }
}

const person = (who: "bride" | "groom", name: string): WeddingItem[] => [
  text(`${who}_name`, name),
  text(`${who}_address`, "ADDRESS"),
  text(`${who}_city`, "CITY"),
  text(`${who}_state`, "STATE"),
  text(`${who}_zip`, "ZIP"),
  text(`${who}_cell`, "CELL PHONE"),
  text(`${who}_email`, "EMAIL", { keepLinks: true }),
]

const TEMPLATE_V1: WeddingTemplate = {
  version: 1,
  title: "Wedding Film",
  subtitle: "VIDEOGRAPHY DETAILS & SHOT LIST",
  tagline: "FILM • HIGHLIGHT TRAILER • CONTENT CREATION",
  preparedFor: "PREPARED FOR",
  cover: [text("cover.event_date", "EVENT DATE"), text("cover.ceremony_venue", "CEREMONY VENUE"), text("cover.reception_venue", "RECEPTION VENUE")],
  howTo: [
    { title: "Check boxes", text: "Tap every moment you'd love on film. Unchecked = we'll use our judgment." },
    { title: "Rank & choose", text: "Number your priorities and pick your songs so your film feels like you." },
    { title: "Special requests", text: "Be very specific: names, places, surprises, and must-have moments." },
  ],
  note: note("NOTE", "Please fill out, keep a copy, and return to Go! Event Group no later than 30 days before your event. Works on computer or phone. Press Tab (or Next on mobile) to move field to field."),
  sections: [
    section("couple", 1, "THE COUPLE", "the guests of honor", true, [
      heading("BRIDE"),
      ...person("bride", "BRIDE'S FULL NAME"),
      heading("GROOM"),
      ...person("groom", "GROOM'S FULL NAME"),
      heading("DAY-OF CONTACT", "someone helping with details who can be reached on the day, such as a parent or relative"),
      text("day_of_name", "THIRD PERSON CONTACT NAME"),
      text("day_of_relationship", "RELATIONSHIP"),
      text("day_of_cell", "CELL PHONE"),
    ]),
    section("film", 2, "YOUR FILM", "make it yours", true, [
      text("video_inspiration", "WHICH WEDDING VIDEO FROM OUR WEBSITE CAUGHT YOUR ATTENTION?", { keepLinks: true }),
      note(null, "Most couples choose one song for the details & events of the day and another for the dancing."),
      text("song_1", "HIGHLIGHT TRAILER SONG #1 (DETAILS & EVENTS) - TITLE & ARTIST"),
      text("song_2", "HIGHLIGHT TRAILER SONG #2 (DANCING) - TITLE & ARTIST"),
      rank("priorities", "WHAT MATTERS MOST? RANK 1 (MOST) TO 3 (LEAST)", [["getting_ready", "Getting ready"], ["formalities", "Formalities"], ["dancing", "Dancing"]]),
    ]),
    section("wedding_info", 3, "WEDDING INFORMATION", "the essentials", true, [
      time("primary_start", "PRIMARY COVERAGE START"),
      time("primary_end", "PRIMARY COVERAGE END"),
      time("second_start", "SECOND VIDEOGRAPHER START (OPTIONAL)"),
      text("total_hours", "TOTAL HOURS BOOKED"),
      text("ceremony_location", "CEREMONY LOCATION & ADDRESS"),
      text("reception_location", "RECEPTION VENUE LOCATION & ADDRESS"),
      text("venue_contact_name", "VENUE CONTACT NAME"),
      text("venue_contact_phone", "VENUE CONTACT PHONE"),
      heading("TRAVEL TIME"),
      text("travel_bride_groom", "Bride's location → Groom's location", { help: "recommended under 15 min" }),
      text("travel_bride_ceremony", "Bride's location → Ceremony", { help: "we need 45 min for ceremony set-up" }),
      text("travel_groom_ceremony", "Groom's location → Ceremony", { help: "we need 45 min for ceremony set-up" }),
      note("TIP", "Keeping getting-ready locations close together (under 15 minutes apart) lets one videographer capture both sides without missing moments."),
    ]),
    section("bride_prep", 4, "BRIDE PREPARATION", "getting ready", true, [
      time("start_time", "START TIME"),
      text("location", "LOCATION & ADDRESS"),
      group("details", "DETAILS", [
        ["dress", "Wedding dress (bodice on hanger)"],
        ["veil", "Veil"],
        ["shoes", "Shoes"],
        ["jewelry", "Jewelry"],
        ["garter", "Garter"],
        ["perfume", "Perfume"],
        ["invitations", "Invitations"],
        ["rings", "Wedding rings (usually during reception)"],
        ["gift_from_groom", "Wedding gift from the groom"],
      ]),
      choice("read_note", "Read the groom's handwritten note on video?", YES_NO),
      choice("wearing", "Wearing:", [["gown", "Gown"], ["robe", "Robe"]]),
      group("candid", "CANDID MOMENTS", [
        ["hair", "Bride getting her hair done"],
        ["makeup", "Bride getting her makeup done (close-up & wide)"],
        ["bridesmaids_ready", "Bridesmaids getting ready"],
        ["mingling", "Bride mingling with bridesmaids (toasts, gifts, robe shot - optional)"],
        ["in_dress", "Getting in the dress: adjusting, zipping or buttoning"],
        ["surrounded", "Bride surrounded by bridesmaids or family as she dresses"],
        ["behind_scenes", "Behind the scenes of the bride in the suite (fluffing dress, earrings)"],
        ["jewelry_help", "Mom (or Maid of Honor) helping with jewelry"],
        ["opening_gift", "Bride opening gift from the groom"],
      ]),
      area("special_requests", SPECIAL),
    ]),
    section("groom_prep", 5, "GROOM PREPARATION", "suiting up", true, [
      time("start_time", "START TIME"),
      text("location", "LOCATION & ADDRESS"),
      group("details", "DETAILS", [
        ["tie", "Tie or bow tie"],
        ["tailored", "Personalized tailored aspects of the suit"],
        ["socks", "Specialty socks"],
        ["cuff_links", "Cuff links"],
        ["shoes", "Shoes"],
        ["watch", "Watch"],
        ["gift_from_bride", "Opening wedding gift from the bride"],
        ["alcohol", "Any special alcohol"],
      ]),
      choice("read_note", "Read the bride's handwritten note on video?", YES_NO),
      choice("dressed", "Dressed:", [["in_suit", "In suit"], ["casual", "Casual"]]),
      group("candid", "CANDID MOMENTS", [
        ["guys_dressed", "The guys getting dressed & hanging out"],
        ["with_best_man", "Groom getting dressed with best man or dad"],
        ["tying_tie", "Groom tying his tie"],
        ["jacket", "Groom putting on jacket, buttoning sleeves / cufflinks"],
        ["toasting", "Groom drinking / toasting with groomsmen"],
      ]),
      area("special_requests", SPECIAL),
    ]),
    section("ceremony", 6, "CEREMONY", "the I do's", true, [
      time("time", "TIME"),
      text("location", "LOCATION & ADDRESS"),
      choice("full_mass", "Full mass ceremony?", YES_NO),
      choice("balcony", "Balcony access available?", [["yes", "Yes"], ["no", "No"], ["not_sure", "Not sure"]]),
      note("AUDIO", "A microphone will be placed on the groom ONLY, to capture vows, readings, and the officiant."),
      group("scene", "SETTING THE SCENE", [
        ["signage", "Wedding signage"],
        ["overview", "Full overview of ceremony location (inside & out)"],
        ["drone", "Drone coverage (package, weather & venue rules permitting)"],
        ["guests_seated", "Guests mingling and/or seated before the start"],
      ]),
      group("moments", "CEREMONY MOMENTS", [
        ["processional", "Processional (officiant, wedding party, parents & grandparents seated)"],
        ["children", "Any children in the ceremony"],
        ["father_walking", "Father walking bride down the aisle"],
        ["groom_reaction", "Groom's reaction seeing the bride"],
        ["giving_away", "Father giving away the bride"],
        ["looking", "Bride & groom looking at each other"],
        ["rings", "Close-up of rings being placed on fingers"],
        ["parents_reactions", "Parents' reactions (if possible)"],
        ["readers", "Guest readers / speakers / soloist / special guests"],
        ["religious", "Religious or cultural moments"],
        ["first_kiss", "First kiss"],
        ["recessional", "Recessional"],
      ]),
      area("special_requests", SPECIAL),
    ]),
    section("family_party", 7, "FAMILY & BRIDAL PARTY", "candid in-betweens", true, [
      time("time", "TIME"),
      text("location", "LOCATION"),
      note("NOTE", "Your videographer captures the laid-back, in-between moments while your photographer takes formal photos, so have fun with your spouse, family & bridal party! These are some of the best reaction shots for your trailer. The videographer does NOT stay for all formal photos; they'll head to cocktail hour or the venue once they have these moments."),
      area("special_requests", SPECIAL),
    ]),
    section("bride_groom", 8, "BRIDE & GROOM", "just the two of you", true, [
      choice("first_look", "Are you doing a first look?", [["yes", "Yes"], ["no", "No"], ["undecided", "Undecided"]]),
      note("FIRST LOOK", "A first look includes the bride & groom, wedding party, and immediate family. Please coordinate the start time with your photographer. Your videographer may pose a few scenes but mostly films behind-the-scenes and real interaction."),
      time("time", "TIME"),
      text("location", "LOCATION"),
      group("moments", "COUPLE MOMENTS", [
        ["close_together", "Looking at each other, faces close together"],
        ["toward_camera", "Walking toward camera holding hands"],
        ["away_from_camera", "Walking away from camera holding hands"],
        ["hugging", "Hugging each other tightly"],
        ["interacting", "Interacting (laughing, kissing) while photos are taken"],
        ["veil", "Veil shot (if time allows)"],
      ]),
      area("special_requests", SPECIAL),
    ]),
    section("cocktail_hour", 9, "COCKTAIL HOUR", "cheers!", true, [
      time("time", "TIME"),
      text("location", "LOCATION"),
      choice("candid_footage", "Would you like candid footage from cocktail hour?", YES_NO),
      area("special_requests", "SPECIAL REQUESTS (E.G. GUESTS MINGLING, DETAILS, HORS D'OEUVRES)"),
    ]),
    section("reception", 10, "RECEPTION", "let's celebrate", true, [
      time("time", "TIME"),
      text("location", "LOCATION"),
      group("details", "DETAILS", [
        ["guests_arriving", "Guests arriving"],
        ["centerpieces", "Centerpieces & decor"],
        ["dessert_bar", "Dessert bar"],
        ["cake", "Cake"],
        ["bar_signage", "Bar signage"],
        ["gobos", "Gobos (optional)"],
      ]),
      group("moments", "RECEPTION MOMENTS", [
        ["entrances", "Wedding party entrances & grand entrance"],
        ["first_dance", "First dance"],
        ["bride_father", "Bride dancing with father"],
        ["groom_mother", "Groom dancing with mother"],
        ["speeches", "Speeches & toasts (Maid of Honor, Best Man)"],
        ["cake_cutting", "Cutting the cake"],
        ["bouquet", "Bride throwing bouquet"],
        ["garter_removal", "Removal of the garter"],
        ["garter_throw", "Groom throwing the garter"],
        ["garter_placed", "Garter placed on the bouquet catcher"],
        ["ending", "Special ending (fireworks, sparklers, etc.)"],
      ]),
      area("special_requests", SPECIAL),
    ]),
    section("content_creation", 11, "CONTENT CREATION", "social-ready moments", false, [
      note(null, "Want your day on your feed fast? A content creator films vertical, phone-ready clips alongside your videographer, so you can relive (and post!) the highlights before the film is even edited."),
      choice("interested", "Interested in content creation?", [["yes", "Yes, add it"], ["maybe", "Maybe, tell me more"], ["no", "No thanks"]]),
      group("capture", "CAPTURE OPTIONS  (ADDITIONAL FEES MAY APPLY: SEE YOUR CONTRACT)", [
        ["dedicated_creator", "Dedicated content creator (phone-shot, vertical 9:16)"],
        ["teaser", "Sneak-peek teaser reel delivered within 24-48 hours"],
        ["same_night", "Same-night clip & photo dump (raw, unedited)"],
        ["edited_reels", "Edited reels for Instagram / TikTok"],
        ["stories_live", "Instagram / Facebook Stories captured live during the day"],
        ["grwm", "“Get ready with me” (GRWM) style video"],
        ["pov_recap", "Day-in-the-life POV recap"],
        ["drone_short", "Drone short / aerial reel (where permitted)"],
        ["guest_message", "Guest message / “advice for the couple” interviews"],
        ["behind_vendors", "Behind-the-scenes of vendors & venue set-up"],
      ]),
      multi("where_post", "Where will you post?", [["instagram", "Instagram"], ["tiktok", "TikTok"], ["facebook", "Facebook"], ["youtube_shorts", "YouTube Shorts"], ["private_only", "Private only"]]),
      text("reel_count", "HOW MANY EDITED REELS?"),
      text("delivery_speed", "DELIVERY: HOW FAST DO YOU WANT THEM?"),
      text("reel_length", "REEL LENGTH PREFERENCE"),
      group("checklist", "CONTENT SHOT CHECKLIST", [
        ["venue_reveal", "Venue reveal / first walk-in"],
        ["flat_lays", "Dress, rings & detail flat-lays (vertical)"],
        ["glam", "Getting-ready glam & hair reveal"],
        ["groom_hype", "Groom's crew hype moments"],
        ["first_look_reaction", "First look reaction (or aisle reaction)"],
        ["letter_reactions", "Letter / gift reading reactions"],
        ["walk_out", "Wedding party “walk-out” slow-mo"],
        ["just_married", "“We just got married!” moment after the recessional"],
        ["grand_entrance", "Grand entrance from the dance floor (POV)"],
        ["first_dance_crowd", "First dance from inside the crowd"],
        ["toast_snippets", "Toast & speech highlight snippets"],
        ["cake_close", "Cake & dessert close-ups"],
        ["crowd_hype", "Dance floor energy / crowd hype"],
        ["trending_audio", "Trending audio & transition shots"],
        ["send_off", "Send-off (sparklers, bubbles, getaway car)"],
        ["recap_clip", "End-of-night recap clip"],
      ]),
      text("trending_sounds", "TRENDING SOUNDS / SONGS YOU'D LOVE USED"),
      text("accounts_to_tag", "ACCOUNTS TO TAG OR COLLAB WITH", { keepLinks: true }),
      choice("post_publicly", "OK for us to post publicly?", [["yes", "Yes"], ["after_first", "After we post first"], ["no", "No"]]),
      choice("approve_before", "Approve before we post?", YES_NO),
      area("privacy_notes", "OFF-LIMITS OR PRIVACY NOTES (E.G. NO KIDS' FACES, NOTHING POSTED BEFORE A CERTAIN DATE)"),
      text("contact_name", "DAY-OF POINT OF CONTACT FOR THE CONTENT CREATOR"),
      text("contact_cell", "THEIR CELL PHONE"),
    ]),
    section("trends", 12, "TRENDS", "optional, for the feed", false, [
      choice("want_trends", "Want trend-featured videos?", YES_NO),
      text("trend_1", "IF YES, TELL US ABOUT SOMETHING YOU SAW OR LIKED (DESCRIBE IT OR PASTE A LINK)", { keepLinks: true }),
      text("trend_2", "IF YES, TELL US ABOUT SOMETHING YOU SAW OR LIKED (DESCRIBE IT OR PASTE A LINK)", { keepLinks: true }),
      text("trend_3", "IF YES, TELL US ABOUT SOMETHING YOU SAW OR LIKED (DESCRIBE IT OR PASTE A LINK)", { keepLinks: true }),
    ]),
    section("additional_notes", 13, "ADDITIONAL NOTES", "anything else?", false, [
      note("TELL US", "Surprises, family dynamics, names we should know, special heirlooms, or moments that matter most to you. Tell us here."),
      area("notes", "ADDITIONAL NOTES", { max: NOTES_MAX }),
    ]),
    section("social_media", 14, "SOCIAL MEDIA", "tag the team", false, [
      note(null, "We'd love to tag everyone who helped make your day! List Instagram handles for shout-outs."),
      handle("bride", "Bride"),
      handle("groom", "Groom"),
      handle("planner", "Planner"),
      handle("photographer", "Photographer"),
      handle("videographer", "Videographer"),
      handle("hair_makeup", "Hair & Makeup"),
      handle("florist", "Florist"),
      handle("dj", "DJ"),
      handle("band", "Band"),
      handle("musicians", "Musicians"),
      handle("caterer", "Caterer"),
      handle("bartenders", "Bartenders"),
      handle("hashtag", "Wedding hashtag", "#"),
      handle("dessert", "Dessert"),
      handle("rentals", "Rentals"),
      handle("calligrapher", "Calligrapher"),
      handle("signage", "Signage"),
      handle("photo_booth", "Photo-booth"),
      handle("gown", "Wedding Gown"),
      handle("bridesmaid_dresses", "Bridesmaid Dresses"),
      handle("suits", "Suits"),
      handle("rings", "Rings"),
      handle("officiant", "Officiant"),
      handle("venue_ceremony", "Venue - Ceremony"),
      handle("venue_reception", "Venue - Reception"),
    ]),
  ],
  thanks: "Thank you for choosing GO! EVENT GROUP",
}

const allFields = (t: WeddingTemplate): WeddingField[] => [...t.cover, ...t.sections.flatMap(sectionFields)]

/* ---- The three bookings ------------------------------------------- */

const day = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString().slice(0, 10)
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
const dayLabel = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number)
  const dt = new Date(y, m - 1, d)
  return `${WEEKDAYS[dt.getDay()]} ${MONTHS[m - 1]} ${d}, ${y}`
}
const addDays = (iso: string, n: number) => {
  const [y, m, d] = iso.split("-").map(Number)
  const dt = new Date(y, m - 1, d + n)
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`
}

/* As the admin's prefillFor builds it from the account and the booking. */
const prefillFor = (eventDay: string): Record<string, string> => ({
  "couple.bride_name": "Jordan Sample",
  "couple.bride_email": "jordan.sample@example.com",
  "couple.bride_cell": "(860) 555-0142",
  "couple.bride_address": "14 Maple Ln, Avon, CT 06001, USA",
  "cover.event_date": dayLabel(eventDay),
  "cover.reception_venue": "14 Maple Ln, Avon, CT 06001, USA",
  "wedding_info.reception_location": "14 Maple Ln, Avon, CT 06001, USA",
})

const PROGRESS: Record<string, WeddingValue> = {
  "couple.groom_name": "Sam Sample",
  "couple.day_of_name": "Pat Sample",
  "couple.day_of_relationship": "Mother of the bride",
  "couple.day_of_cell": "860 555 0177",
  "film.video_inspiration": "The one at the barn with the sparkler exit",
  "film.song_1": "Golden Hour, JVKE",
  "film.priorities": { getting_ready: 2, formalities: 1, dancing: 3 },
  "wedding_info.ceremony_location": "St. Patrick Church, 110 Main St, Farmington, CT 06032",
  "wedding_info.primary_start": "11 AM",
  "bride_prep.start_time": "9 AM",
  "bride_prep.details.dress": true,
  "bride_prep.details.veil": true,
  "bride_prep.details.rings": true,
  "bride_prep.read_note": "yes",
  "ceremony.time": "3 PM",
  "ceremony.full_mass": "no",
  "ceremony.moments.first_kiss": true,
  "ceremony.moments.recessional": true,
  "reception.time": "6 PM",
  "reception.moments.first_dance": true,
  "reception.moments.cake_cutting": true,
}

const SUBMITTED: Record<string, WeddingValue> = {
  ...PROGRESS,
  "film.song_2": "September, Earth, Wind and Fire",
  "groom_prep.start_time": "11 AM",
  "groom_prep.dressed": "in_suit",
  "family_party.time": "3:45 PM",
  "bride_groom.first_look": "no",
  "cocktail_hour.candid_footage": "yes",
  "content_creation.where_post": ["instagram", "tiktok"],
  "social_media.hashtag": "SampleWedding2027",
}

interface Row {
  eventDate: string
  status: WeddingDetails["status"]
  answers: Record<string, WeddingValue>
  submittedAt: string | null
  changeRequestedAt: string | null
}

const rows = new Map<string, Row>([
  ["bk-wedding-new", { eventDate: day(75), status: "not_started", answers: {}, submittedAt: null, changeRequestedAt: null }],
  ["bk-wedding-progress", { eventDate: day(40), status: "in_progress", answers: { ...PROGRESS }, submittedAt: null, changeRequestedAt: null }],
  ["bk-wedding-submitted", { eventDate: day(90), status: "submitted", answers: { ...SUBMITTED }, submittedAt: "2026-10-02T15:20:00.000Z", changeRequestedAt: null }],
])

const wait = () => new Promise((r) => setTimeout(r, 250))

/* ---- The admin's rules, mirrored ---------------------------------- */

function progress(t: WeddingTemplate, answers: Record<string, WeddingValue>) {
  const sections = t.sections.map((s) => ({ key: s.key, number: s.number, title: s.title, required: s.required, done: sectionFields(s).some((f) => answers[f.key] !== undefined) }))
  const required = sections.filter((s) => s.required)
  return { sections, requiredDone: required.filter((s) => s.done).length, requiredTotal: required.length, missing: required.filter((s) => !s.done).map((s) => ({ key: s.key, title: s.title })) }
}

function shape(id: string, row: Row): WeddingDetails {
  const prefill = prefillFor(row.eventDate)
  return structuredClone({
    bookingId: id,
    templateVersion: 1,
    template: TEMPLATE_V1,
    answers: row.answers,
    prefill,
    lockedKeys: Object.keys(prefill),
    status: row.status,
    eventDate: row.eventDate,
    dueDate: addDays(row.eventDate, -30),
    submittedAt: row.submittedAt,
    changeRequestedAt: row.changeRequestedAt,
    ...progress(TEMPLATE_V1, row.answers),
  })
}

const NOT_FOUND: WeddingFailure = { ok: false, status: 404, message: "booking not found" }
const refuse = (status: number, reason: string, message: string, extra: Partial<WeddingFailure> = {}): WeddingFailure => ({ ok: false, status, reason, message, ...extra })

function rowFor(id: string): Row | null {
  // Block S9a: the checkout mock's booking is a wedding when its hold was one.
  if (id === "bk_mock" && mockMode("checkout") !== null && mockIsWedding()) {
    if (!rows.has(id)) rows.set(id, { eventDate: day(60), status: "not_started", answers: {}, submittedAt: null, changeRequestedAt: null })
    return rows.get(id) ?? null
  }
  if (!mockMode("wedding")) return null
  return rows.get(id) ?? null
}

export async function mockGet(id: string): Promise<WeddingResult<WeddingDetails>> {
  await wait()
  const row = rowFor(id)
  return row ? { ok: true, data: shape(id, row) } : NOT_FOUND
}

/* One answer as the admin's cleanValue keeps it: the value to store, null
   to clear, or a refusal. */
function clean(f: WeddingField, value: WeddingValue | undefined): { value: WeddingValue } | WeddingFailure {
  const bad = (message: string, reason = "invalid-answer") => refuse(400, reason, message, { field: f.key })
  if (value === null || value === undefined) return { value: null }
  switch (f.type) {
    case "text":
    case "time":
    case "textarea":
    case "handle": {
      if (typeof value !== "string") return bad(`${f.key} must be text`)
      if (value.trim().length > (f.max ?? 300)) return bad(`${f.key} must be ${f.max ?? 300} characters or fewer`, "too-long")
      const t = value.trim()
      return { value: t === "" ? null : t }
    }
    case "checkbox":
      if (typeof value !== "boolean") return bad(`${f.key} must be true or false`)
      return { value: value ? true : null }
    case "choice":
      if (value === "") return { value: null }
      if (typeof value !== "string" || !f.options?.some((o) => o.value === value)) return bad(`${f.key} must be one of ${f.options?.map((o) => o.value).join(", ")}`)
      return { value }
    case "multi": {
      if (!Array.isArray(value) || !value.every((v) => f.options?.some((o) => o.value === v))) return bad(`${f.key} must be a list from ${f.options?.map((o) => o.value).join(", ")}`)
      const unique = [...new Set(value)]
      return { value: unique.length === 0 ? null : unique }
    }
    case "rank": {
      if (typeof value !== "object" || Array.isArray(value)) return bad(`${f.key} must give each choice a rank`)
      const entries = Object.entries(value).filter(([, n]) => n !== null)
      const size = f.options?.length ?? 0
      for (const [k, n] of entries) {
        if (!f.options?.some((o) => o.value === k)) return bad(`${f.key} has no choice called ${k}`)
        if (!Number.isInteger(n) || n < 1 || n > size) return bad(`${f.key} ranks must be whole numbers from 1 to ${size}`)
      }
      const ranks = entries.map(([, n]) => n)
      if (new Set(ranks).size !== ranks.length) return bad(`${f.key} can use each rank once`)
      return { value: entries.length === 0 ? null : Object.fromEntries(entries) }
    }
  }
}

export async function mockPatch(id: string, answers: Record<string, WeddingValue>): Promise<WeddingResult<WeddingDetails>> {
  await wait()
  const row = rowFor(id)
  if (!row) return NOT_FOUND
  const fields = new Map(allFields(TEMPLATE_V1).map((f) => [f.key, f]))
  const locked = new Set(Object.keys(prefillFor(row.eventDate)))
  const values: Record<string, WeddingValue> = {}
  for (const [key, value] of Object.entries(answers)) {
    const f = fields.get(key)
    if (!f) return refuse(400, "unknown-field", `${key} is not a field on this form`, { field: key })
    if (locked.has(key)) return refuse(400, "locked-field", `${key} comes from the booking and can't be changed here`, { field: key })
    if (typeof value === "string" && value.includes("FAIL")) return { ok: false, status: 500, message: "That didn't go through. Try again, or text us." }
    const cleaned = clean(f, value)
    if ("ok" in cleaned) return cleaned
    values[key] = cleaned.value
  }
  if (row.status === "submitted") return refuse(409, "submitted", "These details are submitted. Ask GO to open them for changes.")
  for (const [key, value] of Object.entries(values)) {
    if (value === null) delete row.answers[key]
    else row.answers[key] = value
  }
  row.status = Object.keys(row.answers).length > 0 ? "in_progress" : "not_started"
  return { ok: true, data: shape(id, row) }
}

export async function mockSubmit(id: string): Promise<WeddingResult<WeddingDetails>> {
  await wait()
  const row = rowFor(id)
  if (!row) return NOT_FOUND
  if (row.status === "submitted") return refuse(409, "submitted", "These details are already submitted.")
  const { missing } = progress(TEMPLATE_V1, row.answers)
  if (missing.length > 0) return refuse(400, "sections-missing", `Finish these sections first: ${missing.map((m) => m.title).join(", ")}.`, { missing })
  row.status = "submitted"
  row.submittedAt = new Date().toISOString()
  return { ok: true, data: shape(id, row) }
}

export async function mockRequestChange(id: string, note: string): Promise<WeddingResult<WeddingDetails>> {
  await wait()
  const row = rowFor(id)
  if (!row) return NOT_FOUND
  if (row.status !== "submitted") return refuse(409, "not-submitted", "These details aren't submitted, so you can still change them.")
  if (!row.changeRequestedAt) row.changeRequestedAt = new Date().toISOString()
  void note
  return { ok: true, data: shape(id, row) }
}
