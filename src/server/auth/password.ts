import { argon2id, hash, verify } from "argon2";
export const passwordOptions = { type: argon2id, memoryCost: 65536, timeCost: 3, parallelism: 1 } as const;
export function hashPassword(password: string) { return hash(password, passwordOptions); }
export function verifyPassword(encoded: string, password: string) { return verify(encoded, password); }
let dummy: Promise<string> | undefined;
export function dummyHash() { return dummy ??= hashPassword("unusable-dummy-credential-for-timing-only"); }
