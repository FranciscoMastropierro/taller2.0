import { config } from "dotenv";
import { createInterface } from "node:readline/promises";
import { Writable } from "node:stream";
import { createInitialAdmin, recoverUser } from "../src/server/auth/service";
import { getDb, getPool } from "../src/server/db";
config({ path: ".env.local", quiet: true });
async function main() {
  if (!process.stdin.isTTY) throw new Error("Usar terminal interactiva: no recibir contraseñas por argumentos ni archivos");
  const operation = process.argv[2];
  if (!["bootstrap", "recover"].includes(operation)) throw new Error("Uso: npm run admin -- bootstrap | recover");
  let muted = false;
  const output = new Writable({ write(chunk, _encoding, callback) { if (!muted) process.stdout.write(chunk); callback(); } });
  const rl = createInterface({ input: process.stdin, output, terminal: true });
  try {
    const username = await rl.question("Usuario: ");
    const displayName = operation === "bootstrap" ? await rl.question("Nombre para mostrar: ") : "";
    process.stdout.write("Contraseña nueva (mínimo 12 caracteres, oculta): ");
    muted = true;
    const password = await rl.question("");
    muted = false;
    process.stdout.write("\nRepetir contraseña: ");
    muted = true;
    const confirmation = await rl.question("");
    muted = false;
    process.stdout.write("\n");
    if (password !== confirmation) throw new Error("Las contraseñas no coinciden");
    if (operation === "bootstrap") await createInitialAdmin(getDb(), { username, password, displayName });
    else await recoverUser(getDb(), username, password);
    console.log("Operación completada. Las sesiones anteriores del usuario recuperado quedan revocadas.");
  } finally { rl.close(); output.end(); await getPool().end(); }
}
main().catch(() => { console.error("No se completó la operación: verificar conexión, datos y si el bootstrap ya fue realizado."); process.exitCode = 1; });
