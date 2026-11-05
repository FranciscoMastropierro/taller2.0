import { createHash } from "node:crypto";
import type { ChequeDetails } from "../../shared/contracts/cheques";
export function chequeIdentity(cheque: ChequeDetails) {
  const normalized = (value: string) => value.normalize("NFKC").trim().replace(/\s+/g, " ").toUpperCase();
  const compact = (value: string) => normalized(value).replace(/[\s-]/g, "");
  const number = compact(cheque.number).replace(/^0+(?=\d)/, "");
  return createHash("sha256").update(JSON.stringify([normalized(cheque.bank), compact(cheque.account), number])).digest("hex");
}
