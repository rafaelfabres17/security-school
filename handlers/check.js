import crypto from "node:crypto";
import fs from "node:fs";
import readline from "node:readline/promises";

const env = Object.fromEntries(
  fs
    .readFileSync(".env", "utf8")
    .split(/\r?\n/)
    .filter(Boolean)
    .map((l) => l.split("=")),
);
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});
const password = await rl.question("Senha: ");
rl.close();

const hash = crypto
  .pbkdf2Sync(
    password,
    Buffer.from(env.BYTES, "hex"),
    Number(env.ITERATIONS),
    32,
    "sha256",
  )
  .toString("hex");
console.log(
  hash === env.HASH ? "Senha confere com o .env" : "Senha NÃO confere",
);
