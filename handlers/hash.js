import { brBuilder, log } from "#functions";
import crypto from "node:crypto";
import fs from "node:fs";
import readline from "node:readline/promises";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});
const password = await rl.question("Nova senha (mín. 8 caracteres): ");
rl.close();

if (!password || password.length < 8) {
  log.warn("A senha deve ter no mínimo 8 caracteres.");
  process.exit(1);
}

const iterations = 310000;
const bytes = crypto.randomBytes(16);
const hash = crypto.pbkdf2Sync(password, bytes, iterations, 32, "sha256");

const content = brBuilder([
  `BYTES=${bytes.toString("hex")}`,
  `HASH=${hash.toString("hex")}`,
  `ITERATIONS=${iterations}`,
]);
fs.writeFile(".env", content, (error) => {
  if (error) throw error;
  log.success("A senha foi gerada com sucesso.");
});
