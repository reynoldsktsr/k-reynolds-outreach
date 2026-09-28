import { readFileSync } from "node:fs";
import path from "node:path";

const TEST_DATA_PATH = path.join(__dirname, ".state", "test-data.json");

export function getTestBusiness(): { businessId: string; businessName: string } {
  return JSON.parse(readFileSync(TEST_DATA_PATH, "utf-8"));
}
