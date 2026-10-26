import { test } from "node:test";
import assert from "node:assert/strict";
import { orderFieldsSchema, technicalSchema, nextStatus } from "../src/shared/contracts/orders";
import { can } from "../src/server/auth/permissions";

const fields = { equipment: "Motor", brand: "", model: "", serialNumber: "", intake: "No enciende", notes: "", location: "", assignedTo: "", diagnosis: "", workDone: "", workedMinutes: "0", budget: "", approval: "" };
test("presupuesto exacto opcional y validación de importes/minutos", () => {
  assert.equal(orderFieldsSchema.parse(fields).budget, null);
  assert.equal(orderFieldsSchema.parse({ ...fields, budget: "000123,4" }).budget, "123.40");
  for (const budget of ["-1", "1.001", "1e3", "NaN", "1.234,50", "1234567890123"]) assert.equal(orderFieldsSchema.safeParse({ ...fields, budget }).success, false, budget);
  for (const workedMinutes of [-1, 1.5, "abc", 10000001]) assert.equal(technicalSchema.safeParse({ ...fields, workedMinutes }).success, false, String(workedMinutes));
});
test("estados y permisos mantienen límites operativos", () => {
  assert.deepEqual(nextStatus, { queued: "completed", completed: "delivered" });
  assert.equal(can("reception", "work:write"), true);
  assert.equal(can("reception", "work:correct"), false);
  assert.equal(can("technician", "work:write"), false);
  assert.equal(can("readonly", "work:technical"), false);
  assert.equal(can("admin", "work:correct"), true);
});
