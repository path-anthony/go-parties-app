import { useSyncExternalStore } from "react"
import { addressMode, subscribeAddressMode, type AddressMode } from "@/lib/maps"

/* "pick" while Google's address lookup works (the customer must choose a
   suggestion); "plain" with no key or once Google could not be reached
   (Block S6). Every address field and the screens that gate on a pick read
   it, so a failure flips them all at once. */
export function useAddressMode(): AddressMode {
  return useSyncExternalStore(subscribeAddressMode, addressMode, addressMode)
}
