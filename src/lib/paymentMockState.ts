import type { PaymentStatus } from "@/lib/paymentApi"

/* The mock payment's memory, DEV only: which mock sessions were "paid". */
const paid = new Set<string>()

export const MOCK_SECRET = "cs_test_mock_secret_1"

export const markMockPaid = (clientSecret: string) => {
  paid.add(clientSecret.split("_secret_")[0])
}

export function mockPaymentStatus(sessionId: string): PaymentStatus {
  const id = sessionId.split("_secret_")[0]
  return { status: paid.has(id) ? "complete" : "open", paid: paid.has(id), bookingId: "mock-booking", kind: "retainer" }
}
