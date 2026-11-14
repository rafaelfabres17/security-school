import { brBuilder, log } from "#functions";
import fs from "node:fs";

if (!fs.existsSync(".env")) {
  log.warn("O arquivo .env não foi encontrado.");
  process.exit(1);
}

const env = {};
const lines = fs.readFileSync(".env", "utf8").split(/\r?\n/);

for (const line of lines) {
  const item = line.trim();
  if (!item || item.startsWith("#")) continue;
  const separator = item.indexOf("=");

  const variable = item.slice(0, separator).trim();
  const value = item.slice(separator + 1).trim();
  env[variable] = value;
}

const { BYTES, HASH, ITERATIONS } = env;
if (!BYTES || !HASH || !ITERATIONS) {
  console.log(env);
  log.error("O arquivo .env está com dados incorretos.");
  process.exit(1);
}

const content = brBuilder([
  "// NÃO ALTERE ESSE ARQUIVO",
  `export const CONFIG = { BYTES: "${BYTES}", HASH: "${HASH}", ITERATIONS: "${ITERATIONS}" };`,
]);
fs.writeFileSync("extension/config.js", content, (error) => {
  if (error) throw error;
});
log.success("Extensão pronta para uso.");
