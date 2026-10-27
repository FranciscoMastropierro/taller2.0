import { z } from "zod";

export const moneySchema = z.string().trim().regex(/^\d{1,12}([.,]\d{1,2})?$/, "Ingresá un importe sin miles y con hasta dos decimales.").transform(value => {
  const [whole, fraction = ""] = value.replace(",", ".").split(".");
  return `${whole.replace(/^0+(?=\d)/, "")}.${fraction.padEnd(2, "0")}`;
});
export function cents(amount: string): bigint {
  const [whole, fraction = ""] = amount.split(".");
  return BigInt(whole) * 100n + BigInt(fraction.padEnd(2, "0"));
}
export function decimal(amount: bigint): string {
  const absolute = amount < 0n ? -amount : amount;
  return `${amount < 0n ? "-" : ""}${absolute / 100n}.${String(absolute % 100n).padStart(2, "0")}`;
}
export const positiveMoneySchema = moneySchema.refine(value => cents(value) > 0n, "El importe debe ser mayor que cero.");
export const businessDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => {
  const parsed = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}, "Ingresá una fecha válida.");
