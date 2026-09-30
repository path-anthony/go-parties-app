import { useCallback, useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { AppShell, Body } from "@/components/go/AppShell"
import { GoLabel } from "@/components/go/GoLabel"
import { Letterhead } from "@/components/go/Letterhead"
import { BidForm } from "@/components/go/bid/BidForm"
import { BidNotice } from "@/components/go/bid/BidNotice"
import { GigPage } from "@/components/go/bid/GigPage"
import { useNoIndex } from "@/hooks/use-noindex"
import { loadBid, type BidGig, type BidLoad } from "@/lib/bidApi"

/* /bid/:token, the crew gig page. Reached only from a text, no login: the
   link is the credential, so it is treated like the contract link (bare
   shell, letterhead, out of search engines). One page, two lives. Before the
   gig is filled it is the bid page: the facts, the pay range, a bid. Once the
   crew member's bid is accepted the same link is their gig page, with the
   address and day-of details. The admin decides the state; this page renders
   what it is told and keeps the latest answer, so a bid or a decline swaps the
   screen without a reload. Mock tokens work in local dev only (see bidApi). */

export default function Bid() {
  useNoIndex()
  const { token = "" } = useParams()
  const [state, setState] = useState<BidLoad | null>(null)
  const [round, setRound] = useState(0)

  const retry = useCallback(() => {
    setState(null)
    setRound((n) => n + 1)
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    loadBid(token, controller.signal)
      .then(setState)
      .catch(() => {})
    return () => controller.abort()
  }, [token, round])

  const setGig = useCallback((gig: BidGig) => setState({ kind: "ok", gig }), [])

  let content: React.ReactNode
  if (!state) {
    content = (
      <>
        <GoLabel>Gig</GoLabel>
        <p className="mt-2 text-body text-muted">Opening your gig.</p>
      </>
    )
  } else if (state.kind === "invalid") {
    content = <BidNotice kind="invalid" />
  } else if (state.kind === "error") {
    content = <BidNotice kind="error" onRetry={retry} />
  } else {
    const gig = state.gig
    if (gig.state === "open" || gig.state === "bid_submitted") content = <BidForm token={token} gig={gig} onGig={setGig} />
    else if (gig.state === "accepted") content = <GigPage token={token} gig={gig} onGig={setGig} />
    else content = <BidNotice kind={gig.state} gig={gig} />
  }

  return (
    <AppShell bare>
      <Letterhead />
      <Body>{content}</Body>
    </AppShell>
  )
}
