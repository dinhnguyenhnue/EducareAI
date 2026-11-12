import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_INTEGRATION_SLOTS,
  isVerifiedExternalGemUrl,
} from "../src/lib/integration-slots";

describe("IntegrationSlot & Honest Gem Fallback Architecture (Section 2.4 & 6)", () => {
  it("rejects generic Gemini/Gems homepage URLs and unverified demo placeholders", () => {
    assert.equal(isVerifiedExternalGemUrl(""), false);
    assert.equal(isVerifiedExternalGemUrl(null), false);
    assert.equal(isVerifiedExternalGemUrl("https://gemini.google.com"), false);
    assert.equal(isVerifiedExternalGemUrl("https://gemini.google.com/gems"), false);
    assert.equal(isVerifiedExternalGemUrl("https://gemini.google.com/gems/"), false);
    assert.equal(
      isVerifiedExternalGemUrl("https://gemini.google.com/gem/tin-hoc-sang-tao-unigo"),
      false
    );
    assert.equal(isVerifiedExternalGemUrl("http://insecure-example.com/gem"), false);
  });

  it("accepts specific verified HTTPS Gem URLs", () => {
    assert.equal(
      isVerifiedExternalGemUrl("https://gemini.google.com/gem/1a2b3c4d5e6f7g"),
      true
    );
  });

  it("initializes all default catalog slots as DISCONNECTED with non-empty Socratic fallbackPrompt", () => {
    assert.ok(DEFAULT_INTEGRATION_SLOTS.length >= 9);
    for (const slot of DEFAULT_INTEGRATION_SLOTS) {
      assert.equal(slot.status, "DISCONNECTED");
      assert.equal(slot.externalUrl, null);
      assert.ok(slot.fallbackPrompt.trim().length > 20);
    }
  });
});

