"use server";

import type { ReceiptLookupResponse } from "@ecclesia/shared";
import { lookupReceipt } from "@/lib/demo";

/** INV-2: returns inclusion status only (validated against the closed schema in lookupReceipt). */
export async function searchReceipt(
  electionId: string,
  phrase: string,
): Promise<ReceiptLookupResponse> {
  return lookupReceipt(electionId, phrase);
}
