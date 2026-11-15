import test from "node:test";
import assert from "node:assert/strict";
import { validFamilyCode } from "../src/lib/family-auth.ts";

test("connected routes require the configured long family code", () => {
  const code = "d6b9e584a2cf4948873e158f";
  assert.equal(validFamilyCode(code, code), true);
  assert.equal(validFamilyCode("1234", code), false);
  assert.equal(validFamilyCode(code, "1234"), false);
  assert.equal(validFamilyCode(null, code), false);
});
