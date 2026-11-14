import { styleText } from "node:util";

export const log = {
  success: (text) => console.log(styleText("green", text)),
  error: (text) => console.log(styleText("red", text)),
  warn: (text) => console.log(styleText("yellow", text)),
  info: (text) => console.log(styleText("blue", text)),
};
