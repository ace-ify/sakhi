import { timingSafeEqual } from "node:crypto";

export function validFamilyCode(supplied: string | null, expected: string | undefined) {
  if (!expected || expected.length < 12 || !supplied || supplied.length > 128) return false;
  const actualBuffer = Buffer.from(supplied);
  const expectedBuffer = Buffer.from(expected);
  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
}
