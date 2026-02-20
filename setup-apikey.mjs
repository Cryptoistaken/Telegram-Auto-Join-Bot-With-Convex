import { ConvexClient } from "convex/browser";
import { randomBytes } from "crypto";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const env = Object.fromEntries(
  readFileSync(join(__dirname, "data", ".env"), "utf8")
    .split("\n")
    .filter(Boolean)
    .map((line) => line.split("=").map((s) => s.trim()))
);

const CONVEX_URL = env.CONVEX_URL;
if (!CONVEX_URL) {
  console.error("CONVEX_URL missing from data/.env");
  process.exit(1);
}

const convex = new ConvexClient(CONVEX_URL);
const apiKey = randomBytes(24).toString("hex");

await convex.mutation("mutations:setApiKey", { apiKey });
await convex.close();

console.log("\n✓ API key saved to Convex.\n");
console.log("Your login key:");
console.log(`\n  ${apiKey}\n`);
console.log("Save this — you will need it to log in to the web panel.\n");
