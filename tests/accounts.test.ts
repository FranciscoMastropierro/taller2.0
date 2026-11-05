import { test } from "node:test";
import assert from "node:assert/strict";
import { businessDateSchema, cents, decimal, moneySchema, positiveMoneySchema } from "../src/shared/contracts/money";

test("dinero exacto: decimales y sumas sin punto flotante", () => {
  assert.equal(moneySchema.parse("000,1"), "0.10");
  assert.equal(decimal(cents("0.10") + cents("0.20")), "0.30");
  assert.equal(decimal(cents("999999999999.99") + 1n), "1000000000000.00");
  assert.equal(decimal(-30n), "-0.30");
  for (const input of ["1.000,10", "-1", "1e3", "1.001", "NaN", ""]) assert.equal(moneySchema.safeParse(input).success, false, input);
  assert.equal(positiveMoneySchema.safeParse("0").success, false);
});
test("fecha comercial rechaza fechas inexistentes", () => {
  assert.equal(businessDateSchema.safeParse("2026-02-29").success, false);
  assert.equal(businessDateSchema.safeParse("2024-02-29").success, true);
  assert.equal(businessDateSchema.safeParse("2026-13-01").success, false);
});
