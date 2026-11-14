import { CONFIG } from "./config.js";

const RULESET = "ia";
const MAX = 3;
const WAITING = 1000 * 10;

const toBytes = (hex) =>
  Uint8Array.from(hex.match(/../g).map((h) => parseInt(h, 16)));

async function correctPassword(password) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bytes = new Uint8Array(
    await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt: toBytes(CONFIG.BYTES),
        iterations: CONFIG.ITERATIONS,
        hash: "SHA-256",
      },
      key,
      256,
    ),
  );
  const waiting = toBytes(CONFIG.HASH);
  if (bytes.length !== waiting.length) return false;
  let diff = 0;
  for (let i = 0; i < bytes.length; i++) diff |= bytes[i] ^ waiting[i];
  return diff === 0;
}

async function read() {
  const { active = true } = await chrome.storage.local.get("active");
  return active;
}

async function apply(active) {
  await chrome.declarativeNetRequest.updateEnabledRulesets(
    active ? { enableRulesetIds: [RULESET] } : { disableRulesetIds: [RULESET] },
  );
}

const applySave = async () => apply(await read());
chrome.runtime.onInstalled.addListener(applySave);
chrome.runtime.onStartup.addListener(applySave);

async function secondsOfWaiting() {
  const { blockAt = 0 } = await chrome.storage.session.get("blockAt");
  return Math.max(0, Math.ceil((blockAt - Date.now()) / 1000));
}

async function registerFail() {
  const { fails = 0 } = await chrome.storage.session.get("fails");
  if (fails + 1 >= MAX) {
    await chrome.storage.session.set({
      fails: 0,
      blockAt: Date.now() + WAITING,
    });
  } else {
    await chrome.storage.session.set({ fails: fails + 1 });
  }
}

async function toggle(password) {
  const wait = await secondsOfWaiting();
  if (wait > 0) return { ok: false, reason: "wait", seconds: wait };

  if (typeof password !== "string" || !(await correctPassword(password))) {
    await registerFail();
    return { ok: false, reason: "password" };
  }

  await chrome.storage.session.set({ fails: 0 });
  const newValue = !(await read());
  await chrome.storage.local.set({ active: newValue });
  await apply(newValue);
  return { ok: true, active: newValue };
}

chrome.runtime.onMessage.addListener((message, sender, reply) => {
  if (sender.id !== chrome.runtime.id) return false;

  if (message?.type === "status") {
    read().then((active) => reply({ active }));
    return true;
  }
  if (message?.type === "toggle") {
    toggle(message.password)
      .then(reply)
      .catch(() => reply({ ok: false, reason: "error" }));
    return true;
  }
  return false;
});
