import { useEffect } from "react"

/* The signature-style face for typed signatures, loaded only while a contract
   is on screen (Google Fonts, which the CSP already allows for Inter). Great
   Vibes reads as handwriting without being hard to read. */
const HREF = "https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap"
const ID = "go-signature-font"

export const SIGNATURE_FONT = '"Great Vibes", "Brush Script MT", "Snell Roundhand", cursive'

export function useSignatureFont() {
  useEffect(() => {
    if (document.getElementById(ID)) return
    const link = document.createElement("link")
    link.id = ID
    link.rel = "stylesheet"
    link.href = HREF
    document.head.appendChild(link)
  }, [])
}
