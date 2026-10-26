/* The typed signature's shape and defaults, shared by the signing form, the
   checkout store and the pages that sign. Kept apart from the component so
   fast refresh can treat that file as components only. */
export interface SignatureValues {
  name: string
  additional: string
  consent: boolean
}

export const EMPTY_SIGNATURE: SignatureValues = { name: "", additional: "", consent: false }

export const CHANGED_MESSAGE = "Your cart or the contract changed. Please read it again."
