import { test } from "node:test";
import assert from "node:assert/strict";
import { mapLegacyCustomer } from "../src/server/legacy/import";

test("cliente anterior sin nombre no se fusiona ni inventa contacto", () => {
  const raw = { legacy_codigo: 123, cliente: "", nombre: null, telefono: null, localidad: "Localidad original", condicion_iva: "Original" };
  const mapped = mapLegacyCustomer(raw);
  assert.equal(mapped.name, "Cliente anterior #123 (sin nombre)");
  assert.equal(mapped.phone, "");
  assert.deepEqual(mapped.legacyOriginal, raw);
});

test("nombre de un carácter queda como dato original sin romper la carga", () => {
  const mapped = mapLegacyCustomer({ legacy_codigo: 124, cliente: "X" });
  assert.equal(mapped.name, "Cliente anterior #124 (sin nombre)");
  assert.equal(mapped.legacyOriginal.cliente, "X");
});
