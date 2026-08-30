import assert from "node:assert/strict";
import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const testDir = new URL("../tests/", import.meta.url);
const testPath = fileURLToPath(testDir);
const files = (await readdir(testDir)).filter((file) => file.endsWith(".test.js")).sort();
let passed = 0;

globalThis.test = async function test(name, callback) {
  try {
    await callback();
    passed += 1;
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    console.error(error);
    process.exitCode = 1;
  }
};

globalThis.assert = assert;

for (const file of files) {
  await import(pathToFileURL(join(testPath, file)));
}

if (process.exitCode) {
  process.exit(process.exitCode);
}

console.log(`\n${passed} tests passed.`);
