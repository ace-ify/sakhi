import test from "node:test";
import assert from "node:assert/strict";
import { hasSameOrigin } from "../src/lib/request-origin.ts";

test("accepts the browser origin matching its actual request Host", () => {
  assert.equal(hasSameOrigin(new Request("http://localhost/api", { headers: { host: "127.0.0.1:3187", origin: "http://127.0.0.1:3187" } })), true);
});

test("rejects a different or malformed browser origin", () => {
  assert.equal(hasSameOrigin(new Request("http://localhost/api", { headers: { host: "app.example.com", origin: "https://evil.example.com" } })), false);
  assert.equal(hasSameOrigin(new Request("http://localhost/api", { headers: { host: "app.example.com", origin: "not-a-url" } })), false);
});
