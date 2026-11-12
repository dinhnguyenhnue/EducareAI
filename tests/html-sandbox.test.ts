import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  analyzeStudentHtmlCode,
  wrapHtmlWithStrictCsp,
  MAX_HTML_GAME_SIZE_BYTES,
  STRICT_GAME_CSP,
} from "../src/lib/html-game-sandbox";

describe("HTML Game Sandbox & CSP Isolation (T1.1 & T1.2)", () => {
  it("rejects empty or oversized HTML inputs", () => {
    assert.equal(analyzeStudentHtmlCode("").isWithinSizeLimit, false);
    assert.equal(
      analyzeStudentHtmlCode("x".repeat(MAX_HTML_GAME_SIZE_BYTES + 1))
        .isWithinSizeLimit,
      false
    );
  });

  it("accepts self-contained HTML within size limit", () => {
    const res = analyzeStudentHtmlCode("<html><body><h1>Hello</h1></body></html>");
    assert.equal(res.isWithinSizeLimit, true);
    assert.equal(res.isSelfContainedHtml, true);
    assert.equal(res.riskLevel, "LOW");
  });

  it("detects external network calls, meta refresh, and base URI overrides as HIGH risk", () => {
    const netScan = analyzeStudentHtmlCode(
      '<script>fetch("https://example.invalid")</script>'
    );
    assert.equal(netScan.riskLevel, "HIGH");
    assert.ok(netScan.findings.some((f) => f.code === "NETWORK_API_CALL"));

    const refreshScan = analyzeStudentHtmlCode(
      '<meta http-equiv="refresh" content="0;url=https://evil.example">'
    );
    assert.equal(refreshScan.riskLevel, "HIGH");
    assert.ok(refreshScan.findings.some((f) => f.code === "META_REFRESH_REDIRECT"));

    const baseScan = analyzeStudentHtmlCode('<base href="https://evil.example">');
    assert.equal(baseScan.riskLevel, "HIGH");
    assert.ok(baseScan.findings.some((f) => f.code === "BASE_URI_OVERRIDE"));
  });

  it("always places Content-Security-Policy BEFORE any user scripts even when <script> precedes <head>", () => {
    const payload = '<script>fetch("https://example.invalid")</script><head></head>';
    const wrapped = wrapHtmlWithStrictCsp(payload);
    const cspIdx = wrapped.indexOf("Content-Security-Policy");
    const scriptIdx = wrapped.indexOf("<script>");
    assert.ok(cspIdx > -1, "CSP meta tag must exist");
    assert.ok(scriptIdx > -1, "User script must exist");
    assert.ok(
      cspIdx < scriptIdx,
      `CSP index (${cspIdx}) must be strictly before script index (${scriptIdx})`
    );
  });

  it("never places Content-Security-Policy inside an HTML comment when fake <!-- <head> --> is present", () => {
    const payload = "<!-- <head> --><html><body>hello</body></html>";
    const wrapped = wrapHtmlWithStrictCsp(payload);
    assert.ok(wrapped.includes(STRICT_GAME_CSP));
    assert.ok(
      !/<!--[\s\S]*?Content-Security-Policy[\s\S]*?-->/.test(wrapped),
      "CSP must not be enclosed inside an HTML comment"
    );
    const cspIdx = wrapped.indexOf("Content-Security-Policy");
    const commentIdx = wrapped.indexOf("<!--");
    assert.ok(cspIdx < commentIdx, "CSP must appear before user HTML comments");
  });

  it("strips dangerous <meta http-equiv='refresh'> and <base> tags from wrapped output", () => {
    const payload =
      '<html><head><meta http-equiv="refresh" content="0;url=https://evil.example"><base href="https://evil.example"></head><body>Game</body></html>';
    const wrapped = wrapHtmlWithStrictCsp(payload);
    assert.ok(!/http-equiv\s*=\s*["']?refresh/i.test(wrapped));
    assert.ok(!/<base\b/i.test(wrapped));
    assert.ok(wrapped.includes(STRICT_GAME_CSP));
  });

  it("handles malformed HTML safely while keeping CSP at top of document", () => {
    const payload = "</head><body><<script>alert(1)</script><head attr='unclosed>";
    const wrapped = wrapHtmlWithStrictCsp(payload);
    assert.ok(wrapped.startsWith('<!DOCTYPE html><html lang="vi"><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy"'));
  });
});

